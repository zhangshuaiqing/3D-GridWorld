// 3D GridWorld — zustand Global Store (with editor support)

import { create } from 'zustand';
import type { GridWorldConfig, ObservationMode, GridWorldState, Pos3 } from './types';
import { DEFAULT_CONFIG, CellType } from './types';
import { GridWorld3D } from './logic/gridworld';

interface AppState {
  config: GridWorldConfig;
  setWidth: (n: number) => void;
  setHeight: (n: number) => void;
  setDepth: (n: number) => void;
  setObstacleRatio: (n: number) => void;
  setRandomStartGoal: (b: boolean) => void;
  setObservationMode: (m: ObservationMode) => void;
  setViewRange: (n: number) => void;

  env: GridWorld3D;
  state: GridWorldState;
  step: (action: 0 | 1 | 2 | 3 | 4 | 5) => void;
  reset: () => void;
  regenerate: () => void;

  // Editor
  editMode: boolean;
  setEditMode: (b: boolean) => void;
  editLayer: number;
  setEditLayer: (n: number) => void;
  toggleCell: (x: number, y: number, z: number) => void;
  clearAll: () => void;
  randomFill: () => void;
  applyMap: () => void;  // apply edited map to env and reset
  importMap: (data: string) => void;

  autoRun: boolean;
  autoSpeed: number;
  setAutoRun: (b: boolean) => void;
  setAutoSpeed: (n: number) => void;
  message: string;
  setMessage: (msg: string) => void;

  // Edited grid buffer (separate from env so you can edit then apply)
  editGrid: number[][][];
  initEditGrid: () => void;
}

function cloneGrid(grid: number[][][]): number[][][] {
  return grid.map(xy => xy.map(yz => [...yz]));
}

const env = new GridWorld3D(DEFAULT_CONFIG);

