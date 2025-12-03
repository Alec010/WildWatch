import { useCallback, useEffect, useState } from 'react';
import { type OfficeInfo } from '../models/report';

export const useOffices = (apiBaseUrl: string, token: string | null) => {
  const [offices, setOffices] = useState<OfficeInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffices = useCallback(async (): Promise<void> => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/offices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data: OfficeInfo[] = await response.json();
      setOffices(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch offices');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, token]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  return { offices, isLoading, error, fetchOffices };
};



