import { useStore } from '../store';

const labelStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11,
};
const rangeStyle: React.CSSProperties = { width: 70 };

export default function SettingsPanel() {
  const config = useStore((s) => s.config);
  const setWidth = useStore((s) => s.setWidth);
  const setHeight = useStore((s) => s.setHeight);
  const setDepth = useStore((s) => s.setDepth);
  const setObstacleRatio = useStore((s) => s.setObstacleRatio);
  const setRandomStartGoal = useStore((s) => s.setRandomStartGoal);
  const setObservationMode = useStore((s) => s.setObservationMode);
  const setViewRange = useStore((s) => s.setViewRange);

  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 14px', background: 'rgba(22, 27, 34, 0.9)',
      borderRadius: 8, border: '1px solid #30363d',
      backdropFilter: 'blur(8px)', zIndex: 10, fontSize: 11,
      color: '#c9d1d9', display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{ color: '#8b949e', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
        Size
      </div>

      <label style={labelStyle}>
        <span style={{ minWidth: 16 }}>W</span>
        <input type="range" min={3} max={10} value={config.width}
          onChange={(e) => setWidth(Number(e.target.value))} style={rangeStyle} />
        <span style={{ minWidth: 16, textAlign: 'right' }}>{config.width}</span>
      </label>

      <label style={labelStyle}>
        <span style={{ minWidth: 16 }}>H</span>
        <input type="range" min={2} max={6} value={config.height}
          onChange={(e) => setHeight(Number(e.target.value))} style={rangeStyle} />
        <span style={{ minWidth: 16, textAlign: 'right' }}>{config.height}</span>
      </label>

      <label style={labelStyle}>
        <span style={{ minWidth: 16 }}>D</span>
        <input type="range" min={3} max={10} value={config.depth}
          onChange={(e) => setDepth(Number(e.target.value))} style={rangeStyle} />
        <span style={{ minWidth: 16, textAlign: 'right' }}>{config.depth}</span>
      </label>

      <div style={{ width: 1, height: 24, background: '#30363d' }} />

      <label style={labelStyle}>
        <span>Obs%</span>
        <input type="range" min={0} max={0.4} step={0.05} value={config.obstacleRatio}
          onChange={(e) => setObstacleRatio(Number(e.target.value))} style={rangeStyle} />
        <span style={{ minWidth: 24, textAlign: 'right' }}>{(config.obstacleRatio * 100).toFixed(0)}%</span>
      </label>

      <label style={labelStyle}>
        <span>VR</span>
        <input type="range" min={1} max={4} value={config.viewRange}
          onChange={(e) => setViewRange(Number(e.target.value))} style={rangeStyle} />
        <span style={{ minWidth: 12, textAlign: 'right' }}>{config.viewRange}</span>
      </label>

      <div style={{ width: 1, height: 24, background: '#30363d' }} />

      <label style={labelStyle}>
        <span>Rand</span>
        <input type="checkbox" checked={config.randomStartGoal}
          onChange={(e) => setRandomStartGoal(e.target.checked)} />
      </label>

      <select value={config.observationMode}
        onChange={(e) => setObservationMode(e.target.value as any)}
        style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: 4, padding: '2px 4px', fontSize: 10 }}>
        <option value="full">Full</option>
        <option value="fog_of_war">Fog</option>
      </select>
    </div>
  );
}
