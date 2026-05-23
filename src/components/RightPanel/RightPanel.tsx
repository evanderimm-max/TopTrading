import { useState } from 'react';
import Watchlist from '../Watchlist/Watchlist';
import NewsPanel from '../NewsPanel/NewsPanel';

const TABS = ['Watchlist', 'News'] as const;
type Tab = typeof TABS[number];

interface Props { symbol: string; onClose: () => void }

export default function RightPanel({ symbol, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('Watchlist');

  return (
    <div style={{
      width: '310px', flexShrink: 0, background: '#1e222d', borderLeft: '1px solid #2a2e39',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2e39', height: '36px', flexShrink: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, height: '100%', background: 'transparent', border: 'none',
              fontSize: '12px', fontWeight: 500, transition: 'all 0.1s',
              color: tab === t ? '#d1d4dc' : '#787b86',
              borderBottom: tab === t ? '2px solid #2962ff' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
        <button
          onClick={onClose}
          style={{
            width: '36px', height: '100%', background: 'transparent', border: 'none',
            color: '#787b86', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: '1px solid #2a2e39',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#d1d4dc'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#787b86'; }}
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'Watchlist' ? <Watchlist /> : <NewsPanel symbol={symbol} />}
      </div>
    </div>
  );
}
