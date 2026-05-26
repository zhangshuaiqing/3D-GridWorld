import { useStore } from '../store';

const labelStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11,
};
const rangeStyle: React.CSSProperties = { width: 60 };

export default function DynObsPanel() {
  const dynObs = useStore((s) => s.state.dynamicObstacles);
  const setProp = (i: number, p: string, v: any) => (useStore as any).getState().setDynObsProp(i, p, v);

  if (!dynObs || dynObs.length === 0) return null;

  return (
    <div style={{
      position: 'absolute', bottom: 150, right: 16, zIndex: 10,
      padding: '8px 12px', background: 'rgba(22, 27, 34, 0.9)',
      borderRadius: 8, border: '1px solid #f85149',
      backdropFilter: 'blur(8px)',
      color: '#c9d1d9', fontSize: 11,
      minWidth: 180, maxHeight: 220, overflowY: 'auto',
    }}>
      <div style={{ color: '#f85149', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Dynamic Obstacles
      </div>
      {dynObs.map((dyn, i) => (
        <div key={i} style={{
          padding: '4px 0', borderTop: i > 0 ? '1px solid #30363d' : 'none',
          marginTop: i > 0 ? 4 : 0,
        }}>
          <div style={{ color: '#8b949e', fontSize: 10, marginBottom: 2 }}>
            #{i} @ ({dyn.pos[0]},{dyn.pos[1]},{dyn.pos[2]})
          </div>

          <label style={labelStyle}>
            <span>Mode</span>
            <select
              value={dyn.mode}
              onChange={(e) => setProp(i, 'mode', e.target.value)}
              style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: 4, padding: '1px 4px', fontSize: 10 }}
            >
              <option value="bounce">Bounce</option>
              <option value="random">Random</option>
            </select>
          </label>

          <label style={labelStyle}>
            <span>Speed</span>
            <input type="range" min={1} max={5} value={dyn.speed}
              onChange={(e) => setProp(i, 'speed', Number(e.target.value))}
              style={rangeStyle} />
            <span style={{ minWidth: 12, textAlign: 'right' }}>{dyn.speed}</span>
          </label>

          <label style={labelStyle}>
            <span>Dir</span>
            <span style={{ color: '#8b949e', fontSize: 9 }}>
              ({dyn.dir[0]},{dyn.dir[1]},{dyn.dir[2]})
            </span>
          </label>
        </div>
      ))}
    </div>
  );
}
