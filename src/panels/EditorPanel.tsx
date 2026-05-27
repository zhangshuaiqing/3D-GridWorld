import { useRef } from 'react';
import { useStore } from '../store';
import { CellType } from '../types';

export default function EditorPanel() {
  const editMode = useStore((s) => s.editMode);
  const setEditMode = useStore((s) => s.setEditMode);
  const clearAll = useStore((s) => s.clearAll);
  const randomFill = useStore((s) => s.randomFill);
  const applyMap = useStore((s) => s.applyMap);
  const regenerate = useStore((s) => s.regenerate);
  const importMap = useStore((s) => (s as any).importMap);
  const editGrid = useStore((s) => s.editGrid);
  const cursor = useStore((s) => s.cursor);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const btn: React.CSSProperties = {
    padding: '5px 10px', border: '1px solid #30363d', borderRadius: 5,
    background: '#21262d', color: '#c9d1d9', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
  };

  const activeBtn: React.CSSProperties = {
    ...btn, background: '#238636', borderColor: '#2ea043', color: '#fff',
  };

  const handleFileImport = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importMap(text);
      setEditMode(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const s = useStore.getState().state;
    const grid = s.grid;
    const obstacles: number[][] = [];
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[x].length; y++) {
        for (let z = 0; z < grid[x][y].length; z++) {
          if (grid[x][y][z] === CellType.OBSTACLE) obstacles.push([x, y, z]);
        }
      }
    }
    const mapData = { width: s.width, height: s.height, depth: s.depth, agentPos: s.agentPos, goalPos: s.goalPos, obstacles };
    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gridworld_${s.width}x${s.height}x${s.depth}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDownloadExample = () => {
    const example = {
      width: 6, height: 4, depth: 6,
      agentPos: [0, 0, 0], goalPos: [5, 0, 5],
      obstacles: [[1,0,1],[2,0,1],[3,0,1],[1,0,3],[1,1,3],[3,0,3],[3,1,3],[3,2,3],[2,0,5],[2,1,5]],
    };
    const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'example_map.json'; a.click(); URL.revokeObjectURL(url);
  };

  if (!editMode) {
    return (
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: 6, marginTop: 40 }}>
        <button style={btn} onClick={() => { regenerate(); setEditMode(true); }}>🗺️ Edit Map</button>
        <button style={btn} onClick={handleFileImport}>📂 Import Map</button>
        <button style={btn} onClick={handleExport}>💾 Export Map</button>
        <button style={btn} onClick={handleDownloadExample}>📄 Example</button>
        <button style={btn} onClick={() => window.open('/3D-GridWorld/about.html', '_blank')}>❓ About</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    );
  }

  let obsCount = 0;
  let totalCells = 0;
  if (editGrid && editGrid.length > 0) {
    for (let x = 0; x < editGrid.length; x++) {
      for (let y = 0; y < editGrid[x].length; y++) {
        for (let z = 0; z < editGrid[x][y].length; z++) { totalCells++; if (editGrid[x][y][z] === CellType.OBSTACLE) obsCount++; }
      }
    }
  }

  return (
    <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: 'rgba(22,27,34,0.95)', borderRadius: 8, border: '1px solid #3fb950', backdropFilter: 'blur(8px)', alignItems: 'center' }}>
        <span style={{ color: '#3fb950', fontSize: 11, fontWeight: 700 }}>🗺️ MAP EDITOR</span>
        <div style={{ width: 1, height: 24, background: '#30363d' }} />
        <span style={{ color: '#8b949e', fontSize: 10 }}>Cursor: ({cursor[0]},{cursor[1]},{cursor[2]})</span>
        <span style={{ color: '#8b949e', fontSize: 10 }}>{obsCount}/{totalCells}</span>
        <div style={{ width: 1, height: 24, background: '#30363d' }} />
        <button style={btn} onClick={clearAll}>🗑️ Clear</button>
        <button style={btn} onClick={randomFill}>🎲 Random</button>
        <div style={{ width: 1, height: 24, background: '#30363d' }} />
        <button style={{ ...btn, background: '#f85149', color: '#fff', borderColor: '#f85149' }} onClick={() => setEditMode(false)}>✕ Cancel</button>
        <button style={{ ...activeBtn, fontWeight: 700 }} onClick={applyMap}>✅ Apply</button>
      </div>
      <div style={{ color: '#8b949e', fontSize: 10, textAlign: 'center', padding: '3px 10px', background: 'rgba(22,27,34,0.8)', borderRadius: 4 }}>
        WASD/Arrows: move cursor · Q/E: up/down · Space/F: toggle obstacle
      </div>
    </div>
  );
}
