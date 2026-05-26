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
  const [hovered, setHovered] = useState<{ x: number; y: number; z: number } | null>(null);

  if (!editMode || !editGrid || editGrid.length === 0) return null;

  const w = editGrid.length;
  const h = editGrid[0].length;
  const d = editGrid[0][0].length;
  const agentPos = env.agentPos;
  const goalPos = env.goalPos;

  // Render the entire grid for editing
  const cells: { x: number; y: number; z: number; type: number }[] = [];

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      for (let z = 0; z < d; z++) {
        // Skip agent and goal
        if ((x === agentPos[0] && y === agentPos[1] && z === agentPos[2]) ||
            (x === goalPos[0] && y === goalPos[1] && z === goalPos[2])) continue;

        cells.push({ x, y, z, type: editGrid[x][y][z] });
      }
    }
  }

  const toggle = (x: number, y: number, z: number) => {
    toggleCell(x, y, z);
  };

  return (
    <group>
      {cells.map((cell) => {
        const key = `${cell.x},${cell.y},${cell.z}`;
        const isHovered = hovered?.x === cell.x && hovered?.y === cell.y && hovered?.z === cell.z;
        const isObstacle = cell.type === CellType.OBSTACLE;
        const isCurrentLayer = cell.y === editLayer;

        return (
          <mesh
            key={key}
            position={[cell.x, cell.y + 0.5, cell.z]}
            onClick={(e) => { e.stopPropagation(); toggle(cell.x, cell.y, cell.z); }}
            onPointerEnter={(e) => { e.stopPropagation(); setHovered({ x: cell.x, y: cell.y, z: cell.z }); document.body.style.cursor = 'pointer'; }}
            onPointerLeave={() => { setHovered(null); document.body.style.cursor = 'default'; }}
          >
            <boxGeometry args={[0.95, 0.95, 0.95]} />
            <meshStandardMaterial
              color={isObstacle ? CELL_COLORS[CellType.OBSTACLE] : '#58a6ff'}
              transparent
              opacity={
                isObstacle
                  ? (isCurrentLayer ? (isHovered ? 0.5 : 1.0) : (isHovered ? 0.4 : 0.85))
                  : (isCurrentLayer ? (isHovered ? 0.5 : 0.15) : 0.04)
              }
              emissive={isObstacle ? undefined : '#58a6ff'}
              emissiveIntensity={isHovered && !isObstacle ? 0.3 : 0}
              roughness={0.8}
            />
          </mesh>
        );
      })}

      {/* Layer highlight — orange plane at current edit layer */}
      <mesh position={[(w - 1) / 2, editLayer + 0.01, (d - 1) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color="#f0883e" transparent opacity={0.06} depthWrite={false} />
      </mesh>
    </group>
  );
}
