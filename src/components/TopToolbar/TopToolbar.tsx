import { useState } from 'react';
import { useQuote } from '../../hooks/useQuote';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { useAppStore } from '../../store';
import SearchBar from '../SearchBar/SearchBar';
import IndicatorsModal from '../IndicatorsModal/IndicatorsModal';
import type { Timeframe } from '../../types';

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
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
  const indicators = useAppStore(s => s.indicators);
  const { quote } = useQuote(symbol);
  const { profile } = useCompanyProfile(symbol);
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);

  const isPositive = (quote?.dp ?? 0) >= 0;
  const changeColor = isPositive ? '#26a69a' : '#ef5350';

  return (
    <>
      <div style={{ background: '#1e222d', borderBottom: '1px solid #2a2e39', display: 'flex', flexDirection: 'column' }}>
        {/* Row 1: Search + Logo + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', height: '38px', padding: '0 8px', gap: '8px', borderBottom: '1px solid #2a2e39' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px 0 4px', borderRight: '1px solid #2a2e39', height: '100%', alignSelf: 'stretch', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#2962ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="#2962ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#d1d4dc', fontWeight: 700, fontSize: '14px' }}>
              Top<span style={{ color: '#2962ff' }}>Trading</span>
            </span>
          </div>

          <SearchBar />
          <div style={{ flex: 1 }} />

          <ToolbarButton onClick={onToggleRightPanel} active={rightPanelOpen} title="Watchlist">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton onClick={onToggleBottomPanel} title="Details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/>
            </svg>
          </ToolbarButton>
        </div>

        {/* Row 2: Symbol info + Timeframes + Indicators + Price */}
        <div style={{ display: 'flex', alignItems: 'center', height: '36px', padding: '0 8px', gap: '4px' }}>
          {/* Symbol */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0 10px 0 4px', borderRight: '1px solid #2a2e39',
            height: '100%', alignSelf: 'stretch', cursor: 'pointer',
          }}>
            {profile?.logo && (
              <img
                src={profile.logo} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: '18px', height: '18px', borderRadius: '3px', objectFit: 'contain', background: '#fff', padding: '1px' }}
              />
            )}
            <span style={{ color: '#d1d4dc', fontWeight: 600, fontSize: '14px' }}>{symbol}</span>
            <span style={{ color: '#787b86', fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || ''}
            </span>
          </div>

          {/* Timeframes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', padding: '0 6px', borderRight: '1px solid #2a2e39', height: '100%', alignSelf: 'stretch' }}>
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                style={{
                  padding: '2px 5px', borderRadius: '3px', fontSize: '11px', fontWeight: 400,
                  border: 'none', transition: 'all 0.1s',
                  background: timeframe === tf.value ? '#2962ff' : 'transparent',
                  color: timeframe === tf.value ? '#fff' : '#787b86',
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', borderRight: '1px solid #2a2e39', height: '100%', alignSelf: 'stretch' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="3" height="8" fill="#26a69a" rx="0.5"/>
              <rect x="5" y="2" width="3" height="12" fill="#ef5350" rx="0.5"/>
              <rect x="9" y="6" width="3" height="6" fill="#26a69a" rx="0.5"/>
              <rect x="13" y="3" width="2" height="10" fill="#ef5350" rx="0.5"/>
            </svg>
            <span style={{ color: '#787b86', fontSize: '12px' }}>Candles</span>
          </div>

          {/* Indicators button */}
          <ToolbarButton onClick={() => setIndicatorsOpen(true)} active={indicators.length > 0} title="Indicators">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 20L8 10l4 6 4-12 5 16"/>
            </svg>
            <span style={{ fontSize: '12px' }}>Indicators</span>
            {indicators.length > 0 && (
              <span style={{
                background: '#2962ff', color: '#fff', fontSize: '9px', fontWeight: 700,
                padding: '1px 4px', borderRadius: '6px', minWidth: '14px', textAlign: 'center',
              }}>
                {indicators.length}
              </span>
            )}
          </ToolbarButton>

          <div style={{ flex: 1 }} />

          {/* Price info */}
          {quote && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
              <span style={{ color: '#d1d4dc', fontWeight: 600, fontSize: '15px' }}>{fmt(quote.c)}</span>
              <span style={{ color: changeColor, fontSize: '12px', fontWeight: 500 }}>
                {isPositive ? '+' : ''}{fmt(quote.d)} ({isPositive ? '+' : ''}{fmt(quote.dp)}%)
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { l: 'O', v: quote.o },
                  { l: 'H', v: quote.h },
                  { l: 'L', v: quote.l },
                  { l: 'C', v: quote.c },
                ].map(({ l, v }) => (
                  <span key={l} style={{ fontSize: '11px' }}>
                    <span style={{ color: '#787b86' }}>{l} </span>
                    <span style={{ color: v >= quote.o ? '#26a69a' : '#ef5350' }}>{fmt(v)}</span>
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

function ToolbarButton({ children, onClick, active, title }: {
  children: React.ReactNode; onClick: () => void; active?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '4px 8px', borderRadius: '3px', border: 'none',
        background: active ? '#2a2e39' : 'transparent',
        color: active ? '#d1d4dc' : '#787b86',
        fontSize: '12px', transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#2a2e39'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
