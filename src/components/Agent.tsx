import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function Agent() {
  const agentPos = useStore((s) => s.state.agentPos);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(agentPos[1], 0.5, agentPos[0]);
    }
  }, [agentPos]);

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color={CELL_COLORS[CellType.AGENT]}
          emissive={CELL_COLORS[CellType.AGENT]}
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.AGENT]} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
