import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS, FOG_COLOR } from '../constants';

const CELL = 14;
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
  offsetX: number,
  offsetY: number,
  view: View,
) {
  const h = grid[0]?.length ?? 1;

  for (let dh = -viewRange; dh <= viewRange; dh++) {
    for (let dv = -viewRange; dv <= viewRange; dv++) {
      let gx: number, gy: number, gz: number;
      if (view === 'top') {
        gx = ax + dh; gy = ay; gz = az + dv;
      } else if (view === 'front') {
        gx = ax + dh; gy = ay + dv; gz = dValue;
      } else {
        gx = dValue; gy = ay + dv; gz = az + dh;
      }

      const px = offsetX + PAD + (dh + viewRange) * CELL;
      const py = offsetY + PAD + (dv + viewRange) * CELL;
      const inBounds = gx >= 0 && gx < grid.length && gy >= 0 && gy < h && gz >= 0 && gz < (grid[0]?.[0]?.length ?? 0);

      let visible = true;
      if (obsMode === 'fog_of_war') visible = inBounds && visited[gx]?.[gy]?.[gz] === true;

      if (!inBounds) {
        ctx.fillStyle = '#0d1117'; ctx.fillRect(px, py, CELL, CELL);
      } else if (!visible) {
        ctx.fillStyle = FOG_COLOR; ctx.fillRect(px, py, CELL, CELL);
      } else {
        const cellType = grid[gx][gy][gz];
        switch (cellType) {
          case CellType.EMPTY: ctx.fillStyle = '#1c2128'; break;
          case CellType.OBSTACLE: ctx.fillStyle = CELL_COLORS[CellType.OBSTACLE]; break;
          case CellType.GOAL: ctx.fillStyle = CELL_COLORS[CellType.GOAL]; break;
          default: ctx.fillStyle = '#1c2128';
        }
        ctx.fillRect(px, py, CELL, CELL);
        if (view === 'top' && cellType === CellType.EMPTY) {
          const hasAbove = gy + 1 < h && grid[gx]?.[gy + 1]?.[gz] === CellType.OBSTACLE;
          const hasBelow = gy - 1 >= 0 && grid[gx]?.[gy - 1]?.[gz] === CellType.OBSTACLE;
          if (hasAbove) { ctx.fillStyle = 'rgba(240, 136, 62, 0.5)'; ctx.fillRect(px, py, CELL, 2); }
          if (hasBelow) { ctx.fillStyle = 'rgba(240, 136, 62, 0.25)'; ctx.fillRect(px, py + CELL - 2, CELL, 2); }
        }
      }
      ctx.strokeStyle = '#30363d'; ctx.lineWidth = 0.5; ctx.strokeRect(px, py, CELL, CELL);
    }
  }

  const cx = offsetX + PAD + viewRange * CELL + CELL / 2;
  const cy = offsetY + PAD + viewRange * CELL + CELL / 2;
  ctx.fillStyle = 'rgba(88, 166, 255, 0.15)';
  ctx.beginPath(); ctx.arc(cx, cy, CELL / 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CELL_COLORS[CellType.AGENT];
  ctx.beginPath(); ctx.arc(cx, cy, CELL / 3.5, 0, Math.PI * 2); ctx.fill();
}

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

    const s = 2 * viewRange + 1;
    const vs = s * CELL + PAD * 2;
    const totalW = vs * 4 + GAP * 3;
    const totalH = vs;

    canvas.width = totalW;
    canvas.height = totalH;

    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, totalW, totalH);

    // Planar views
    drawSlice(ctx, grid, visited, viewRange, observationMode, ax, ay, az, az, 0, 0, 'top');
    drawSlice(ctx, grid, visited, viewRange, observationMode, ax, ay, az, az, vs + GAP, 0, 'front');
    drawSlice(ctx, grid, visited, viewRange, observationMode, ax, ay, az, ax, (vs + GAP) * 2, 0, 'side');

    // Perspective 3D view
    const px = (vs + GAP) * 3;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(px, 0, vs, vs);
    const cx = px + vs / 2;
    const cy = vs / 2;
    const cs = 4;
    const depth = 3;

    for (let dy = -depth; dy <= depth; dy++) {
      for (let dx = -depth; dx <= depth; dx++) {
        for (let dz = -depth; dz <= depth; dz++) {
          const gx = ax + dx; const gy = ay + dy; const gz = az + dz;
          const inBounds = gx >= 0 && gx < grid.length && gy >= 0 && gy < (grid[0]?.length ?? 0) && gz >= 0 && gz < (grid[0]?.[0]?.length ?? 0);
          if (!inBounds) continue;

          let visible = true;
          if (observationMode === 'fog_of_war') visible = visited[gx]?.[gy]?.[gz] === true;

          const xPos = cx + (dx - dz) * cs * 1.2;
          const yPos = cy + (dx + dz) * cs * 0.5 - dy * cs * 1.2;
          if (xPos < px || xPos > px + vs || yPos < 0 || yPos > vs) continue;

          if (visible) {
            const cellType = grid[gx][gy][gz];
            let color: string;
            switch (cellType) {
              case CellType.OBSTACLE: color = CELL_COLORS[CellType.OBSTACLE]; break;
              case CellType.GOAL: color = CELL_COLORS[CellType.GOAL]; break;
              default: color = '#1c2128';
            }
            ctx.fillStyle = color;
            ctx.fillRect(xPos - cs / 2, yPos - cs / 2, cs, cs);
            if (cellType === CellType.OBSTACLE || cellType === CellType.GOAL) {
              ctx.strokeStyle = '#30363d'; ctx.lineWidth = 0.5;
              ctx.strokeRect(xPos - cs / 2, yPos - cs / 2, cs, cs);
            }
          }

          if (dx === 0 && dy === 0 && dz === 0) {
            ctx.fillStyle = CELL_COLORS[CellType.AGENT];
            ctx.beginPath(); ctx.arc(xPos, yPos, cs * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(88, 166, 255, 0.2)';
            ctx.beginPath(); ctx.arc(xPos, yPos, cs, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    // Labels
    ctx.fillStyle = '#8b949e'; ctx.font = '8px monospace';
    ctx.fillText(`TOP y=${ay}`, PAD, 10);
    ctx.fillText(`FRONT z=${az}`, vs + GAP + PAD, 10);
    ctx.fillText(`SIDE x=${ax}`, (vs + GAP) * 2 + PAD, 10);
    ctx.fillText('3D', (vs + GAP) * 3 + PAD, 10);

    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, totalW, totalH);
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
