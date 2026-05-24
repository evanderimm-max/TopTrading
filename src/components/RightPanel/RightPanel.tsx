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
      width: '300px', flexShrink: 0,
      background: 'var(--bg-glass)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderLeft: '1px solid var(--border-glass)',
      boxShadow: 'var(--shadow-glass)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', height: '42px', flexShrink: 0, padding: '0 4px', gap: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flex: 1, padding: '4px', gap: '2px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', margin: '6px 0 6px 6px', boxShadow: 'var(--neu-in)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, height: '26px',
              background: tab === t ? 'var(--accent)' : 'transparent',
              border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              boxShadow: tab === t ? 'var(--accent-glow)' : 'none',
              transition: 'all 0.2s ease', cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
        <button onClick={onClose} style={{
          width: '28px', height: '28px', flexShrink: 0, marginRight: '6px',
          background: 'var(--bg-primary)', border: 'none',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--text-muted)', fontSize: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--neu-out-sm)', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >×</button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'Watchlist' ? <Watchlist /> : <NewsPanel symbol={symbol} />}
      </div>
    </div>
  );
}
