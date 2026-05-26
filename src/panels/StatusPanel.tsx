import { useStore } from '../store';

export default function StatusPanel() {
  const stepCount = useStore((s) => s.stepCount);
  const [r, c] = useStore((s) => s.agentPos);
  const reward = useStore((s) => s.reward);
  const done = useStore((s) => s.done);

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      padding: '12px 16px',
      background: 'rgba(22, 27, 34, 0.9)',
      borderRadius: 8,
      border: '1px solid #30363d',
      backdropFilter: 'blur(8px)',
      color: '#c9d1d9',
      fontSize: 13,
      lineHeight: 1.8,
      fontFamily: 'monospace',
      zIndex: 10,
      minWidth: 160,
    }}>
      <div><span style={{ color: '#8b949e' }}>Steps: </span>{stepCount}</div>
      <div><span style={{ color: '#8b949e' }}>Pos: </span>({r}, {c})</div>
      <div><span style={{ color: '#8b949e' }}>Reward: </span>{reward.toFixed(1)}</div>
      <div><span style={{ color: '#8b949e' }}>Done: </span>
        <span style={{ color: done ? '#f85149' : '#3fb950' }}>{done ? 'true' : 'false'}</span>
      </div>
    </div>
  );
}
