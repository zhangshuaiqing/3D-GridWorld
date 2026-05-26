export default function ControlPanel() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8,
      padding: '10px 16px',
      background: 'rgba(22, 27, 34, 0.9)',
      borderRadius: 8,
      border: '1px solid #30363d',
      backdropFilter: 'blur(8px)',
      zIndex: 10,
    }}>
      <span style={{ color: '#8b949e', fontSize: 12, display: 'flex', alignItems: 'center' }}>
        Use arrow keys / WASD to move
      </span>
    </div>
  );
}
