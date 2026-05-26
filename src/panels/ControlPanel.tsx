import { useEffect, useRef } from 'react';
import { useStore } from '../store';

// 6 actions: 0=+x, 1=-x, 2=+y, 3=-y, 4=+z, 5=-z
const KEY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5> = {
  ArrowRight: 0, d: 0, D: 0,
  ArrowLeft: 1, a: 1, A: 1,
  ArrowUp: 4, w: 4, W: 4,
  ArrowDown: 5, s: 5, S: 5,
  // Up/Down height: q=up, e=down
  q: 2, Q: 2, e: 3, E: 3,
  // Shift/Ctrl for height also works
};

export default function ControlPanel() {
  const state = useStore((s) => s.state);
  const autoRun = useStore((s) => s.autoRun);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const autoSpeed = useStore((s) => s.autoSpeed);
  const setAutoSpeed = useStore((s) => s.setAutoSpeed);
  const message = useStore((s) => s.message);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.key];
      if (action !== undefined) {
        e.preventDefault();
        const st = useStore.getState();
        if (!st.state.done) st.step(action);
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

  useEffect(() => {
    if (autoRun && !state.done) {
      timerRef.current = setInterval(() => {
        const st = useStore.getState();
        if (st.state.done) { st.setAutoRun(false); return; }
        // Simple: move forward (+z)
        st.step(4);
      }, autoSpeed);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  }, [autoRun, state.done, autoSpeed]);

  const btn: React.CSSProperties = {
    padding: '5px 10px', border: '1px solid #30363d', borderRadius: 6,
    background: '#21262d', color: '#c9d1d9', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
  };

  const doStep = (a: 0 | 1 | 2 | 3 | 4 | 5) => {
    const st = useStore.getState();
    if (!st.state.done) st.step(a);
  };

  return (
    <>
      <div style={{
        position: 'absolute', bottom: 20, left: '50%',
        transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, zIndex: 10,
      }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: '#484f58', fontSize: 10 }}>Q↑</span>
          <button style={btn} onClick={() => doStep(2)}>▲ Up</button>
          <span style={{ color: '#484f58', fontSize: 10 }}>E↓</span>
          <button style={btn} onClick={() => doStep(3)}>▼ Down</button>
          <span style={{ color: '#30363d' }}>|</span>
          <button style={{ ...btn, background: '#238636', color: '#fff', marginLeft: 4 }}
            onClick={() => useStore.getState().reset()}>
            🔄 Reset
          </button>
          <button style={{ ...btn, background: autoRun ? '#f85149' : '#238636', color: '#fff' }}
            onClick={() => setAutoRun(!autoRun)}>
            {autoRun ? '⏹ Stop' : '▶ Auto'}
          </button>
          <input type="range" min={100} max={1000} step={50} value={autoSpeed}
            onChange={(e) => setAutoSpeed(Number(e.target.value))}
            style={{ width: 50 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={btn} onClick={() => doStep(1)}>← -X</button>
          <button style={btn} onClick={() => doStep(4)}>↑ +Z</button>
          <button style={btn} onClick={() => doStep(0)}>→ +X</button>
          <button style={btn} onClick={() => doStep(5)}>↓ -Z</button>
        </div>
        {message && <div style={{ color: '#d29922', fontSize: 13, fontWeight: 600 }}>{message}</div>}
      </div>
      <div style={{
        position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        color: '#484f58', fontSize: 10, zIndex: 10, textAlign: 'center', pointerEvents: 'none',
      }}>
        WASD: XZ plane · Q/E: up/down · Space: auto · R: reset
      </div>
    </>
  );
}
