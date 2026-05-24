import { useRef } from 'react';
import { useAppStore } from '../../store';

const TOOLS = [
  { id: 'cursor',    icon: <path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/>,  label: 'Cursor' },
  { id: 'crosshair', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></>, label: 'Crosshair' },
  null, // separator
  { id: 'trendline', icon: <><path d="M4 20L20 4"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="4" r="1.5" fill="currentColor"/></>, label: 'Trend Line' },
  { id: 'hline',     icon: <path d="M4 12h16" strokeDasharray="4 2"/>, label: 'Horiz. Line' },
  { id: 'channel',   icon: <path d="M4 18L16 6M8 22L20 10"/>, label: 'Channel' },
  null,
  { id: 'fib',  icon: <path d="M4 4h16M4 9h16M4 15h16M4 20h16" strokeDasharray="2 3"/>, label: 'Fibonacci' },
  { id: 'rect', icon: <rect x="4" y="6" width="16" height="12" rx="1"/>, label: 'Rectangle' },
  null,
  { id: 'text',    icon: <path d="M5 5h14M12 5v14M9 19h6"/>, label: 'Text' },
  { id: 'measure', icon: <><path d="M2 12h20M12 2v20"/><path d="M7 7l10 10M17 7L7 17" opacity="0.6"/></>, label: 'Measure Move' },
  null,
  { id: 'zoom',   icon: <><circle cx="10" cy="10" r="7"/><path d="M15 15l5 5"/><path d="M7 10h6M10 7v6"/></>, label: 'Zoom' },
  { id: 'magnet', icon: <path d="M6 2v6a6 6 0 1012 0V2M6 2h4v6a2 2 0 104 0V2h4"/>, label: 'Magnet' },
];

const MULTIPLIERS = [2, 3, 4, 5];

export default function LeftToolbar() {
  const activeTool = useAppStore(s => s.activeTool);
  const setActiveTool = useAppStore(s => s.setActiveTool);
  const measureMultiplier = useAppStore(s => s.measureMultiplier);
  const setMeasureMultiplier = useAppStore(s => s.setMeasureMultiplier);
  const tooltipRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{
      width: '48px', flexShrink: 0,
      background: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-glass)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '8px 0', gap: '3px',
      overflowY: 'auto', position: 'relative',
    }}>
      {TOOLS.map((tool, idx) => {
        if (tool === null) return (
          <div key={`sep-${idx}`} style={{
            width: '28px', height: '1px',
            background: 'var(--border-glass)',
            margin: '4px 0',
          }} />
        );

        const isActive = activeTool === tool.id;

        return (
          <div key={tool.id} style={{ position: 'relative' }}>
            <button
              title={tool.label}
              onClick={() => setActiveTool(isActive ? 'crosshair' : tool.id)}
              style={{
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)', border: 'none',
                background: isActive ? 'var(--accent)' : 'var(--bg-primary)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                boxShadow: isActive ? 'var(--accent-glow)' : 'var(--neu-out-sm)',
                transition: 'all 0.2s ease',
                cursor: 'pointer', flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--neu-out)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--neu-out-sm)';
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {tool.icon}
              </svg>
            </button>

            {/* Measure multiplier picker */}
            {tool.id === 'measure' && isActive && (
              <div style={{
                position: 'absolute', left: '44px', top: '50%', transform: 'translateY(-50%)',
                zIndex: 200,
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-dropdown)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                padding: '6px 5px',
                display: 'flex', flexDirection: 'column', gap: '3px',
                minWidth: '52px',
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '9px', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Move</div>
                {MULTIPLIERS.map(m => (
                  <button key={m} onClick={() => setMeasureMultiplier(m)} style={{
                    padding: '5px 0', borderRadius: '6px', border: 'none',
                    fontSize: '11px', fontWeight: 700,
                    background: measureMultiplier === m ? 'var(--accent)' : 'var(--bg-primary)',
                    color: measureMultiplier === m ? '#fff' : 'var(--text-secondary)',
                    boxShadow: measureMultiplier === m ? 'var(--accent-glow)' : 'var(--neu-flat)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>{m}x</button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Invisible tooltip anchor */}
      <div ref={tooltipRef} style={{ position: 'absolute', pointerEvents: 'none' }} />
    </div>
  );
}
