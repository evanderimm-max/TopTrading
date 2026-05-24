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

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load audio via Web Audio API so we can apply 4x gain boost
  useEffect(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    fetch('/click.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => { audioBufferRef.current = decoded; })
      .catch(() => {});
    return () => { ctx.close(); };
  }, []);

  const playClick = useCallback(() => {
    const ctx = audioCtxRef.current;
    const buf = audioBufferRef.current;
    if (!ctx || !buf) return;
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = 4; // 400% volume boost
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }, []);

  // Global listener — catches every mousedown including sidebar / links
  useEffect(() => {
    document.addEventListener('mousedown', playClick);
    return () => document.removeEventListener('mousedown', playClick);
  }, [playClick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <TopToolbar
        symbol={activeSymbol}
        onToggleRightPanel={() => setRightPanelOpen(p => !p)}
        onToggleBottomPanel={() => setBottomPanelOpen(p => !p)}
        rightPanelOpen={rightPanelOpen}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftToolbar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', boxShadow: 'var(--neu-in)' }}>
            <Chart symbol={activeSymbol} />
          </div>
          {bottomPanelOpen && <BottomPanel symbol={activeSymbol} />}
        </div>
        {rightPanelOpen && <RightPanel symbol={activeSymbol} onClose={() => setRightPanelOpen(false)} />}
      </div>
    </div>
  );
}
