import { useCallback, useEffect, useState } from 'react';
import { incidentAPI } from '../api/incident_api';

export const useUpvoteStatus = (incidentId?: string) => {
    const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
    const [isLoadingUpvoteStatus, setIsLoadingUpvoteStatus] = useState<boolean>(false);
    const [upvoteStatusError, setUpvoteStatusError] = useState<string | null>(null);

    const fetchUpvoteStatus = useCallback(async () => {
        if (!incidentId) {
            setIsLoadingUpvoteStatus(false);
            return;
        }
        try {
            setIsLoadingUpvoteStatus(true);
            setUpvoteStatusError(null);
            const status = await incidentAPI.getUpvoteStatus(incidentId);
            setHasUpvoted(status);
        } catch (error: any) {
            setUpvoteStatusError(error?.message || 'Failed to fetch upvote status');
            setHasUpvoted(false);
        } finally {
            setIsLoadingUpvoteStatus(false);
        }
    }, [incidentId]);

    useEffect(() => {
        fetchUpvoteStatus();
    }, [fetchUpvoteStatus]);

    return {
        hasUpvoted,
        setHasUpvoted,
        isLoadingUpvoteStatus,
        upvoteStatusError,
        refetchUpvoteStatus: fetchUpvoteStatus,
    } as const;
};

