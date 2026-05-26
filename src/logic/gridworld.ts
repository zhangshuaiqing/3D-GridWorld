// 3D GridWorld — Environment Core Logic
// Ported from Python navigation-agent/src/env/gridworld.py

import type { Pos, Action, GridWorldConfig, GridWorldState } from '../types';
import { CellType } from '../types';

const ACTION_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function seededRng(seed?: number) {
  let s = seed ?? Math.floor(Math.random() * 2147483647);
  return {
    next: () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    },
    shuffle: <T>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(s * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

function bfsPathExists(grid: number[][], size: number, start: Pos, goal: Pos): boolean {
  const visited = new Set<string>();
  const queue: Pos[] = [start];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === goal[0] && c === goal[1]) return true;
    for (const [dr, dc] of ACTION_DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (visited.has(key)) continue;
      if (grid[nr][nc] === CellType.OBSTACLE) continue;
      visited.add(key);
      queue.push([nr, nc]);
    }
  }
  return false;
}

export class GridWorld {
  size: number;
  obstacleRatio: number;
  randomStartGoal: boolean;
  observationMode: string;
  viewRange: number;
  numDynamicObstacles: number;
  rng: ReturnType<typeof seededRng>;

  grid: number[][];
  agentPos: Pos;
  goalPos: Pos;
  stepCount: number;
  maxSteps: number;
  done: boolean;
  reward: number;
  visitedMask: boolean[][];

  constructor(config: GridWorldConfig) {
    this.size = config.size;
    this.obstacleRatio = config.obstacleRatio;
    this.randomStartGoal = config.randomStartGoal;
    this.observationMode = config.observationMode;
    this.viewRange = Math.max(1, config.viewRange);
    this.numDynamicObstacles = config.numDynamicObstacles;
    this.rng = seededRng(config.seed);

    this.grid = [];
    this.agentPos = [0, 0];
    this.goalPos = [this.size - 1, this.size - 1];
    this.stepCount = 0;
    this.maxSteps = this.size * this.size * 2;
    this.done = false;
    this.reward = 0;
    this.visitedMask = [];

    this._generateMap();
  }

  private _generateMap() {
    this.grid = Array.from({ length: this.size }, () =>
      Array(this.size).fill(CellType.EMPTY)
    );

    if (this.randomStartGoal) {
      this._pickStartGoal();
    } else {
      this.agentPos = [0, 0];
      this.goalPos = [this.size - 1, this.size - 1];
    }

    const totalCells = this.size * this.size;
    const numObstacles = Math.floor(totalCells * this.obstacleRatio);
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    const shuffled = this.rng.shuffle(indices);

    let placed = 0;
    for (const idx of shuffled) {
      if (placed >= numObstacles) break;
      const r = Math.floor(idx / this.size);
      const c = idx % this.size;
      if (!((r === this.agentPos[0] && c === this.agentPos[1]) ||
            (r === this.goalPos[0] && c === this.goalPos[1]))) {
        this.grid[r][c] = CellType.OBSTACLE;
        placed++;
      }
    }

    if (!bfsPathExists(this.grid, this.size, this.agentPos, this.goalPos)) {
      this._clearPathToGoal();
    }

    this.visitedMask = Array.from({ length: this.size }, () =>
      Array(this.size).fill(false)
    );
    this._updateVisitedMask();
  }

  private _pickStartGoal() {
    const cells: Pos[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        cells.push([r, c]);
      }
    }
    const shuffled = this.rng.shuffle(cells);
    this.agentPos = shuffled[0];
    this.goalPos = shuffled[1];
  }

  private _clearPathToGoal() {
    let [r, c] = this.agentPos;
    const [gr, gc] = this.goalPos;
    while (r !== gr || c !== gc) {
      if (this.rng.next() < 0.5 && r !== gr) {
        r += gr > r ? 1 : -1;
      } else if (c !== gc) {
        c += gc > c ? 1 : -1;
      } else {
        r += gr > r ? 1 : -1;
      }
      if (this.grid[r][c] === CellType.OBSTACLE) {
        this.grid[r][c] = CellType.EMPTY;
      }
    }
  }

  private _updateVisitedMask() {
    const [ar, ac] = this.agentPos;
    const vr = this.viewRange;
    for (let r = Math.max(0, ar - vr); r < Math.min(this.size, ar + vr + 1); r++) {
      for (let c = Math.max(0, ac - vr); c < Math.min(this.size, ac + vr + 1); c++) {
        this.visitedMask[r][c] = true;
      }
    }
  }

  reset(config?: Partial<GridWorldConfig>): GridWorldState {
    if (config) {
      if (config.size !== undefined) this.size = config.size;
      if (config.obstacleRatio !== undefined) this.obstacleRatio = config.obstacleRatio;
      if (config.randomStartGoal !== undefined) this.randomStartGoal = config.randomStartGoal;
      if (config.observationMode !== undefined) this.observationMode = config.observationMode;
      if (config.viewRange !== undefined) this.viewRange = Math.max(1, config.viewRange);
      if (config.numDynamicObstacles !== undefined) this.numDynamicObstacles = config.numDynamicObstacles;
      this.maxSteps = this.size * this.size * 2;
    }

    this.stepCount = 0;
    this.done = false;
    this.reward = 0;
    this._generateMap();
    return this.getState();
  }

  step(action: Action): GridWorldState {
    if (this.done) return this.getState();

    const [dr, dc] = ACTION_DIRS[action];
    const [ar, ac] = this.agentPos;
    const nr = ar + dr;
    const nc = ac + dc;

    this.stepCount++;

    if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) {
      this.reward = -0.5;
    } else if (this.grid[nr][nc] === CellType.OBSTACLE) {
      this.reward = -0.5;
    } else {
      this.grid[ar][ac] = CellType.EMPTY;
      this.agentPos = [nr, nc];
      this.grid[nr][nc] = CellType.AGENT;

      if (nr === this.goalPos[0] && nc === this.goalPos[1]) {
        this.reward = 10;
        this.done = true;
      } else {
        this.reward = -0.1;
      }
    }

    this._updateVisitedMask();

    if (this.stepCount >= this.maxSteps) {
      this.done = true;
      this.reward = -5;
    }

    return this.getState();
  }

  getState(): GridWorldState {
    return {
      grid: this.grid.map(row => [...row]),
      agentPos: [...this.agentPos] as Pos,
      goalPos: [...this.goalPos] as Pos,
      stepCount: this.stepCount,
      done: this.done,
      reward: this.reward,
      visited: this.visitedMask.map(row => [...row]),
    };
  }

  setAgentPos(r: number, c: number) {
    this.grid[this.agentPos[0]][this.agentPos[1]] = CellType.EMPTY;
    this.agentPos = [r, c];
    this.grid[r][c] = CellType.AGENT;
    this._updateVisitedMask();
  }

  setGoalPos(r: number, c: number) {
    this.goalPos = [r, c];
  }

  getGrid(): number[][] {
    return this.grid.map(row => [...row]);
  }
}
