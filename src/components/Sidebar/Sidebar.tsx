import { useState } from 'react';
import Watchlist from '../Watchlist/Watchlist';
import NewsPanel from '../NewsPanel/NewsPanel';

const TABS = ['Watchlist', 'News'] as const;
type Tab = typeof TABS[number];

interface Props { symbol: string }

export default function Sidebar({ symbol }: Props) {
  const [tab, setTab] = useState<Tab>('Watchlist');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#131722', borderLeft: '1px solid #1e2130' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #1e2130' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px', background: 'transparent', border: 'none',
              cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s',
              color: tab === t ? '#e2e8f0' : '#6b7db3',
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'Watchlist' ? <Watchlist /> : <NewsPanel symbol={symbol} />}
      </div>
    </div>
  );
}
