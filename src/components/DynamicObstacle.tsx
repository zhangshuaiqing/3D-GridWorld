import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

export default function DynamicObstacle() {
  const dynObs = useStore((s) => s.state.dynamicObstacles);
  const obsMode = useStore((s) => s.config.observationMode);
  const visited = useStore((s) => s.state.visited);
  const groupRef = useRef<THREE.Group>(null);

  // Move group to match dynamic obstacle positions
  useEffect(() => {
    if (!groupRef.current) return;
    // We handle individual positions per mesh
  });

  if (!dynObs || dynObs.length === 0) return null;

  return (
    <group ref={groupRef}>
      {dynObs.map((dyn, i) => {
        const [x, y, z] = dyn.pos;
        const [dx, dy, dz] = dyn.dir;

        // Calculate arrow rotation
        const angle = Math.atan2(dx, dz);
        const verticalAngle = Math.asin(Math.max(-1, Math.min(1, -dy)));

        let visible = true;
        if (obsMode === 'fog_of_war') {
          const v = visited[x]?.[y]?.[z];
          visible = v === true;
        }

        return (
          <group key={i} position={[x, y + 0.5, z]} visible={visible}>
            {/* Red obstacle cube */}
            <mesh>
              <boxGeometry args={[0.85, 0.85, 0.85]} />
              <meshStandardMaterial
                color={CELL_COLORS[CellType.DYNAMIC_OBSTACLE]}
                emissive={CELL_COLORS[CellType.DYNAMIC_OBSTACLE]}
                emissiveIntensity={0.15}
              />
            </mesh>
            {/* Direction arrow */}
            <group rotation={[verticalAngle, 0, -angle]}>
              <mesh position={[0, 0.55, 0]}>
                <coneGeometry args={[0.12, 0.2, 6]} />
                <meshBasicMaterial color="#ff7b72" />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}
