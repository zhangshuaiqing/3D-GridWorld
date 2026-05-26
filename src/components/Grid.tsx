import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

export default function Grid() {
  const w = useStore((s) => s.state.width);
  const h = useStore((s) => s.state.height);
  const d = useStore((s) => s.state.depth);

  const linesRef = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (!linesRef.current) return;
    const pts: number[] = [];
    for (let r = 0; r <= d; r++) {
      pts.push(-0.5, 0, r - 0.5, w - 0.5, 0, r - 0.5);
    }
    for (let c = 0; c <= w; c++) {
      pts.push(c - 0.5, 0, -0.5, c - 0.5, 0, d - 0.5);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    linesRef.current.geometry = geo;
  }, [w, d]);

  // Corner pillars
  const pillars: [number, number, number][] = [];
  for (let x = 0; x <= w; x++) {
    for (let z = 0; z <= d; z++) {
      if (x === 0 || x === w || z === 0 || z === d) {
        pillars.push([x - 0.5, 0.5, z - 0.5]);
      }
    }
  }

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(w - 1) / 2, -0.01, (d - 1) / 2]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#161b22" />
      </mesh>

      {/* Ground grid lines */}
      <lineSegments ref={linesRef}>
        <lineBasicMaterial color="#30363d" transparent opacity={0.5} />
      </lineSegments>

      {/* Corner pillars */}
      {pillars.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.03, 0.03, h, 4]} />
          <meshBasicMaterial color="#30363d" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Height level indicators */}
      {Array.from({ length: h + 1 }, (_, y) => (
        <mesh key={y} rotation={[-Math.PI / 2, 0, 0]} position={[(w - 1) / 2, y, (d - 1) / 2]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial
            color="#30363d"
            transparent
            opacity={0.05}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
