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
      width: '310px', flexShrink: 0,
      background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
      borderLeft: '1px solid var(--border-glass)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', height: '38px', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, height: '100%', background: 'transparent', border: 'none', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s',
            color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
          }}>{t}</button>
        ))}
        <button onClick={onClose} style={{
          width: '38px', height: '100%', background: 'transparent', border: 'none',
          color: 'var(--text-secondary)', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderLeft: '1px solid var(--border-subtle)', transition: 'color 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >×</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'Watchlist' ? <Watchlist /> : <NewsPanel symbol={symbol} />}
      </div>
    </div>
  );
}
