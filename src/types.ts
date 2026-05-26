// 3D GridWorld — Type Definitions

export const CellType = {
  EMPTY: 0,
  OBSTACLE: 1,
  AGENT: 2,
  GOAL: 3,
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

// 3D position: [x, y, z] where y is height
export type Pos3 = [number, number, number];

// 6-direction actions: 0=+x, 1=-x, 2=+y, 3=-y, 4=+z, 5=-z
export type Action = 0 | 1 | 2 | 3 | 4 | 5;

export type ObservationMode = 'full' | 'fog_of_war';

export interface GridWorldState {
  // 3D grid: grid[x][y][z] = CellType
  grid: number[][][];
  width: number;
  height: number;
  depth: number;
  agentPos: Pos3;
  goalPos: Pos3;
  stepCount: number;
  done: boolean;
  reward: number;
  visited: boolean[][][];
}

export interface GridWorldConfig {
  width: number;   // x dimension
  height: number;  // y dimension (vertical)
  depth: number;   // z dimension
  obstacleRatio: number;
  seed?: number;
  randomStartGoal: boolean;
  observationMode: ObservationMode;
  viewRange: number;
  numDynamicObstacles: number;
}

export const DEFAULT_CONFIG: GridWorldConfig = {
  width: 6,
  height: 4,
  depth: 6,
  obstacleRatio: 0.15,
  observationMode: 'full',
  viewRange: 2,
  randomStartGoal: false,
  numDynamicObstacles: 0,
};
