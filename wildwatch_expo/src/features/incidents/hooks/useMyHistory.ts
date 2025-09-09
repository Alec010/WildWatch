import { useCallback, useEffect, useState } from 'react';
import { incidentAPI } from '../../incidents/api/incident_api';
import type { IncidentResponseDto } from '../../incidents/models/IncidentModels';

export const useMyHistory = () => {
  const [incidents, setIncidents] = useState<IncidentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await incidentAPI.getMyIncidents();
      setIncidents(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchHistory(); }, [fetchHistory]);

  return { incidents, isLoading, error, refresh: fetchHistory };
};



