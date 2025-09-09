import { useCallback, useEffect, useState } from 'react';
import { userAPI } from '../../users/api/user_api';
import type { UserProfile, UserUpdateRequest } from '../../users/models/UserProfileModels';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const me = await userAPI.getMe();
      setUserProfile(me as UserProfile);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (payload: UserUpdateRequest) => {
    const updated = await userAPI.updateMe(payload);
    setUserProfile(updated as UserProfile);
    return updated as UserProfile;
  }, []);

  useEffect(() => {
    void fetchUserProfile();
  }, [fetchUserProfile]);

  return { userProfile, isLoading, error, fetchUserProfile, updateUserProfile, setUserProfile };
};


