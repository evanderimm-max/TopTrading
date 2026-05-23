import { useState, useEffect } from 'react';
import { getQuote } from '../utils/finnhub';
import type { Quote } from '../types';

export function useQuote(symbol: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    getQuote(symbol)
      .then(data => {
        setQuote(data as Quote);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });

    const interval = setInterval(() => {
      getQuote(symbol)
        .then(data => setQuote(data as Quote))
        .catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, [symbol]);

  return { quote, loading, error };
}
