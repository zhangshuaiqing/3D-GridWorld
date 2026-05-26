// 3D GridWorld — Constants & Colors

import { CellType } from './types';

export const CELL_COLORS: Record<number, string> = {
  [CellType.EMPTY]: '#161b22',
  [CellType.OBSTACLE]: '#586069',
  [CellType.AGENT]: '#58a6ff',
  [CellType.GOAL]: '#d29922',
  [CellType.DYNAMIC_OBSTACLE]: '#f85149',
};

export const ACTION_VECTORS: [number, number, number][] = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];

export const FOG_COLOR = '#0d1117';
