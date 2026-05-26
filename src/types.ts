// 3D GridWorld — Type Definitions

export const CellType = {
  EMPTY: 0,
  OBSTACLE: 1,
  AGENT: 2,
  GOAL: 3,
  PATH: 4,
  DYNAMIC_OBSTACLE: 5,
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

export type Action = 0 | 1 | 2 | 3; // 0=up, 1=down, 2=left, 3=right
export type Pos = [number, number];
export type ObservationMode = 'full' | 'local' | 'fog_of_war';

export interface GridWorldState {
  grid: number[][];
  agentPos: Pos;
  goalPos: Pos;
  stepCount: number;
  done: boolean;
  reward: number;
  visited: boolean[][];
}

export interface GridWorldConfig {
  size: number;
  obstacleRatio: number;
  seed?: number;
  randomStartGoal: boolean;
  observationMode: ObservationMode;
  viewRange: number;
  numDynamicObstacles: number;
  dynamicObstacleSpeed: number;
}

export const DEFAULT_CONFIG: GridWorldConfig = {
  size: 8,
  obstacleRatio: 0.2,
  observationMode: 'full',
  viewRange: 1,
  randomStartGoal: false,
  numDynamicObstacles: 0,
  dynamicObstacleSpeed: 1,
};
