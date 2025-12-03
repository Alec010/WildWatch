import { useCallback, useEffect, useState } from 'react';
import { ratingAPI } from '../api/rating_api';
import type { RatingRequest, RatingStatus } from '../models/RatingModels';

export const useRating = (incidentId: string) => {
  const [ratingStatus, setRatingStatus] = useState<RatingStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRatingStatus = useCallback(async () => {
    if (!incidentId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await ratingAPI.getIncidentRating(incidentId);
      setRatingStatus(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch rating status');
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  const rateReporter = useCallback(async (rating: RatingRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ratingAPI.rateReporter(incidentId, rating);
      setRatingStatus(response);
      return response;
    } catch (e: any) {
      setError(e?.message || 'Failed to submit reporter rating');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  const rateOffice = useCallback(async (rating: RatingRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ratingAPI.rateOffice(incidentId, rating);
      setRatingStatus(response);
      return response;
    } catch (e: any) {
      setError(e?.message || 'Failed to submit office rating');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchRatingStatus();
  }, [fetchRatingStatus]);

  return {
    ratingStatus,
    isLoading,
    error,
    fetchRatingStatus,
    rateReporter,
    rateOffice,
  };
};

