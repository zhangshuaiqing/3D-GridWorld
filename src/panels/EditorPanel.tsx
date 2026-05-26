import { useStore } from '../store';
import { CellType } from '../types';

export default function EditorPanel() {
  const editMode = useStore((s) => s.editMode);
  const setEditMode = useStore((s) => s.setEditMode);
  const editLayer = useStore((s) => s.editLayer);
  const setEditLayer = useStore((s) => s.setEditLayer);
  const config = useStore((s) => s.config);
  const clearAll = useStore((s) => s.clearAll);
  const randomFill = useStore((s) => s.randomFill);
  const applyMap = useStore((s) => s.applyMap);
  const regenerate = useStore((s) => s.regenerate);
  const editGrid = useStore((s) => s.editGrid);

  const btn: React.CSSProperties = {
    padding: '5px 10px',
    border: '1px solid #30363d',
    borderRadius: 5,
    background: '#21262d',
    color: '#c9d1d9',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'monospace',
  };

  const activeBtn: React.CSSProperties = {
    ...btn,
    background: '#238636',
    borderColor: '#2ea043',
    color: '#fff',
  };

  if (!editMode) {
    return (
      <button
        style={{
          ...btn,
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          marginTop: 40,
        }}
        onClick={() => {
          regenerate();
          setEditMode(true);
        }}
      >
        🗺️ Edit Map
      </button>
    );
  }

  // Count obstacles in edit grid
  let obsCount = 0;
  let totalCells = 0;
  if (editGrid && editGrid.length > 0) {
    for (let x = 0; x < editGrid.length; x++) {
      for (let y = 0; y < editGrid[x].length; y++) {
        for (let z = 0; z < editGrid[x][y].length; z++) {
          totalCells++;
          if (editGrid[x][y][z] === CellType.OBSTACLE) obsCount++;
        }
      }
    }
  }

  const layerPct = totalCells > 0 ? Math.round((obsCount / totalCells) * 100) : 0;

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}>
      {/* Editor toolbar */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 14px',
        background: 'rgba(22, 27, 34, 0.95)',
        borderRadius: 8,
        border: '1px solid #f0883e',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
      }}>
        <span style={{ color: '#f0883e', fontSize: 11, fontWeight: 700 }}>
          🗺️ MAP EDITOR
        </span>

        <div style={{ width: 1, height: 24, background: '#30363d' }} />

        {/* Layer selector */}
        <span style={{ color: '#8b949e', fontSize: 11 }}>Layer Y:</span>
        <input
          type="range"
          min={0}
          max={config.height - 1}
          value={editLayer}
          onChange={(e) => setEditLayer(Number(e.target.value))}
          style={{ width: 60 }}
        />
        <span style={{ color: '#c9d1d9', fontSize: 11, minWidth: 16, textAlign: 'right' }}>
          {editLayer}
        </span>

        <div style={{ width: 1, height: 24, background: '#30363d' }} />

        <button style={btn} onClick={clearAll}>🗑️ Clear</button>
        <button style={btn} onClick={randomFill}>🎲 Random</button>

        <div style={{ width: 1, height: 24, background: '#30363d' }} />

        <span style={{ color: '#8b949e', fontSize: 10 }}>
          {obsCount}/{totalCells} obs ({layerPct}%)
        </span>

        <div style={{ width: 1, height: 24, background: '#30363d' }} />

        <button
          style={{ ...btn, background: '#f85149', color: '#fff', borderColor: '#f85149' }}
          onClick={() => setEditMode(false)}
        >
          ✕ Cancel
        </button>
        <button
          style={{ ...activeBtn, fontWeight: 700 }}
          onClick={applyMap}
        >
          ✅ Apply
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        color: '#8b949e',
        fontSize: 10,
        textAlign: 'center',
        padding: '3px 10px',
        background: 'rgba(22, 27, 34, 0.8)',
        borderRadius: 4,
      }}>
        Click on any obstacle in the 3D scene to toggle it · Use slider to change Y-layer
      </div>
    </div>
  );
}
