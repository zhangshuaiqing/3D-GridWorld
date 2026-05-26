import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

export default function Goal() {
  const pos = useStore((s) => s.state.goalPos);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(pos[0], pos[1] + 0.5, pos[2]);
    }
  }, [pos]);

  return (
    <group ref={ref}>
      {/* Rotating ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.4, 24]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.GOAL]} side={THREE.DoubleSide} />
      </mesh>
      {/* Glow pillar */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.8, 12]} />
        <meshStandardMaterial
          color={CELL_COLORS[CellType.GOAL]}
          emissive={CELL_COLORS[CellType.GOAL]}
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.GOAL]} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
