import { useNews } from '../../hooks/useNews';

interface Props { symbol: string }
function timeAgo(unix: number) {
  const diff = Math.floor((Date.now() / 1000) - unix);
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NewsPanel({ symbol }: Props) {
  const { news, loading } = useNews(symbol);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>Loading...</div>}
        {!loading && news.length === 0 && <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>No recent news</div>}
        {news.map(item => (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ padding: '10px 12px', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1.4, marginBottom: '4px' }}>{item.headline}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{item.source}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{timeAgo(item.datetime)} ago</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
