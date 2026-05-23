import { useState } from 'react';
import { useAppStore, getNextColor } from '../../store';
import type { IndicatorType } from '../../types';

const AVAILABLE_INDICATORS: { type: IndicatorType; name: string; description: string; category: string; defaults: Record<string, number> }[] = [
  { type: 'SMA', name: 'Simple Moving Average', description: 'Average price over N periods', category: 'Trend', defaults: { period: 20 } },
  { type: 'EMA', name: 'Exponential Moving Average', description: 'Weighted average giving more weight to recent prices', category: 'Trend', defaults: { period: 20 } },
  { type: 'BB', name: 'Bollinger Bands', description: 'Volatility bands around a moving average', category: 'Volatility', defaults: { period: 20, stdDev: 2 } },
  { type: 'RSI', name: 'Relative Strength Index', description: 'Momentum oscillator measuring speed of price changes', category: 'Momentum', defaults: { period: 14 } },
  { type: 'RPS', name: 'Relative Price Strength', description: 'Percentage price change over N periods', category: 'Momentum', defaults: { period: 12 } },
  { type: 'MACD', name: 'MACD', description: 'Moving average convergence/divergence', category: 'Momentum', defaults: { fast: 12, slow: 26, signal: 9 } },
];
const CATEGORIES = ['All', 'Trend', 'Momentum', 'Volatility'];

interface Props { open: boolean; onClose: () => void }

export default function IndicatorsModal({ open, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const addIndicator = useAppStore(s => s.addIndicator);
  const indicators = useAppStore(s => s.indicators);
  const removeIndicator = useAppStore(s => s.removeIndicator);

  if (!open) return null;

  const filtered = AVAILABLE_INDICATORS.filter(ind => {
    const matchCat = category === 'All' || ind.category === category;
    const matchSearch = !search || ind.name.toLowerCase().includes(search.toLowerCase()) || ind.type.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleAdd(ind: typeof AVAILABLE_INDICATORS[0]) {
    addIndicator({ id: `${ind.type}-${Date.now()}`, type: ind.type, params: { ...ind.defaults }, color: getNextColor() });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '520px', maxHeight: '500px',
        background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
        borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: 'var(--shadow-dropdown)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>Indicators</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search indicators..." autoFocus
            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-xs)', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }} />
        </div>
        {/* Categories */}
        <div style={{ display: 'flex', gap: '2px', padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-xs)', border: 'none', fontSize: '11px', fontWeight: 500, transition: 'all 0.15s',
              background: category === cat ? 'var(--accent)' : 'transparent', color: category === cat ? '#fff' : 'var(--text-secondary)',
            }}>{cat}</button>
          ))}
        </div>
        {/* Active */}
        {indicators.length > 0 && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Active</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {indicators.map(ind => (
                <span key={ind.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)', background: 'var(--bg-glass-hover)', border: '1px solid var(--border-glass)', fontSize: '11px',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ind.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{ind.type}{ind.params.period ? ` (${ind.params.period})` : ''}</span>
                  <button onClick={() => removeIndicator(ind.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1, padding: 0, marginLeft: '2px', cursor: 'pointer' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(ind => (
            <div key={ind.type} onClick={() => handleAdd(ind)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{ind.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px', background: 'var(--bg-input)', padding: '1px 5px', borderRadius: '3px' }}>{ind.type}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>{ind.description}</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', background: 'var(--bg-input)', padding: '2px 7px', borderRadius: 'var(--radius-xs)', textTransform: 'uppercase' }}>{ind.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
