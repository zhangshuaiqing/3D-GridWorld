import { useStore } from '../store';

export default function SettingsPanel() {
  const config = useStore((s) => s.config);
  const setSize = useStore((s) => s.setSize);
  const setObstacleRatio = useStore((s) => s.setObstacleRatio);
  const setRandomStartGoal = useStore((s) => s.setRandomStartGoal);
  const setObservationMode = useStore((s) => s.setObservationMode);
  const setViewRange = useStore((s) => s.setViewRange);

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      right: 16,
      padding: '12px 16px',
      background: 'rgba(22, 27, 34, 0.9)',
      borderRadius: 8,
      border: '1px solid #30363d',
      backdropFilter: 'blur(8px)',
      zIndex: 10,
      fontSize: 12,
      color: '#c9d1d9',
      minWidth: 160,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ color: '#8b949e', fontWeight: 600, marginBottom: 2, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
        Settings
      </div>

      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Size</span>
        <input type="range" min={4} max={20} value={config.size}
          onChange={(e) => setSize(Number(e.target.value))}
          style={{ width: 80 }} />
        <span style={{ minWidth: 20, textAlign: 'right' }}>{config.size}</span>
      </label>

      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Obstacles</span>
        <input type="range" min={0} max={0.5} step={0.05} value={config.obstacleRatio}
          onChange={(e) => setObstacleRatio(Number(e.target.value))}
          style={{ width: 80 }} />
        <span style={{ minWidth: 20, textAlign: 'right' }}>{(config.obstacleRatio * 100).toFixed(0)}%</span>
      </label>

      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>View Range</span>
        <input type="range" min={1} max={5} value={config.viewRange}
          onChange={(e) => setViewRange(Number(e.target.value))}
          style={{ width: 80 }} />
        <span style={{ minWidth: 20, textAlign: 'right' }}>{config.viewRange}</span>
      </label>

      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Random Start</span>
        <input type="checkbox" checked={config.randomStartGoal}
          onChange={(e) => setRandomStartGoal(e.target.checked)} />
      </label>

      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Mode</span>
        <select value={config.observationMode}
          onChange={(e) => setObservationMode(e.target.value as any)}
          style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: 4, padding: '2px 4px', fontSize: 11 }}>
          <option value="full">Full</option>
          <option value="local">Local</option>
          <option value="fog_of_war">Fog of War</option>
        </select>
      </label>
    </div>
  );
}
