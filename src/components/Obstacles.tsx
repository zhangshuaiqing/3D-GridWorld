import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';
import { useMemo } from 'react';

export default function Obstacles() {
  const grid = useStore((s) => s.state.grid);
  const obsMode = useStore((s) => s.config.observationMode);
  const visited = useStore((s) => s.state.visited);
  const viewRange = useStore((s) => s.config.viewRange);
  const agentPos = useStore((s) => s.state.agentPos);

  const obstacles = useMemo(() => {
    const result: Array<{
      pos: [number, number, number];
      color: string;
      visible: boolean;
    }> = [];

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cellType = grid[r][c];
        if (cellType === CellType.OBSTACLE || cellType === CellType.DYNAMIC_OBSTACLE) {
          const color = cellType === CellType.OBSTACLE
            ? CELL_COLORS[CellType.OBSTACLE]
            : CELL_COLORS[CellType.DYNAMIC_OBSTACLE];

          let visible = true;

          if (obsMode === 'local') {
            const dist = Math.abs(r - agentPos[0]) + Math.abs(c - agentPos[1]);
            visible = dist <= viewRange;
          } else if (obsMode === 'fog_of_war') {
            visible = visited[r]?.[c] ?? false;
          }

          result.push({
            pos: [c, 0.4, r],
            color,
            visible,
          });
        }
      }
    }

    return result;
  }, [grid, obsMode, visited, viewRange, agentPos]);

  return (
    <group>
      {obstacles.map((obs, i) => (
        <mesh key={i} position={obs.pos} visible={obs.visible}>
          <boxGeometry args={[0.9, 0.8, 0.9]} />
          <meshStandardMaterial color={obs.color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
