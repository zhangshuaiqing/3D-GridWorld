import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

export default function EditorOverlay() {
  const editMode = useStore((s) => s.editMode);
  const editGrid = useStore((s) => s.editGrid);
  const env = useStore((s) => s.env);

  if (!editMode || !editGrid || editGrid.length === 0) return null;

  const w = editGrid.length;
  const h = editGrid[0].length;
  const d = editGrid[0][0].length;
  const agentPos = env.agentPos;
  const goalPos = env.goalPos;

  const cells: { x: number; y: number; z: number; type: number }[] = [];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      for (let z = 0; z < d; z++) {
        if ((x === agentPos[0] && y === agentPos[1] && z === agentPos[2]) ||
            (x === goalPos[0] && y === goalPos[1] && z === goalPos[2])) continue;
        cells.push({ x, y, z, type: editGrid[x][y][z] });
      }
    }
  }

  return (
    <group>
      {cells.map((cell) => (
        <mesh key={`${cell.x},${cell.y},${cell.z}`} position={[cell.x, cell.y + 0.5, cell.z]}>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshStandardMaterial
            color={cell.type === CellType.OBSTACLE ? CELL_COLORS[CellType.OBSTACLE] : '#1c2128'}
            transparent
            opacity={cell.type === CellType.OBSTACLE ? 0.85 : 0.03}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
