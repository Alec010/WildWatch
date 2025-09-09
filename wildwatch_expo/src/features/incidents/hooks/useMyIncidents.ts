import { useCallback, useEffect, useState } from 'react';
import { incidentAPI } from '../../incidents/api/incident_api';
import type { IncidentResponseDto } from '../../incidents/models/IncidentModels';

export const useMyIncidents = () => {
  const [incidents, setIncidents] = useState<IncidentResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await incidentAPI.getMyIncidents();
      setIncidents(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch cases');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIncidents();
  }, [fetchIncidents]);

  return { incidents, isLoading, error, refresh: fetchIncidents };
};


