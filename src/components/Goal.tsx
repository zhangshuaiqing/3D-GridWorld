import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function Goal() {
  const goalPos = useStore((s) => s.state.goalPos);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(goalPos[1], 0.3, goalPos[0]);
    }
  }, [goalPos]);

  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.45, 32]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.GOAL]} side={THREE.DoubleSide} />
      </mesh>
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color={CELL_COLORS[CellType.GOAL]} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
