import type { Candle, IndicatorConfig } from '../types';
import type { Time } from 'lightweight-charts';

export interface LinePoint { time: Time; value: number }
export interface MACDPoint { time: Time; macd: number; signal: number; histogram: number }

export interface IndicatorResult {
  id: string;
  type: string;
  overlay: boolean;
  lines: { data: LinePoint[]; color: string; label: string }[];
  histogram?: { data: { time: Time; value: number; color: string }[] };
}

function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (prev === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      prev = sum / period;
    } else {
      prev = data[i] * k + prev * (1 - k);
    }
    result.push(prev);
  }
  return result;
}

function calcRSI(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length < period + 1) return closes.map(() => null);

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < period; i++) result.push(null);
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

function calcMACD(closes: number[], fast: number, slow: number, signal: number) {
  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);
  const macdLine: (number | null)[] = fastEma.map((f, i) => {
    const s = slowEma[i];
    return f !== null && s !== null ? f - s : null;
  });
  const macdValues = macdLine.filter(v => v !== null) as number[];
  const signalLine = ema(macdValues, signal);

  let si = 0;
  const fullSignal: (number | null)[] = macdLine.map(v => {
    if (v === null) return null;
    return signalLine[si++] ?? null;
  });

  return { macdLine, signalLine: fullSignal };
}

function calcRPS(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) { result.push(null); continue; }
    result.push(((closes[i] / closes[i - period]) - 1) * 100);
  }
  return result;
}

function calcBB(closes: number[], period: number, stdDev: number) {
  const middle = sma(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) { upper.push(null); lower.push(null); continue; }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) sumSq += (closes[j] - middle[i]!) ** 2;
    const sd = Math.sqrt(sumSq / period);
    upper.push(middle[i]! + stdDev * sd);
    lower.push(middle[i]! - stdDev * sd);
  }
  return { upper, middle, lower };
}

const INDICATOR_COLORS = ['#2962ff', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4'];
let colorIdx = 0;
function nextColor() { return INDICATOR_COLORS[colorIdx++ % INDICATOR_COLORS.length]; }

export function computeIndicator(config: IndicatorConfig, candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close);
  const times = candles.map(c => c.time as Time);

  function toLine(values: (number | null)[], color: string, label: string): { data: LinePoint[]; color: string; label: string } {
    const data: LinePoint[] = [];
    values.forEach((v, i) => { if (v !== null) data.push({ time: times[i], value: v }); });
    return { data, color, label };
  }

  switch (config.type) {
    case 'SMA': {
      const period = config.params.period || 20;
      const values = sma(closes, period);
      return { id: config.id, type: 'SMA', overlay: true, lines: [toLine(values, config.color || nextColor(), `SMA ${period}`)] };
    }
    case 'EMA': {
      const period = config.params.period || 20;
      const values = ema(closes, period);
      return { id: config.id, type: 'EMA', overlay: true, lines: [toLine(values, config.color || nextColor(), `EMA ${period}`)] };
    }
    case 'RSI': {
      const period = config.params.period || 14;
      const values = calcRSI(closes, period);
      return { id: config.id, type: 'RSI', overlay: false, lines: [toLine(values, config.color || '#e91e63', `RSI ${period}`)] };
    }
    case 'MACD': {
      const fast = config.params.fast || 12;
      const slow = config.params.slow || 26;
      const signal = config.params.signal || 9;
      const { macdLine, signalLine } = calcMACD(closes, fast, slow, signal);
      const histData: { time: Time; value: number; color: string }[] = [];
      macdLine.forEach((m, i) => {
        const s = signalLine[i];
        if (m !== null && s !== null) {
          const v = m - s;
          histData.push({ time: times[i], value: v, color: v >= 0 ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)' });
        }
      });
      return {
        id: config.id, type: 'MACD', overlay: false,
        lines: [
          toLine(macdLine, '#2962ff', 'MACD'),
          toLine(signalLine, '#ff6d00', 'Signal'),
        ],
        histogram: { data: histData },
      };
    }
    case 'RPS': {
      const period = config.params.period || 12;
      const values = calcRPS(closes, period);
      return { id: config.id, type: 'RPS', overlay: false, lines: [toLine(values, config.color || '#ff9800', `RPS ${period}`)] };
    }
    case 'BB': {
      const period = config.params.period || 20;
      const stdDev = config.params.stdDev || 2;
      const { upper, middle, lower } = calcBB(closes, period, stdDev);
      const col = config.color || '#2962ff';
      return {
        id: config.id, type: 'BB', overlay: true,
        lines: [
          toLine(upper, col, `BB Upper`),
          toLine(middle, col + '80', `BB Mid`),
          toLine(lower, col, `BB Lower`),
        ],
      };
    }
  }
}
