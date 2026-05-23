import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time, MouseEventParams } from 'lightweight-charts';
import { useCandles } from '../../hooks/useCandles';
import { useAppStore } from '../../store';

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
  const { candles, loading, error } = useCandles(symbol, timeframe);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [chartReady, setChartReady] = useState(false);

  const [legend, setLegend] = useState<{ o: number; h: number; l: number; c: number; v: number } | null>(null);

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
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
      },
      rightPriceScale: { borderColor: '#2a2e39', textColor: '#787b86' },
      timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: false },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

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
      setChartReady(false);
    };
  }, [onCrosshairMove]);

  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (candles.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    const candleData = candles.map(c => ({
      time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close,
    }));

    const volumeData = candles.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();

    // Set default legend to last candle
    const last = candles[candles.length - 1];
    setLegend({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume });
  }, [candles, chartReady]);

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const displayLegend = legend || (lastCandle ? { o: lastCandle.open, h: lastCandle.high, l: lastCandle.low, c: lastCandle.close, v: lastCandle.volume } : null);
  const noData = !loading && !error && candles.length === 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#131722' }}>
      {/* OHLCV Legend Overlay */}
      {displayLegend && (
        <div style={{
          position: 'absolute', top: '8px', left: '8px', zIndex: 20,
          display: 'flex', gap: '12px', fontSize: '11px', pointerEvents: 'none',
        }}>
          <span>
            <span style={{ color: '#787b86' }}>O </span>
            <span style={{ color: displayLegend.c >= displayLegend.o ? '#26a69a' : '#ef5350' }}>{fmt(displayLegend.o)}</span>
          </span>
          <span>
            <span style={{ color: '#787b86' }}>H </span>
            <span style={{ color: displayLegend.c >= displayLegend.o ? '#26a69a' : '#ef5350' }}>{fmt(displayLegend.h)}</span>
          </span>
          <span>
            <span style={{ color: '#787b86' }}>L </span>
            <span style={{ color: displayLegend.c >= displayLegend.o ? '#26a69a' : '#ef5350' }}>{fmt(displayLegend.l)}</span>
          </span>
          <span>
            <span style={{ color: '#787b86' }}>C </span>
            <span style={{ color: displayLegend.c >= displayLegend.o ? '#26a69a' : '#ef5350' }}>{fmt(displayLegend.c)}</span>
          </span>
          <span>
            <span style={{ color: '#787b86' }}>Vol </span>
            <span style={{ color: '#787b86' }}>{fmtVol(displayLegend.v)}</span>
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(19,23,34,0.8)', zIndex: 30, color: '#787b86', fontSize: '13px',
        }}>
          Loading...
        </div>
      )}

      {/* Error / No data */}
      {(error || noData) && !loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 30, gap: '4px',
        }}>
          <span style={{ color: '#787b86', fontSize: '13px' }}>
            {error ? error : `No data for ${symbol}`}
          </span>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
