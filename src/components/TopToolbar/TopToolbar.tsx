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
      <div style={{
        background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-glass)',
      }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 10px', gap: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px 0 4px', borderRight: '1px solid var(--border-subtle)', height: '100%', alignSelf: 'stretch', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '14px' }}>
              Top<span style={{ color: 'var(--accent)' }}>Trading</span>
            </span>
          </div>
          <SearchBar />
          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <GlassButton onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </GlassButton>
          <GlassButton onClick={onToggleRightPanel} active={rightPanelOpen} title="Watchlist">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          </GlassButton>
          <GlassButton onClick={onToggleBottomPanel} title="Details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/></svg>
          </GlassButton>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'flex', alignItems: 'center', height: '38px', padding: '0 10px', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px 0 4px', borderRight: '1px solid var(--border-subtle)', height: '100%', alignSelf: 'stretch' }}>
            {profile?.logo && (
              <img src={profile.logo} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'contain', background: '#fff', padding: '1px' }} />
            )}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>{symbol}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name || ''}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 8px', borderRight: '1px solid var(--border-subtle)', height: '100%', alignSelf: 'stretch' }}>
            {TIMEFRAMES.map(tf => (
              <button key={tf.value} onClick={() => setTimeframe(tf.value)} style={{
                padding: '3px 6px', borderRadius: 'var(--radius-xs)', fontSize: '11px', fontWeight: 500, border: 'none', transition: 'all 0.15s',
                background: timeframe === tf.value ? 'var(--accent)' : 'transparent',
                color: timeframe === tf.value ? '#fff' : 'var(--text-secondary)',
              }}>{tf.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--border-subtle)', height: '100%', alignSelf: 'stretch' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="3" height="8" fill="var(--green)" rx="0.5"/><rect x="5" y="2" width="3" height="12" fill="var(--red)" rx="0.5"/>
              <rect x="9" y="6" width="3" height="6" fill="var(--green)" rx="0.5"/><rect x="13" y="3" width="2" height="10" fill="var(--red)" rx="0.5"/>
            </svg>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Candles</span>
          </div>

          <GlassButton onClick={() => setIndicatorsOpen(true)} active={indicators.length > 0} title="Indicators">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 20L8 10l4 6 4-12 5 16"/></svg>
            <span style={{ fontSize: '12px' }}>Indicators</span>
            {indicators.length > 0 && (
              <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', minWidth: '14px', textAlign: 'center' }}>{indicators.length}</span>
            )}
          </GlassButton>

          <div style={{ flex: 1 }} />

          {quote && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>{fmt(quote.c)}</span>
              <span style={{ color: isPositive ? 'var(--green)' : 'var(--red)', fontSize: '12px', fontWeight: 500, background: isPositive ? 'var(--green-bg)' : 'var(--red-bg)', padding: '2px 8px', borderRadius: 'var(--radius-xs)' }}>
                {isPositive ? '+' : ''}{fmt(quote.d)} ({isPositive ? '+' : ''}{fmt(quote.dp)}%)
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[{ l: 'O', v: quote.o }, { l: 'H', v: quote.h }, { l: 'L', v: quote.l }, { l: 'C', v: quote.c }].map(({ l, v }) => (
                  <span key={l} style={{ fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{l} </span>
                    <span style={{ color: v >= quote.o ? 'var(--green)' : 'var(--red)' }}>{fmt(v)}</span>
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

function GlassButton({ children, onClick, active, title }: { children: React.ReactNode; onClick: () => void; active?: boolean; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid transparent',
      background: active ? 'var(--bg-glass-active)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '12px', transition: 'all 0.15s',
      borderColor: active ? 'var(--border-glass)' : 'transparent',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
    >{children}</button>
  );
}
