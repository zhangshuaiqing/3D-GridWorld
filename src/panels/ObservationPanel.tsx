import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';
import { CELL_COLORS, FOG_COLOR } from '../constants';

const CELL = 16;
const PAD = 4;
const GAP = 8;

// Draw a 2D slice of the 3D grid on a canvas context
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
) {
  const w = grid.length;
  const h = grid[0]?.length ?? 1;
  const d = grid[0]?.[0]?.length ?? 1;

  for (let dh = -viewRange; dh <= viewRange; dh++) {
    for (let dv = -viewRange; dv <= viewRange; dv++) {
      // Front/side views: horizontal = x/z, vertical = y, depth fixed
      // We determine mapping based on offset (front uses 'x' horiz, side uses 'z' horiz)
      // But for simplicity, we just hardcode: if offsetX is for front view, it's x-y at fixed z
      // if offsetX is for side view, it's z-y at fixed x.
      // Actually, the caller passes the correct dValue so we just iterate dh/dv as [horiz, y]
      // and the caller also tells us whether dValue is for x or z via context.
      // Since we're only calling this for front and side, we can distinguish by which coordinate is fixed.
      // For front: dValue is az (z fixed), so we iterate x (dh) and y (dv)
      // For side: dValue is ax (x fixed), so we iterate z (dh) and y (dv)

      // We can tell: if dValue is az, it's front -> iterate x,y
      // if dValue is ax, it's side -> iterate z,y
      const isFront = dValue === az;

      let gx: number, gy: number, gz: number;
      if (isFront) {
        gx = ax + dh;
        gy = ay + dv;
        gz = dValue;
      } else {
        gx = dValue;
        gy = ay + dv;
        gz = az + dh;
      }

      const px = offsetX + PAD + (dh + viewRange) * CELL;
      const py = offsetY + PAD + (dv + viewRange) * CELL;

      // Check bounds
      const inBounds = gx >= 0 && gx < w && gy >= 0 && gy < h && gz >= 0 && gz < d;

      let visible = true;
      if (obsMode === 'fog_of_war') {
        visible = inBounds && visited[gx]?.[gy]?.[gz] === true;
      }

      if (!inBounds) {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(px, py, CELL, CELL);
      } else if (!visible) {
        ctx.fillStyle = FOG_COLOR;
        ctx.fillRect(px, py, CELL, CELL);
      } else {
        const cellType = grid[gx][gy][gz];
        switch (cellType) {
          case CellType.EMPTY: ctx.fillStyle = '#1c2128'; break;
          case CellType.OBSTACLE: ctx.fillStyle = CELL_COLORS[CellType.OBSTACLE]; break;
          case CellType.GOAL: ctx.fillStyle = CELL_COLORS[CellType.GOAL]; break;
          default: ctx.fillStyle = '#1c2128';
        }
        ctx.fillRect(px, py, CELL, CELL);
      }

      // Grid lines
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, CELL, CELL);

      // Agent position (center of slice)
      const isAgentX = gx === ax && gy === ay && gz === az;
      if (isAgentX) {
        ctx.fillStyle = CELL_COLORS[CellType.AGENT];
        ctx.beginPath();
        ctx.arc(px + CELL / 2, py + CELL / 2, CELL / 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(88, 166, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(px + CELL / 2, py + CELL / 2, CELL / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
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
    const viewSize = s * CELL + PAD * 2;
    const totalW = viewSize * 3 + GAP * 2;
    const totalH = viewSize;

    canvas.width = totalW;
    canvas.height = totalH;

    // Background
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, totalW, totalH);

    // Three views
    // Top view (XZ plane, looking down) - uses real y=ay
    // We draw this as hAxis=z, vAxis=y? No, top view should be XZ at fixed y.
    // For top view: iterate over x,z, fixed y=ay
    // But our drawSlice function expects hAxis/vAxis as display axes.
    // Let's make a custom one for the top view since it's different.
    const vx = (dx: number) => PAD + (dx + viewRange) * CELL;
    const vy = (dz: number) => PAD + (dz + viewRange) * CELL;

    // === TOP VIEW (XZ at y=ay) ===
    for (let dx = -viewRange; dx <= viewRange; dx++) {
      for (let dz = -viewRange; dz <= viewRange; dz++) {
        const gx = ax + dx;
        const gz = az + dz;
        const px = vx(dx);
        const py2 = vy(dz);

        const inBounds = gx >= 0 && gx < grid.length && ay >= 0 && ay < (grid[0]?.length ?? 0) && gz >= 0 && gz < (grid[0]?.[0]?.length ?? 0);

        let visible = true;
        if (observationMode === 'fog_of_war') {
          visible = inBounds && visited[gx]?.[ay]?.[gz] === true;
        }

        if (!inBounds) {
          ctx.fillStyle = '#0d1117';
          ctx.fillRect(px, py2, CELL, CELL);
        } else if (!visible) {
          ctx.fillStyle = FOG_COLOR;
          ctx.fillRect(px, py2, CELL, CELL);
        } else {
          const cellType = grid[gx][ay][gz];
          switch (cellType) {
            case CellType.EMPTY: ctx.fillStyle = '#1c2128'; break;
            case CellType.OBSTACLE: ctx.fillStyle = CELL_COLORS[CellType.OBSTACLE]; break;
            case CellType.GOAL: ctx.fillStyle = CELL_COLORS[CellType.GOAL]; break;
            default: ctx.fillStyle = '#1c2128';
          }
          ctx.fillRect(px, py2, CELL, CELL);

          // Mark obstacles above/below
          let hasAbove = false, hasBelow = false;
          if (ay + 1 < (grid[0]?.length ?? 0) && grid[gx]?.[ay + 1]?.[gz] === CellType.OBSTACLE) hasAbove = true;
          if (ay - 1 >= 0 && grid[gx]?.[ay - 1]?.[gz] === CellType.OBSTACLE) hasBelow = true;
          if (hasAbove) {
            ctx.fillStyle = 'rgba(240, 136, 62, 0.6)';
            ctx.fillRect(px, py2, CELL, 3);
          }
          if (hasBelow) {
            ctx.fillStyle = 'rgba(240, 136, 62, 0.3)';
            ctx.fillRect(px, py2 + CELL - 3, CELL, 3);
          }
        }

        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py2, CELL, CELL);

        // Agent
        if (dx === 0 && dz === 0 && inBounds) {
          ctx.fillStyle = CELL_COLORS[CellType.AGENT];
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py2 + CELL / 2, CELL / 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(88, 166, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py2 + CELL / 2, CELL / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Label for top view
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px monospace';
    ctx.fillText('TOP (y=' + ay + ')', PAD, 10);

    // === FRONT VIEW (XZ slice? No, front = X at fixed Z, looking along -Z) ===
    // Front = looking from -z direction: axes are x (h), y (v), fixed z=az
    const frontOffsetX = viewSize + GAP;
    drawSlice(ctx, grid, visited, viewRange, observationMode,
      ax, ay, az, az,
      frontOffsetX, 0);

    ctx.fillStyle = '#8b949e';
    ctx.font = '9px monospace';
    ctx.fillText('FRONT (z=' + az + ')', frontOffsetX + PAD, 10);

    // === SIDE VIEW (Z at fixed X, looking along +X) ===
    // Side = looking from +x direction: axes are z (h), y (v), fixed x=ax
    const sideOffsetX = (viewSize + GAP) * 2;
    drawSlice(ctx, grid, visited, viewRange, observationMode,
      ax, ay, az, ax,
      sideOffsetX, 0);

    ctx.fillStyle = '#8b949e';
    ctx.font = '9px monospace';
    ctx.fillText('SIDE (x=' + ax + ')', sideOffsetX + PAD, 10);

    // Border around whole panel
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, totalW, totalH);

  }, [state, config]);

  return (
    <div style={{
      position: 'absolute', bottom: 150, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      background: 'rgba(13, 17, 23, 0.9)',
      borderRadius: 8,
      border: '1px solid #30363d',
      padding: '4px 6px',
      backdropFilter: 'blur(8px)',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
