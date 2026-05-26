import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

export default function Agent() {
  const pos = useStore((s) => s.state.agentPos);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(pos[0], pos[1] + 0.5, pos[2]);
    }
  }, [pos]);

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial
          color={CELL_COLORS[CellType.AGENT]}
          emissive={CELL_COLORS[CellType.AGENT]}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Shadow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <ringGeometry args={[0.3, 0.45, 24]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.AGENT]} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
