import type { Candle, Timeframe } from '../types';

function mapTimeframe(tf: Timeframe): { interval: string; range: string } {
  switch (tf) {
    case '1D': return { interval: '5m',  range: '1d' };
    case '1W': return { interval: '30m', range: '5d' };
    case '1M': return { interval: '1d',  range: '1mo' };
    case '3M': return { interval: '1d',  range: '3mo' };
    case '1Y': return { interval: '1wk', range: '1y' };
    case '5Y': return { interval: '1mo', range: '5y' };
  }
}

export async function getYahooCandles(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
  const { interval, range } = mapTimeframe(timeframe);
  const url = `/yahoo-finance/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error('No data returned');

  const timestamps: number[] = result.timestamp ?? [];
  const { open, high, low, close, volume } = result.indicators.quote[0];

  return timestamps
    .map((t, i) => ({
      time: t,
      open: open[i],
      high: high[i],
      low: low[i],
      close: close[i],
      volume: volume[i] ?? 0,
    }))
    .filter(c => c.open != null && c.high != null && c.low != null && c.close != null);
}
