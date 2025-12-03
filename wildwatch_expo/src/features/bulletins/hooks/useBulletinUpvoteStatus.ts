import { useCallback, useEffect, useState } from 'react';
import { bulletinAPI } from '../api/bulletin_api';

export const useBulletinUpvoteStatus = (bulletinId?: string) => {
    const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
    const [isLoadingUpvoteStatus, setIsLoadingUpvoteStatus] = useState<boolean>(false);
    const [upvoteStatusError, setUpvoteStatusError] = useState<string | null>(null);

    const fetchUpvoteStatus = useCallback(async () => {
        if (!bulletinId) {
            setIsLoadingUpvoteStatus(false);
            return;
        }
        try {
            setIsLoadingUpvoteStatus(true);
            setUpvoteStatusError(null);
            const status = await bulletinAPI.getUpvoteStatus(bulletinId);
            setHasUpvoted(status);
        } catch (error: any) {
            setUpvoteStatusError(error?.message || 'Failed to fetch upvote status');
            setHasUpvoted(false);
        } finally {
            setIsLoadingUpvoteStatus(false);
        }
    }, [bulletinId]);

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

