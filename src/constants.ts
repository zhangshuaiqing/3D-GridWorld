// 3D GridWorld — Constants & Colors

import { CellType } from './types';

export const CELL_COLORS: Record<number, string> = {
  [CellType.EMPTY]: '#161b22',
  [CellType.OBSTACLE]: '#586069',
  [CellType.AGENT]: '#58a6ff',
  [CellType.GOAL]: '#d29922',
  [CellType.DYNAMIC_OBSTACLE]: '#f85149',
};

export const ACTIONS: Record<string, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

export const ACTION_KEYS: Array<[number, string, string]> = [
  [0, 'up', 'ArrowUp'],
  [1, 'down', 'ArrowDown'],
  [2, 'left', 'ArrowLeft'],
  [3, 'right', 'ArrowRight'],
];

export const FOG_COLOR = '#0d1117';
export const GRID_LINE_COLOR = '#30363d';
