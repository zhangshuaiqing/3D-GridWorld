import { useState } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

export default function EditorOverlay() {
  const editMode = useStore((s) => s.editMode);
  const editLayer = useStore((s) => s.editLayer);
  const editGrid = useStore((s) => s.editGrid);
  const toggleCell = useStore((s) => s.toggleCell);
  const env = useStore((s) => s.env);
  const [hovered, setHovered] = useState<{ x: number; z: number } | null>(null);

  if (!editMode || !editGrid || editGrid.length === 0) return null;

  const w = editGrid.length;
  const d = editGrid[0][0].length;
  const y = editLayer;
  const agentPos = env.agentPos;
  const goalPos = env.goalPos;

  const cells: { x: number; z: number; type: number }[] = [];

  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      if ((x === agentPos[0] && y === agentPos[1] && z === agentPos[2]) ||
          (x === goalPos[0] && y === goalPos[1] && z === goalPos[2])) continue;
      cells.push({ x, z, type: editGrid[x][y][z] });
    }
  }

  return (
    <group>
      {cells.map((cell) => {
        const isHovered = hovered?.x === cell.x && hovered?.z === cell.z;
        const isObstacle = cell.type === CellType.OBSTACLE;

        return (
          <mesh
            key={`${cell.x},${cell.z}`}
            position={[cell.x, y + 0.5, cell.z]}
            onClick={(e) => {
              e.stopPropagation();
              toggleCell(cell.x, y, cell.z);
            }}
            onPointerEnter={(e) => {
              e.stopPropagation();
              setHovered({ x: cell.x, z: cell.z });
              document.body.style.cursor = 'pointer';
            }}
            onPointerLeave={() => {
              setHovered(null);
              document.body.style.cursor = 'default';
            }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={isObstacle ? CELL_COLORS[CellType.OBSTACLE] : '#1c2128'}
              transparent
              opacity={isObstacle ? 1 : (isHovered ? 0.4 : 0.15)}
              roughness={0.8}
              wireframe={!isObstacle && isHovered}
            />
          </mesh>
        );
      })}

      <mesh position={[(w - 1) / 2, y + 0.01, (d - 1) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color="#f0883e" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}
