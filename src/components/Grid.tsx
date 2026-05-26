import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

const GRID_Y = 0;

export default function Grid() {
  const size = useStore((s) => s.config.size);
  const visited = useStore((s) => s.state.visited);
  const gridRef = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const pts: number[] = [];
    for (let r = 0; r <= size; r++) {
      pts.push(-0.5, GRID_Y, r - 0.5, size - 0.5, GRID_Y, r - 0.5);
    }
    for (let c = 0; c <= size; c++) {
      pts.push(c - 0.5, GRID_Y, -0.5, c - 0.5, GRID_Y, size - 0.5);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    gridRef.current.geometry = geo;
  }, [size]);

  // Visited trail tiles
  const trailInstances = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    for (let r = 0; r < visited.length; r++) {
      for (let c = 0; c < (visited[r]?.length || 0); c++) {
        if (visited[r][c]) {
          positions.push(c, GRID_Y + 0.005, r);
          colors.push(0.22, 0.65, 1.0); // #38a6ff tint
        }
      }
    }
    return { positions, colors };
  }, [visited]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(size - 1) / 2, GRID_Y - 0.01, (size - 1) / 2]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#161b22" />
      </mesh>

      {/* Visited trail — small translucent squares */}
      {trailInstances.positions.length > 0 && (
        <group>
          {Array.from({ length: trailInstances.positions.length / 3 }, (_, i) => (
            <mesh
              key={i}
              position={[
                trailInstances.positions[i * 3],
                trailInstances.positions[i * 3 + 1],
                trailInstances.positions[i * 3 + 2],
              ]}
            >
              <planeGeometry args={[0.6, 0.6]} />
              <meshBasicMaterial
                color="#58a6ff"
                transparent
                opacity={0.08}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Grid lines */}
      <lineSegments ref={gridRef}>
        <lineBasicMaterial color="#30363d" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}
