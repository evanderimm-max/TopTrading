import { useState } from 'react';
import { useQuote } from '../../hooks/useQuote';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { useAppStore } from '../../store';
import SearchBar from '../SearchBar/SearchBar';
import IndicatorsModal from '../IndicatorsModal/IndicatorsModal';
import type { Timeframe } from '../../types';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '15m', value: '15m' }, { label: '30m', value: '30m' }, { label: '1h', value: '1h' },
  { label: '1D', value: '1D' }, { label: '1W', value: '1W' }, { label: '1M', value: '1M' },
  { label: '3M', value: '3M' }, { label: '1Y', value: '1Y' }, { label: '5Y', value: '5Y' },
];

interface Props {
  symbol: string;
  onToggleRightPanel: () => void;
  onToggleBottomPanel: () => void;
  rightPanelOpen: boolean;
}

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TopToolbar({ symbol, onToggleRightPanel, onToggleBottomPanel, rightPanelOpen }: Props) {
  const timeframe = useAppStore(s => s.timeframe);
  const setTimeframe = useAppStore(s => s.setTimeframe);
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const indicators = useAppStore(s => s.indicators);
  const { quote } = useQuote(symbol);
  const { profile } = useCompanyProfile(symbol);
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);

  const isPositive = (quote?.dp ?? 0) >= 0;

  return (
    <>
      {/* Toolbar wrapper – glass panel on top of neumorphic page */}
      <div style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-glass)',
        position: 'relative', zIndex: 50,
        flexShrink: 0,
      }}>

        {/* ── ROW 1 ── */}
        <div style={{ display: 'flex', alignItems: 'center', height: '44px', padding: '0 12px', gap: '10px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingRight: '14px', borderRight: '1px solid var(--border-subtle)', height: '26px', flexShrink: 0 }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
              boxShadow: 'var(--accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="2 17 8.5 10.5 13.5 15.5 22 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 7 22 7 22 13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.3px' }}>
              <span style={{ color: 'var(--text-primary)' }}>Top</span>
              <span style={{ color: 'var(--accent)' }}>Trading</span>
            </span>
          </div>

          <SearchBar />
          <div style={{ flex: 1 }} />

          {/* Util buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <NeuBtn onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark'
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </NeuBtn>
            <NeuBtn onClick={onToggleRightPanel} active={rightPanelOpen} title="Watchlist">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </NeuBtn>
            <NeuBtn onClick={onToggleBottomPanel} title="Details">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/></svg>
            </NeuBtn>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

        {/* ── ROW 2 ── */}
        <div style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 12px', gap: '6px' }}>

          {/* Symbol & logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingRight: '12px', borderRight: '1px solid var(--border-subtle)', height: '26px', flexShrink: 0 }}>
            {profile?.logo && (
              <img src={profile.logo} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain', background: '#fff', padding: '1px', boxShadow: 'var(--neu-flat)' }} />
            )}
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.2px' }}>{symbol}</span>
            {profile?.name && (
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</span>
            )}
          </div>

          {/* Timeframes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 8px', borderRight: '1px solid var(--border-subtle)', height: '28px' }}>
            {TIMEFRAMES.map(tf => (
              <TFButton key={tf.value} active={timeframe === tf.value} onClick={() => setTimeframe(tf.value)}>
                {tf.label}
              </TFButton>
            ))}
          </div>

          {/* Candle type indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 8px', borderRight: '1px solid var(--border-subtle)', height: '28px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="3" height="8" fill="var(--green)" rx="0.5"/>
              <rect x="5" y="2" width="3" height="12" fill="var(--red)" rx="0.5"/>
              <rect x="9" y="6" width="3" height="6" fill="var(--green)" rx="0.5"/>
              <rect x="13" y="3" width="2" height="10" fill="var(--red)" rx="0.5"/>
            </svg>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500 }}>Candles</span>
          </div>

          {/* Indicators button */}
          <button onClick={() => setIndicatorsOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
            borderRadius: 'var(--radius-xs)', border: 'none', fontSize: '12px', fontWeight: 500,
            background: indicators.length > 0 ? 'var(--accent)' : 'var(--bg-glass)',
            color: indicators.length > 0 ? '#fff' : 'var(--text-secondary)',
            boxShadow: indicators.length > 0 ? 'var(--accent-glow)' : 'var(--neu-flat)',
            transition: 'all 0.2s ease', cursor: 'pointer',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 20L8 10l4 6 4-12 5 16"/></svg>
            <span>Indicators</span>
            {indicators.length > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px' }}>
                {indicators.length}
              </span>
            )}
          </button>

          <div style={{ flex: 1 }} />

          {/* Live price */}
          {quote && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>{fmt(quote.c)}</span>
              <span style={{
                color: isPositive ? 'var(--green)' : 'var(--red)', fontSize: '11px', fontWeight: 600,
                background: isPositive ? 'var(--green-bg)' : 'var(--red-bg)',
                padding: '3px 8px', borderRadius: 'var(--radius-xs)',
                border: `1px solid ${isPositive ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
              }}>
                {isPositive ? '+' : ''}{fmt(quote.d)} ({isPositive ? '+' : ''}{fmt(quote.dp)}%)
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[{ l: 'O', v: quote.o }, { l: 'H', v: quote.h }, { l: 'L', v: quote.l }, { l: 'PC', v: quote.pc }].map(({ l, v }) => (
                  <span key={l} style={{ fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l} </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{fmt(v)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <IndicatorsModal open={indicatorsOpen} onClose={() => setIndicatorsOpen(false)} />
    </>
  );
}

/* ── Neumorphic icon button ── */
function NeuBtn({ children, onClick, active, title }: { children: React.ReactNode; onClick: () => void; active?: boolean; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: '32px', height: '32px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 'var(--radius-xs)', border: 'none',
      background: active ? 'var(--accent)' : 'var(--bg-primary)',
      color: active ? '#fff' : 'var(--text-secondary)',
      boxShadow: active ? 'var(--accent-glow)' : 'var(--neu-out-sm)',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--neu-out)'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--neu-out-sm)'; } }}
    >{children}</button>
  );
}

/* ── Timeframe button ── */
function TFButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 7px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: active ? 600 : 400,
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      boxShadow: active ? 'var(--accent-glow)' : 'none',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
    >{children}</button>
  );
}
