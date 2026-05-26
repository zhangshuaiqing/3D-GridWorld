import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const ACTION_KEYS: Record<string, 0 | 1 | 2 | 3> = {
  ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3,
  w: 0, W: 0, s: 1, S: 1, a: 2, A: 2, d: 3, D: 3,
};

export default function ControlPanel() {
  const state = useStore((s) => s.state);
  const autoRun = useStore((s) => s.autoRun);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const autoSpeed = useStore((s) => s.autoSpeed);
  const setAutoSpeed = useStore((s) => s.setAutoSpeed);
  const message = useStore((s) => s.message);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const action = ACTION_KEYS[e.key];
      if (action !== undefined) {
        e.preventDefault();
        const s = useStore.getState();
        if (!s.state.done) s.step(action);
      }
      if (e.key === ' ') {
        e.preventDefault();
        useStore.getState().setAutoRun(!useStore.getState().autoRun);
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        useStore.getState().reset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto run timer
  useEffect(() => {
    if (autoRun && !state.done) {
      timerRef.current = setInterval(() => {
        const st = useStore.getState();
        if (st.state.done) { st.setAutoRun(false); return; }
        st.step(0); // Just go up as a simple demo
      }, autoSpeed);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  }, [autoRun, state.done, autoSpeed]);

  const btnStyle: React.CSSProperties = {
    padding: '6px 14px',
    border: '1px solid #30363d',
    borderRadius: 6,
    background: '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  };

  const doStep = (action: 0 | 1 | 2 | 3) => {
    const st = useStore.getState();
    if (!st.state.done) st.step(action);
  };

  return (
    <>
      <div style={{
        position: 'absolute', bottom: 24, left: '50%',
        transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8, zIndex: 10,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btnStyle} onClick={() => doStep(0)}>↑ Step</button>
          <button style={btnStyle} onClick={() => doStep(2)}>← Step</button>
          <button style={btnStyle} onClick={() => doStep(3)}>→ Step</button>
          <button style={btnStyle} onClick={() => doStep(1)}>↓ Step</button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button style={{ ...btnStyle }} onClick={() => useStore.getState().reset()}>
            🔄 Reset
          </button>
          <button
            style={{ ...btnStyle, background: autoRun ? '#f85149' : '#238636', color: '#fff' }}
            onClick={() => setAutoRun(!autoRun)}
          >
            {autoRun ? '⏹ Stop' : '▶ Auto Run'}
          </button>
          <span style={{ color: '#8b949e', fontSize: 11 }}>Speed:</span>
          <input type="range" min={100} max={1000} step={50} value={autoSpeed}
            onChange={(e) => setAutoSpeed(Number(e.target.value))} style={{ width: 60 }} />
          <span style={{ color: '#8b949e', fontSize: 11, minWidth: 30 }}>{autoSpeed}ms</span>
        </div>
        {message && <div style={{ color: '#d29922', fontSize: 14, fontWeight: 600 }}>{message}</div>}
      </div>
      <div style={{
        position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        color: '#484f58', fontSize: 11, zIndex: 10, textAlign: 'center', pointerEvents: 'none',
      }}>
        Arrow keys / WASD to move · Space to toggle auto · R to reset
      </div>
    </>
  );
}
