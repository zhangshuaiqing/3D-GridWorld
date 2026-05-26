// 3D GridWorld — Environment Core Logic
// True 3D grid: grid[x][y][z] = CellType

import type { Pos3, Action, GridWorldConfig, GridWorldState, DynamicObstacle, DynObsMode } from '../types';
import { CellType, DIR_VECTORS } from '../types';
import { ACTION_VECTORS } from '../constants';

function seededRng(seed?: number) {
  let s = seed ?? Math.floor(Math.random() * 2147483647);
  return {
    next: () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; },
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

function bfsPathExists(grid: number[][][], w: number, h: number, d: number, start: Pos3, goal: Pos3): boolean {
  const visited = new Set<string>();
  const queue: Pos3[] = [start];
  visited.add(`${start[0]},${start[1]},${start[2]}`);
  while (queue.length > 0) {
    const [x, y, z] = queue.shift()!;
    if (x === goal[0] && y === goal[1] && z === goal[2]) return true;
    for (const [dx, dy, dz] of ACTION_VECTORS) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
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

function createGrid(w: number, h: number, d: number, fill: number): number[][][] {
  const g: number[][][] = [];
  for (let x = 0; x < w; x++) {
    const yz: number[][] = [];
    for (let y = 0; y < h; y++) yz.push(Array(d).fill(fill));
    g.push(yz);
  }
  return g;
}

export class GridWorld3D {
  width: number;
  height: number;
  depth: number;
  obstacleRatio: number;
  randomStartGoal: boolean;
  observationMode: string;
  viewRange: number;
  numDynamicObstacles: number;
  dynamicObstacleSpeed: number;
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
  dynamicObstacles: DynamicObstacle[];

  constructor(config: GridWorldConfig) {
    this.width = config.width;
    this.height = config.height;
    this.depth = config.depth;
    this.obstacleRatio = config.obstacleRatio;
    this.randomStartGoal = config.randomStartGoal;
    this.observationMode = config.observationMode;
    this.viewRange = Math.max(1, config.viewRange);
    this.numDynamicObstacles = config.numDynamicObstacles;
    this.dynamicObstacleSpeed = config.dynamicObstacleSpeed;
    this.rng = seededRng(config.seed);
    this.totalCells = this.width * this.height * this.depth;
    this.maxSteps = this.totalCells * 2;

    this.grid = createGrid(this.width, this.height, this.depth, CellType.EMPTY);
    this.agentPos = [0, 0, 0];
    this.goalPos = [this.width - 1, 0, this.depth - 1];
    this.stepCount = 0;
    this.done = false;
    this.reward = 0;
    this.visitedMask = createGrid(this.width, this.height, this.depth, 0).map(
      xy => xy.map(yz => yz.map(() => false))
    );
    this.dynamicObstacles = [];

    this._generateMap();
  }

  private _generateMap() {
    this.grid = createGrid(this.width, this.height, this.depth, CellType.EMPTY);

    if (this.randomStartGoal) this._pickStartGoal();
    else { this.agentPos = [0, 0, 0]; this.goalPos = [this.width - 1, 0, this.depth - 1]; }

    // Place static obstacles
    const numObs = Math.floor(this.totalCells * this.obstacleRatio);
    const indices = Array.from({ length: this.totalCells }, (_, i) => i);
    const shuffled = this.rng.shuffle(indices);
    let placed = 0;
    for (const idx of shuffled) {
      if (placed >= numObs) break;
      const x = Math.floor(idx / (this.height * this.depth));
      const rem = idx % (this.height * this.depth);
      const y = Math.floor(rem / this.depth);
      const z = rem % this.depth;
      if (!((x === this.agentPos[0] && y === this.agentPos[1] && z === this.agentPos[2]) ||
            (x === this.goalPos[0] && y === this.goalPos[1] && z === this.goalPos[2]))) {
        this.grid[x][y][z] = CellType.OBSTACLE;
        placed++;
      }
    }

    if (!bfsPathExists(this.grid, this.width, this.height, this.depth, this.agentPos, this.goalPos)) {
      this._clearPathToGoal();
    }

    // Init dynamic obstacles
    this._initDynamicObstacles();

    // Mark agent and goal in grid
    this.grid[this.agentPos[0]][this.agentPos[1]][this.agentPos[2]] = CellType.AGENT;
    this.grid[this.goalPos[0]][this.goalPos[1]][this.goalPos[2]] = CellType.GOAL;

    // Init visited
    this.visitedMask = createGrid(this.width, this.height, this.depth, 0).map(
      xy => xy.map(yz => yz.map(() => false))
    );
    this.updateVisitedMask();
  }

  private _pickStartGoal() {
    const cells: Pos3[] = [];
    for (let x = 0; x < this.width; x++)
      for (let y = 0; y < this.height; y++)
        for (let z = 0; z < this.depth; z++) cells.push([x, y, z]);
    const sh = this.rng.shuffle(cells);
    this.agentPos = sh[0];
    this.goalPos = sh[1];
  }

  private _clearPathToGoal() {
    let [x, y, z] = this.agentPos;
    const [gx, gy, gz] = this.goalPos;
    let it = 0;
    while ((x !== gx || y !== gy || z !== gz) && it < 1000) {
      it++;
      const dirs: Pos3[] = [];
      if (x < gx) dirs.push([1, 0, 0]); if (x > gx) dirs.push([-1, 0, 0]);
      if (y < gy) dirs.push([0, 1, 0]); if (y > gy) dirs.push([0, -1, 0]);
      if (z < gz) dirs.push([0, 0, 1]); if (z > gz) dirs.push([0, 0, -1]);
      if (dirs.length === 0) break;
      const [dx, dy, dz] = dirs[Math.floor(this.rng.next() * dirs.length)];
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && nz >= 0 && nz < this.depth) {
        if (this.grid[nx][ny][nz] === CellType.OBSTACLE) this.grid[nx][ny][nz] = CellType.EMPTY;
        x = nx; y = ny; z = nz;
      }
    }
  }

  private _initDynamicObstacles() {
    this.dynamicObstacles = [];
    if (this.numDynamicObstacles <= 0) return;

    const emptyCells: Pos3[] = [];
    for (let x = 0; x < this.width; x++)
      for (let y = 0; y < this.height; y++)
        for (let z = 0; z < this.depth; z++)
          if (this.grid[x][y][z] === CellType.EMPTY) emptyCells.push([x, y, z]);

    const sh = this.rng.shuffle(emptyCells);
    const modes: DynObsMode[] = ['bounce', 'bounce', 'random'];

    for (let i = 0; i < Math.min(this.numDynamicObstacles, sh.length); i++) {
      const pos = sh[i];
      const dir = DIR_VECTORS[Math.floor(this.rng.next() * DIR_VECTORS.length)];
      const mode = modes[Math.floor(this.rng.next() * modes.length)];
      this.dynamicObstacles.push({ pos, dir, mode, speed: this.dynamicObstacleSpeed });
      this.grid[pos[0]][pos[1]][pos[2]] = CellType.DYNAMIC_OBSTACLE;
    }
  }

  private _updateDynamicObstacles() {
    if (this.dynamicObstacles.length === 0) return;
    if (this.stepCount % this.dynamicObstacleSpeed !== 0) return;

    for (const dyn of this.dynamicObstacles) {
      const [x, y, z] = dyn.pos;
      let [dx, dy, dz] = dyn.dir;
      let nx = x + dx, ny = y + dy, nz = z + dz;

      const blocked = (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height || nz < 0 || nz >= this.depth) ||
        this.grid[nx][ny][nz] === CellType.OBSTACLE ||
        this.grid[nx][ny][nz] === CellType.AGENT ||
        this.grid[nx][ny][nz] === CellType.GOAL;

      if (blocked) {
        if (dyn.mode === 'bounce') {
          // Reverse direction
          dyn.dir = [-dx, -dy, -dz] as Pos3;
          [dx, dy, dz] = dyn.dir;
          nx = x + dx; ny = y + dy; nz = z + dz;
          const stillBlocked = nx < 0 || nx >= this.width || ny < 0 || ny >= this.height || nz < 0 || nz >= this.depth ||
            this.grid[nx][ny][nz] === CellType.OBSTACLE ||
            this.grid[nx][ny][nz] === CellType.AGENT ||
            this.grid[nx][ny][nz] === CellType.GOAL;
          if (stillBlocked) continue;
        } else {
          // Random: pick a random valid direction
          const validDirs: Pos3[] = [];
          for (const vd of DIR_VECTORS) {
            const tx = x + vd[0], ty = y + vd[1], tz = z + vd[2];
            if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height && tz >= 0 && tz < this.depth &&
              this.grid[tx][ty][tz] !== CellType.OBSTACLE &&
              this.grid[tx][ty][tz] !== CellType.AGENT &&
              this.grid[tx][ty][tz] !== CellType.GOAL &&
              this.grid[tx][ty][tz] !== CellType.DYNAMIC_OBSTACLE) {
              validDirs.push(vd);
            }
          }
          if (validDirs.length === 0) continue;
          const chosen = validDirs[Math.floor(this.rng.next() * validDirs.length)];
          dyn.dir = chosen;
          [dx, dy, dz] = chosen;
          nx = x + dx; ny = y + dy; nz = z + dz;
        }
      }

      // Move
      this.grid[x][y][z] = CellType.EMPTY;
      dyn.pos = [nx, ny, nz];
      this.grid[nx][ny][nz] = CellType.DYNAMIC_OBSTACLE;
    }
  }

  updateVisitedMask() {
    const [ax, ay, az] = this.agentPos;
    const vr = this.viewRange;
    for (let x = Math.max(0, ax - vr); x < Math.min(this.width, ax + vr + 1); x++)
      for (let y = Math.max(0, ay - vr); y < Math.min(this.height, ay + vr + 1); y++)
        for (let z = Math.max(0, az - vr); z < Math.min(this.depth, az + vr + 1); z++)
          this.visitedMask[x][y][z] = true;
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
      if (config.numDynamicObstacles !== undefined) this.numDynamicObstacles = config.numDynamicObstacles;
      if (config.dynamicObstacleSpeed !== undefined) this.dynamicObstacleSpeed = config.dynamicObstacleSpeed;
      if (config.seed !== undefined) this.rng = seededRng(config.seed);
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
    const nx = ax + dx, ny = ay + dy, nz = az + dz;

    this.stepCount++;

    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height || nz < 0 || nz >= this.depth) {
      this.reward = -0.5;
    } else if (this.grid[nx][ny][nz] === CellType.OBSTACLE || this.grid[nx][ny][nz] === CellType.DYNAMIC_OBSTACLE) {
      this.reward = this.grid[nx][ny][nz] === CellType.DYNAMIC_OBSTACLE ? -1.0 : -0.5;
    } else {
      this.grid[ax][ay][az] = CellType.EMPTY;
      this.agentPos = [nx, ny, nz];
      this.grid[nx][ny][nz] = CellType.AGENT;
      this.reward = dy > 0 ? -0.2 : dy < 0 ? 0 : -0.1;

      if (nx === this.goalPos[0] && ny === this.goalPos[1] && nz === this.goalPos[2]) {
        this.reward = 10;
        this.done = true;
      }
    }

    // Move dynamic obstacles after agent step
    this._updateDynamicObstacles();
    this.updateVisitedMask();

    if (this.stepCount >= this.maxSteps) { this.done = true; this.reward = -5; }

    return this.getState();
  }

  getState(): GridWorldState {
    return {
      grid: this.grid,
      width: this.width, height: this.height, depth: this.depth,
      agentPos: [...this.agentPos] as Pos3,
      goalPos: [...this.goalPos] as Pos3,
      stepCount: this.stepCount,
      done: this.done,
      reward: this.reward,
      visited: this.visitedMask,
      dynamicObstacles: this.dynamicObstacles.map(d => ({
        pos: [...d.pos] as Pos3,
        dir: [...d.dir] as Pos3,
        mode: d.mode,
        speed: d.speed,
      })),
    };
  }

  setAgentPos(x: number, y: number, z: number) {
    this.grid[this.agentPos[0]][this.agentPos[1]][this.agentPos[2]] = CellType.EMPTY;
    this.agentPos = [x, y, z];
    this.grid[x][y][z] = CellType.AGENT;
    this.updateVisitedMask();
  }

  setGoalPos(x: number, y: number, z: number) {
    this.goalPos = [x, y, z];
  }
}
