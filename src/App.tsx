import { useState } from 'react';
import { useAppStore } from './store';
import TopToolbar from './components/TopToolbar/TopToolbar';
import LeftToolbar from './components/LeftToolbar/LeftToolbar';
import Chart from './components/Chart/Chart';
import RightPanel from './components/RightPanel/RightPanel';
import BottomPanel from './components/BottomPanel/BottomPanel';

export default function App() {
  const activeSymbol = useAppStore(s => s.activeSymbol);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#131722', overflow: 'hidden' }}>
      {/* Top toolbar */}
      <TopToolbar
        symbol={activeSymbol}
        onToggleRightPanel={() => setRightPanelOpen(p => !p)}
        onToggleBottomPanel={() => setBottomPanelOpen(p => !p)}
        rightPanelOpen={rightPanelOpen}
      />

      {/* Main area: left toolbar + chart + right panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftToolbar />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <Chart symbol={activeSymbol} />
          </div>

          {bottomPanelOpen && <BottomPanel symbol={activeSymbol} />}
        </div>

        {rightPanelOpen && (
          <RightPanel symbol={activeSymbol} onClose={() => setRightPanelOpen(false)} />
        )}
      </div>
    </div>
  );
}
