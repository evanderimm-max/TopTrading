import { useState, useEffect } from 'react';
import { getCompanyNews } from '../utils/finnhub';
import type { NewsItem } from '../types';

export function useNews(symbol: string) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    getCompanyNews(symbol, fmt(from), fmt(to))
      .then(data => {
        setNews((data as NewsItem[]).slice(0, 15));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  return { news, loading };
}
