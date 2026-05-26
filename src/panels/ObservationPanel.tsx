import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS, FOG_COLOR } from '../constants';

const CELL_SIZE = 24;
const PADDING = 8;

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
    const size = 2 * viewRange + 1;
    const canvasSize = size * CELL_SIZE + PADDING * 2;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const [ar, ac] = agentPos;

    for (let dr = -viewRange; dr <= viewRange; dr++) {
      for (let dc = -viewRange; dc <= viewRange; dc++) {
        const r = ar + dr;
        const c = ac + dc;
        const x = PADDING + (dc + viewRange) * CELL_SIZE;
        const y = PADDING + (dr + viewRange) * CELL_SIZE;

        // Determine visibility
        let visible = true;
        if (observationMode === 'fog_of_war') {
          visible = r >= 0 && r < grid.length && c >= 0 && c < grid[0].length && visited[r]?.[c] === true;
        }

        const outOfBounds = r < 0 || r >= grid.length || c < 0 || c >= grid[0].length;

        if (outOfBounds) {
          ctx.fillStyle = '#0d1117';
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        } else if (!visible) {
          ctx.fillStyle = FOG_COLOR;
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        } else {
          const cellType = grid[r][c];
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
            case CellType.DYNAMIC_OBSTACLE:
              ctx.fillStyle = CELL_COLORS[CellType.DYNAMIC_OBSTACLE];
              break;
            default:
              ctx.fillStyle = '#1c2128';
          }
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        // Grid lines
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        // Agent (center cell)
        if (dr === 0 && dc === 0 && !outOfBounds) {
          ctx.fillStyle = CELL_COLORS[CellType.AGENT];
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(88, 166, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Border
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasSize, canvasSize);

  }, [state, config]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 160,
      left: 16,
      zIndex: 10,
      background: 'rgba(13, 17, 23, 0.9)',
      borderRadius: 8,
      border: '1px solid #30363d',
      padding: '6px 8px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        color: '#8b949e',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        textAlign: 'center',
      }}>
        Agent View ({config.observationMode})
      </div>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
