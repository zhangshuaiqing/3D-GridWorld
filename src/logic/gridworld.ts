// 3D GridWorld — Environment Core Logic
// True 3D grid: grid[x][y][z] = CellType

import type { Pos3, Action, GridWorldConfig, GridWorldState } from '../types';
import { CellType } from '../types';
import { ACTION_VECTORS } from '../constants';

function seededRng(seed?: number) {
  let s = seed ?? Math.floor(Math.random() * 2147483647);
  return {
    next: () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    },
    shuffle: <T>(arr: T[]): T[] => {
      const a = [...arr];
      let r = s;
      for (let i = a.length - 1; i > 0; i--) {
        r = (r * 1103515245 + 12345) & 0x7fffffff;
        const j = Math.floor((r / 0x7fffffff) * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

function bfsPathExists(
  grid: number[][][],
  w: number, h: number, d: number,
  start: Pos3, goal: Pos3
): boolean {
  const visited = new Set<string>();
  const queue: Pos3[] = [start];
  visited.add(`${start[0]},${start[1]},${start[2]}`);

  while (queue.length > 0) {
    const [x, y, z] = queue.shift()!;
    if (x === goal[0] && y === goal[1] && z === goal[2]) return true;
    for (const [dx, dy, dz] of ACTION_VECTORS) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      const key = `${nx},${ny},${nz}`;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h || nz < 0 || nz >= d) continue;
      if (visited.has(key)) continue;
      if (grid[nx][ny][nz] === CellType.OBSTACLE) continue;
      visited.add(key);
      queue.push([nx, ny, nz]);
    }
  }
  return false;
}

function createEmptyGrid(w: number, h: number, d: number): number[][][] {
  const g: number[][][] = [];
  for (let x = 0; x < w; x++) {
    const yz: number[][] = [];
    for (let y = 0; y < h; y++) {
      yz.push(Array(d).fill(CellType.EMPTY));
    }
    g.push(yz);
  }
  return g;
}

function createVisited(w: number, h: number, d: number): boolean[][][] {
  const v: boolean[][][] = [];
  for (let x = 0; x < w; x++) {
    const yz: boolean[][] = [];
    for (let y = 0; y < h; y++) {
      yz.push(Array(d).fill(false));
    }
    v.push(yz);
  }
  return v;
}

export class GridWorld3D {
  width: number;
  height: number;
  depth: number;
  obstacleRatio: number;
  randomStartGoal: boolean;
  observationMode: string;
  viewRange: number;
  rng: ReturnType<typeof seededRng>;

  grid: number[][][];
  agentPos: Pos3;
  goalPos: Pos3;
  stepCount: number;
  maxSteps: number;
  done: boolean;
  reward: number;
  visitedMask: boolean[][][];
  totalCells: number;

  constructor(config: GridWorldConfig) {
    this.width = config.width;
    this.height = config.height;
    this.depth = config.depth;
    this.obstacleRatio = config.obstacleRatio;
    this.randomStartGoal = config.randomStartGoal;
    this.observationMode = config.observationMode;
    this.viewRange = Math.max(1, config.viewRange);
    this.rng = seededRng(config.seed);
    this.totalCells = this.width * this.height * this.depth;
    this.maxSteps = this.totalCells * 2;

    this.grid = createEmptyGrid(this.width, this.height, this.depth);
    this.agentPos = [0, 0, 0];
    this.goalPos = [this.width - 1, 0, this.depth - 1];
    this.stepCount = 0;
    this.done = false;
    this.reward = 0;
    this.visitedMask = createVisited(this.width, this.height, this.depth);

    this._generateMap();
  }

  private _generateMap() {
    this.grid = createEmptyGrid(this.width, this.height, this.depth);

    // Pick start/goal
    if (this.randomStartGoal) {
      this._pickStartGoal();
    } else {
      this.agentPos = [0, 0, 0];
      this.goalPos = [this.width - 1, 0, this.depth - 1];
    }

    // Place obstacles
    const numObstacles = Math.floor(this.totalCells * this.obstacleRatio);
    const indices = Array.from({ length: this.totalCells }, (_, i) => i);
    const shuffled = this.rng.shuffle(indices);

    let placed = 0;
    for (const idx of shuffled) {
      if (placed >= numObstacles) break;
      const x = Math.floor(idx / (this.height * this.depth));
      const rem = idx % (this.height * this.depth);
      const y = Math.floor(rem / this.depth);
      const z = rem % this.depth;

      const isAgent = x === this.agentPos[0] && y === this.agentPos[1] && z === this.agentPos[2];
      const isGoal = x === this.goalPos[0] && y === this.goalPos[1] && z === this.goalPos[2];
      if (!isAgent && !isGoal) {
        this.grid[x][y][z] = CellType.OBSTACLE;
        placed++;
      }
    }

    // Ensure path exists
    if (!bfsPathExists(this.grid, this.width, this.height, this.depth, this.agentPos, this.goalPos)) {
      this._clearPathToGoal();
    }

    // Init visited
    this.visitedMask = createVisited(this.width, this.height, this.depth);
    this._updateVisitedMask();
  }

  private _pickStartGoal() {
    const cells: Pos3[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          cells.push([x, y, z]);
        }
      }
    }
    const shuffled = this.rng.shuffle(cells);
    this.agentPos = shuffled[0];
    this.goalPos = shuffled[1];
  }

  private _clearPathToGoal() {
    let [x, y, z] = this.agentPos;
    const [gx, gy, gz] = this.goalPos;
    let iterations = 0;
    const maxIter = 1000;

    while ((x !== gx || y !== gy || z !== gz) && iterations < maxIter) {
      iterations++;
      // Move toward goal with some randomness
      const dirs: [number, number, number][] = [];
      if (x < gx) dirs.push([1, 0, 0]);
      if (x > gx) dirs.push([-1, 0, 0]);
      if (y < gy) dirs.push([0, 1, 0]);
      if (y > gy) dirs.push([0, -1, 0]);
      if (z < gz) dirs.push([0, 0, 1]);
      if (z > gz) dirs.push([0, 0, -1]);

      const [dx, dy, dz] = dirs.length > 0
        ? dirs[Math.floor(this.rng.next() * dirs.length)]
        : [0, 0, 0];

      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && nz >= 0 && nz < this.depth) {
        if (this.grid[nx][ny][nz] === CellType.OBSTACLE) {
          this.grid[nx][ny][nz] = CellType.EMPTY;
        }
        x = nx; y = ny; z = nz;
      }
    }
  }

  private _updateVisitedMask() {
    const [ax, ay, az] = this.agentPos;
    const vr = this.viewRange;
    for (let x = Math.max(0, ax - vr); x < Math.min(this.width, ax + vr + 1); x++) {
      for (let y = Math.max(0, ay - vr); y < Math.min(this.height, ay + vr + 1); y++) {
        for (let z = Math.max(0, az - vr); z < Math.min(this.depth, az + vr + 1); z++) {
          this.visitedMask[x][y][z] = true;
        }
      }
    }
  }

  reset(config?: Partial<GridWorldConfig>): GridWorldState {
    if (config) {
      if (config.width !== undefined) this.width = config.width;
      if (config.height !== undefined) this.height = config.height;
      if (config.depth !== undefined) this.depth = config.depth;
      if (config.obstacleRatio !== undefined) this.obstacleRatio = config.obstacleRatio;
      if (config.randomStartGoal !== undefined) this.randomStartGoal = config.randomStartGoal;
      if (config.observationMode !== undefined) this.observationMode = config.observationMode;
      if (config.viewRange !== undefined) this.viewRange = Math.max(1, config.viewRange);
      this.totalCells = this.width * this.height * this.depth;
      this.maxSteps = this.totalCells * 2;
    }

    this.stepCount = 0;
    this.done = false;
    this.reward = 0;
    this._generateMap();
    return this.getState();
  }

  step(action: Action): GridWorldState {
    if (this.done) return this.getState();

    const [dx, dy, dz] = ACTION_VECTORS[action];
    const [ax, ay, az] = this.agentPos;
    const nx = ax + dx;
    const ny = ay + dy;
    const nz = az + dz;

    this.stepCount++;

    // Check bounds
    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height || nz < 0 || nz >= this.depth) {
      this.reward = -0.5;
    }
    // Check obstacle
    else if (this.grid[nx][ny][nz] === CellType.OBSTACLE) {
      this.reward = -0.5;
    }
    // Valid move
    else {
      this.grid[ax][ay][az] = CellType.EMPTY;
      this.agentPos = [nx, ny, nz];
      this.grid[nx][ny][nz] = CellType.AGENT;

      // Height penalty/reward
      // Moving up costs more, moving down is free
      if (dy > 0) this.reward = -0.2;
      else if (dy < 0) this.reward = 0;  // free descent
      else this.reward = -0.1;  // step penalty

      // Goal check
      if (nx === this.goalPos[0] && ny === this.goalPos[1] && nz === this.goalPos[2]) {
        this.reward = 10;
        this.done = true;
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
      grid: this.grid,
      width: this.width,
      height: this.height,
      depth: this.depth,
      agentPos: [...this.agentPos] as Pos3,
      goalPos: [...this.goalPos] as Pos3,
      stepCount: this.stepCount,
      done: this.done,
      reward: this.reward,
      visited: this.visitedMask,
    };
  }

  setAgentPos(x: number, y: number, z: number) {
    this.grid[this.agentPos[0]][this.agentPos[1]][this.agentPos[2]] = CellType.EMPTY;
    this.agentPos = [x, y, z];
    this.grid[x][y][z] = CellType.AGENT;
    this._updateVisitedMask();
  }

  setGoalPos(x: number, y: number, z: number) {
    this.goalPos = [x, y, z];
  }
}
