import { useState, useCallback, useEffect } from 'react';
import { userAPI } from '../../users/api/user_api';
import type { UserSearchResponse } from '../../users/models/UserModels';
import type { WitnessInfo } from '../models/report';

export const useWitnessSearch = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await userAPI.searchUsers({
        query: query.trim(),
        page: 0,
        size: 10,
      });
      setSearchResults(response.content);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const selectUser = useCallback((user: UserSearchResponse): WitnessInfo => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
    
    return {
      userId: user.id,
      name: user.fullName,
      contact: user.email,
      additionalNotes: '',
      isRegisteredUser: true,
    };
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    selectUser,
    clearSearch,
  };
};
