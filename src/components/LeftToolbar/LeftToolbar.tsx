import { useAppStore } from '../../store';

const TOOLS = [
  { id: 'cursor', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/></svg>, label: 'Cursor' },
  { id: 'crosshair', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>, label: 'Crosshair' },
  { id: 'sep1', icon: null, label: '' },
  { id: 'trendline', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 20L20 4"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="4" r="1.5" fill="currentColor"/></svg>, label: 'Trend Line' },
  { id: 'hline', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12h16" strokeDasharray="4 2"/></svg>, label: 'Horizontal Line' },
  { id: 'channel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 18L16 6M8 22L20 10"/></svg>, label: 'Channel' },
  { id: 'sep2', icon: null, label: '' },
  { id: 'fib', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16M4 9h16M4 15h16M4 20h16" strokeDasharray="2 3"/></svg>, label: 'Fibonacci' },
  { id: 'rect', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="6" width="16" height="12" rx="1"/></svg>, label: 'Rectangle' },
  { id: 'sep3', icon: null, label: '' },
  { id: 'text', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 5h14M12 5v14M9 19h6"/></svg>, label: 'Text' },
  { id: 'measure', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h20M12 2v20M7 7l10 10M17 7L7 17"/></svg>, label: 'Measure Move' },
  { id: 'sep4', icon: null, label: '' },
  { id: 'zoom', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="7"/><path d="M15 15l5 5"/><path d="M7 10h6M10 7v6"/></svg>, label: 'Zoom' },
  { id: 'magnet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2v6a6 6 0 1012 0V2M6 2h4v6a2 2 0 104 0V2h4"/></svg>, label: 'Magnet' },
];

const MULTIPLIERS = [2, 3, 4, 5];

export default function LeftToolbar() {
  const activeTool = useAppStore(s => s.activeTool);
  const setActiveTool = useAppStore(s => s.setActiveTool);
  const measureMultiplier = useAppStore(s => s.measureMultiplier);
  const setMeasureMultiplier = useAppStore(s => s.setMeasureMultiplier);

  return (
    <div style={{
      width: '46px', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
      borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '6px 0', gap: '2px', overflowY: 'auto', flexShrink: 0,
    }}>
      {TOOLS.map(tool => {
        if (tool.icon === null) return <div key={tool.id} style={{ width: '26px', height: '1px', background: 'var(--border-glass)', margin: '4px 0' }} />;
        const isActive = activeTool === tool.id;
        return (
          <div key={tool.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              title={tool.label}
              onClick={() => setActiveTool(isActive ? 'crosshair' : tool.id)}
              style={{
                width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)', border: '1px solid transparent', transition: 'all 0.15s',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >{tool.icon}</button>

            {/* Multiplier sub-panel for measure tool */}
            {tool.id === 'measure' && isActive && (
              <div style={{
                position: 'absolute', left: '44px', top: 0, zIndex: 200,
                background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)',
                padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: 'var(--shadow-dropdown)',
                minWidth: '48px',
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '9px', textAlign: 'center', padding: '2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Move</div>
                {MULTIPLIERS.map(m => (
                  <button key={m} onClick={() => setMeasureMultiplier(m)} style={{
                    padding: '4px 8px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: 600,
                    background: measureMultiplier === m ? 'var(--accent)' : 'transparent',
                    color: measureMultiplier === m ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}>{m}x</button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
