import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useCandles } from '../../hooks/useCandles';
import { useAppStore } from '../../store';
import type { Timeframe } from '../../types';

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

interface Props { symbol: string }

export default function Chart({ symbol }: Props) {
  const timeframe = useAppStore(s => s.timeframe);
  const setTimeframe = useAppStore(s => s.setTimeframe);
  const { candles, loading, error } = useCandles(symbol, timeframe);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#8892b0',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e2130' },
        horzLines: { color: '#1e2130' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#3b4578', labelBackgroundColor: '#3b4578' },
        horzLine: { color: '#3b4578', labelBackgroundColor: '#3b4578' },
      },
      rightPriceScale: { borderColor: '#1e2130' },
      timeScale: {
        borderColor: '#1e2130',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setChartReady(true);

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setChartReady(false);
    };
  }, []);

  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (candles.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      return;
    }

    const candleData = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candles.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles, chartReady]);

  const noData = !loading && !error && candles.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#131722' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #1e2130', flexShrink: 0 }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: timeframe === tf ? '#2d3350' : 'transparent',
              color: timeframe === tf ? '#e2e8f0' : '#6b7db3',
            }}
          >
            {tf}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ color: '#4a5568', fontSize: '11px', padding: '4px 8px', background: '#1e2130', borderRadius: '4px' }}>
            Candlestick
          </span>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(19,23,34,0.85)', zIndex: 10, color: '#6b7db3', fontSize: '14px', gap: '8px',
          }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
            Loading chart data...
          </div>
        )}
        {(error || noData) && !loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: '8px',
          }}>
            <span style={{ fontSize: '28px' }}>📭</span>
            <span style={{ color: '#6b7db3', fontSize: '13px' }}>
              {error ? `Error: ${error}` : `No data available for ${symbol} — ${timeframe}`}
            </span>
            <span style={{ color: '#4a5568', fontSize: '11px' }}>
              Try a different timeframe or check your API key
            </span>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
