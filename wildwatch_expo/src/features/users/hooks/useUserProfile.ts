import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { userAPI } from '../../users/api/user_api';
import { storage } from '../../../../lib/storage';
import type { UserProfile, UserUpdateRequest } from '../../users/models/UserProfileModels';

// ✅ FIX: Create a global profile state manager to allow clearing from anywhere
let globalProfileState: {
  setProfile: ((profile: UserProfile | null) => void) | null;
  setToken: ((token: string | null) => void) | null;
} = {
  setProfile: null,
  setToken: null,
};

export const clearUserProfileState = () => {
  if (globalProfileState.setProfile) {
    console.log('🧹 [PROFILE] Clearing user profile state globally');
    globalProfileState.setProfile(null);
  }
  // ✅ FIX: Also reset token tracking to force re-detection
  if (globalProfileState.setToken) {
    globalProfileState.setToken(null);
  }
};

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // ✅ FIX: Track current token to detect changes (not just null)
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // ✅ FIX: Register setProfile and setToken functions globally so they can be cleared from anywhere
  useEffect(() => {
    globalProfileState.setProfile = setUserProfile;
    globalProfileState.setToken = setCurrentToken;
    return () => {
      globalProfileState.setProfile = null;
      globalProfileState.setToken = null;
    };
  }, []);

  // ✅ FIX: Initialize token tracking on mount
  useEffect(() => {
    const initToken = async () => {
      const token = await storage.getToken();
      setCurrentToken(token);
      // If no token but profile exists, clear it
      if (!token && userProfile) {
        console.log('🧹 [PROFILE] No token on mount but profile exists, clearing');
        setUserProfile(null);
      }
    };
    initToken();
  }, []); // Only run on mount

  // ✅ FIX: Clear profile state when token changes (account switch) - detect token VALUE changes
  useEffect(() => {
    const checkTokenChange = async () => {
      const token = await storage.getToken();

      // If token was removed, clear profile
      if (!token && userProfile) {
        console.log('🧹 [PROFILE] Token removed, clearing profile state');
        setUserProfile(null);
        setCurrentToken(null);
        return;
      }

      // ✅ CRITICAL FIX: If token CHANGED (different value), clear profile
      // This handles account switching where old token is replaced with new token
      if (token && currentToken && token !== currentToken) {
        console.log('🧹 [PROFILE] Token changed (account switch detected), clearing profile state');
        console.log('🧹 [PROFILE] Old token:', currentToken.substring(0, 10) + '...');
        console.log('🧹 [PROFILE] New token:', token.substring(0, 10) + '...');
        setUserProfile(null);
        setCurrentToken(token);
        return;
      }

      // Update current token if it's the first time or token was restored
      if (token !== currentToken) {
        setCurrentToken(token);
      }
    };

    // Check token on mount and periodically
    checkTokenChange();
    const interval = setInterval(checkTokenChange, 500); // Check more frequently
    return () => clearInterval(interval);
  }, [userProfile, currentToken]);

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ✅ FIX: Get current token before fetching to ensure we're using the right token
      const token = await storage.getToken();
      if (!token) {
        console.log('⚠️ [PROFILE] No token available, cannot fetch profile');
        setUserProfile(null);
        setCurrentToken(null);
        return;
      }

      // ✅ FIX: If token changed since last fetch, clear profile first
      if (currentToken && token !== currentToken) {
        console.log('🧹 [PROFILE] Token changed during fetch, clearing old profile');
        setUserProfile(null);
        setCurrentToken(token);
      }

      // ✅ FIX: Clear profile state before fetching to prevent showing old data
      setUserProfile(null);

      console.log('🔄 [PROFILE] Fetching user profile with token:', token.substring(0, 10) + '...');
      const me = await userAPI.getMe();
      console.log('✅ [PROFILE] User profile fetched:', {
        email: me.email,
        firstName: me.firstName,
        lastName: me.lastName,
      });

      // ✅ FIX: Verify token hasn't changed during fetch
      const verifyToken = await storage.getToken();
      if (verifyToken !== token) {
        console.log('⚠️ [PROFILE] Token changed during fetch, discarding result');
        setUserProfile(null);
        setCurrentToken(verifyToken);
        return;
      }

      setUserProfile(me as UserProfile);
      setCurrentToken(token); // Update tracked token
    } catch (e: any) {
      console.error('❌ [PROFILE] Failed to fetch profile:', e);
      setError(e?.message || 'Failed to fetch profile');
      // ✅ FIX: Clear profile on error (might be from different account)
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentToken]);

  const updateUserProfile = useCallback(async (payload: UserUpdateRequest) => {
    const updated = await userAPI.updateMe(payload);
    setUserProfile(updated as UserProfile);
    return updated as UserProfile;
  }, []);

  // ✅ FIX: Fetch on mount
  useEffect(() => {
    void fetchUserProfile();
  }, [fetchUserProfile]);

  // ✅ FIX: Refetch when screen is focused to ensure fresh data after account switch
  useFocusEffect(
    useCallback(() => {
      // Clear profile state first, then refetch
      setUserProfile(null);
      void fetchUserProfile();
    }, [fetchUserProfile])
  );

  return { userProfile, isLoading, error, fetchUserProfile, updateUserProfile, setUserProfile };
};


