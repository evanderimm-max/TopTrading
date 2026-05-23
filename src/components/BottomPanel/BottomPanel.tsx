import { useState } from 'react';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { useQuote } from '../../hooks/useQuote';

interface Props { symbol: string }
const TABS = ['Overview', 'Financials'] as const;
type Tab = typeof TABS[number];

function fmt(n: number | undefined) { return n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtCap(n: number) { if (!n) return '—'; return n >= 1000 ? `$${(n / 1000).toFixed(2)}T` : `$${n.toFixed(2)}B`; }

export default function BottomPanel({ symbol }: Props) {
  const [tab, setTab] = useState<Tab>('Overview');
  const { profile } = useCompanyProfile(symbol);
  const { quote } = useQuote(symbol);

  return (
    <div style={{
      height: '200px', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
      borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', height: '32px', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0 16px', height: '100%', background: 'transparent', border: 'none', fontSize: '12px',
            color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        {tab === 'Overview' && profile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Market Cap', value: fmtCap(profile.marketCapitalization) },
              { label: 'Industry', value: profile.finnhubIndustry || '—' },
              { label: 'Exchange', value: profile.exchange || '—' },
              { label: 'Country', value: profile.country || '—' },
              { label: 'IPO Date', value: profile.ipo || '—' },
              { label: 'Currency', value: profile.currency || '—' },
              { label: 'Shares Out', value: profile.shareOutstanding ? `${(profile.shareOutstanding / 1000).toFixed(2)}B` : '—' },
              { label: 'Previous Close', value: fmt(quote?.pc) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '2px' }}>{label}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{value}</div>
              </div>
            ))}
            {profile.weburl && (
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '2px' }}>Website</div>
                <a href={profile.weburl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '12px' }}>
                  {profile.weburl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
          </div>
        )}
        {tab === 'Financials' && <div style={{ color: 'var(--text-secondary)', fontSize: '12px', paddingTop: '20px', textAlign: 'center' }}>Financial data coming soon</div>}
      </div>
    </div>
  );
}
