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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '280px' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#1e2130', borderRadius: '6px', padding: '0 10px', border: '1px solid #2d3350' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7db3" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          placeholder="Search symbols..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: '#d1d5db', padding: '8px 8px', width: '100%', fontSize: '13px'
          }}
        />
        {loading && <span style={{ color: '#6b7db3', fontSize: '11px' }}>...</span>}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#1a1e2e', border: '1px solid #2d3350', borderRadius: '6px',
          zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          {results.map(r => (
            <div
              key={r.symbol}
              onClick={() => handleSelect(r)}
              style={{
                padding: '9px 14px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #1e2130', transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1e2130')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px' }}>{r.displaySymbol}</span>
                <span style={{ color: '#6b7db3', fontSize: '11px', marginLeft: '8px' }}>{r.description.slice(0, 30)}</span>
              </div>
              <span style={{ color: '#4a5568', fontSize: '10px', background: '#2d3350', padding: '2px 6px', borderRadius: '3px' }}>{r.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
