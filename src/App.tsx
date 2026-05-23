import { useAppStore } from './store';
import SearchBar from './components/SearchBar/SearchBar';
import QuoteBar from './components/QuoteBar/QuoteBar';
import Chart from './components/Chart/Chart';
import Sidebar from './components/Sidebar/Sidebar';

export default function App() {
  const activeSymbol = useAppStore(s => s.activeSymbol);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Top navbar */}
      <header style={{
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px',
        background: '#131722', borderBottom: '1px solid #1e2130', height: '50px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 7 22 7 22 13" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em' }}>
            Top<span style={{ color: '#3b82f6' }}>Trading</span>
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <SearchBar />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#1e2130', color: '#22c55e', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', border: '1px solid #22c55e33' }}>
            LIVE
          </span>
          <span style={{ color: '#4a5568', fontSize: '11px' }}>Powered by Finnhub</span>
        </div>
      </header>

      {/* Quote bar */}
      <QuoteBar symbol={activeSymbol} />

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chart area */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <Chart symbol={activeSymbol} />
        </div>

        {/* Sidebar */}
        <div style={{ width: '260px', flexShrink: 0, overflow: 'hidden' }}>
          <Sidebar symbol={activeSymbol} />
        </div>
      </div>
    </div>
  );
}
