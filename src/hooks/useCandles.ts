import { useState, useEffect } from 'react';
import { getCandles } from '../utils/finnhub';
import type { Candle, Timeframe } from '../types';

function getResolutionAndRange(tf: Timeframe): { resolution: string; from: number } {
  const now = Math.floor(Date.now() / 1000);
  const DAY = 86400;
  switch (tf) {
    case '1D': return { resolution: '5',   from: now - DAY };
    case '1W': return { resolution: '30',  from: now - 7 * DAY };
    case '1M': return { resolution: 'D',   from: now - 30 * DAY };
    case '3M': return { resolution: 'D',   from: now - 90 * DAY };
    case '1Y': return { resolution: 'W',   from: now - 365 * DAY };
    case '5Y': return { resolution: 'M',   from: now - 5 * 365 * DAY };
  }
}

export function useCandles(symbol: string, timeframe: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    setCandles([]);

    const { resolution, from } = getResolutionAndRange(timeframe);
    const to = Math.floor(Date.now() / 1000);

    getCandles(symbol, resolution, from, to)
      .then(data => {
        if (data.s !== 'ok' || !data.t) {
          setCandles([]);
          setLoading(false);
          return;
        }
        const result: Candle[] = data.t.map((t, i) => ({
          time: t,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i],
        }));
        setCandles(result);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [symbol, timeframe]);

  return { candles, loading, error };
}
