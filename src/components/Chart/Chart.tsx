import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time, MouseEventParams } from 'lightweight-charts';
import { useCandles } from '../../hooks/useCandles';
import { useAppStore } from '../../store';
import { computeIndicator } from '../../utils/indicators';
import type { IndicatorResult } from '../../utils/indicators';

interface Props { symbol: string }

function fmt(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  return n.toFixed(2);
}
function fmtVol(n: number | undefined) {
  if (!n) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function getThemeColors(theme: string) {
  const dark = theme === 'dark';
  return {
    bg:          dark ? '#131728' : '#ffffff',
    text:        dark ? '#6b7098' : '#8892b0',
    grid:        dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.04)',
    border:      dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    crosshair:   dark ? '#6b7098' : '#9ba3c0',
    crosshairBg: dark ? '#1c2035' : '#f0f2fa',
    upColor:     dark ? '#34d399' : '#059669',
    downColor:   dark ? '#f87171' : '#dc2626',
    volUp:       dark ? 'rgba(52,211,153,0.18)' : 'rgba(5,150,105,0.14)',
    volDown:     dark ? 'rgba(248,113,113,0.18)' : 'rgba(220,38,38,0.14)',
  };
}

// ── Drawing system ──────────────────────────────────────────────
interface Pt { x: number; y: number; }
interface Drawing { id: string; tool: string; pts: Pt[]; }
type Pending = { tool: string; clicks: Pt[]; mx: number; my: number; } | null;

// Tools that finalize on mouseup (drag) vs tools that need N clicks
const DRAG_TOOLS  = new Set(['measure']);
const CLICKS_FOR: Record<string, number> = { hline: 1, trendline: 2, fib: 2, rect: 2, channel: 3 };
const ALL_DRAW_TOOLS = new Set([...DRAG_TOOLS, ...Object.keys(CLICKS_FOR)]);

function extendLine(x1: number, y1: number, x2: number, y2: number) {
  const L = 10000;
  if (Math.abs(x2 - x1) < 0.5) return { x1, y1: -L, x2, y2: L };
  const s = (y2 - y1) / (x2 - x1);
  return { x1: -L, y1: y1 + s * (-L - x1), x2: L, y2: y1 + s * (L - x1) };
}

function toolColor(tool: string, dark: boolean): string {
  switch (tool) {
    case 'trendline': return dark ? '#e2e8ff' : '#0f172a';  // near-black / near-white
    case 'hline':     return '#ef4444';
    case 'channel':   return '#3b82f6';
    case 'fib':       return '#f59e0b';
    case 'rect':      return '#06b6d4';
    default:          return dark ? '#7c6bff' : '#5b54e8';
  }
}

