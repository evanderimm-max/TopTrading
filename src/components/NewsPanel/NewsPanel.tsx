import { useNews } from '../../hooks/useNews';

interface Props { symbol: string }

function timeAgo(unix: number) {
  const diff = Math.floor((Date.now() / 1000) - unix);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsPanel({ symbol }: Props) {
  const { news, loading } = useNews(symbol);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#131722' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2130' }}>
        <span style={{ color: '#8892b0', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          News — {symbol}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '20px', color: '#6b7db3', fontSize: '12px', textAlign: 'center' }}>Loading news...</div>
        )}
        {!loading && news.length === 0 && (
          <div style={{ padding: '20px', color: '#4a5568', fontSize: '12px', textAlign: 'center' }}>No recent news</div>
        )}
        {news.map(item => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', textDecoration: 'none', borderBottom: '1px solid #1a1e2e' }}
          >
            <div
              style={{ padding: '12px 14px', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#161b27')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div style={{ color: '#c9d1d9', fontSize: '12px', fontWeight: 500, lineHeight: 1.4, marginBottom: '4px' }}>
                {item.headline}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#4a5568', fontSize: '10px' }}>{item.source}</span>
                <span style={{ color: '#4a5568', fontSize: '10px' }}>{timeAgo(item.datetime)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
