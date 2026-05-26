import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS, FOG_COLOR } from '../constants';

const CELL_SIZE = 20;
const PADDING = 6;

export default function ObservationPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useStore((s) => s.state);
  const config = useStore((s) => s.config);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { grid, agentPos, visited } = state;
    const { viewRange, observationMode } = config;

    const [ax, ay, az] = agentPos;
    const size = 2 * viewRange + 1;
    const canvasSize = size * CELL_SIZE + PADDING * 2;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw agent's current y-level (top-down view)
    for (let dx = -viewRange; dx <= viewRange; dx++) {
      for (let dz = -viewRange; dz <= viewRange; dz++) {
        const x = ax + dx;
        const z = az + dz;
        const px = PADDING + (dx + viewRange) * CELL_SIZE;
        const py = PADDING + (dz + viewRange) * CELL_SIZE;

        let visible = true;
        if (observationMode === 'fog_of_war') {
          visible = x >= 0 && x < grid.length && z >= 0 && z < (grid[0]?.[0]?.length ?? 0) &&
            ay >= 0 && ay < (grid[0]?.length ?? 0) &&
            visited[x]?.[ay]?.[z] === true;
        }

        const outOfBounds = x < 0 || x >= grid.length || ay < 0 || ay >= (grid[0]?.length ?? 0) ||
          z < 0 || z >= (grid[0]?.[0]?.length ?? 0);

        if (outOfBounds) {
          ctx.fillStyle = '#0d1117';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        } else if (!visible) {
          ctx.fillStyle = FOG_COLOR;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        } else {
          const cellType = grid[x][ay][z];
          switch (cellType) {
            case CellType.EMPTY:
              ctx.fillStyle = '#1c2128';
              break;
            case CellType.OBSTACLE:
              ctx.fillStyle = CELL_COLORS[CellType.OBSTACLE];
              break;
            case CellType.GOAL:
              ctx.fillStyle = CELL_COLORS[CellType.GOAL];
              break;
            default:
              ctx.fillStyle = '#1c2128';
          }
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          // If there's an obstacle above/below, show indicator
          if (cellType === CellType.EMPTY) {
            let hasAbove = false, hasBelow = false;
            if (ay + 1 < grid[0]?.length && grid[x]?.[ay + 1]?.[z] === CellType.OBSTACLE) hasAbove = true;
            if (ay - 1 >= 0 && grid[x]?.[ay - 1]?.[z] === CellType.OBSTACLE) hasBelow = true;

            if (hasAbove) {
              ctx.fillStyle = 'rgba(88, 102, 105, 0.5)'; // floating obstacle above
              ctx.fillRect(px, py, CELL_SIZE, 3);
            }
            if (hasBelow) {
              ctx.fillStyle = 'rgba(88, 102, 105, 0.3)'; // obstacle below
              ctx.fillRect(px, py + CELL_SIZE - 3, CELL_SIZE, 3);
            }
          }
        }

        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }

    // Agent center
    const cx = PADDING + viewRange * CELL_SIZE + CELL_SIZE / 2;
    const cy = PADDING + viewRange * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillStyle = CELL_COLORS[CellType.AGENT];
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(88, 166, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE / 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasSize, canvasSize);

  }, [state, config]);

  return (
    <div style={{
      position: 'absolute', bottom: 160, left: 16, zIndex: 10,
      background: 'rgba(13, 17, 23, 0.9)', borderRadius: 8,
      border: '1px solid #30363d', padding: '6px 8px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        color: '#8b949e', fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: 4, textAlign: 'center',
      }}>
        Agent View (y={useStore.getState().state.agentPos[1]}, {config.observationMode})
      </div>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
