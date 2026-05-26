import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

interface ObstacleProps {
  position: [number, number, number];
  color?: string;
}

export default function Obstacle({ position, color }: ObstacleProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.9, 0.8, 0.9]} />
      <meshStandardMaterial
        color={color || CELL_COLORS[CellType.OBSTACLE]}
        roughness={0.8}
      />
    </mesh>
  );
}
