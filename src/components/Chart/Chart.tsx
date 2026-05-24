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
interface Drawing {
  id: string;
  tool: string;
  x1: number; y1: number;
  x2: number; y2: number;
}
type ActiveDrawing = Omit<Drawing, 'id'>;

const OVERLAY_TOOLS = new Set(['trendline', 'hline', 'channel', 'measure']);

function extendLine(x1: number, y1: number, x2: number, y2: number) {
  const L = 10000;
  if (Math.abs(x2 - x1) < 0.5) return { x1, y1: -L, x2, y2: L };
  const s = (y2 - y1) / (x2 - x1);
  return { x1: -L, y1: y1 + s * (-L - x1), x2: L, y2: y1 + s * (L - x1) };
}

function perpLine(x1: number, y1: number, x2: number, y2: number, dist: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = -dy / len * dist, py = dx / len * dist;
  return { x1: x1 + px, y1: y1 + py, x2: x2 + px, y2: y2 + py };
}

// Renders one drawing in SVG space
function DrawingSVG({
  d, cs, measureMult, accent,
}: {
  d: Drawing | ActiveDrawing;
  cs: ISeriesApi<'Candlestick'> | null;
  measureMult: number;
  accent: string;
}) {
  const { x1, y1, x2, y2 } = d;

  if (d.tool === 'trendline') {
    const e = extendLine(x1, y1, x2, y2);
    return (
      <g>
        <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke={accent} strokeWidth={1.8} strokeLinecap="round" opacity={0.9} />
        <circle cx={x1} cy={y1} r={4} fill={accent} opacity={0.9} />
        <circle cx={x2} cy={y2} r={4} fill={accent} opacity={0.9} />
      </g>
    );
  }

  if (d.tool === 'hline') {
    const price = cs?.coordinateToPrice(y1) ?? null;
    return (
      <g>
        <line x1={-10000} y1={y1} x2={10000} y2={y1}
          stroke={accent} strokeWidth={1.5} strokeDasharray="8 5" opacity={0.85} />
        {price !== null && (
          <text x={6} y={y1 - 5} fill={accent} fontSize={10} fontFamily="monospace"
            paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={3}>
            {price.toFixed(2)}
          </text>
        )}
      </g>
    );
  }

  if (d.tool === 'channel') {
    const e1 = extendLine(x1, y1, x2, y2);
    const p = perpLine(x1, y1, x2, y2, 60);
    const e2 = extendLine(p.x1, p.y1, p.x2, p.y2);
    return (
      <g>
        <polygon
          points={`${e1.x1},${e1.y1} ${e1.x2},${e1.y2} ${e2.x2},${e2.y2} ${e2.x1},${e2.y1}`}
          fill={accent} fillOpacity={0.07} />
        <line x1={e1.x1} y1={e1.y1} x2={e1.x2} y2={e1.y2}
          stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
        <line x1={e2.x1} y1={e2.y1} x2={e2.x2} y2={e2.y2}
          stroke={accent} strokeWidth={1.2} strokeDasharray="6 4" opacity={0.75} />
        <circle cx={x1} cy={y1} r={4} fill={accent} opacity={0.9} />
        <circle cx={x2} cy={y2} r={4} fill={accent} opacity={0.9} />
      </g>
    );
  }

  if (d.tool === 'measure' && cs) {
    const p1 = cs.coordinateToPrice(y1);
    const p2 = cs.coordinateToPrice(y2);
    if (p1 === null || p2 === null) return null;

    const isUp = p2 > p1;
    const color = isUp ? '#26a69a' : '#ef5350';
    const fillColor = isUp ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)';
    const extFill = isUp ? 'rgba(38,166,154,0.08)' : 'rgba(239,83,80,0.08)';

    const pTarget = p1 + measureMult * (p2 - p1);
    const yTarget = y1 + measureMult * (y2 - y1);
    const xExt = x2 + (x2 - x1);
    const pctMove = (p2 - p1) / p1 * 100;
    const pctTarget = (pTarget - p1) / p1 * 100;

    const bx = Math.min(x1, x2), by = Math.min(y1, y2);
    const bw = Math.abs(x2 - x1), bh = Math.abs(y2 - y1);
    const ex = Math.min(x2, xExt), ey = Math.min(y2, yTarget);
    const ew = Math.abs(xExt - x2), eh = Math.abs(yTarget - y2);
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    const extMidX = (x2 + xExt) / 2, extMidY = (y2 + yTarget) / 2;

    return (
      <g>
        {bw > 0 && bh > 0 && (
          <rect x={bx} y={by} width={bw} height={bh}
            fill={fillColor} stroke={color} strokeWidth={1} rx={2} />
        )}
        {ew > 0 && eh > 0 && (
          <rect x={ex} y={ey} width={ew} height={eh}
            fill={extFill} stroke={color} strokeWidth={1} strokeDasharray="5 3" rx={2} />
        )}
        {bw > 0 && (
          <line x1={x2} y1={Math.min(by, ey)} x2={x2} y2={Math.max(by + bh, ey + eh)}
            stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
        )}
        {bw > 40 && bh > 18 && (
          <>
            <rect x={midX - 34} y={midY - 10} width={68} height={18} rx={3} fill="rgba(0,0,0,0.55)" />
            <text x={midX} y={midY + 5} textAnchor="middle"
              fill={color} fontSize={11} fontWeight="bold" fontFamily="monospace">
              {pctMove >= 0 ? '+' : ''}{pctMove.toFixed(2)}%
            </text>
          </>
        )}
        {ew > 40 && eh > 18 && (
          <>
            <rect x={extMidX - 44} y={extMidY - 10} width={88} height={18} rx={3} fill="rgba(0,0,0,0.55)" />
            <text x={extMidX} y={extMidY + 5} textAnchor="middle"
              fill={color} fontSize={11} fontWeight="bold" fontFamily="monospace">
              {measureMult}x {pctTarget >= 0 ? '+' : ''}{pctTarget.toFixed(2)}%
            </text>
          </>
        )}
        <text x={x1 + 4} y={y1 - 5} fill={color} fontSize={10} fontFamily="monospace"
          paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={3}>{p1.toFixed(2)}</text>
        <text x={x2 + 4} y={y2 - 5} fill={color} fontSize={10} fontFamily="monospace"
          paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={3}>{p2.toFixed(2)}</text>
        <text x={ex + 4} y={yTarget - 5} fill={color} fontSize={10} fontFamily="monospace"
          paintOrder="stroke" stroke="rgba(0,0,0,0.5)" strokeWidth={3}>
          {measureMult}x: {pTarget.toFixed(2)}
        </text>
      </g>
    );
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

  // Drawing tool state
  const [activeDrawing, setActiveDrawing] = useState<ActiveDrawing | null>(null);
  const [savedDrawings, setSavedDrawings] = useState<Drawing[]>([]);
  const drawRef = useRef(false);
  const activeDrawingDataRef = useRef<ActiveDrawing | null>(null);

  const indicatorResults = useMemo<IndicatorResult[]>(() => {
    if (candles.length === 0) return [];
    return indicatorConfigs.map(cfg => computeIndicator(cfg, candles));
  }, [candles, indicatorConfigs]);

  const hasRSI = indicatorResults.some(r => r.type === 'RSI');
  const hasMACD = indicatorResults.some(r => r.type === 'MACD');
  const hasRPS = indicatorResults.some(r => r.type === 'RPS');
  const colors = useMemo(() => getThemeColors(theme), [theme]);
  const accentColor = theme === 'dark' ? '#7c6bff' : '#5b54e8';

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

  // Clear drawings when tool changes (fresh start per tool session)
  useEffect(() => {
    setActiveDrawing(null);
    setSavedDrawings([]);
    drawRef.current = false;
    activeDrawingDataRef.current = null;
  }, [activeTool]);

  // Pointer event handlers — more reliable than mouse events (pointer capture keeps
  // tracking even when cursor leaves the div or moves to the price axis)
  const handleOverlayDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    drawRef.current = true;
    const d: ActiveDrawing = { tool: activeTool, x1: x, y1: y, x2: x, y2: y };
    activeDrawingDataRef.current = d;
    setActiveDrawing(d);
  }, [activeTool]);

  const handleOverlayMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawRef.current || !activeDrawingDataRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const updated: ActiveDrawing = { ...activeDrawingDataRef.current, x2: x, y2: y };
    activeDrawingDataRef.current = updated;
    setActiveDrawing(updated);
  }, []);

  const handleOverlayUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawRef.current || !activeDrawingDataRef.current) return;
    drawRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const prev = activeDrawingDataRef.current;
    const final: Drawing = {
      ...prev,
      x2: x,
      y2: prev.tool === 'hline' ? prev.y1 : y,
      id: `${prev.tool}-${Date.now()}`,
    };
    activeDrawingDataRef.current = null;
    setActiveDrawing(null);
    setSavedDrawings(d => [...d, final]);
  }, []);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const dl = legend || (lastCandle ? { o: lastCandle.open, h: lastCandle.high, l: lastCandle.low, c: lastCandle.close, v: lastCandle.volume } : null);
  const noData = !loading && !error && candles.length === 0;
  const isOverlayTool = OVERLAY_TOOLS.has(activeTool);

  const toolHints: Record<string, string> = {
    trendline: 'Click & drag to draw a trend line',
    hline: 'Click to place a horizontal price level',
    channel: 'Click & drag to draw a parallel channel',
    measure: `Click & drag to measure a price move · ${measureMultiplier}x multiplier`,
  };

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

        {/* Always-on SVG layer for saved drawings (pointer-events: none so chart still pans) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 9999 }}>
          {savedDrawings.map(d => (
            <DrawingSVG key={d.id} d={d} cs={candleSeriesRef.current} measureMult={measureMultiplier} accent={accentColor} />
          ))}
        </svg>

        {/* Active drawing overlay — captures pointer events when a drawing tool is active */}
        {isOverlayTool && (
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 10000, cursor: 'crosshair', userSelect: 'none', touchAction: 'none' }}
            onPointerDown={handleOverlayDown}
            onPointerMove={handleOverlayMove}
            onPointerUp={handleOverlayUp}
          >
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              {activeDrawing && (
                <DrawingSVG d={activeDrawing} cs={candleSeriesRef.current} measureMult={measureMultiplier} accent={accentColor} />
              )}
            </svg>

            {/* Hint bar at the bottom */}
            {!activeDrawing && (
              <div style={{
                position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '11px',
                padding: '5px 14px', borderRadius: '6px', pointerEvents: 'none', whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)',
              }}>
                {toolHints[activeTool] ?? ''}
              </div>
            )}
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
