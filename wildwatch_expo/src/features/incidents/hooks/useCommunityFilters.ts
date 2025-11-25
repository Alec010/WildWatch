import { useState, useCallback, useMemo } from 'react';
import type { IncidentResponseDto } from '../models/IncidentModels';
import type { OfficeBulletinDto } from '../../bulletins/models/BulletinModels';
import type { OfficeInfo } from '../../offices/models/OfficeModels';

interface UseCommunityFiltersOptions {
  incidents: IncidentResponseDto[];
  bulletins: OfficeBulletinDto[];
  offices: OfficeInfo[];
}

export const useCommunityFilters = ({
  incidents,
  bulletins,
  offices,
}: UseCommunityFiltersOptions) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [officeFilter, setOfficeFilter] = useState<string>('All');
  const [incidentSortOrder, setIncidentSortOrder] = useState<'asc' | 'desc'>('desc');
  const [bulletinSortOrder, setBulletinSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    let filtered = [...incidents];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.trackingNumber || '').toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(
        (i) => (i.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.dateOfIncident).getTime();
      const dateB = new Date(b.dateOfIncident).getTime();
      return incidentSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [incidents, searchQuery, statusFilter, incidentSortOrder]);

  // Filter bulletins
  const filteredBulletins = useMemo(() => {
    let filtered = [...bulletins];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }

    // Office filter
    if (officeFilter !== 'All') {
      filtered = filtered.filter((b) => {
        const filterWithAdmin = `${officeFilter} Admin`;
        return b.createdBy.toLowerCase() === filterWithAdmin.toLowerCase();
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return bulletinSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [bulletins, searchQuery, officeFilter, bulletinSortOrder]);

  // Get unique statuses
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(
      incidents.map((i) => i.status || 'Unknown').filter(Boolean)
    );
    return ['All', ...Array.from(statuses)];
  }, [incidents]);

  // Get unique offices
  const uniqueOffices = useMemo(() => {
    if (!offices || offices.length === 0) {
      return ['All'];
    }
    const officeNames = offices
      .map((office) => office.fullName)
      .filter(Boolean)
      .sort();
    return ['All', ...officeNames];
  }, [offices]);

  const toggleIncidentSort = useCallback(() => {
    setIncidentSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  }, []);

  const toggleBulletinSort = useCallback(() => {
    setBulletinSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  }, []);

  return {
    // State
    searchQuery,
    statusFilter,
    officeFilter,
    incidentSortOrder,
    bulletinSortOrder,
    
    // Setters
    setSearchQuery,
    setStatusFilter,
    setOfficeFilter,
    setIncidentSortOrder,
    setBulletinSortOrder,
    toggleIncidentSort,
    toggleBulletinSort,
    
    // Filtered data
    filteredIncidents,
    filteredBulletins,
    
    // Options
    uniqueStatuses,
    uniqueOffices,
  };
};

