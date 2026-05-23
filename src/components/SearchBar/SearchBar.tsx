import { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { useAppStore } from '../../store';
import type { SearchResult } from '../../types';

let debounceTimer: ReturnType<typeof setTimeout>;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, loading, search, clear } = useSearch();
  const setActiveSymbol = useAppStore(s => s.setActiveSymbol);
  const addToWatchlist = useAppStore(s => s.addToWatchlist);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(val), 300);
  }

  function handleSelect(r: SearchResult) {
    setActiveSymbol(r.symbol, r.description);
    addToWatchlist({ symbol: r.symbol, name: r.description });
    setQuery('');
    setOpen(false);
    clear();
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '220px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', background: '#131722',
        borderRadius: '4px', padding: '0 8px', border: '1px solid #2a2e39', height: '26px',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#787b86" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          placeholder="Search symbol..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: '#d1d4dc', padding: '0 6px', width: '100%', fontSize: '12px',
          }}
        />
        {loading && <span style={{ color: '#787b86', fontSize: '10px' }}>...</span>}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
          background: '#1e222d', border: '1px solid #2a2e39', borderRadius: '4px',
          zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          {results.map(r => (
            <div
              key={r.symbol}
              onClick={() => handleSelect(r)}
              style={{
                padding: '7px 12px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #2a2e39',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a2e39')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <span style={{ color: '#d1d4dc', fontWeight: 600, fontSize: '12px' }}>{r.displaySymbol}</span>
                <span style={{ color: '#787b86', fontSize: '11px', marginLeft: '8px' }}>{r.description.slice(0, 28)}</span>
              </div>
              <span style={{ color: '#787b86', fontSize: '10px', background: '#131722', padding: '1px 4px', borderRadius: '2px' }}>{r.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
