const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'd10v0q9r01qi5j0cptu0d10v0q9r01qi5j0cptug';
const BASE_URL = 'https://finnhub.io/api/v1';

async function fetchFinnhub<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('token', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Finnhub ${res.status}: ${path}`);
  return res.json();
}

export function getQuote(symbol: string) {
  return fetchFinnhub<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number }>(
    '/quote', { symbol }
  );
}

export function getCandles(symbol: string, resolution: string, from: number, to: number) {
  return fetchFinnhub<{ c: number[]; h: number[]; l: number[]; o: number[]; t: number[]; v: number[]; s: string }>(
    '/stock/candle', { symbol, resolution, from: String(from), to: String(to) }
  );
}

export function searchSymbol(query: string) {
  return fetchFinnhub<{ count: number; result: { description: string; displaySymbol: string; symbol: string; type: string }[] }>(
    '/search', { q: query }
  );
}

export function getCompanyProfile(symbol: string) {
  return fetchFinnhub<{
    name: string; ticker: string; logo: string; finnhubIndustry: string;
    marketCapitalization: number; shareOutstanding: number; weburl: string;
    country: string; currency: string; exchange: string; ipo: string;
  }>('/stock/profile2', { symbol });
}

export function getCompanyNews(symbol: string, from: string, to: string) {
  return fetchFinnhub<{
    id: number; headline: string; summary: string; source: string;
    url: string; datetime: number; image: string; category: string;
  }[]>('/company-news', { symbol, from, to });
}

export const FINNHUB_WS_URL = `wss://ws.finnhub.io?token=${API_KEY}`;
