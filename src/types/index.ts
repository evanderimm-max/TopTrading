export interface Quote {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyProfile {
  name: string;
  ticker: string;
  logo: string;
  finnhubIndustry: string;
  marketCapitalization: number;
  shareOutstanding: number;
  weburl: string;
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
}

export interface SearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image: string;
  category: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
}

export type Timeframe = '15m' | '30m' | '1h' | '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';
export type Theme = 'dark' | 'light';
export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB' | 'RPS';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  params: Record<string, number>;
  color: string;
}
