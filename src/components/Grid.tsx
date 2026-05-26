import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

const GRID_Y = 0;

export default function Grid() {
  const size = useStore((s) => s.config.size);
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

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(size - 1) / 2, GRID_Y - 0.01, (size - 1) / 2]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#161b22" />
      </mesh>
      <lineSegments ref={gridRef}>
        <lineBasicMaterial color="#30363d" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}
