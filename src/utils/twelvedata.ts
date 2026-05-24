import type { Candle, Timeframe } from '../types';

const API_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY as string;
const BASE = 'https://api.twelvedata.com';

function mapTimeframe(tf: Timeframe): { interval: string; outputsize: number } {
  switch (tf) {
    case '15m': return { interval: '1min',   outputsize: 15 };
    case '30m': return { interval: '1min',   outputsize: 30 };
    case '1h':  return { interval: '5min',   outputsize: 12 };
    case '1D':  return { interval: '5min',   outputsize: 390 };
    case '1W':  return { interval: '15min',  outputsize: 500 };
    case '1M':  return { interval: '1day',   outputsize: 60 };
    case '3M':  return { interval: '1day',   outputsize: 180 };
    case '1Y':  return { interval: '1day',   outputsize: 365 };
    case '5Y':  return { interval: '1week',  outputsize: 260 };
  }
}

export async function getTwelveDataCandles(symbol: string, timeframe: Timeframe, endDate?: string): Promise<Candle[]> {
  const { interval, outputsize } = mapTimeframe(timeframe);
  let url = `${BASE}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`;
  if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status}`);

  const data = await res.json();
  if (data.status === 'error') throw new Error(data.message || 'API error');
  if (!data.values?.length) throw new Error('No data returned');

  return data.values
    .map((v: { datetime: string; open: string; high: string; low: string; close: string; volume: string }) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume) || 0,
    }))
    .filter((c: Candle) => !isNaN(c.open) && !isNaN(c.close))
    .reverse();
}
