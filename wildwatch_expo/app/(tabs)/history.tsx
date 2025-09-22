import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import TopSpacing from '../../components/TopSpacing';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useMyHistory } from '../../src/features/incidents/hooks/useMyHistory';
import type { IncidentResponseDto } from '../../src/features/incidents/models/IncidentModels';

export default function HistoryScreen() {
  const { incidents, isLoading, error, refresh } = useMyHistory();
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentResponseDto[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  useEffect(() => { filterIncidents(); }, [incidents, searchQuery, selectedStatus]);

  const filterIncidents = () => {
    let filtered = incidents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((i) => (i.trackingNumber || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    if (selectedStatus !== 'All') {
      filtered = filtered.filter((i) => (i.status || '').toLowerCase() === selectedStatus.toLowerCase());
    }
    setFilteredIncidents(filtered);
  };

  const onRefresh = async () => { setIsRefreshing(true); await refresh(); setIsRefreshing(false); };

  const handleIncidentClick = (trackingNumber?: string) => { if (!trackingNumber) return; router.push(`/case/${trackingNumber}` as never); };

  const getStatusColor = (status?: string | null): string => {
    const s = (status || '').toLowerCase();
    if (s === 'in progress') return '#1976D2';
    if (s === 'resolved') return '#4CAF50';
    if (s === 'urgent') return '#F44336';
    return '#FFA000';
  };

  const getStatusIcon = (status?: string | null): keyof typeof Ionicons.glyphMap => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved') return 'checkmark-circle';
    if (s === 'urgent') return 'warning';
    return 'time';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch { return 'N/A'; }
  };

  const allCount = incidents.length;
  const resolvedCount = incidents.filter((i) => (i.status || '').toLowerCase() === 'resolved').length;
  const dismissedCount = incidents.filter((i) => (i.status || '').toLowerCase() === 'dismissed').length;

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text className="text-[#8B0000] mt-2">Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'History' }} />
      
      {/* Top spacing for notch */}
      <TopSpacing />
      
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-bold text-[#8B0000]">History</Text>
          <Text className="text-gray-600 mt-1">View and manage your incident history.</Text>
        </View>
      </View>

      {/* Fixed Search Bar */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="bg-white rounded-3xl border border-gray-200 flex-row items-center px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput className="flex-1 ml-3 text-base" placeholder="Search incidents..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9CA3AF" />
        </View>
      </View>

      {/* Fixed Filter Buttons */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row">
          {[
            { status: 'All', count: allCount, title: 'All Cases' },
            { status: 'Resolved', count: resolvedCount, title: 'Resolved' },
            { status: 'Dismissed', count: dismissedCount, title: 'Dismissed' },
          ].map((item, index) => (
            <TouchableOpacity key={item.status} className={`flex-1 bg-white rounded-xl p-3 items-center ${selectedStatus === item.status ? 'bg-gray-100' : ''} ${index > 0 ? 'ml-2' : ''}`} style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }} onPress={() => setSelectedStatus(item.status)}>
              <Text className="text-2xl font-bold text-[#8B0000]">{item.count}</Text>
              <Text className="text-xs text-gray-600 mt-1">{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <Text className="text-red-800 text-center">{error}</Text>
            <TouchableOpacity className="bg-[#8B0000] rounded-lg px-4 py-2 mt-2" onPress={refresh}>
              <Text className="text-white text-center font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredIncidents.length === 0 ? (
          <View className="bg-white rounded-lg p-8 mt-4 items-center">
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center text-lg">No incidents found</Text>
            <Text className="text-gray-400 mt-2 text-center">Try adjusting your search or filters</Text>
          </View>
        ) : (
          <View className="mt-4">
            {filteredIncidents.map((incident) => (
              <TouchableOpacity key={incident.id} className="bg-white rounded-lg mb-3 shadow-sm" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }} onPress={() => handleIncidentClick(incident.trackingNumber)}>
                <View className="flex-row">
                  <View className="rounded-l-lg" style={{ width: 6, backgroundColor: getStatusColor(incident.status) }} />
                  <View className="flex-1 p-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-gray-900 text-lg flex-1 mr-2">{incident.incidentType}</Text>
                      <View className="rounded-full px-3 py-1 flex-row items-center" style={{ backgroundColor: `${getStatusColor(incident.status)}20` }}>
                        <Ionicons name={getStatusIcon(incident.status)} size={12} color={getStatusColor(incident.status)} />
                        <Text className="font-medium text-xs ml-1" style={{ color: getStatusColor(incident.status) }}>{incident.status}</Text>
                      </View>
                    </View>
                    <Text className="text-gray-600 text-sm mb-2">Tracking: {incident.trackingNumber}</Text>
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text className="text-gray-500 ml-1 flex-1" numberOfLines={1}>{incident.location}</Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar" size={16} color="#6B7280" />
                      <Text className="text-gray-500 ml-1">{formatDate(incident.submittedAt)}</Text>
                    </View>
                    <Text className="text-gray-700 text-sm" numberOfLines={2}>{incident.description}</Text>
                    <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons name="thumbs-up" size={16} color="#6B7280" />
                        <Text className="text-gray-500 ml-1 text-sm">{incident.upvoteCount || 0}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="eye" size={16} color="#8B0000" />
                        <Text className="text-[#8B0000] ml-1 text-sm font-medium">View Details</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

