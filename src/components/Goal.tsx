import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

export default function Goal() {
  const [r, c] = useStore((s) => s.goalPos);

  return (
    <group position={[c, 0.3, r]}>
      {/* Goal ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.45, 32]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.GOAL]} side={2} />
      </mesh>
      {/* Glow pillar */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 16]} />
        <meshStandardMaterial
          color={CELL_COLORS[CellType.GOAL]}
          emissive={CELL_COLORS[CellType.GOAL]}
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.GOAL]} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
