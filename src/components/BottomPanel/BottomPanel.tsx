import { useState } from 'react';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { useQuote } from '../../hooks/useQuote';

interface Props { symbol: string }

const TABS = ['Overview', 'Financials'] as const;
type Tab = typeof TABS[number];

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCap(n: number) {
  if (!n) return '—';
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}T`;
  return `$${n.toFixed(2)}B`;
}

export default function BottomPanel({ symbol }: Props) {
  const [tab, setTab] = useState<Tab>('Overview');
  const { profile } = useCompanyProfile(symbol);
  const { quote } = useQuote(symbol);

  return (
    <div style={{
      height: '200px', background: '#1e222d', borderTop: '1px solid #2a2e39',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2e39', height: '30px', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0 16px', height: '100%', background: 'transparent', border: 'none',
              fontSize: '12px', color: tab === t ? '#d1d4dc' : '#787b86',
              borderBottom: tab === t ? '2px solid #2962ff' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
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
                <div style={{ color: '#787b86', fontSize: '11px', marginBottom: '2px' }}>{label}</div>
                <div style={{ color: '#d1d4dc', fontSize: '12px' }}>{value}</div>
              </div>
            ))}
            {profile.weburl && (
              <div>
                <div style={{ color: '#787b86', fontSize: '11px', marginBottom: '2px' }}>Website</div>
                <a href={profile.weburl} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#2962ff', fontSize: '12px' }}>
                  {profile.weburl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
          </div>
        )}
        {tab === 'Financials' && (
          <div style={{ color: '#787b86', fontSize: '12px', paddingTop: '20px', textAlign: 'center' }}>
            Financial data coming soon
          </div>
        )}
      </div>
    </div>
  );
}
