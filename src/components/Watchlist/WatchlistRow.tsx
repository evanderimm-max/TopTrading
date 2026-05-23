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
  const changeColor = isPositive ? '#26a69a' : '#ef5350';

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', padding: '6px 12px', cursor: 'pointer',
        borderBottom: '1px solid #1e222d',
        background: active ? '#2a2e39' : hovered ? '#262b3d' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#d1d4dc', fontSize: '12px', fontWeight: 600 }}>{symbol}</div>
        <div style={{ color: '#787b86', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
      </div>

      <div style={{ width: '70px', textAlign: 'right' }}>
        <span style={{ color: '#d1d4dc', fontSize: '12px' }}>
          {quote ? quote.c.toFixed(2) : '—'}
        </span>
      </div>

      <div style={{ width: '60px', textAlign: 'right' }}>
        <span style={{
          color: '#131722', fontSize: '11px', fontWeight: 500,
          background: changeColor, padding: '1px 6px', borderRadius: '3px',
          display: 'inline-block',
        }}>
          {quote ? `${isPositive ? '+' : ''}${quote.dp.toFixed(2)}%` : '—'}
        </span>
      </div>

      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            marginLeft: '4px', background: 'transparent', border: 'none',
            color: '#787b86', padding: '0 2px', lineHeight: 1, fontSize: '14px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
