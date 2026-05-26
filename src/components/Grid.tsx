import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

export default function Grid() {
  const w = useStore((s) => s.state.width);
  const h = useStore((s) => s.state.height);
  const d = useStore((s) => s.state.depth);

  // Outer boundary box
  const borderGeo = useMemo(() => {
    const pts: number[] = [];
    const x0 = -0.5;
    const x1 = w - 0.5;
    const z0 = -0.5;
    const z1 = d - 0.5;

    // Bottom edges
    pts.push(x0, 0, z0, x1, 0, z0);
    pts.push(x1, 0, z0, x1, 0, z1);
    pts.push(x1, 0, z1, x0, 0, z1);
    pts.push(x0, 0, z1, x0, 0, z0);

    // Top edges
    pts.push(x0, h, z0, x1, h, z0);
    pts.push(x1, h, z0, x1, h, z1);
    pts.push(x1, h, z1, x0, h, z1);
    pts.push(x0, h, z1, x0, h, z0);

    // Vertical corners
    for (const x of [x0, x1]) {
      for (const z of [z0, z1]) {
        pts.push(x, 0, z, x, h, z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, h, d]);

  // Inner grid lines on the ground (y=0)
  const gridGeo = useMemo(() => {
    const pts: number[] = [];
    const x0 = -0.5;
    const x1 = w - 0.5;
    const z0 = -0.5;
    const z1 = d - 0.5;

    // Lines parallel to X axis (along X, varying Z)
    for (let z = z0 + 1; z < z1; z++) {
      pts.push(x0, 0, z, x1, 0, z);
    }
    // Lines parallel to Z axis (along Z, varying X)
    for (let x = x0 + 1; x < x1; x++) {
      pts.push(x, 0, z0, x, 0, z1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, d]);

  // Grid lines on the top (y=h)
  const topGridGeo = useMemo(() => {
    const pts: number[] = [];
    const x0 = -0.5;
    const x1 = w - 0.5;
    const z0 = -0.5;
    const z1 = d - 0.5;
    const y = h;

    for (let z = z0 + 1; z < z1; z++) {
      pts.push(x0, y, z, x1, y, z);
    }
    for (let x = x0 + 1; x < x1; x++) {
      pts.push(x, y, z0, x, y, z1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, d, h]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(w - 1) / 2, -0.01, (d - 1) / 2]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#161b22" />
      </mesh>

      {/* Inner grid lines (ground) */}
      <lineSegments geometry={gridGeo}>
        <lineBasicMaterial color="#30363d" transparent opacity={0.3} />
      </lineSegments>

      {/* Inner grid lines (top) */}
      <lineSegments geometry={topGridGeo}>
        <lineBasicMaterial color="#30363d" transparent opacity={0.08} />
      </lineSegments>

      {/* Outer boundary box */}
      <lineSegments geometry={borderGeo}>
        <lineBasicMaterial color="#8b949e" transparent opacity={0.35} />
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
