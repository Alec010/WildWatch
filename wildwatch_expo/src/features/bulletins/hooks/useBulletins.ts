import { useCallback, useEffect, useState } from 'react';
import { bulletinAPI } from '../api/bulletin_api';
import type { OfficeBulletinDto } from '../models/BulletinModels';

export const useBulletins = () => {
  const [bulletins, setBulletins] = useState<OfficeBulletinDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBulletins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bulletinAPI.getAllBulletins();
      setBulletins(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch bulletins');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBulletins();
  }, [fetchBulletins]);

  return { bulletins, isLoading, error, refresh: fetchBulletins };
};

