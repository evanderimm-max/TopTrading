import { useAppStore } from '../../store';
import WatchlistRow from './WatchlistRow';

export default function Watchlist() {
  const watchlist = useAppStore(s => s.watchlist);
  const activeSymbol = useAppStore(s => s.activeSymbol);
  const setActiveSymbol = useAppStore(s => s.setActiveSymbol);
  const removeFromWatchlist = useAppStore(s => s.removeFromWatchlist);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', padding: '7px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span style={{ flex: 1 }}>Symbol</span>
        <span style={{ width: '70px', textAlign: 'right' }}>Last</span>
        <span style={{ width: '60px', textAlign: 'right' }}>Chg%</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {watchlist.length === 0
          ? <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>Search to add symbols</div>
          : watchlist.map(item => (
              <WatchlistRow key={item.symbol} symbol={item.symbol} name={item.name} active={item.symbol === activeSymbol}
                onSelect={() => setActiveSymbol(item.symbol, item.name)} onRemove={() => removeFromWatchlist(item.symbol)} />
            ))
        }
      </div>
    </div>
  );
}
