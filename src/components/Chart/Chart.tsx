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
    bg: dark ? '#131722' : '#ffffff',
    text: '#787b86',
    grid: dark ? 'rgba(42,46,57,0.5)' : 'rgba(0,0,0,0.04)',
    border: dark ? '#2a2e39' : '#e0e3eb',
    crosshair: dark ? '#758696' : '#9598a1',
    crosshairBg: dark ? '#2a2e39' : '#f0f3fa',
    upColor: dark ? '#26a69a' : '#089981',
    downColor: dark ? '#ef5350' : '#f23645',
    volUp: dark ? 'rgba(38,166,154,0.25)' : 'rgba(8,153,129,0.18)',
    volDown: dark ? 'rgba(239,83,80,0.25)' : 'rgba(242,54,69,0.18)',
  };
}

export default function Chart({ symbol }: Props) {
  const timeframe = useAppStore(s => s.timeframe);
  const theme = useAppStore(s => s.theme);
  const indicatorConfigs = useAppStore(s => s.indicators);
  const removeIndicator = useAppStore(s => s.removeIndicator);
  const { candles, loading, error } = useCandles(symbol, timeframe);

  const containerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const macdSeriesRef = useRef<(ISeriesApi<'Line'> | ISeriesApi<'Histogram'>)[]>([]);
  const [chartReady, setChartReady] = useState(false);
  const [rsiReady, setRsiReady] = useState(false);
  const [macdReady, setMacdReady] = useState(false);
  const [legend, setLegend] = useState<{ o: number; h: number; l: number; c: number; v: number } | null>(null);

  const indicatorResults = useMemo<IndicatorResult[]>(() => {
    if (candles.length === 0) return [];
    return indicatorConfigs.map(cfg => computeIndicator(cfg, candles));
  }, [candles, indicatorConfigs]);

  const hasRSI = indicatorResults.some(r => r.type === 'RSI');
  const hasMACD = indicatorResults.some(r => r.type === 'MACD');
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

    chartRef.current = chart;
    candleSeriesRef.current = cs;
    volumeSeriesRef.current = vs;
    setChartReady(true);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null; candleSeriesRef.current = null; volumeSeriesRef.current = null;
      overlaySeriesRef.current = [];
      setChartReady(false);
    };
  }, [onCrosshairMove, colors]);

  // RSI sub-chart
  useEffect(() => {
    if (!hasRSI || !rsiContainerRef.current) {
      if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; rsiSeriesRef.current = []; }
      setRsiReady(false);
      return;
    }
    const chart = createChart(rsiContainerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text, fontSize: 10 },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    });
    rsiChartRef.current = chart;
    setRsiReady(true);
    return () => { chart.remove(); rsiChartRef.current = null; rsiSeriesRef.current = []; setRsiReady(false); };
  }, [hasRSI, colors]);

  // MACD sub-chart
  useEffect(() => {
    if (!hasMACD || !macdContainerRef.current) {
      if (macdChartRef.current) { macdChartRef.current.remove(); macdChartRef.current = null; macdSeriesRef.current = []; }
      setMacdReady(false);
      return;
    }
    const chart = createChart(macdContainerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: colors.bg }, textColor: colors.text, fontSize: 10 },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    });
    macdChartRef.current = chart;
    setMacdReady(true);
    return () => { chart.remove(); macdChartRef.current = null; macdSeriesRef.current = []; setMacdReady(false); };
  }, [hasMACD, colors]);

  // Set candle + volume data
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (candles.length === 0) { candleSeriesRef.current.setData([]); volumeSeriesRef.current.setData([]); return; }
    candleSeriesRef.current.setData(candles.map(c => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })));
    volumeSeriesRef.current.setData(candles.map(c => ({
      time: c.time as Time, value: c.volume,
      color: c.close >= c.open ? colors.volUp : colors.volDown,
    })));
    chartRef.current?.timeScale().fitContent();
    const last = candles[candles.length - 1];
    setLegend({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume });
  }, [candles, chartReady, colors]);

  // Render all indicators
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chartReady) return;

    // Clear overlays
    overlaySeriesRef.current.forEach(s => { try { chart.removeSeries(s); } catch {} });
    overlaySeriesRef.current = [];
    // Clear RSI
    if (rsiChartRef.current) {
      rsiSeriesRef.current.forEach(s => { try { rsiChartRef.current!.removeSeries(s); } catch {} });
      rsiSeriesRef.current = [];
    }
    // Clear MACD
    if (macdChartRef.current) {
      macdSeriesRef.current.forEach(s => { try { macdChartRef.current!.removeSeries(s); } catch {} });
      macdSeriesRef.current = [];
    }

    for (const result of indicatorResults) {
      if (result.overlay) {
        for (const line of result.lines) {
          const s = chart.addLineSeries({ color: line.color, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
          s.setData(line.data);
          overlaySeriesRef.current.push(s);
        }
      } else if (result.type === 'RSI' && rsiReady && rsiChartRef.current) {
        for (const line of result.lines) {
          const s = rsiChartRef.current.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
          s.setData(line.data);
          rsiSeriesRef.current.push(s);
        }
        if (result.lines[0]?.data.length > 1) {
          const pts = result.lines[0].data;
          const ob = rsiChartRef.current.addLineSeries({ color: colors.text + '30', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          const os = rsiChartRef.current.addLineSeries({ color: colors.text + '30', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          ob.setData(pts.map(p => ({ time: p.time, value: 70 })));
          os.setData(pts.map(p => ({ time: p.time, value: 30 })));
          rsiSeriesRef.current.push(ob, os);
        }
        rsiChartRef.current.timeScale().fitContent();
      } else if (result.type === 'MACD' && macdReady && macdChartRef.current) {
        if (result.histogram) {
          const h = macdChartRef.current.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false });
          h.setData(result.histogram.data);
          macdSeriesRef.current.push(h);
        }
        for (const line of result.lines) {
          const s = macdChartRef.current.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
          s.setData(line.data);
          macdSeriesRef.current.push(s);
        }
        macdChartRef.current.timeScale().fitContent();
      }
    }
  }, [indicatorResults, chartReady, rsiReady, macdReady, colors]);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const dl = legend || (lastCandle ? { o: lastCandle.open, h: lastCandle.high, l: lastCandle.low, c: lastCandle.close, v: lastCandle.volume } : null);
  const noData = !loading && !error && candles.length === 0;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-chart)' }}>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* OHLCV + indicator legend */}
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
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

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
    </div>
  );
}
