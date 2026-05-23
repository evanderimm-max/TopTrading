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
    setQuery(val); setOpen(true);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(val), 300);
  }
  function handleSelect(r: SearchResult) {
    setActiveSymbol(r.symbol, r.description);
    addToWatchlist({ symbol: r.symbol, name: r.description });
    setQuery(''); setOpen(false); clear();
  }
  useEffect(() => {
    function onClickOutside(e: MouseEvent) { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '220px' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--bg-input)', backdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-xs)', padding: '0 8px', border: '1px solid var(--border-glass)', height: '28px',
        transition: 'border-color 0.15s',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input value={query} onChange={handleChange} onFocus={() => query && setOpen(true)} placeholder="Search symbol..."
          style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '0 6px', width: '100%', fontSize: '12px' }} />
        {loading && <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>...</span>}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)',
          zIndex: 100, overflow: 'hidden', boxShadow: 'var(--shadow-dropdown)',
        }}>
          {results.map(r => (
            <div key={r.symbol} onClick={() => handleSelect(r)}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '12px' }}>{r.displaySymbol}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginLeft: '8px' }}>{r.description.slice(0, 28)}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', background: 'var(--bg-input)', padding: '1px 5px', borderRadius: '3px' }}>{r.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
