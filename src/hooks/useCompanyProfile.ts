import { useState, useEffect } from 'react';
import { getCompanyProfile } from '../utils/finnhub';
import type { CompanyProfile } from '../types';

export function useCompanyProfile(symbol: string) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    getCompanyProfile(symbol)
      .then(data => { setProfile(data as CompanyProfile); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  return { profile, loading };
}
