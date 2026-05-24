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
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '220px' }}>
      {/* Input — neumorphic inset */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-xs)',
        padding: '0 10px',
        height: '30px',
        boxShadow: 'var(--neu-in)',
        border: '1px solid var(--border-glass)',
        transition: 'box-shadow 0.2s',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          placeholder="Search symbol…"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', width: '100%', fontSize: '12px',
          }}
        />
        {loading && <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>···</span>}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-dropdown)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)',
          zIndex: 100, overflow: 'hidden',
        }}>
          {results.map((r, i) => (
            <div key={r.symbol} onClick={() => handleSelect(r)}
              style={{
                padding: '9px 12px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '12px' }}>{r.displaySymbol}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginLeft: '8px' }}>{r.description.slice(0, 26)}</span>
              </div>
              <span style={{
                color: 'var(--text-muted)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em',
                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
              }}>{r.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
