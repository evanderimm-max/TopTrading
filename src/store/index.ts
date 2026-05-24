import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistItem, Timeframe, IndicatorConfig, Theme } from '../types';

interface AppState {
  activeSymbol: string;
  timeframe: Timeframe;
  theme: Theme;
  watchlist: WatchlistItem[];
  indicators: IndicatorConfig[];
  activeTool: string;
  measureMultiplier: number;
  setActiveSymbol: (symbol: string, name?: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  toggleTheme: () => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  addIndicator: (indicator: IndicatorConfig) => void;
  removeIndicator: (id: string) => void;
  setActiveTool: (tool: string) => void;
  setMeasureMultiplier: (mult: number) => void;
}

const INDICATOR_COLORS = ['#2962ff', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
let nextColorIdx = 0;
export function getNextColor() { return INDICATOR_COLORS[nextColorIdx++ % INDICATOR_COLORS.length]; }

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeSymbol: 'AAPL',
      timeframe: '1M',
      theme: 'dark',
      watchlist: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corp.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.' },
      ],
      indicators: [],
      activeTool: 'crosshair',
      measureMultiplier: 2,
      setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
      setTimeframe: (timeframe) => set({ timeframe }),
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      addToWatchlist: (item) => {
        if (!get().watchlist.find(w => w.symbol === item.symbol)) {
          set(s => ({ watchlist: [...s.watchlist, item] }));
        }
      },
      removeFromWatchlist: (symbol) =>
        set(s => ({ watchlist: s.watchlist.filter(w => w.symbol !== symbol) })),
      addIndicator: (indicator) =>
        set(s => ({ indicators: [...s.indicators, indicator] })),
      removeIndicator: (id) =>
        set(s => ({ indicators: s.indicators.filter(i => i.id !== id) })),
      setActiveTool: (activeTool) => set({ activeTool }),
      setMeasureMultiplier: (measureMultiplier) => set({ measureMultiplier }),
    }),
    { name: 'toptrading-store' }
  )
);
