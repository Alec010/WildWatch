import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../../../lib/storage';
import { config } from '../../../../lib/config';
import { type IncidentDetailsDto } from '../../incidents/models/IncidentDetails';

export const useIncidentDetails = (idOrTracking?: string) => {
  const [token, setToken] = useState<string | null>(null);
  const [incident, setIncident] = useState<IncidentDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storage.getToken().then(setToken).catch(() => setToken(null));
  }, []);

  const fetchIncident = useCallback(async () => {
    if (!token || !idOrTracking) {
      if (!token) setError('Authentication required');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      let res = await fetch(`${config.API.BASE_URL}/incidents/track/${idOrTracking}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        res = await fetch(`${config.API.BASE_URL}/incidents/${idOrTracking}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (!res.ok) throw new Error(`Failed to fetch incident: ${res.status}`);
      const data: IncidentDetailsDto = await res.json();
      setIncident(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch incident details');
    } finally {
      setIsLoading(false);
    }
  }, [idOrTracking, token]);

  useEffect(() => { fetchIncident(); }, [fetchIncident]);

  return { token, incident, isLoading, error, refetch: fetchIncident } as const;
};


