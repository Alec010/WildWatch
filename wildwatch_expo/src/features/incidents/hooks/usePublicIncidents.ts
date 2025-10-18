import { useCallback, useEffect, useState } from 'react';
import { incidentAPI } from '../api/incident_api';
import type { IncidentResponseDto } from '../models/IncidentModels';

export const usePublicIncidents = () => {
  const [incidents, setIncidents] = useState<IncidentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await incidentAPI.getPublicIncidents();
      setIncidents(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch public cases');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIncidents();
  }, [fetchIncidents]);

  return { incidents, isLoading, error, refresh: fetchIncidents };
};

