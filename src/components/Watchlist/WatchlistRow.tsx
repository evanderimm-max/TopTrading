import { useState } from 'react';
import { useQuote } from '../../hooks/useQuote';

interface Props {
  symbol: string;
  name: string;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function WatchlistRow({ symbol, name, active, onSelect, onRemove }: Props) {
  const { quote } = useQuote(symbol);
  const [hovered, setHovered] = useState(false);

  const isPositive = (quote?.dp ?? 0) >= 0;
  const changeColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 14px', cursor: 'pointer', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #1a1e2e',
        background: active ? '#1e2130' : hovered ? '#161b27' : 'transparent',
        borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>{symbol}</div>
        <div style={{ color: '#4a5568', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
      </div>

      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
        <span style={{ color: '#d1d5db', fontSize: '13px', fontWeight: 500 }}>
          {quote ? quote.c.toFixed(2) : '—'}
        </span>
        <span style={{ color: changeColor, fontSize: '10px' }}>
          {quote ? `${isPositive ? '+' : ''}${quote.dp.toFixed(2)}%` : '—'}
        </span>
      </div>

      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            marginLeft: '8px', background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#4a5568', padding: '2px', lineHeight: 1, fontSize: '14px',
          }}
          title="Remove"
        >
          ×
        </button>
      )}
    </div>
  );
}
