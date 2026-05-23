import { useAppStore } from '../../store';
import WatchlistRow from './WatchlistRow';

export default function Watchlist() {
  const watchlist = useAppStore(s => s.watchlist);
  const activeSymbol = useAppStore(s => s.activeSymbol);
  const setActiveSymbol = useAppStore(s => s.setActiveSymbol);
  const removeFromWatchlist = useAppStore(s => s.removeFromWatchlist);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#131722' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#8892b0', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Watchlist</span>
        <span style={{ color: '#4a5568', fontSize: '11px' }}>{watchlist.length}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {watchlist.length === 0 ? (
          <div style={{ padding: '20px', color: '#4a5568', fontSize: '12px', textAlign: 'center' }}>
            Search for a symbol to add it
          </div>
        ) : (
          watchlist.map(item => (
            <WatchlistRow
              key={item.symbol}
              symbol={item.symbol}
              name={item.name}
              active={item.symbol === activeSymbol}
              onSelect={() => setActiveSymbol(item.symbol, item.name)}
              onRemove={() => removeFromWatchlist(item.symbol)}
            />
          ))
        )}
      </div>
    </div>
  );
}
