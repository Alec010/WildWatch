import { useState, useCallback } from 'react';
import { usePublicIncidents } from './usePublicIncidents';
import { useBulletins } from '../../bulletins/hooks/useBulletins';
import { useOffices } from '../../offices/hooks/useOffices';
import { useDeviceLayout } from './useDeviceLayout';
import { usePagination } from './usePagination';
import { useCommunityFilters } from './useCommunityFilters';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';

export const useCommunityCases = () => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Data hooks
  const {
    incidents,
    isLoading: incidentsLoading,
    error: incidentsError,
    refresh: refreshIncidents,
  } = usePublicIncidents();

  const {
    bulletins,
    isLoading: bulletinsLoading,
    error: bulletinsError,
    refresh: refreshBulletins,
  } = useBulletins();

  const {
    offices,
    isLoading: officesLoading,
    error: officesError,
  } = useOffices();

  // Device layout
  const deviceLayout = useDeviceLayout();

  // Filters
  const filters = useCommunityFilters({
    incidents,
    bulletins,
    offices,
  });

  // Pagination for incidents
  const incidentsPagination = usePagination({
    data: filters.filteredIncidents,
    itemsPerPage: deviceLayout.itemsPerPage,
  });

  // Pagination for bulletins
  const bulletinsPagination = usePagination({
    data: filters.filteredBulletins,
    itemsPerPage: deviceLayout.itemsPerPage,
  });

  // Get current pagination based on selected tab
  const currentPagination = selectedTab === 0 ? incidentsPagination : bulletinsPagination;
  const currentFilteredData = selectedTab === 0 ? filters.filteredIncidents : filters.filteredBulletins;

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (selectedTab === 0) {
      await refreshIncidents();
    } else {
      await refreshBulletins();
    }
    setIsRefreshing(false);
  }, [selectedTab, refreshIncidents, refreshBulletins]);

  // Reset pagination when tab changes
  React.useEffect(() => {
    incidentsPagination.resetPage();
    bulletinsPagination.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  // Reset pagination when filters change
  React.useEffect(() => {
    incidentsPagination.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchQuery, filters.statusFilter, filters.incidentSortOrder]);

  React.useEffect(() => {
    bulletinsPagination.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchQuery, filters.officeFilter, filters.bulletinSortOrder]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshIncidents();
      refreshBulletins();
    }, [refreshIncidents, refreshBulletins])
  );

  return {
    // Data
    incidents,
    bulletins,
    offices,
    
    // Loading states
    incidentsLoading,
    bulletinsLoading,
    officesLoading,
    isRefreshing,
    
    // Errors
    incidentsError,
    bulletinsError,
    officesError,
    
    // Device layout
    ...deviceLayout,
    
    // Filters
    ...filters,
    
    // Pagination
    incidentsPagination,
    bulletinsPagination,
    currentPagination,
    currentFilteredData,
    
    // UI state
    selectedTab,
    setSelectedTab,
    
    // Actions
    onRefresh,
    refreshIncidents,
    refreshBulletins,
  };
};

