import { useMemo } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';
import * as THREE from 'three';

export default function Obstacles() {
  const grid = useStore((s) => s.state.grid);
  const obsMode = useStore((s) => s.config.observationMode);
  const visited = useStore((s) => s.state.visited);
  const viewRange = useStore((s) => s.config.viewRange);
  const agentPos = useStore((s) => s.state.agentPos);

  const cubes = useMemo(() => {
    const result: Array<{
      pos: [number, number, number];
      color: string;
      visible: boolean;
    }> = [];

    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[x].length; y++) {
        for (let z = 0; z < grid[x][y].length; z++) {
          if (grid[x][y][z] === CellType.OBSTACLE) {
            let visible = true;
            if (obsMode === 'fog_of_war') {
              visible = visited[x]?.[y]?.[z] ?? false;
            }
            result.push({
              pos: [x, y + 0.5, z],
              color: CELL_COLORS[CellType.OBSTACLE],
              visible,
            });
          }
        }
      }
    }
    return result;
  }, [grid, obsMode, visited, viewRange, agentPos]);

  return (
    <group>
      {cubes.map((cube, i) => (
        <group key={i} position={cube.pos} visible={cube.visible}>
          {/* Solid fill */}
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial color={cube.color} roughness={0.8} />
          </mesh>
          {/* Wireframe border */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.9, 0.9, 0.9)]} />
            <lineBasicMaterial color="#8b949e" transparent opacity={0.4} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
