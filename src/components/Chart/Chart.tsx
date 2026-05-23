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

export default function Chart({ symbol }: Props) {
  const timeframe = useAppStore(s => s.timeframe);
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
  const [legend, setLegend] = useState<{ o: number; h: number; l: number; c: number; v: number } | null>(null);

  const indicatorResults = useMemo<IndicatorResult[]>(() => {
    if (candles.length === 0) return [];
    return indicatorConfigs.map(cfg => computeIndicator(cfg, candles));
  }, [candles, indicatorConfigs]);

  const hasRSI = indicatorResults.some(r => r.type === 'RSI');
  const hasMACD = indicatorResults.some(r => r.type === 'MACD');

  const onCrosshairMove = useCallback((param: MouseEventParams) => {
    if (!param.time || !candleSeriesRef.current || !volumeSeriesRef.current) {
      setLegend(null);
      return;
    }
    const candle = param.seriesData.get(candleSeriesRef.current) as { open: number; high: number; low: number; close: number } | undefined;
    const vol = param.seriesData.get(volumeSeriesRef.current) as { value: number } | undefined;
    if (candle) {
      setLegend({ o: candle.open, h: candle.high, l: candle.low, c: candle.close, v: vol?.value ?? 0 });
    }
  }, []);

  // Main chart setup
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#787b86',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        fontSize: 11,
      },
      grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
      },
      rightPriceScale: { borderColor: '#2a2e39', textColor: '#787b86' },
      timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350',
      borderUpColor: '#26a69a', borderDownColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    chart.subscribeCrosshairMove(onCrosshairMove);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setChartReady(true);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      overlaySeriesRef.current = [];
      setChartReady(false);
    };
  }, [onCrosshairMove]);

  // RSI sub-chart
  useEffect(() => {
    if (!hasRSI || !rsiContainerRef.current) {
      if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; rsiSeriesRef.current = []; }
      return;
    }
    const chart = createChart(rsiContainerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#787b86', fontSize: 10 },
      grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
      rightPriceScale: { borderColor: '#2a2e39' },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    });
    rsiChartRef.current = chart;
    return () => { chart.remove(); rsiChartRef.current = null; rsiSeriesRef.current = []; };
  }, [hasRSI]);

  // MACD sub-chart
  useEffect(() => {
    if (!hasMACD || !macdContainerRef.current) {
      if (macdChartRef.current) { macdChartRef.current.remove(); macdChartRef.current = null; macdSeriesRef.current = []; }
      return;
    }
    const chart = createChart(macdContainerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#787b86', fontSize: 10 },
      grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
      rightPriceScale: { borderColor: '#2a2e39' },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    });
    macdChartRef.current = chart;
    return () => { chart.remove(); macdChartRef.current = null; macdSeriesRef.current = []; };
  }, [hasMACD]);

  // Set candle + volume data
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (candles.length === 0) { candleSeriesRef.current.setData([]); volumeSeriesRef.current.setData([]); return; }

    candleSeriesRef.current.setData(candles.map(c => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })));
    volumeSeriesRef.current.setData(candles.map(c => ({
      time: c.time as Time, value: c.volume,
      color: c.close >= c.open ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)',
    })));
    chartRef.current?.timeScale().fitContent();
    const last = candles[candles.length - 1];
    setLegend({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume });
  }, [candles, chartReady]);

  // Render indicators
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chartReady) return;

    // Remove old overlay series
    overlaySeriesRef.current.forEach(s => { try { chart.removeSeries(s); } catch {} });
    overlaySeriesRef.current = [];

    // Remove old RSI series
    if (rsiChartRef.current) {
      rsiSeriesRef.current.forEach(s => { try { rsiChartRef.current!.removeSeries(s); } catch {} });
      rsiSeriesRef.current = [];
    }

    // Remove old MACD series
    if (macdChartRef.current) {
      macdSeriesRef.current.forEach(s => { try { macdChartRef.current!.removeSeries(s); } catch {} });
      macdSeriesRef.current = [];
    }

    for (const result of indicatorResults) {
      if (result.overlay) {
        for (const line of result.lines) {
          const series = chart.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
          series.setData(line.data);
          overlaySeriesRef.current.push(series);
        }
      } else if (result.type === 'RSI' && rsiChartRef.current) {
        for (const line of result.lines) {
          const series = rsiChartRef.current.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
          series.setData(line.data);
          rsiSeriesRef.current.push(series);
        }
        // Add overbought/oversold lines
        const ob = rsiChartRef.current.addLineSeries({ color: '#787b8640', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
        const os = rsiChartRef.current.addLineSeries({ color: '#787b8640', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
        if (result.lines[0]?.data.length > 1) {
          const times = result.lines[0].data;
          ob.setData(times.map(p => ({ time: p.time, value: 70 })));
          os.setData(times.map(p => ({ time: p.time, value: 30 })));
        }
        rsiSeriesRef.current.push(ob, os);
        rsiChartRef.current.timeScale().fitContent();
      } else if (result.type === 'MACD' && macdChartRef.current) {
        if (result.histogram) {
          const hist = macdChartRef.current.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false });
          hist.setData(result.histogram.data);
          macdSeriesRef.current.push(hist);
        }
        for (const line of result.lines) {
          const series = macdChartRef.current.addLineSeries({ color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: true });
          series.setData(line.data);
          macdSeriesRef.current.push(series);
        }
        macdChartRef.current.timeScale().fitContent();
      }
    }
  }, [indicatorResults, chartReady]);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const displayLegend = legend || (lastCandle ? { o: lastCandle.open, h: lastCandle.high, l: lastCandle.low, c: lastCandle.close, v: lastCandle.volume } : null);
  const noData = !loading && !error && candles.length === 0;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#131722' }}>
      {/* Main chart */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* OHLCV + indicator legend overlay */}
        <div style={{
          position: 'absolute', top: '8px', left: '8px', zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'none', fontSize: '11px',
        }}>
          {displayLegend && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { l: 'O', v: displayLegend.o },
                { l: 'H', v: displayLegend.h },
                { l: 'L', v: displayLegend.l },
                { l: 'C', v: displayLegend.c },
              ].map(({ l, v }) => (
                <span key={l}>
                  <span style={{ color: '#787b86' }}>{l} </span>
                  <span style={{ color: displayLegend.c >= displayLegend.o ? '#26a69a' : '#ef5350' }}>{fmt(v)}</span>
                </span>
              ))}
              <span>
                <span style={{ color: '#787b86' }}>Vol </span>
                <span style={{ color: '#787b86' }}>{fmtVol(displayLegend.v)}</span>
              </span>
            </div>
          )}
          {/* Overlay indicator labels */}
          {indicatorResults.filter(r => r.overlay).map(r => (
            <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}>
              {r.lines.map((line, i) => (
                <span key={i} style={{ color: line.color, fontSize: '10px' }}>{line.label}</span>
              ))}
              <button
                onClick={() => removeIndicator(r.id)}
                style={{ background: 'transparent', border: 'none', color: '#787b86', fontSize: '10px', padding: 0, cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(19,23,34,0.8)', zIndex: 30, color: '#787b86', fontSize: '13px',
          }}>
            Loading...
          </div>
        )}

        {(error || noData) && !loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
          }}>
            <span style={{ color: '#787b86', fontSize: '13px' }}>{error || `No data for ${symbol}`}</span>
          </div>
        )}

        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* RSI sub-chart */}
      {hasRSI && (
        <div style={{ height: '100px', borderTop: '1px solid #2a2e39', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '4px', left: '8px', zIndex: 20, fontSize: '10px', pointerEvents: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: '#e91e63' }}>RSI</span>
            {indicatorResults.filter(r => r.type === 'RSI').map(r => (
              <button key={r.id} onClick={() => removeIndicator(r.id)}
                style={{ background: 'transparent', border: 'none', color: '#787b86', fontSize: '10px', padding: 0, cursor: 'pointer' }}>×</button>
            ))}
          </div>
          <div ref={rsiContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* MACD sub-chart */}
      {hasMACD && (
        <div style={{ height: '100px', borderTop: '1px solid #2a2e39', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '4px', left: '8px', zIndex: 20, fontSize: '10px', pointerEvents: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: '#2962ff' }}>MACD</span>
            {indicatorResults.filter(r => r.type === 'MACD').map(r => (
              <button key={r.id} onClick={() => removeIndicator(r.id)}
                style={{ background: 'transparent', border: 'none', color: '#787b86', fontSize: '10px', padding: 0, cursor: 'pointer' }}>×</button>
            ))}
          </div>
          <div ref={macdContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  );
}
