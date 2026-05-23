import { useState, useEffect } from 'react';
import { getStooqCandles } from '../utils/stooq';
import type { Candle, Timeframe } from '../types';

export function useCandles(symbol: string, timeframe: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    setCandles([]);

    getStooqCandles(symbol, timeframe)
      .then(data => {
        setCandles(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [symbol, timeframe]);

  return { candles, loading, error };
}