// Renders a SAVED drawing (permanent)
function SavedDrawing({ d, cs, measureMult, dark }: {
  d: Drawing; cs: ISeriesApi<'Candlestick'> | null; measureMult: number; dark: boolean;
}) {
  const { tool, pts } = d;
  const col = toolColor(tool, dark);
  const [p1, p2, p3] = pts;
  if (!p1) return null;

  if (tool === 'trendline') {
    if (!p2) return null;
    const e = extendLine(p1.x, p1.y, p2.x, p2.y);
    return (
      <g>
        <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={col} strokeWidth={1.8} strokeLinecap="round" />
        <circle cx={p1.x} cy={p1.y} r={4} fill={col} />
        <circle cx={p2.x} cy={p2.y} r={4} fill={col} />
      </g>
    );
  }

  if (tool === 'hline') {
    const price = cs?.coordinateToPrice(p1.y) ?? null;
    return (
      <g>
        <line x1={-10000} y1={p1.y} x2={10000} y2={p1.y} stroke={col} strokeWidth={1.5} strokeDasharray="8 4" />
        {price !== null && (
          <text x={8} y={p1.y - 5} fill={col} fontSize={10} fontFamily="monospace"
            paintOrder="stroke" stroke={dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)'} strokeWidth={3}>
            {price.toFixed(2)}
          </text>
        )}
      </g>
    );
  }

  if (tool === 'channel') {
    if (!p2) return null;
    const e1 = extendLine(p1.x, p1.y, p2.x, p2.y);
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    // Third click: parallel through p3 (or default offset if missing)
    const ref = p3 ?? { x: p1.x, y: p1.y - 60 };
    const e2 = extendLine(ref.x, ref.y, ref.x + dx, ref.y + dy);
    return (
      <g>
        <polygon points={`${e1.x1},${e1.y1} ${e1.x2},${e1.y2} ${e2.x2},${e2.y2} ${e2.x1},${e2.y1}`}
          fill={col} fillOpacity={0.06} />
        <line x1={e1.x1} y1={e1.y1} x2={e1.x2} y2={e1.y2} stroke={col} strokeWidth={1.8} />
        <line x1={e2.x1} y1={e2.y1} x2={e2.x2} y2={e2.y2} stroke={col} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.85} />
        <circle cx={p1.x} cy={p1.y} r={4} fill={col} />
        <circle cx={p2.x} cy={p2.y} r={4} fill={col} />
      </g>
    );
  }

  if (tool === 'fib') {
    if (!p2) return null;
    const LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const dy = p2.y - p1.y;
    const pr1 = cs?.coordinateToPrice(p1.y) ?? null;
    const pr2 = cs?.coordinateToPrice(p2.y) ?? null;
    return (
      <g>
        {LEVELS.map(lv => {
          const ly = p1.y + lv * dy;
          const price = pr1 !== null && pr2 !== null ? pr1 + lv * (pr2 - pr1) : null;
          const opacity = lv === 0 || lv === 1 ? 1 : 0.75;
          return (
            <g key={lv}>
              <line x1={-10000} y1={ly} x2={10000} y2={ly} stroke={col} strokeWidth={1} opacity={opacity} />
              <text x={8} y={ly - 4} fill={col} fontSize={9} fontFamily="monospace" opacity={0.9}
                paintOrder="stroke" stroke={dark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'} strokeWidth={2}>
                {(lv * 100).toFixed(1)}%{price !== null ? `  ${price.toFixed(2)}` : ''}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  if (tool === 'rect') {
    if (!p2) return null;
    const bx = Math.min(p1.x, p2.x), by = Math.min(p1.y, p2.y);
    const bw = Math.abs(p2.x - p1.x), bh = Math.abs(p2.y - p1.y);
    return <rect x={bx} y={by} width={bw} height={bh} fill={col} fillOpacity={0.1} stroke={col} strokeWidth={1.5} rx={2} />;
  }

  if (tool === 'measure') {
    if (!p2 || !cs) return null;
    const pr1 = cs.coordinateToPrice(p1.y);
    const pr2 = cs.coordinateToPrice(p2.y);
    if (pr1 === null || pr2 === null) return null;
    const isUp = pr2 > pr1;
    const color = isUp ? '#26a69a' : '#ef5350';
    const fillM = isUp ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)';
    const fillE = isUp ? 'rgba(38,166,154,0.08)' : 'rgba(239,83,80,0.08)';
    const pct = (pr2 - pr1) / pr1 * 100;
    const prT = pr1 + measureMult * (pr2 - pr1);
    const yT = p1.y + measureMult * (p2.y - p1.y);
    const xE = p2.x + (p2.x - p1.x);
    const pctT = (prT - pr1) / pr1 * 100;
    const bx = Math.min(p1.x, p2.x), by = Math.min(p1.y, p2.y);
    const bw = Math.abs(p2.x - p1.x), bh = Math.abs(p2.y - p1.y);
    const ex = Math.min(p2.x, xE), ey = Math.min(p2.y, yT);
    const ew = Math.abs(xE - p2.x), eh = Math.abs(yT - p2.y);
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const emx = (p2.x + xE) / 2, emy = (p2.y + yT) / 2;
    return (
      <g>
        {bw > 0 && bh > 0 && <rect x={bx} y={by} width={bw} height={bh} fill={fillM} stroke={color} strokeWidth={1} rx={2} />}
        {ew > 0 && eh > 0 && <rect x={ex} y={ey} width={ew} height={eh} fill={fillE} stroke={color} strokeWidth={1} strokeDasharray="5 3" rx={2} />}
        {bw > 0 && <line x1={p2.x} y1={Math.min(by, ey)} x2={p2.x} y2={Math.max(by + bh, ey + eh)} stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />}
        {bw > 40 && bh > 16 && <>
          <rect x={mx - 36} y={my - 10} width={72} height={18} rx={3} fill="rgba(0,0,0,0.6)" />
          <text x={mx} y={my + 5} textAnchor="middle" fill={color} fontSize={11} fontWeight="bold" fontFamily="monospace">
            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
          </text>
        </>}
        {ew > 40 && eh > 16 && <>
          <rect x={emx - 46} y={emy - 10} width={92} height={18} rx={3} fill="rgba(0,0,0,0.6)" />
          <text x={emx} y={emy + 5} textAnchor="middle" fill={color} fontSize={11} fontWeight="bold" fontFamily="monospace">
            {measureMult}x {pctT >= 0 ? '+' : ''}{pctT.toFixed(2)}%
          </text>
        </>}
        <text x={p1.x + 4} y={p1.y - 5} fill={color} fontSize={10} fontFamily="monospace"
          paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={3}>{pr1.toFixed(2)}</text>
        <text x={p2.x + 4} y={p2.y - 5} fill={color} fontSize={10} fontFamily="monospace"
          paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={3}>{pr2.toFixed(2)}</text>
        <text x={ex + 4} y={yT - 5} fill={color} fontSize={10} fontFamily="monospace"
          paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={3}>{measureMult}x: {prT.toFixed(2)}</text>
      </g>
    );
  }
  return null;
}

// Renders the in-progress drawing while the user is drawing
function PendingPreview({ p, dark }: { p: Pending; dark: boolean }) {
  if (!p) return null;
  const { tool, clicks, mx, my } = p;
  const col = toolColor(tool, dark);
  const c0 = clicks[0], c1 = clicks[1];

  if (tool === 'measure') {
    // Drag: c0 = mousedown, mx/my = current pos
    if (!c0) return null;
    const isUp = my < c0.y;
    const color = isUp ? '#26a69a' : '#ef5350';
    const fill  = isUp ? 'rgba(38,166,154,0.18)' : 'rgba(239,83,80,0.18)';
    const bx = Math.min(c0.x, mx), by = Math.min(c0.y, my);
    const bw = Math.max(Math.abs(mx - c0.x), 1), bh = Math.max(Math.abs(my - c0.y), 1);
    return <rect x={bx} y={by} width={bw} height={bh} fill={fill} stroke={color} strokeWidth={1.5} rx={2} />;
  }

  if (tool === 'trendline') {
    if (!c0) return null;
    // After 1st click, show dashed preview to cursor
    const e = extendLine(c0.x, c0.y, mx, my);
    return (
      <g>
        <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={col} strokeWidth={1.8} strokeDasharray="8 4" />
        <circle cx={c0.x} cy={c0.y} r={5} fill={col} />
        <circle cx={mx} cy={my} r={4} fill={col} opacity={0.6} />
      </g>
    );
  }

  if (tool === 'hline') {
    if (!c0) return null;
    return <line x1={-10000} y1={c0.y} x2={10000} y2={c0.y} stroke={col} strokeWidth={1.5} strokeDasharray="8 4" />;
  }

  if (tool === 'channel') {
    if (!c0) return null;
    if (!c1) {
      // Phase 1: drawing first line (dashed preview)
      const e = extendLine(c0.x, c0.y, mx, my);
      return (
        <g>
          <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={col} strokeWidth={1.8} strokeDasharray="8 4" />
          <circle cx={c0.x} cy={c0.y} r={5} fill={col} />
        </g>
      );
    }
    // Phase 2: first line is solid, second (parallel through cursor) dashed
    const e1 = extendLine(c0.x, c0.y, c1.x, c1.y);
    const dx = c1.x - c0.x, dy = c1.y - c0.y;
    const e2 = extendLine(mx, my, mx + dx, my + dy);
    return (
      <g>
        <polygon points={`${e1.x1},${e1.y1} ${e1.x2},${e1.y2} ${e2.x2},${e2.y2} ${e2.x1},${e2.y1}`}
          fill={col} fillOpacity={0.06} />
        <line x1={e1.x1} y1={e1.y1} x2={e1.x2} y2={e1.y2} stroke={col} strokeWidth={1.8} />
        <line x1={e2.x1} y1={e2.y1} x2={e2.x2} y2={e2.y2} stroke={col} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.8} />
        <circle cx={c0.x} cy={c0.y} r={4} fill={col} />
        <circle cx={c1.x} cy={c1.y} r={4} fill={col} />
      </g>
    );
  }

  if (tool === 'fib') {
    if (!c0) return null;
    const LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const dy = my - c0.y;
    return (
      <g opacity={0.6}>
        {LEVELS.map(lv => (
          <line key={lv} x1={-10000} y1={c0.y + lv * dy} x2={10000} y2={c0.y + lv * dy}
            stroke={col} strokeWidth={1} />
        ))}
        <circle cx={c0.x} cy={c0.y} r={4} fill={col} />
        <circle cx={mx} cy={my} r={4} fill={col} opacity={0.6} />
      </g>
    );
  }

  if (tool === 'rect') {
    if (!c0) return null;
    const bx = Math.min(c0.x, mx), by = Math.min(c0.y, my);
    const bw = Math.max(Math.abs(mx - c0.x), 1), bh = Math.max(Math.abs(my - c0.y), 1);
    return <rect x={bx} y={by} width={bw} height={bh} fill={col} fillOpacity={0.08}
      stroke={col} strokeWidth={1.5} strokeDasharray="6 3" rx={2} />;
  }

  return null;
}


// ── Main component ───────────────────────────────────────────────
export default function Chart({ symbol }: Props) {
  const timeframe = useAppStore(s => s.timeframe);
  const theme = useAppStore(s => s.theme);
  const indicatorConfigs = useAppStore(s => s.indicators);
  const removeIndicator = useAppStore(s => s.removeIndicator);
  const activeTool = useAppStore(s => s.activeTool);
  const measureMultiplier = useAppStore(s => s.measureMultiplier);
  const { candles, loading, error, loadingMore, loadMoreHistory, prependedCountRef } = useCandles(symbol, timeframe);

  const containerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rpsContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const rpsChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const macdSeriesRef = useRef<(ISeriesApi<'Line'> | ISeriesApi<'Histogram'>)[]>([]);
  const rpsSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const [chartReady, setChartReady] = useState(false);
  const [rsiReady, setRsiReady] = useState(false);
  const [macdReady, setMacdReady] = useState(false);
  const [rpsReady, setRpsReady] = useState(false);
  const [legend, setLegend] = useState<{ o: number; h: number; l: number; c: number; v: number } | null>(null);

  // Drawing state
  const [pending, setPending]         = useState<Pending>(null);
  const [savedDrawings, setSavedDrawings] = useState<Drawing[]>([]);
  const pendingRef   = useRef<Pending>(null);          // mirrors pending without closure issues
  const overlayRef   = useRef<HTMLDivElement>(null);
  const previewRef   = useRef<((e: MouseEvent) => void) | null>(null); // mousemove for click-tools
  const dragRef      = useRef<{ move: (e: MouseEvent) => void; up: (e: MouseEvent) => void } | null>(null);

  const indicatorResults = useMemo<IndicatorResult[]>(() => {
    if (candles.length === 0) return [];
    return indicatorConfigs.map(cfg => computeIndicator(cfg, candles));
  }, [candles, indicatorConfigs]);

  const hasRSI = indicatorResults.some(r => r.type === 'RSI');
  const hasMACD = indicatorResults.some(r => r.type === 'MACD');
  const hasRPS = indicatorResults.some(r => r.type === 'RPS');
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const onCrosshairMove = useCallback((param: MouseEventParams) => {
    if (!param.time || !candleSeriesRef.current || !volumeSeriesRef.current) { setLegend(null); return; }
    const candle = param.seriesData.get(candleSeriesRef.current) as { open: number; high: number; low: number; close: number } | undefined;
    const vol = param.seriesData.get(volumeSeriesRef.current) as { value: number } | undefined;
    if (candle) setLegend({ o: candle.open, h: candle.high, l: candle.low, c: candle.close, v: vol?.value ?? 0 });
  }, []);

  // Main chart
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text, fontSize: 11 },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshair, width: 1, style: 3, labelBackgroundColor: colors.crosshairBg },
        horzLine: { color: colors.crosshair, width: 1, style: 3, labelBackgroundColor: colors.crosshairBg },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: true, secondsVisible: false },
    });
    const cs = chart.addCandlestickSeries({
      upColor: colors.upColor, downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: colors.upColor, wickDownColor: colors.downColor,
    });
    const vs = chart.addHistogramSeries({ color: colors.upColor, priceFormat: { type: 'volume' }, priceScaleId: 'volume' });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    chart.subscribeCrosshairMove(onCrosshairMove);
    chartRef.current = chart; candleSeriesRef.current = cs; volumeSeriesRef.current = vs;
    setChartReady(true);
    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null; candleSeriesRef.current = null; volumeSeriesRef.current = null;
      overlaySeriesRef.current = [];
      setChartReady(false);
    };
  }, [onCrosshairMove, colors]);

  // Infinite scroll subscription
  useEffect(() => {
    if (!chartReady || !chartRef.current) return;
    const chart = chartRef.current;
    const handler = () => {
      const range = chart.timeScale().getVisibleLogicalRange();
      if (range && (range as unknown as { from: number }).from < 10) loadMoreHistory();
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    return () => { chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler); };
  }, [chartReady, loadMoreHistory]);

  // RSI sub-chart
  useEffect(() => {
    if (!hasRSI || !rsiContainerRef.current) {
      if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; rsiSeriesRef.current = []; }
      setRsiReady(false); return;
    }
    const chart = createChart(rsiContainerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text, fontSize: 10 },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    });
    rsiChartRef.current = chart; setRsiReady(true);
    return () => { chart.remove(); rsiChartRef.current = null; rsiSeriesRef.current = []; setRsiReady(false); };
  }, [hasRSI, colors]);

  // MACD sub-chart
  useEffect(() => {
    if (!hasMACD || !macdContainerRef.current) {
      if (macdChartRef.current) { macdChartRef.current.remove(); macdChartRef.current = null; macdSeriesRef.current = []; }
      setMacdReady(false); return;
    }
    const chart = createChart(macdContainerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text, fontSize: 10 },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    });
    macdChartRef.current = chart; setMacdReady(true);
    return () => { chart.remove(); macdChartRef.current = null; macdSeriesRef.current = []; setMacdReady(false); };
  }, [hasMACD, colors]);

  // RPS sub-chart
  useEffect(() => {
    if (!hasRPS || !rpsContainerRef.current) {
      if (rpsChartRef.current) { rpsChartRef.current.remove(); rpsChartRef.current = null; rpsSeriesRef.current = []; }
      setRpsReady(false); return;
    }
    const chart = createChart(rpsContainerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text, fontSize: 10 },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    });
    rpsChartRef.current = chart; setRpsReady(true);
    return () => { chart.remove(); rpsChartRef.current = null; rpsSeriesRef.current = []; setRpsReady(false); };
  }, [hasRPS, colors]);

  // Candle + volume data (preserves scroll on history prepend)
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (candles.length === 0) { candleSeriesRef.current.setData([]); volumeSeriesRef.current.setData([]); return; }
    const prependCount = prependedCountRef.current;
    prependedCountRef.current = 0;
    const isPrepend = prependCount > 0;
    let savedRange: { from: number; to: number } | null = null;
    if (isPrepend && chartRef.current) {
      const r = chartRef.current.timeScale().getVisibleLogicalRange();
      if (r) savedRange = { from: (r as unknown as { from: number }).from, to: (r as unknown as { to: number }).to };
    }
    candleSeriesRef.current.setData(candles.map(c => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })));
    volumeSeriesRef.current.setData(candles.map(c => ({
      time: c.time as Time, value: c.volume,
      color: c.close >= c.open ? colors.volUp : colors.volDown,
    })));
    if (isPrepend && savedRange) {
      const from = savedRange.from + prependCount, to = savedRange.to + prependCount;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chartRef.current?.timeScale() as any)?.setVisibleLogicalRange({ from, to });
      }));
    } else {
      chartRef.current?.timeScale().fitContent();
      const last = candles[candles.length - 1];
      setLegend({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume });
    }
  }, [candles, chartReady, colors, prependedCountRef]);

  // Indicators
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chartReady) return;
    overlaySeriesRef.current.forEach(s => { try { chart.removeSeries(s); } catch {} });
    overlaySeriesRef.current = [];
    if (rsiChartRef.current) { rsiSeriesRef.current.forEach(s => { try { rsiChartRef.current!.removeSeries(s); } catch {} }); rsiSeriesRef.current = []; }
    if (macdChartRef.current) { macdSeriesRef.current.forEach(s => { try { macdChartRef.current!.removeSeries(s); } catch {} }); macdSeriesRef.current = []; }
    if (rpsChartRef.current) { rpsSeriesRef.current.forEach(s => { try { rpsChartRef.current!.removeSeries(s); } catch {} }); rpsSeriesRef.current = []; }

    for (const result of indicatorResults) {
      if (result.overlay) {
        for (const line of result.lines) {
          const s = chart.addLineSeries({ color: line.color, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
          s.setData(line.data); overlaySeriesRef.current.push(s);
        }
      } else if (result.type === 'RSI' && rsiReady && rsiChartRef.current) {
        for (const line of result.lines) {
          const s = rsiChartRef.current.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
          s.setData(line.data); rsiSeriesRef.current.push(s);
        }
        if (result.lines[0]?.data.length > 1) {
          const pts = result.lines[0].data;
          const ob = rsiChartRef.current.addLineSeries({ color: colors.text + '30', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          const os = rsiChartRef.current.addLineSeries({ color: colors.text + '30', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          ob.setData(pts.map(p => ({ time: p.time, value: 70 }))); os.setData(pts.map(p => ({ time: p.time, value: 30 })));
          rsiSeriesRef.current.push(ob, os);
        }
        rsiChartRef.current.timeScale().fitContent();
      } else if (result.type === 'MACD' && macdReady && macdChartRef.current) {
        if (result.histogram) { const h = macdChartRef.current.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false }); h.setData(result.histogram.data); macdSeriesRef.current.push(h); }
        for (const line of result.lines) { const s = macdChartRef.current.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true }); s.setData(line.data); macdSeriesRef.current.push(s); }
        macdChartRef.current.timeScale().fitContent();
      } else if (result.type === 'RPS' && rpsReady && rpsChartRef.current) {
        for (const line of result.lines) { const s = rpsChartRef.current.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true }); s.setData(line.data); rpsSeriesRef.current.push(s); }
        if (result.lines[0]?.data.length > 1) {
          const pts = result.lines[0].data;
          const zl = rpsChartRef.current.addLineSeries({ color: colors.text + '30', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          zl.setData(pts.map(p => ({ time: p.time, value: 0 }))); rpsSeriesRef.current.push(zl);
        }
        rpsChartRef.current.timeScale().fitContent();
      }
    }
  }, [indicatorResults, chartReady, rsiReady, macdReady, rpsReady, colors]);

  // Helper: keep ref in sync with state
  const setP = useCallback((p: Pending) => { pendingRef.current = p; setPending(p); }, []);

  // Clear everything when tool changes
  useEffect(() => {
    setP(null);
    setSavedDrawings([]);
    if (previewRef.current) { document.removeEventListener('mousemove', previewRef.current); previewRef.current = null; }
    if (dragRef.current) {
      document.removeEventListener('mousemove', dragRef.current.move);
      document.removeEventListener('mouseup',   dragRef.current.up);
      dragRef.current = null;
    }
  }, [activeTool, setP]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (previewRef.current) document.removeEventListener('mousemove', previewRef.current);
    if (dragRef.current) {
      document.removeEventListener('mousemove', dragRef.current.move);
      document.removeEventListener('mouseup',   dragRef.current.up);
    }
  }, []);

  const handleOverlayDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = overlayRef.current;
    if (!el) return;
    const r   = el.getBoundingClientRect();
    const x   = e.clientX - r.left;
    const y   = e.clientY - r.top;
    const tool = activeTool;

    // ── DRAG tool (measure) ──────────────────────────────────────
    if (DRAG_TOOLS.has(tool)) {
      const start: Pt = { x, y };
      setP({ tool, clicks: [start], mx: x, my: y });

      const onMove = (ev: MouseEvent) => {
        const rr = el.getBoundingClientRect();
        setP({ tool, clicks: [start], mx: ev.clientX - rr.left, my: ev.clientY - rr.top });
      };
      const onUp = (ev: MouseEvent) => {
        const rr = el.getBoundingClientRect();
        const ex = ev.clientX - rr.left, ey = ev.clientY - rr.top;
        setP(null);
        setSavedDrawings(prev => [...prev, { id: `${tool}-${Date.now()}`, tool, pts: [start, { x: ex, y: ey }] }]);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        dragRef.current = null;
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      dragRef.current = { move: onMove, up: onUp };
      return;
    }

    // ── CLICK tool ───────────────────────────────────────────────
    const need  = CLICKS_FOR[tool] ?? 2;
    const cur   = pendingRef.current;

    if (!cur || cur.tool !== tool) {
      // First click — start new pending drawing
      setP({ tool, clicks: [{ x, y }], mx: x, my: y });
      // Start live-preview tracking
      if (previewRef.current) document.removeEventListener('mousemove', previewRef.current);
      const onMove = (ev: MouseEvent) => {
        const rr = el.getBoundingClientRect();
        const nmx = ev.clientX - rr.left, nmy = ev.clientY - rr.top;
        pendingRef.current = pendingRef.current ? { ...pendingRef.current, mx: nmx, my: nmy } : null;
        setPending(pendingRef.current);
      };
      previewRef.current = onMove;
      document.addEventListener('mousemove', onMove);
    } else {
      // Subsequent click
      const newClicks = [...cur.clicks, { x, y }];
      if (newClicks.length >= need) {
        // Finalize
        setSavedDrawings(prev => [...prev, { id: `${tool}-${Date.now()}`, tool, pts: newClicks }]);
        if (previewRef.current) { document.removeEventListener('mousemove', previewRef.current); previewRef.current = null; }
        setP(null);
      } else {
        setP({ ...cur, clicks: newClicks, mx: x, my: y });
      }
    }
  }, [activeTool, setP]);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const dl = legend || (lastCandle ? { o: lastCandle.open, h: lastCandle.high, l: lastCandle.low, c: lastCandle.close, v: lastCandle.volume } : null);
  const noData      = !loading && !error && candles.length === 0;
  const isDrawTool  = ALL_DRAW_TOOLS.has(activeTool);
  const dark        = theme === 'dark';

  const toolHints: Record<string, string> = {
    trendline: 'Click to set start · Click again to set end',
    hline:     'Click to place a horizontal price level',
    channel:   'Click start · Click end · Click to set parallel',
    fib:       'Click start · Click end for Fibonacci levels',
    rect:      'Click two corners to draw a rectangle',
    measure:   `Drag to measure a price move · ${measureMultiplier}x multiplier`,
  };
  const pendingHint = pending && pending.clicks.length === 1 && (
    pending.tool === 'channel' ? 'Click end of first line' :
    pending.tool === 'trendline' ? 'Click to set end point' :
    pending.tool === 'fib' ? 'Click end price level' :
    pending.tool === 'rect' ? 'Click opposite corner' : ''
  );
  const pendingHint2 = pending && pending.clicks.length === 2 && pending.tool === 'channel'
    ? 'Click to set parallel line position' : '';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-chart)' }}>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>

        {/* OHLCV legend */}
        <div style={{
          position: 'absolute', top: '10px', left: '12px', zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px',
          background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-xs)',
          padding: '6px 10px', pointerEvents: 'none',
        }}>
          {dl && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['O', 'H', 'L', 'C'] as const).map(k => {
                const val = k === 'O' ? dl.o : k === 'H' ? dl.h : k === 'L' ? dl.l : dl.c;
                return (
                  <span key={k}>
                    <span style={{ color: 'var(--text-secondary)' }}>{k} </span>
                    <span style={{ color: dl.c >= dl.o ? 'var(--green)' : 'var(--red)' }}>{fmt(val)}</span>
                  </span>
                );
              })}
              <span><span style={{ color: 'var(--text-secondary)' }}>Vol </span><span style={{ color: 'var(--text-secondary)' }}>{fmtVol(dl.v)}</span></span>
            </div>
          )}
          {indicatorResults.filter(r => r.overlay).map(r => (
            <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}>
              {r.lines.map((line, i) => <span key={i} style={{ color: line.color, fontSize: '10px' }}>{line.label}</span>)}
              <button onClick={() => removeIndicator(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10px', padding: 0, cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>

        {/* Loading more history */}
        {loadingMore && (
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 25, background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-xs)', padding: '4px 10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Loading history…
          </div>
        )}

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', zIndex: 30, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading...
          </div>
        )}
        {(error || noData) && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              {error || `No data for ${symbol}`}
            </span>
          </div>
        )}

        {/* Lightweight-charts canvas */}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Saved drawings — always visible, no pointer events */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 9999 }}>
          {savedDrawings.map(d => (
            <SavedDrawing key={d.id} d={d} cs={candleSeriesRef.current} measureMult={measureMultiplier} dark={dark} />
          ))}
        </svg>

        {/* Drawing overlay — active only when a drawing tool is selected */}
        {isDrawTool && (
          <div
            ref={overlayRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000, cursor: 'crosshair', userSelect: 'none' }}
            onMouseDown={handleOverlayDown}
          >
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
              <PendingPreview p={pending} dark={dark} />
            </svg>

            {/* Contextual hint */}
            <div style={{
              position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px',
              padding: '5px 14px', borderRadius: '6px', pointerEvents: 'none', whiteSpace: 'nowrap',
              backdropFilter: 'blur(8px)', opacity: (pendingHint || pendingHint2) ? 1 : 0.85,
            }}>
              {pendingHint2 || pendingHint || toolHints[activeTool] || ''}
            </div>
          </div>
        )}
      </div>

      {/* Sub-charts */}
      {hasRSI && (
        <div style={{ height: '100px', borderTop: '1px solid var(--border-glass)', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '4px', left: '8px', zIndex: 20, fontSize: '10px', pointerEvents: 'auto', display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', padding: '2px 6px', borderRadius: '4px' }}>
            <span style={{ color: '#e91e63' }}>RSI</span>
            {indicatorResults.filter(r => r.type === 'RSI').map(r => (
              <button key={r.id} onClick={() => removeIndicator(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10px', padding: 0, cursor: 'pointer' }}>×</button>
            ))}
          </div>
          <div ref={rsiContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
      {hasMACD && (
        <div style={{ height: '100px', borderTop: '1px solid var(--border-glass)', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '4px', left: '8px', zIndex: 20, fontSize: '10px', pointerEvents: 'auto', display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', padding: '2px 6px', borderRadius: '4px' }}>
            <span style={{ color: '#2962ff' }}>MACD</span>
            {indicatorResults.filter(r => r.type === 'MACD').map(r => (
              <button key={r.id} onClick={() => removeIndicator(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10px', padding: 0, cursor: 'pointer' }}>×</button>
            ))}
          </div>
          <div ref={macdContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
      {hasRPS && (
        <div style={{ height: '100px', borderTop: '1px solid var(--border-glass)', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '4px', left: '8px', zIndex: 20, fontSize: '10px', pointerEvents: 'auto', display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)', padding: '2px 6px', borderRadius: '4px' }}>
            <span style={{ color: '#ff9800' }}>RPS</span>
            {indicatorResults.filter(r => r.type === 'RPS').map(r => (
              <button key={r.id} onClick={() => removeIndicator(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10px', padding: 0, cursor: 'pointer' }}>×</button>
            ))}
          </div>
          <div ref={rpsContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  );
}
