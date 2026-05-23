import { useState } from 'react';
import { useQuote } from '../../hooks/useQuote';

interface Props { symbol: string; name: string; active: boolean; onSelect: () => void; onRemove: () => void }

export default function WatchlistRow({ symbol, name, active, onSelect, onRemove }: Props) {
  const { quote } = useQuote(symbol);
  const [hovered, setHovered] = useState(false);
  const isPositive = (quote?.dp ?? 0) >= 0;

  return (
    <div onClick={onSelect} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', padding: '7px 12px', cursor: 'pointer',
        borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.12s',
        background: active ? 'var(--bg-glass-active)' : hovered ? 'var(--bg-glass-hover)' : 'transparent',
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}>{symbol}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
      </div>
      <div style={{ width: '70px', textAlign: 'right' }}>
        <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{quote ? quote.c.toFixed(2) : '—'}</span>
      </div>
      <div style={{ width: '60px', textAlign: 'right' }}>
        <span style={{
          fontSize: '11px', fontWeight: 500, padding: '2px 6px', borderRadius: 'var(--radius-xs)', display: 'inline-block',
          background: isPositive ? 'var(--green-bg)' : 'var(--red-bg)', color: isPositive ? 'var(--green)' : 'var(--red)',
        }}>
          {quote ? `${isPositive ? '+' : ''}${quote.dp.toFixed(2)}%` : '—'}
        </span>
      </div>
      {hovered && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ marginLeft: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0 2px', lineHeight: 1, fontSize: '14px' }}>×</button>
      )}
    </div>
  );
}
