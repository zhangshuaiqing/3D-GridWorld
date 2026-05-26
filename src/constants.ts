// 3D GridWorld — Constants & Colors

import { CellType } from './types';

export const CELL_COLORS: Record<number, string> = {
  [CellType.EMPTY]: '#161b22',
  [CellType.OBSTACLE]: '#586069',
  [CellType.AGENT]: '#58a6ff',
  [CellType.GOAL]: '#d29922',
};

// 6 actions in 3D space: +x, -x, +y, -y, +z, -z
export const ACTION_VECTORS: [number, number, number][] = [
  [1, 0, 0],   // 0: +x
  [-1, 0, 0],  // 1: -x
  [0, 1, 0],   // 2: +y (up)
  [0, -1, 0],  // 3: -y (down)
  [0, 0, 1],   // 4: +z
  [0, 0, -1],  // 5: -z
];

export const ACTION_LABELS: Record<number, string> = {
  0: '+x',
  1: '-x',
  2: '+y',
  3: '-y',
  4: '+z',
  5: '-z',
};

export const FOG_COLOR = '#0d1117';
