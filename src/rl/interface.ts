// 3D GridWorld — RL Interface (window.__gridworld)
// Exposes the environment API for external training scripts (Python, WebSocket, browser console)

import { useStore } from '../store';
import { GridWorld3D } from '../logic/gridworld';
import type { GridWorldConfig, GridWorldState, Action, Pos3, ObservationMode } from '../types';
import { CellType } from '../types';

export interface RLAPI {
  /** Reset the environment with optional config overrides */
  reset(config?: Partial<GridWorldConfig>): GridWorldState;

  /** Execute one action. action: 0=+x, 1=-x, 2=+y, 3=-y, 4=+z, 5=-z */
  step(action: Action): GridWorldState;

  /** Get current state */
  getState(): GridWorldState;

  /** Get the visible grid (respects observation mode) */
  getVisibleGrid(): number[][][];

  /** Get available actions (all 6 are always available) */
  getActionSpace(): Action[];

  /** Manually set agent position */
  setAgentPos(x: number, y: number, z: number): void;

  /** Manually set goal position */
  setGoalPos(x: number, y: number, z: number): void;

  /** Set observation mode */
  setMode(mode: ObservationMode): void;

  /** Set view range */
  setViewRange(n: number): void;

  /** Get current config */
  getConfig(): GridWorldConfig;

  /** Seed the RNG */
  seed(s: number): void;

  /** Render current state to the 3D scene (triggers React update) */
  render(): void;

  /** Subscribe to events: 'step', 'reset', 'goal', 'collision', 'collision_dynamic' */
  on(event: string, callback: (...args: any[]) => void): void;

  /** Unsubscribe from events */
  off(event: string, callback: (...args: any[]) => void): void;
}

type EventCallback = (...args: any[]) => void;

function createRLInterface(): RLAPI {
  const listeners: Record<string, EventCallback[]> = {};

  const emit = (event: string, ...args: any[]) => {
    (listeners[event] || []).forEach((cb) => cb(...args));
  };

  const getEnv = (): GridWorld3D => {
    return useStore.getState().env;
  };

  const api: RLAPI = {
    reset: (config?: Partial<GridWorldConfig>) => {
      const env = getEnv();
      const store = useStore.getState();
      // Merge with current config
      const merged: Partial<GridWorldConfig> = { ...config };
      const s = env.reset(Object.keys(merged).length > 0 ? merged : undefined);
      // Sync store
      if (Object.keys(merged).length > 0) {
        const cfg = { ...store.config, ...merged };
        useStore.setState({ config: cfg, state: s });
      } else {
        useStore.setState({ state: s });
      }
      emit('reset', s);
      return s;
    },

    step: (action: Action) => {
      const env = getEnv();
      const oldPos = [...env.agentPos] as Pos3;
      const s = env.step(action);
      useStore.setState({ state: s });

      emit('step', s);

      // Check events
      if (s.done && s.reward > 0) {
        emit('goal', s);
      }
      if (s.reward <= -0.5 && oldPos[0] === s.agentPos[0] && oldPos[1] === s.agentPos[1] && oldPos[2] === s.agentPos[2]) {
        // Agent didn't move — collision
        // Check if a dynamic obstacle is at the attempted cell
        const [dx, dy, dz] = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]][action];
        const nx = oldPos[0] + dx;
        const ny = oldPos[1] + dy;
        const nz = oldPos[2] + dz;
        if (nx >= 0 && nx < env.width && ny >= 0 && ny < env.height && nz >= 0 && nz < env.depth) {
          const cell = env.grid[nx][ny][nz];
          if (cell === CellType.DYNAMIC_OBSTACLE) {
            emit('collision_dynamic', s);
          } else if (cell === CellType.OBSTACLE) {
            emit('collision', s);
          }
        } else {
          emit('collision', s);
        }
      }

      return s;
    },

    getState: () => getEnv().getState(),

    getVisibleGrid: () => {
      const env = getEnv();
      if (env.observationMode === 'full') {
        return env.grid.map((xy: number[][]) => xy.map((yz: number[]) => [...yz]));
      }
      const visible = Array.from({ length: env.width }, () =>
        Array.from({ length: env.height }, () => Array(env.depth).fill(-1))
      );
      for (let x = 0; x < env.width; x++) {
        for (let y = 0; y < env.height; y++) {
          for (let z = 0; z < env.depth; z++) {
            if (env.visitedMask[x][y][z]) {
              visible[x][y][z] = env.grid[x][y][z];
            }
          }
        }
      }
      return visible;
    },

    getActionSpace: () => [0, 1, 2, 3, 4, 5],

    setAgentPos: (x: number, y: number, z: number) => {
      getEnv().setAgentPos(x, y, z);
      useStore.setState({ state: getEnv().getState() });
    },

    setGoalPos: (x: number, y: number, z: number) => {
      getEnv().setGoalPos(x, y, z);
      useStore.setState({ state: getEnv().getState() });
    },

    setMode: (mode: ObservationMode) => {
      getEnv().observationMode = mode;
      useStore.setState({ state: getEnv().getState() });
    },

    setViewRange: (n: number) => {
      getEnv().viewRange = Math.max(1, n);
      useStore.setState({ state: getEnv().getState() });
    },

    getConfig: () => useStore.getState().config,

    seed: (s: number) => {
      // Rebuild env with new seed
      const store = useStore.getState();
      const cfg = { ...store.config, seed: s };
      const env = new GridWorld3D(cfg);
      useStore.setState({ env, state: env.getState() });
    },

    render: () => {
      useStore.setState({ state: getEnv().getState() });
    },

    on: (event: string, callback: EventCallback) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },

    off: (event: string, callback: EventCallback) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    },
  };

  return api;
}

// Export singleton
let instance: RLAPI | null = null;

export function getRLInterface(): RLAPI {
  if (!instance) {
    instance = createRLInterface();
  }
  return instance;
}
