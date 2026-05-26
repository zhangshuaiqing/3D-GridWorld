// 3D GridWorld — zustand Global Store

import { create } from 'zustand';
import type { GridWorldConfig, ObservationMode, GridWorldState } from './types';
import { DEFAULT_CONFIG } from './types';
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

  autoRun: boolean;
  autoSpeed: number;
  setAutoRun: (b: boolean) => void;
  setAutoSpeed: (n: number) => void;
  message: string;
  setMessage: (msg: string) => void;
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

  autoRun: false,
  autoSpeed: 500,
  setAutoRun: (b) => set({ autoRun: b }),
  setAutoSpeed: (n) => set({ autoSpeed: n }),
  message: '',
  setMessage: (msg) => set({ message: msg }),
}));
