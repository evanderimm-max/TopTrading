import type { Candle, Timeframe } from '../types';

function fmt(d: Date) {
  return d.toISOString().split('T')[0].replace(/-/g, '');
}

function getRange(tf: Timeframe): { from: Date; interval: string } {
  const from = new Date();
  switch (tf) {
    case '1D': from.setDate(from.getDate() - 7);    return { from, interval: 'd' };
    case '1W': from.setDate(from.getDate() - 35);   return { from, interval: 'd' };
    case '1M': from.setDate(from.getDate() - 30);   return { from, interval: 'd' };
    case '3M': from.setDate(from.getDate() - 90);   return { from, interval: 'd' };
    case '1Y': from.setDate(from.getDate() - 365);  return { from, interval: 'd' };
    case '5Y': from.setFullYear(from.getFullYear() - 5); return { from, interval: 'w' };
  }
}

export async function getStooqCandles(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
  const { from, interval } = getRange(timeframe);
  const to = new Date();
  // Stooq uses lowercase symbol with .us suffix for US stocks
  const s = symbol.toLowerCase() + '.us';
  const url = `/stooq/q/d/l/?s=${s}&d1=${fmt(from)}&d2=${fmt(to)}&i=${interval}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Stooq ${res.status}`);

  const text = await res.text();
  if (text.includes('No data') || text.trim() === '') throw new Error('No data for this symbol');

  const lines = text.trim().split('\n');
  // CSV header: Date,Open,High,Low,Close,Volume
  const candles: Candle[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;
    const [date, open, high, low, close, volume] = parts;
    const time = Math.floor(new Date(date).getTime() / 1000);
    const o = parseFloat(open), h = parseFloat(high), l = parseFloat(low), c = parseFloat(close);
    if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) continue;
    candles.push({ time, open: o, high: h, low: l, close: c, volume: parseFloat(volume) || 0 });
  }

  return candles.sort((a, b) => a.time - b.time);
}
