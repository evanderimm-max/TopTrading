import { useState } from 'react';
import { useAppStore, getNextColor } from '../../store';
import type { IndicatorType } from '../../types';

const AVAILABLE_INDICATORS: {
  type: IndicatorType;
  name: string;
  description: string;
  category: string;
  defaults: Record<string, number>;
}[] = [
  { type: 'SMA', name: 'Simple Moving Average', description: 'Average price over N periods', category: 'Trend', defaults: { period: 20 } },
  { type: 'EMA', name: 'Exponential Moving Average', description: 'Weighted average giving more weight to recent prices', category: 'Trend', defaults: { period: 20 } },
  { type: 'BB', name: 'Bollinger Bands', description: 'Volatility bands around a moving average', category: 'Volatility', defaults: { period: 20, stdDev: 2 } },
  { type: 'RSI', name: 'Relative Strength Index', description: 'Momentum oscillator measuring speed of price changes', category: 'Momentum', defaults: { period: 14 } },
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
    addIndicator({
      id: `${ind.type}-${Date.now()}`,
      type: ind.type,
      params: { ...ind.defaults },
      color: getNextColor(),
    });
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '520px', maxHeight: '500px', background: '#1e222d',
        borderRadius: '8px', border: '1px solid #2a2e39',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid #2a2e39',
        }}>
          <span style={{ color: '#d1d4dc', fontWeight: 600, fontSize: '14px' }}>Indicators</span>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#787b86', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2e39' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search indicators..."
            autoFocus
            style={{
              width: '100%', background: '#131722', border: '1px solid #2a2e39',
              borderRadius: '4px', padding: '7px 10px', color: '#d1d4dc',
              fontSize: '12px', outline: 'none',
            }}
          />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '8px 16px', borderBottom: '1px solid #2a2e39' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '3px 10px', borderRadius: '3px', border: 'none',
                fontSize: '11px', fontWeight: 500,
                background: category === cat ? '#2962ff' : 'transparent',
                color: category === cat ? '#fff' : '#787b86',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Active indicators */}
        {indicators.length > 0 && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #2a2e39' }}>
            <div style={{ color: '#787b86', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Active
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {indicators.map(ind => (
                <span
                  key={ind.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 8px', borderRadius: '3px',
                    background: '#2a2e39', fontSize: '11px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ind.color, display: 'inline-block' }} />
                  <span style={{ color: '#d1d4dc' }}>
                    {ind.type}
                    {ind.params.period ? ` (${ind.params.period})` : ''}
                  </span>
                  <button
                    onClick={() => removeIndicator(ind.id)}
                    style={{ background: 'transparent', border: 'none', color: '#787b86', fontSize: '12px', lineHeight: 1, padding: 0, marginLeft: '2px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Indicator list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(ind => (
            <div
              key={ind.type}
              onClick={() => handleAdd(ind)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: '1px solid #1e222d',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a2e39')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#d1d4dc', fontSize: '13px', fontWeight: 500 }}>{ind.name}</span>
                  <span style={{ color: '#787b86', fontSize: '10px', background: '#131722', padding: '1px 5px', borderRadius: '2px' }}>{ind.type}</span>
                </div>
                <div style={{ color: '#787b86', fontSize: '11px', marginTop: '2px' }}>{ind.description}</div>
              </div>
              <span style={{
                color: '#787b86', fontSize: '10px', background: '#131722',
                padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase',
              }}>
                {ind.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
