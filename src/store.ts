// 3D GridWorld — zustand Global Store

import { create } from 'zustand';
import type { GridWorldConfig, ObservationMode, Pos } from './types';
import { DEFAULT_CONFIG } from './types';

interface AppState {
  // Config
  config: GridWorldConfig;
  setSize: (n: number) => void;
  setObstacleRatio: (n: number) => void;
  setRandomStartGoal: (b: boolean) => void;
  setObservationMode: (m: ObservationMode) => void;
  setViewRange: (n: number) => void;
  setNumDynamicObstacles: (n: number) => void;

  // Runtime
  stepCount: number;
  agentPos: Pos;
  goalPos: Pos;
  reward: number;
  done: boolean;
  setRuntime: (data: { stepCount: number; agentPos: Pos; goalPos: Pos; reward: number; done: boolean }) => void;
  resetRuntime: () => void;

  // UI
  autoRun: boolean;
  autoSpeed: number;
  setAutoRun: (b: boolean) => void;
  setAutoSpeed: (n: number) => void;
}

export const useStore = create<AppState>((set) => ({
  // Config defaults
  config: { ...DEFAULT_CONFIG },
  setSize: (n) => set((s) => ({ config: { ...s.config, size: n } })),
  setObstacleRatio: (n) => set((s) => ({ config: { ...s.config, obstacleRatio: n } })),
  setRandomStartGoal: (b) => set((s) => ({ config: { ...s.config, randomStartGoal: b } })),
  setObservationMode: (m) => set((s) => ({ config: { ...s.config, observationMode: m } })),
  setViewRange: (n) => set((s) => ({ config: { ...s.config, viewRange: n } })),
  setNumDynamicObstacles: (n) => set((s) => ({ config: { ...s.config, numDynamicObstacles: n } })),

  // Runtime
  stepCount: 0,
  agentPos: [0, 0] as Pos,
  goalPos: [7, 7] as Pos,
  reward: 0,
  done: false,
  setRuntime: (data) => set(data),
  resetRuntime: () => set({ stepCount: 0, reward: 0, done: false }),

  // UI
  autoRun: false,
  autoSpeed: 500,
  setAutoRun: (b) => set({ autoRun: b }),
  setAutoSpeed: (n) => set({ autoSpeed: n }),
}));
