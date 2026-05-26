import { useEffect, useRef } from 'react';
import { useStore } from '../store';

// 6 actions: 0=+x, 1=-x, 2=+y, 3=-y, 4=+z, 5=-z
const KEY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5> = {
  ArrowRight: 0, d: 0, D: 0,
  ArrowLeft: 1, a: 1, A: 1,
  ArrowUp: 4, w: 4, W: 4,
  ArrowDown: 5, s: 5, S: 5,
  q: 2, Q: 2, e: 3, E: 3,
};

// Cursor direction: [dx, dy, dz]
const CURSOR_KEYS: Record<string, [number, number, number]> = {
  ArrowRight: [1, 0, 0], d: [1, 0, 0], D: [1, 0, 0],
  ArrowLeft: [-1, 0, 0], a: [-1, 0, 0], A: [-1, 0, 0],
  ArrowUp: [0, 0, 1], w: [0, 0, 1], W: [0, 0, 1],
  ArrowDown: [0, 0, -1], s: [0, 0, -1], S: [0, 0, -1],
  q: [0, 1, 0], Q: [0, 1, 0],
  e: [0, -1, 0], E: [0, -1, 0],
};

export default function ControlPanel() {
  const editMode = useStore((s) => s.editMode);
  const state = useStore((s) => s.state);
  const autoRun = useStore((s) => s.autoRun);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const autoSpeed = useStore((s) => s.autoSpeed);
  const setAutoSpeed = useStore((s) => s.setAutoSpeed);
  const message = useStore((s) => s.message);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editMode) {
        // Cursor mode
        const dir = CURSOR_KEYS[e.key];
        if (dir) {
          e.preventDefault();
          useStore.getState().moveCursor(dir[0], dir[1], dir[2]);
          return;
        }
        if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          useStore.getState().toggleCursorCell();
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          useStore.getState().reset();
          return;
        }
      } else {
        // Agent control mode
        const action = KEY_MAP[e.key];
        if (action !== undefined) {
          e.preventDefault();
          const st = useStore.getState();
          if (!st.state.done) st.step(action);
          return;
        }
        if (e.key === ' ') {
          e.preventDefault();
          useStore.getState().setAutoRun(!useStore.getState().autoRun);
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          useStore.getState().reset();
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode]);

  useEffect(() => {
    if (autoRun && !state.done && !editMode) {
      timerRef.current = setInterval(() => {
        const st = useStore.getState();
        if (st.state.done) { st.setAutoRun(false); return; }
        st.step(4);
      }, autoSpeed);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  }, [autoRun, state.done, editMode, autoSpeed]);

  const btn: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid #30363d', borderRadius: 5,
    background: '#21262d', color: '#c9d1d9', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, fontFamily: 'monospace', minWidth: 32,
  };

  const doStep = (a: 0 | 1 | 2 | 3 | 4 | 5) => {
    const st = useStore.getState();
    if (!st.state.done) st.step(a);
  };

  const cursor = useStore((s) => s.cursor);

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%',
      transform: 'translateX(-50%)', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{
        display: 'flex', gap: 6, alignItems: 'center',
        padding: '6px 12px', background: 'rgba(22, 27, 34, 0.9)',
        borderRadius: 8, border: editMode ? '1px solid #3fb950' : '1px solid #30363d',
        backdropFilter: 'blur(8px)',
      }}>
        {editMode ? (
          <>
            {/* Cursor controls */}
            <span style={{ color: '#3fb950', fontSize: 10, fontWeight: 700, marginRight: 4 }}>CURSOR</span>
            <span style={{ color: '#8b949e', fontSize: 10 }}>X</span>
            <button style={btn} onClick={() => useStore.getState().moveCursor(-1, 0, 0)}>-X</button>
            <button style={btn} onClick={() => useStore.getState().moveCursor(1, 0, 0)}>+X</button>
            <div style={{ width: 1, height: 20, background: '#30363d' }} />
            <span style={{ color: '#8b949e', fontSize: 10 }}>Z</span>
            <button style={btn} onClick={() => useStore.getState().moveCursor(0, 0, -1)}>-Z</button>
            <button style={btn} onClick={() => useStore.getState().moveCursor(0, 0, 1)}>+Z</button>
            <div style={{ width: 1, height: 20, background: '#30363d' }} />
            <span style={{ color: '#8b949e', fontSize: 10 }}>Y</span>
            <button style={btn} onClick={() => useStore.getState().moveCursor(0, -1, 0)}>▼</button>
            <button style={btn} onClick={() => useStore.getState().moveCursor(0, 1, 0)}>▲</button>
            <div style={{ width: 1, height: 20, background: '#30363d' }} />
            <button style={{ ...btn, background: '#238636', color: '#fff' }}
              onClick={() => useStore.getState().toggleCursorCell()}>
              ⬡ Toggle
            </button>
            <span style={{ color: '#8b949e', fontSize: 10, marginLeft: 4 }}>
              ({cursor[0]},{cursor[1]},{cursor[2]})
            </span>
          </>
        ) : (
          <>
            <span style={{ color: '#8b949e', fontSize: 10, marginRight: 2 }}>X</span>
            <button style={btn} onClick={() => doStep(1)} title="A / ←">-X</button>
            <button style={btn} onClick={() => doStep(0)} title="D / →">+X</button>
            <div style={{ width: 1, height: 20, background: '#30363d' }} />
            <span style={{ color: '#8b949e', fontSize: 10, marginRight: 2 }}>Z</span>
            <button style={btn} onClick={() => doStep(5)} title="S / ↓">-Z</button>
            <button style={btn} onClick={() => doStep(4)} title="W / ↑">+Z</button>
            <div style={{ width: 1, height: 20, background: '#30363d' }} />
            <span style={{ color: '#8b949e', fontSize: 10, marginRight: 2 }}>Y</span>
            <button style={btn} onClick={() => doStep(3)} title="E">▼</button>
            <button style={btn} onClick={() => doStep(2)} title="Q">▲</button>
            <div style={{ width: 1, height: 20, background: '#30363d' }} />
            <button style={{ ...btn, background: '#238636', color: '#fff' }}
              onClick={() => useStore.getState().reset()}>
              🔄
            </button>
            <button style={{ ...btn, background: autoRun ? '#f85149' : '#238636', color: '#fff' }}
              onClick={() => setAutoRun(!autoRun)}>
              {autoRun ? '⏹' : '▶'}
            </button>
            <input type="range" min={100} max={1000} step={50} value={autoSpeed}
              onChange={(e) => setAutoSpeed(Number(e.target.value))} style={{ width: 40 }} />
            {message && <span style={{ color: '#d29922', fontSize: 11 }}>{message}</span>}
          </>
        )}
      </div>

      <div style={{ color: '#484f58', fontSize: 9 }}>
        {editMode
          ? `WASD/Arrows: move cursor · Q/E: up/down · Space/F: toggle cell · R: reset`
          : `WASD/Arrows · Q/E: up/down · Space: auto · R: reset`}
      </div>
    </div>
  );
}
