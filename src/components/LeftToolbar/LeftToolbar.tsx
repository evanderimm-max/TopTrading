import { useState } from 'react';

const TOOLS = [
  {
    id: 'cursor',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/>
      </svg>
    ),
  },
  {
    id: 'crosshair',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>
      </svg>
    ),
  },
  { id: 'sep1', icon: null },
  {
    id: 'trendline',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 20L20 4"/>
      </svg>
    ),
  },
  {
    id: 'hline',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 12h16" strokeDasharray="4 2"/>
      </svg>
    ),
  },
  {
    id: 'channel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 18L16 6M8 22L20 10"/>
      </svg>
    ),
  },
  { id: 'sep2', icon: null },
  {
    id: 'fib',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16M4 9h16M4 15h16M4 20h16" strokeDasharray="2 3"/>
      </svg>
    ),
  },
  {
    id: 'rect',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="6" width="16" height="12" rx="0.5"/>
      </svg>
    ),
  },
  { id: 'sep3', icon: null },
  {
    id: 'text',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 5h14M12 5v14M9 19h6"/>
      </svg>
    ),
  },
  {
    id: 'measure',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 20L20 4M4 20v-6M4 20h6"/>
      </svg>
    ),
  },
  { id: 'sep4', icon: null },
  {
    id: 'zoom',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="7"/><path d="M15 15l5 5"/><path d="M7 10h6M10 7v6"/>
      </svg>
    ),
  },
  {
    id: 'magnet',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2v6a6 6 0 1012 0V2M6 2h4v6a2 2 0 104 0V2h4"/>
      </svg>
    ),
  },
];

export default function LeftToolbar() {
  const [activeTool, setActiveTool] = useState('crosshair');

  return (
    <div style={{
      width: '44px', background: '#1e222d', borderRight: '1px solid #2a2e39',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '4px 0', gap: '1px', overflowY: 'auto', flexShrink: 0,
    }}>
      {TOOLS.map(tool => {
        if (tool.icon === null) {
          return <div key={tool.id} style={{ width: '24px', height: '1px', background: '#2a2e39', margin: '4px 0' }} />;
        }
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              width: '34px', height: '34px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: '4px', border: 'none',
              background: isActive ? '#2962ff' : 'transparent',
              color: isActive ? '#fff' : '#787b86',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#2a2e39'; e.currentTarget.style.color = '#d1d4dc'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#787b86'; } }}
          >
            {tool.icon}
          </button>
        );
      })}
    </div>
  );
}
