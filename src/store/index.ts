import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistItem, Timeframe } from '../types';

interface AppState {
  activeSymbol: string;
  timeframe: Timeframe;
  watchlist: WatchlistItem[];
  setActiveSymbol: (symbol: string, name?: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeSymbol: 'AAPL',
      timeframe: '1M',
      watchlist: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corp.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.' },
      ],
      setActiveSymbol: (symbol, name) => {
        set({ activeSymbol: symbol });
        if (name && !get().watchlist.find(w => w.symbol === symbol)) {
          // optionally auto-add — we do NOT auto-add here
        }
      },
      setTimeframe: (timeframe) => set({ timeframe }),
      addToWatchlist: (item) => {
        if (!get().watchlist.find(w => w.symbol === item.symbol)) {
          set(s => ({ watchlist: [...s.watchlist, item] }));
        }
      },
      removeFromWatchlist: (symbol) =>
        set(s => ({ watchlist: s.watchlist.filter(w => w.symbol !== symbol) })),
    }),
    { name: 'toptrading-store' }
  )
);
