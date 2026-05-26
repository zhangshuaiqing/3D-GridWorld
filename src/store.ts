// 3D GridWorld — zustand Global Store

import { create } from 'zustand';
import type { GridWorldConfig, ObservationMode, GridWorldState } from './types';
import { DEFAULT_CONFIG } from './types';
import { GridWorld } from './logic/gridworld';

interface AppState {
  // Config
  config: GridWorldConfig;
  setSize: (n: number) => void;
  setObstacleRatio: (n: number) => void;
  setRandomStartGoal: (b: boolean) => void;
  setObservationMode: (m: ObservationMode) => void;
  setViewRange: (n: number) => void;
  setNumDynamicObstacles: (n: number) => void;

  // Environment
  env: GridWorld;
  state: GridWorldState;

  // Actions
  step: (action: 0 | 1 | 2 | 3) => void;
  reset: () => void;

  // UI
  autoRun: boolean;
  autoSpeed: number;
  setAutoRun: (b: boolean) => void;
  setAutoSpeed: (n: number) => void;
  message: string;
  setMessage: (msg: string) => void;
}

const env = new GridWorld(DEFAULT_CONFIG);

export const useStore = create<AppState>((set, get) => ({
  // Config
  config: { ...DEFAULT_CONFIG },
  setSize: (n) => set((s) => ({ config: { ...s.config, size: n } })),
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
  setNumDynamicObstacles: (n) => set((s) => ({ config: { ...s.config, numDynamicObstacles: n } })),

  // Environment
  env,
  state: env.getState(),

  // Actions
  step: (action) => {
    const s = env.step(action);
    set({ state: s });
  },
  reset: () => {
    const cfg = get().config;
    const s = env.reset({
      size: cfg.size,
      obstacleRatio: cfg.obstacleRatio,
      randomStartGoal: cfg.randomStartGoal,
      observationMode: cfg.observationMode,
      viewRange: cfg.viewRange,
      numDynamicObstacles: cfg.numDynamicObstacles,
    });
    set({ state: s, message: '' });
  },

  // UI
  autoRun: false,
  autoSpeed: 500,
  setAutoRun: (b) => set({ autoRun: b }),
  setAutoSpeed: (n) => set({ autoSpeed: n }),
  message: '',
  setMessage: (msg) => set({ message: msg }),
}));
