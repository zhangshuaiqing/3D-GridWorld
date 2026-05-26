import { CellType } from '../types';
import { CELL_COLORS } from '../constants';

const ITEMS: Array<{ label: string; color: string; cellType: CellType }> = [
  { label: 'Empty', color: CELL_COLORS[CellType.EMPTY], cellType: CellType.EMPTY },
  { label: 'Obstacle', color: CELL_COLORS[CellType.OBSTACLE], cellType: CellType.OBSTACLE },
  { label: 'Agent', color: CELL_COLORS[CellType.AGENT], cellType: CellType.AGENT },
  { label: 'Goal', color: CELL_COLORS[CellType.GOAL], cellType: CellType.GOAL },
  { label: 'Dynamic Obstacle', color: '#f85149', cellType: 5 as CellType },
];

export default function LegendPanel() {
  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      padding: '10px 14px',
      background: 'rgba(22, 27, 34, 0.9)',
      borderRadius: 8,
      border: '1px solid #30363d',
      backdropFilter: 'blur(8px)',
      zIndex: 10,
      fontSize: 12,
      lineHeight: 2,
    }}>
      <div style={{ color: '#8b949e', fontWeight: 600, marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
        Legend
      </div>
      {ITEMS.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: item.cellType === CellType.AGENT ? '50%' : 2,
            background: item.color,
          }} />
          <span style={{ color: '#c9d1d9' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
