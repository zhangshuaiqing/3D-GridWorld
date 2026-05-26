import { useStore } from '../store';

export default function StatusPanel() {
  const s = useStore((s) => s.state);

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16,
      padding: '12px 16px', background: 'rgba(22, 27, 34, 0.9)',
      borderRadius: 8, border: '1px solid #30363d',
      backdropFilter: 'blur(8px)', color: '#c9d1d9',
      fontSize: 13, lineHeight: 1.8, fontFamily: 'monospace',
      zIndex: 10, minWidth: 170,
    }}>
      <div><span style={{ color: '#8b949e' }}>Steps: </span>{s.stepCount}</div>
      <div><span style={{ color: '#8b949e' }}>Pos: </span>({s.agentPos[0]}, {s.agentPos[1]}, {s.agentPos[2]})</div>
      <div><span style={{ color: '#8b949e' }}>Goal: </span>({s.goalPos[0]}, {s.goalPos[1]}, {s.goalPos[2]})</div>
      <div><span style={{ color: '#8b949e' }}>Reward: </span>{s.reward.toFixed(1)}</div>
      <div><span style={{ color: '#8b949e' }}>Size: </span>{s.width}x{s.height}x{s.depth}</div>
      <div><span style={{ color: '#8b949e' }}>Done: </span>
        <span style={{ color: s.done ? '#f85149' : '#3fb950' }}>{s.done ? 'true' : 'false'}</span>
      </div>
    </div>
  );
}
