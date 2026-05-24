import { useState } from 'react';
import { useAppStore, getNextColor } from '../../store';
import type { IndicatorType } from '../../types';

const AVAILABLE_INDICATORS: { type: IndicatorType; name: string; description: string; category: string; defaults: Record<string, number> }[] = [
  { type: 'SMA',  name: 'Simple Moving Average',       description: 'Average price over N periods',                        category: 'Trend',     defaults: { period: 20 } },
  { type: 'EMA',  name: 'Exponential Moving Average',  description: 'Weighted average giving more weight to recent prices', category: 'Trend',     defaults: { period: 20 } },
  { type: 'BB',   name: 'Bollinger Bands',              description: 'Volatility bands around a moving average',             category: 'Volatility', defaults: { period: 20, stdDev: 2 } },
  { type: 'RSI',  name: 'Relative Strength Index',     description: 'Momentum oscillator measuring speed of price changes', category: 'Momentum',  defaults: { period: 14 } },
  { type: 'RPS',  name: 'Relative Price Strength',     description: 'Percentage price change over N periods',               category: 'Momentum',  defaults: { period: 12 } },
  { type: 'MACD', name: 'MACD',                        description: 'Moving average convergence/divergence',                category: 'Momentum',  defaults: { fast: 12, slow: 26, signal: 9 } },
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
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '540px', maxHeight: '520px',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-modal)',
        border: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Accent top strip */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--accent) 0%, #3b82f6 100%)', flexShrink: 0 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--accent-glow)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 20L8 10l4 6 4-12 5 16"/></svg>
            </div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '14px' }}>Indicators</span>
          </div>
          <button onClick={onClose} style={{
            width: '28px', height: '28px', background: 'var(--bg-primary)',
            border: 'none', borderRadius: '7px', color: 'var(--text-muted)',
            fontSize: '18px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--neu-out-sm)', cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >×</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', padding: '0 10px', height: '34px', boxShadow: 'var(--neu-in)', border: '1px solid var(--border-glass)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search indicators…" autoFocus
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '12px' }} />
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', padding: '4px', boxShadow: 'var(--neu-in)' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                flex: 1, padding: '4px 0', borderRadius: '5px', border: 'none',
                fontSize: '11px', fontWeight: category === cat ? 700 : 400,
                background: category === cat ? 'var(--accent)' : 'transparent',
                color: category === cat ? '#fff' : 'var(--text-secondary)',
                boxShadow: category === cat ? 'var(--accent-glow)' : 'none',
                transition: 'all 0.18s', cursor: 'pointer',
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Active indicators */}
        {indicators.length > 0 && (
          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '8px' }}>Active</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {indicators.map(ind => (
                <span key={ind.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-primary)', boxShadow: 'var(--neu-out-sm)',
                  border: '1px solid var(--border-glass)', fontSize: '11px',
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ind.color, display: 'inline-block', boxShadow: `0 0 6px ${ind.color}` }} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ind.type}{ind.params.period ? ` (${ind.params.period})` : ''}</span>
                  <button onClick={() => removeIndicator(ind.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1, padding: 0, cursor: 'pointer' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((ind, i) => (
            <div key={ind.type} onClick={() => handleAdd(ind)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 18px', cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{ind.name}</span>
                  <span style={{ color: 'var(--accent)', fontSize: '9px', fontWeight: 700, background: 'var(--accent-dim)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.06em' }}>{ind.type}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{ind.description}</div>
              </div>
              <span style={{
                color: 'var(--text-muted)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                background: 'var(--bg-primary)', padding: '3px 8px', borderRadius: 'var(--radius-xs)',
                boxShadow: 'var(--neu-flat)', border: '1px solid var(--border-glass)',
              }}>{ind.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
