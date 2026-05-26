import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

export default function Grid() {
  const w = useStore((s) => s.state.width);
  const h = useStore((s) => s.state.height);
  const d = useStore((s) => s.state.depth);

  // Build boundary box geometry: 4 lines around the perimeter at y=0
  const borderGeo = useMemo(() => {
    const pts: number[] = [];
    const y = 0;
    const x0 = -0.5;
    const x1 = w - 0.5;
    const z0 = -0.5;
    const z1 = d - 0.5;

    // 4 edges at y=0
    pts.push(x0, y, z0, x1, y, z0);  // front edge (z=z0)
    pts.push(x1, y, z0, x1, y, z1);  // right edge (x=x1)
    pts.push(x1, y, z1, x0, y, z1);  // back edge (z=z1)
    pts.push(x0, y, z1, x0, y, z0);  // left edge (x=x0)

    // Vertical lines at each corner (from y=0 to y=h)
    for (const x of [x0, x1]) {
      for (const z of [z0, z1]) {
        pts.push(x, 0, z, x, h, z);
      }
    }

    // Top edge at y=h (same as bottom)
    pts.push(x0, h, z0, x1, h, z0);
    pts.push(x1, h, z0, x1, h, z1);
    pts.push(x1, h, z1, x0, h, z1);
    pts.push(x0, h, z1, x0, h, z0);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, h, d]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(w - 1) / 2, -0.01, (d - 1) / 2]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#161b22" />
      </mesh>

      {/* Outer boundary box */}
      <lineSegments geometry={borderGeo}>
        <lineBasicMaterial color="#8b949e" transparent opacity={0.25} />
      </lineSegments>

      {/* Height level indicators */}
      {Array.from({ length: h + 1 }, (_, y) => (
        <mesh key={y} rotation={[-Math.PI / 2, 0, 0]} position={[(w - 1) / 2, y, (d - 1) / 2]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial
            color="#30363d"
            transparent
            opacity={0.04}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
