import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { Text } from '@react-three/drei';

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

    pts.push(x0, 0, z0, x1, 0, z0);
    pts.push(x1, 0, z0, x1, 0, z1);
    pts.push(x1, 0, z1, x0, 0, z1);
    pts.push(x0, 0, z1, x0, 0, z0);
    pts.push(x0, h, z0, x1, h, z0);
    pts.push(x1, h, z0, x1, h, z1);
    pts.push(x1, h, z1, x0, h, z1);
    pts.push(x0, h, z1, x0, h, z0);
    for (const x of [x0, x1]) {
      for (const z of [z0, z1]) {
        pts.push(x, 0, z, x, h, z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, h, d]);

  // Inner grid lines (ground)
  const gridGeo = useMemo(() => {
    const pts: number[] = [];
    const x0 = -0.5;
    const x1 = w - 0.5;
    const z0 = -0.5;
    const z1 = d - 0.5;
    for (let z = z0 + 1; z < z1; z++) { pts.push(x0, 0, z, x1, 0, z); }
    for (let x = x0 + 1; x < x1; x++) { pts.push(x, 0, z0, x, 0, z1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, d]);

  // Grid lines on top
  const topGridGeo = useMemo(() => {
    const pts: number[] = [];
    const x0 = -0.5;
    const x1 = w - 0.5;
    const z0 = -0.5;
    const z1 = d - 0.5;
    const y = h;
    for (let z = z0 + 1; z < z1; z++) { pts.push(x0, y, z, x1, y, z); }
    for (let x = x0 + 1; x < x1; x++) { pts.push(x, y, z0, x, y, z1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, d, h]);

  // Axis labels
  const axisLabels = useMemo(() => {
    const x0 = -0.5;
    const z0 = -0.5;

    const labels: { text: string; pos: [number, number, number]; color: string }[] = [];

    // X-axis labels along front edge (z = z0, y=0)
    for (let x = 0; x < w; x++) {
      labels.push({ text: `${x}`, pos: [x, 0, z0 - 0.6], color: '#58a6ff' });
    }
    // Z-axis labels along left edge (x = x0, y=0)
    for (let z = 0; z < d; z++) {
      labels.push({ text: `${z}`, pos: [x0 - 0.6, 0, z], color: '#3fb950' });
    }
    // Y-axis labels along back-left corner
    for (let y = 0; y <= h; y++) {
      labels.push({ text: `${y}`, pos: [x0 - 0.6, y + 0.2, z0 - 0.6], color: '#f0883e' });
    }

    // Axis names
    labels.push({ text: 'X', pos: [w / 2, 0, z0 - 1.2], color: '#58a6ff' });
    labels.push({ text: 'Z', pos: [x0 - 1.2, 0, d / 2], color: '#3fb950' });
    labels.push({ text: 'Y', pos: [x0 - 1.2, h + 0.5, z0 - 1.2], color: '#f0883e' });

    return labels;
  }, [w, h, d]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(w - 1) / 2, -0.01, (d - 1) / 2]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#161b22" />
      </mesh>

      {/* Inner grid lines */}
      <lineSegments geometry={gridGeo}>
        <lineBasicMaterial color="#30363d" transparent opacity={0.3} />
      </lineSegments>
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
          <meshBasicMaterial color="#30363d" transparent opacity={0.04} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Axis labels */}
      {axisLabels.map((l, i) => (
        <Text
          key={i}
          position={l.pos}
          fontSize={0.3}
          color={l.color}
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
        >
          {l.text}
        </Text>
      ))}
    </group>
  );
}