export const useStore = create<AppState>((set, get) => ({
  config: { ...DEFAULT_CONFIG },
  setWidth: (n) => set((s) => ({ config: { ...s.config, width: n } })),
  setHeight: (n) => set((s) => ({ config: { ...s.config, height: n } })),
  setDepth: (n) => set((s) => ({ config: { ...s.config, depth: n } })),
  setObstacleRatio: (n) => set((s) => ({ config: { ...s.config, obstacleRatio: n } })),
  setRandomStartGoal: (b) => set((s) => ({ config: { ...s.config, randomStartGoal: b } })),
  setObservationMode: (m) => {
    set((s) => ({ config: { ...s.config, observationMode: m } }));
    env.observationMode = m;
    set({ state: env.getState() });
  },
  setViewRange: (n) => {
    set((s) => ({ config: { ...s.config, viewRange: n } }));
    env.viewRange = n;
    set({ state: env.getState() });
  },

  env,
  state: env.getState(),

  step: (action) => {
    const s = env.step(action);
    set({ state: s });
  },
  reset: () => {
    const cfg = get().config;
    const s = env.reset(cfg);
    set({ state: s, message: '' });
  },
  regenerate: () => {
    const cfg = get().config;
    const s = env.reset(cfg);
    const eg = cloneGrid(s.grid);
    set({ state: s, editGrid: eg, message: '' });
  },

  // Editor state
  editMode: false,
  setEditMode: (b) => {
    set({ editMode: b });
    if (b) {
      // Initialize edit grid from current env
      const eg = cloneGrid(env.grid);
      set({ editGrid: eg, editLayer: Math.min(env.agentPos[1], env.height - 1) });
    }
  },
  editLayer: 0,
  setEditLayer: (n) => set({ editLayer: n }),

  toggleCell: (x, y, z) => {
    const eg = get().editGrid;
    if (!eg || x < 0 || x >= eg.length || y < 0 || y >= eg[0].length || z < 0 || z >= eg[0][0].length) return;
    const current = eg[x][y][z];
    // Don't allow editing agent or goal positions
    const ap = env.agentPos;
    const gp = env.goalPos;
    if ((x === ap[0] && y === ap[1] && z === ap[2]) ||
        (x === gp[0] && y === gp[1] && z === gp[2])) return;

    eg[x][y][z] = current === CellType.OBSTACLE ? CellType.EMPTY : CellType.OBSTACLE;
    set({ editGrid: cloneGrid(eg) });
  },

  clearAll: () => {
    const eg = get().editGrid;
    if (!eg) return;
    for (let x = 0; x < eg.length; x++) {
      for (let y = 0; y < eg[x].length; y++) {
        for (let z = 0; z < eg[x][y].length; z++) {
          const ap = env.agentPos;
          const gp = env.goalPos;
          if (!(x === ap[0] && y === ap[1] && z === ap[2]) &&
              !(x === gp[0] && y === gp[1] && z === gp[2])) {
            eg[x][y][z] = CellType.EMPTY;
          }
        }
      }
    }
    set({ editGrid: cloneGrid(eg) });
  },

  randomFill: () => {
    const cfg = get().config;
    const eg = get().editGrid;
    if (!eg) return;
    const w = eg.length;
    const h = eg[0].length;
    const d = eg[0][0].length;
    const numObs = Math.floor(w * h * d * (cfg.obstacleRatio || 0.2));

    // Clear first
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        for (let z = 0; z < d; z++) {
          const ap = env.agentPos;
          const gp = env.goalPos;
          if (!(x === ap[0] && y === ap[1] && z === ap[2]) &&
              !(x === gp[0] && y === gp[1] && z === gp[2])) {
            eg[x][y][z] = CellType.EMPTY;
          }
        }
      }
    }

    // Random fill
    const cells: Pos3[] = [];
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        for (let z = 0; z < d; z++) {
          const ap = env.agentPos;
          const gp = env.goalPos;
          if (!(x === ap[0] && y === ap[1] && z === ap[2]) &&
              !(x === gp[0] && y === gp[1] && z === gp[2])) {
            cells.push([x, y, z]);
          }
        }
      }
    }

    // Shuffle
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    for (let i = 0; i < Math.min(numObs, cells.length); i++) {
      const [x, y, z] = cells[i];
      eg[x][y][z] = CellType.OBSTACLE;
    }

    set({ editGrid: cloneGrid(eg) });
  },

  applyMap: () => {
    const eg = get().editGrid;
    if (!eg) return;
    // Copy edit grid to env
    for (let x = 0; x < eg.length; x++) {
      for (let y = 0; y < eg[x].length; y++) {
        for (let z = 0; z < eg[x][y].length; z++) {
          env.grid[x][y][z] = eg[x][y][z];
        }
      }
    }
    // Reset positions
    env.grid[env.agentPos[0]][env.agentPos[1]][env.agentPos[2]] = CellType.AGENT;
    env.grid[env.goalPos[0]][env.goalPos[1]][env.goalPos[2]] = CellType.GOAL;
    env.stepCount = 0;
    env.done = false;
    env.reward = 0;
    env.updateVisitedMask();
    set({ state: env.getState(), editMode: false, message: 'Map applied!' });
  },

  autoRun: false,
  autoSpeed: 500,
  setAutoRun: (b) => set({ autoRun: b }),
  setAutoSpeed: (n) => set({ autoSpeed: n }),
  message: '',
  setMessage: (msg) => set({ message: msg }),

  // Edit grid
  editGrid: [],
  initEditGrid: () => {
    const eg = cloneGrid(env.grid);
    set({ editGrid: eg });
  },

  // Import map from JSON
  importMap: (data: string) => {
    try {
      const map = JSON.parse(data);
      const w = map.width || 6;
      const h = map.height || 4;
      const d = map.depth || 6;

      // Validate
      if (w < 2 || h < 1 || d < 2) {
        set({ message: 'Invalid map dimensions' });
        return;
      }

      // Create new grid
      const newGrid: number[][][] = [];
      for (let x = 0; x < w; x++) {
        const yz: number[][] = [];
        for (let y = 0; y < h; y++) yz.push(Array(d).fill(CellType.EMPTY));
        newGrid.push(yz);
      }

      // Place obstacles
      if (map.obstacles && Array.isArray(map.obstacles)) {
        for (const obs of map.obstacles) {
          if (obs.length === 3) {
            const [ox, oy, oz] = obs;
            if (ox >= 0 && ox < w && oy >= 0 && oy < h && oz >= 0 && oz < d) {
              newGrid[ox][oy][oz] = CellType.OBSTACLE;
            }
          }
        }
      }

      // Set agent and goal positions
      const agentPos: Pos3 = map.agentPos && map.agentPos.length === 3
        ? [Math.min(map.agentPos[0], w - 1), Math.min(map.agentPos[1], h - 1), Math.min(map.agentPos[2], d - 1)]
        : [0, 0, 0];

      const goalPos: Pos3 = map.goalPos && map.goalPos.length === 3
        ? [Math.min(map.goalPos[0], w - 1), Math.min(map.goalPos[1], h - 1), Math.min(map.goalPos[2], d - 1)]
        : [w - 1, 0, d - 1];

      // Rebuild env
      env.width = w;
      env.height = h;
      env.depth = d;
      env.totalCells = w * h * d;
      env.maxSteps = env.totalCells * 2;
      env.grid = newGrid;
      env.agentPos = agentPos;
      env.goalPos = goalPos;
      env.stepCount = 0;
      env.done = false;
      env.reward = 0;
      env.visitedMask = [];
      for (let x = 0; x < w; x++) {
        const yz: boolean[][] = [];
        for (let y = 0; y < h; y++) yz.push(Array(d).fill(false));
        env.visitedMask.push(yz);
      }
      env.updateVisitedMask();

      // Mark agent and goal in grid
      env.grid[agentPos[0]][agentPos[1]][agentPos[2]] = CellType.AGENT;
      env.grid[goalPos[0]][goalPos[1]][goalPos[2]] = CellType.GOAL;

      // Update config
      const cfg = { ...get().config, width: w, height: h, depth: d };
      set({ config: cfg, state: env.getState(), message: `Map loaded: ${w}×${h}×${d}, ${map.obstacles?.length || 0} obstacles` });
    } catch (e: any) {
      set({ message: `Import error: ${e.message}` });
    }
  },
}));
