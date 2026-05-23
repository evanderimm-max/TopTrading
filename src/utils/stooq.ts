import type { Candle, Timeframe } from '../types';

function fmt(d: Date) {
  return d.toISOString().split('T')[0].replace(/-/g, '');
}

function getRange(tf: Timeframe): { from: Date; interval: string } {
  const from = new Date();
  switch (tf) {
    case '1D': from.setDate(from.getDate() - 14);   return { from, interval: 'd' };
    case '1W': from.setDate(from.getDate() - 42);   return { from, interval: 'd' };
    case '1M': from.setDate(from.getDate() - 45);   return { from, interval: 'd' };
    case '3M': from.setDate(from.getDate() - 100);  return { from, interval: 'd' };
    case '1Y': from.setDate(from.getDate() - 380);  return { from, interval: 'd' };
    case '5Y': from.setFullYear(from.getFullYear() - 5); return { from, interval: 'w' };
  }
}

function parseCSV(text: string): Candle[] {
  const lines = text.trim().split('\n');
  const candles: Candle[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;
    const [date, open, high, low, close, volume] = parts;
    const o = parseFloat(open), h = parseFloat(high), l = parseFloat(low), c = parseFloat(close);
    if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) continue;
    const time = Math.floor(new Date(date).getTime() / 1000);
    candles.push({ time, open: o, high: h, low: l, close: c, volume: parseFloat(volume) || 0 });
  }
  return candles.sort((a, b) => a.time - b.time);
}

async function fetchStooq(s: string, from: Date, to: Date, interval: string): Promise<Candle[]> {
  const url = `/stooq/q/d/l/?s=${s}&d1=${fmt(from)}&d2=${fmt(to)}&i=${interval}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Stooq HTTP ${res.status}`);
  const text = await res.text();
  // Stooq returns HTML error pages for unknown symbols
  if (text.startsWith('<') || text.toLowerCase().includes('no data')) return [];
  return parseCSV(text);
}

export async function getStooqCandles(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
  const { from, interval } = getRange(timeframe);
  const to = new Date();
  const sym = symbol.toLowerCase();

  // Try with .us suffix first (standard US equities), fall back to bare symbol
  const candidates = [`${sym}.us`, sym];
  for (const s of candidates) {
    const candles = await fetchStooq(s, from, to, interval);
    if (candles.length > 0) return candles;
  }

  throw new Error(`No data found for ${symbol}`);
}
