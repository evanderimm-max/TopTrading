import { useState, useEffect, useCallback, useRef } from 'react';
import { getTwelveDataCandles } from '../utils/twelvedata';
import type { Candle, Timeframe } from '../types';

function toEndDate(ts: number): string {
  return new Date(ts * 1000).toISOString().replace('T', ' ').substring(0, 19);
}

export function useCandles(symbol: string, timeframe: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const prependedCountRef = useRef(0);
  const earliestTimeRef = useRef<number | null>(null);
  const noMoreRef = useRef(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    setCandles([]);
    prependedCountRef.current = 0;
    earliestTimeRef.current = null;
    noMoreRef.current = false;

    getTwelveDataCandles(symbol, timeframe)
      .then(data => {
        setCandles(data);
        if (data.length > 0) earliestTimeRef.current = data[0].time;
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [symbol, timeframe]);

  // Keep earliestTimeRef in sync with candles[0]
  useEffect(() => {
    if (candles.length > 0) earliestTimeRef.current = candles[0].time;
  }, [candles]);

  const loadMoreHistory = useCallback(async () => {
    if (loadingMore || noMoreRef.current || earliestTimeRef.current === null) return;
    const endDate = toEndDate(earliestTimeRef.current - 1);
    setLoadingMore(true);
    try {
      const older = await getTwelveDataCandles(symbol, timeframe, endDate);
      if (older.length === 0) {
        noMoreRef.current = true;
      } else {
        setCandles(prev => {
          if (prev.length === 0) return older;
          const earliestTs = prev[0].time;
          const uniqueOlder = older.filter(c => c.time < earliestTs);
          if (uniqueOlder.length === 0) {
            noMoreRef.current = true;
            return prev;
          }
          prependedCountRef.current = uniqueOlder.length;
          return [...uniqueOlder, ...prev];
        });
      }
    } catch {
      // silently ignore – just don't load more
    }
    setLoadingMore(false);
  }, [symbol, timeframe, loadingMore]);

  return { candles, loading, error, loadingMore, loadMoreHistory, prependedCountRef };
}
