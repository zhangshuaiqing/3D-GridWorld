import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

export default function Agent() {
  const [r, c] = useStore((s) => s.agentPos);

  return (
    <group position={[c, 0.5, r]}>
      {/* Agent body */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={CELL_COLORS[CellType.AGENT]} emissive={CELL_COLORS[CellType.AGENT]} emissiveIntensity={0.3} />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.AGENT]} transparent opacity={0.3} side={2} />
      </mesh>
    </group>
  );
}
