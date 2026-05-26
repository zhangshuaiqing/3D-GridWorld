import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS, FOG_COLOR } from '../constants';

const CELL = 16;
const PAD = 4;
const GAP = 6;

type View = 'top' | 'front' | 'side';

function drawSlice(
  ctx: CanvasRenderingContext2D,
  grid: number[][][],
  visited: boolean[][][],
  viewRange: number,
  obsMode: string,
  ax: number, ay: number, az: number,
  dValue: number,
  ox: number, oy: number,
  view: View,
) {
  const h = grid[0]?.length ?? 1;
  const d = grid[0]?.[0]?.length ?? 0;

  for (let dh = -viewRange; dh <= viewRange; dh++) {
    for (let dv = -viewRange; dv <= viewRange; dv++) {
      let gx: number, gy: number, gz: number;
      if (view === 'top') { gx = ax + dh; gy = ay; gz = az + dv; }
      else if (view === 'front') { gx = ax + dh; gy = ay + dv; gz = dValue; }
      else { gx = dValue; gy = ay + dv; gz = az + dh; }

      const px = ox + PAD + (dh + viewRange) * CELL;
      const py = oy + PAD + (dv + viewRange) * CELL;
      const inBounds = gx >= 0 && gx < grid.length && gy >= 0 && gy < h && gz >= 0 && gz < d;

      let visible = true;
      if (obsMode === 'fog_of_war') visible = inBounds && visited[gx]?.[gy]?.[gz] === true;

      if (!inBounds) { ctx.fillStyle = '#0d1117'; ctx.fillRect(px, py, CELL, CELL); }
      else if (!visible) { ctx.fillStyle = FOG_COLOR; ctx.fillRect(px, py, CELL, CELL); }
      else {
        const ct = grid[gx][gy][gz];
        ctx.fillStyle = ct === CellType.OBSTACLE ? CELL_COLORS[CellType.OBSTACLE] :
                        ct === CellType.GOAL ? CELL_COLORS[CellType.GOAL] : '#1c2128';
        ctx.fillRect(px, py, CELL, CELL);
        if (view === 'top' && ct === CellType.EMPTY) {
          const above = gy + 1 < h && grid[gx][gy + 1][gz] === CellType.OBSTACLE;
          const below = gy - 1 >= 0 && grid[gx][gy - 1][gz] === CellType.OBSTACLE;
          if (above) { ctx.fillStyle = 'rgba(240,136,62,0.5)'; ctx.fillRect(px, py, CELL, 2); }
          if (below) { ctx.fillStyle = 'rgba(240,136,62,0.25)'; ctx.fillRect(px, py + CELL - 2, CELL, 2); }
        }
      }
      ctx.strokeStyle = '#30363d'; ctx.lineWidth = 0.5; ctx.strokeRect(px, py, CELL, CELL);
    }
  }

  const cx = ox + PAD + viewRange * CELL + CELL / 2;
  const cy = oy + PAD + viewRange * CELL + CELL / 2;
  ctx.fillStyle = 'rgba(88,166,255,0.15)';
  ctx.beginPath(); ctx.arc(cx, cy, CELL / 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CELL_COLORS[CellType.AGENT];
  ctx.beginPath(); ctx.arc(cx, cy, CELL / 3.5, 0, Math.PI * 2); ctx.fill();
}

export default function ObservationPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useStore((s) => s.state);
  const config = useStore((s) => s.config);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const { grid, agentPos, visited } = state;
    const { viewRange, observationMode } = config;
    const [ax, ay, az] = agentPos;

    const s = 2 * viewRange + 1;
    const vs = s * CELL + PAD * 2;
    const totalW = vs * 3 + GAP * 2;

    c.width = totalW;
    c.height = vs;

    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, totalW, vs);

    drawSlice(ctx, grid, visited, viewRange, observationMode, ax, ay, az, az, 0, 0, 'top');
    drawSlice(ctx, grid, visited, viewRange, observationMode, ax, ay, az, az, vs + GAP, 0, 'front');
    drawSlice(ctx, grid, visited, viewRange, observationMode, ax, ay, az, ax, (vs + GAP) * 2, 0, 'side');

    ctx.fillStyle = '#8b949e'; ctx.font = '9px monospace';
    const labels = [
      `TOP y=${ay}`, `FRONT z=${az}`, `SIDE x=${ax}`,
    ];
    for (let i = 0; i < 3; i++) {
      ctx.fillText(labels[i], PAD + i * (vs + GAP), 10);
    }

    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, totalW, vs);
  }, [state, config]);

  return (
    <div style={{
      position: 'absolute', bottom: 150, left: '50%',
      transform: 'translateX(-50%)', zIndex: 10,
      background: 'rgba(13, 17, 23, 0.9)', borderRadius: 8,
      border: '1px solid #30363d', padding: '4px 6px',
      backdropFilter: 'blur(8px)',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
