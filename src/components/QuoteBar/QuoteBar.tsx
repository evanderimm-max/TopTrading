import { useQuote } from '../../hooks/useQuote';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';

function fmt(n: number | undefined, decimals = 2) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtMarketCap(n: number) {
  if (!n) return '—';
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}T`;
  return `$${n.toFixed(2)}B`;
}

interface Props { symbol: string }

export default function QuoteBar({ symbol }: Props) {
  const { quote, loading } = useQuote(symbol);
  const { profile } = useCompanyProfile(symbol);

  const isPositive = (quote?.dp ?? 0) >= 0;
  const changeColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div style={{
      padding: '12px 20px', background: '#131722', borderBottom: '1px solid #1e2130',
      display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', minHeight: '64px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {profile?.logo && (
          <img src={profile.logo} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'contain', background: '#fff', padding: '2px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '16px', lineHeight: 1.1 }}>{symbol}</div>
          <div style={{ color: '#6b7db3', fontSize: '11px' }}>{profile?.name || '—'}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#6b7db3', fontSize: '13px' }}>Loading...</div>
      ) : (
        <>
          <div>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '22px' }}>{fmt(quote?.c)}</span>
            <span style={{ color: '#6b7db3', fontSize: '12px', marginLeft: '4px' }}>{profile?.currency || 'USD'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ color: changeColor, fontWeight: 600, fontSize: '13px' }}>
              {isPositive ? '+' : ''}{fmt(quote?.d)} ({isPositive ? '+' : ''}{fmt(quote?.dp)}%)
            </span>
            <span style={{ color: '#6b7db3', fontSize: '10px' }}>Today</span>
          </div>

          <div style={{ height: '32px', width: '1px', background: '#1e2130' }} />

          {[
            { label: 'Open', value: fmt(quote?.o) },
            { label: 'High', value: fmt(quote?.h) },
            { label: 'Low', value: fmt(quote?.l) },
            { label: 'Prev Close', value: fmt(quote?.pc) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ color: '#6b7db3', fontSize: '10px' }}>{label}</div>
              <div style={{ color: '#d1d5db', fontSize: '13px', fontWeight: 500 }}>{value}</div>
            </div>
          ))}

          {profile?.marketCapitalization && (
            <div>
              <div style={{ color: '#6b7db3', fontSize: '10px' }}>Mkt Cap</div>
              <div style={{ color: '#d1d5db', fontSize: '13px', fontWeight: 500 }}>{fmtMarketCap(profile.marketCapitalization)}</div>
            </div>
          )}

          {profile?.finnhubIndustry && (
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ background: '#1e2130', border: '1px solid #2d3350', color: '#8892b0', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                {profile.finnhubIndustry}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
