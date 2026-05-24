import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from './store';
import TopToolbar from './components/TopToolbar/TopToolbar';
import LeftToolbar from './components/LeftToolbar/LeftToolbar';
import Chart from './components/Chart/Chart';
import RightPanel from './components/RightPanel/RightPanel';
import BottomPanel from './components/BottomPanel/BottomPanel';

export default function App() {
  const activeSymbol = useAppStore(s => s.activeSymbol);
  const theme = useAppStore(s => s.theme);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    audioRef.current = new Audio('/click.mp3');
    audioRef.current.volume = 0.4;
  }, []);

  const playClick = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {/* ignore autoplay policy */});
  }, []);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}
      onMouseDown={playClick}
    >
      <TopToolbar
        symbol={activeSymbol}
        onToggleRightPanel={() => setRightPanelOpen(p => !p)}
        onToggleBottomPanel={() => setBottomPanelOpen(p => !p)}
        rightPanelOpen={rightPanelOpen}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftToolbar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', boxShadow: 'var(--neu-in)', margin: '0', borderRadius: '0' }}>
            <Chart symbol={activeSymbol} />
          </div>
          {bottomPanelOpen && <BottomPanel symbol={activeSymbol} />}
        </div>
        {rightPanelOpen && <RightPanel symbol={activeSymbol} onClose={() => setRightPanelOpen(false)} />}
      </div>
    </div>
  );
}
