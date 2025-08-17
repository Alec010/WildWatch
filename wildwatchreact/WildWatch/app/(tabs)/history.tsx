import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// API Base URL - same as AuthContext
const API_BASE_URL = 'http://192.168.1.11:8080/api';

interface Incident {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  assignedOffice: string;
  priorityLevel: string;
  status: string;
  submittedBy: string;
  submittedByFullName: string;
  submittedByEmail: string;
  submittedByPhone: string;
  submittedAt: string;
  verified: boolean;
  upvoteCount: number;
}

export default function HistoryScreen() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    filterIncidents();
  }, [incidents, searchQuery, selectedStatus]);

  const fetchHistory = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/my-incidents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

      const historyData = await response.json();
      setIncidents(historyData);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      setError(error.message || 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  };

  const filterIncidents = () => {
    let filtered = incidents;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(incident =>
        incident.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(incident =>
        incident.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    setFilteredIncidents(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
  };

  const handleIncidentClick = (trackingNumber: string) => {
    router.push(`/tracking/${trackingNumber}` as any);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return '#1976D2';
      case 'resolved':
        return '#4CAF50';
      case 'urgent':
        return '#F44336';
      case 'pending':
      default:
        return '#FFA000';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'time';
      case 'resolved':
        return 'checkmark-circle';
      case 'urgent':
        return 'warning';
      case 'pending':
      default:
        return 'time';
    }
  };

  const getIncidentTypeIcon = (incidentType: string) => {
    switch (incidentType.toLowerCase()) {
      case 'theft':
        return 'shield-outline';
      case 'vandalism':
        return 'hammer-outline';
      case 'assault':
        return 'warning-outline';
      case 'harassment':
        return 'person-remove-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  const getIncidentTypeColor = (incidentType: string) => {
    switch (incidentType.toLowerCase()) {
      case 'theft':
        return '#EF4444';
      case 'vandalism':
        return '#F59E0B';
      case 'assault':
        return '#DC2626';
      case 'harassment':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  // Calculate counts
  const allCount = incidents.length;
  const resolvedCount = incidents.filter(i => i.status.toLowerCase() === 'resolved').length;
  const dismissedCount = incidents.filter(i => i.status.toLowerCase() === 'dismissed').length;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text className="text-[#8B0000] mt-2">Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-bold text-[#8B0000]">History</Text>
          <Text className="text-gray-600 mt-1">View and manage your incident history.</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View className="bg-white rounded-3xl border border-gray-200 flex-row items-center px-4 py-3 mt-4 mb-4">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-base"
            placeholder="Search incidents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Status Cards */}
        <View className="flex-row mb-4">
          {[
            { status: 'All', count: allCount, title: 'All Cases' },
            { status: 'Resolved', count: resolvedCount, title: 'Resolved' },
            { status: 'Dismissed', count: dismissedCount, title: 'Dismissed' }
          ].map((item, index) => (
            <TouchableOpacity
              key={item.status}
              className={`flex-1 bg-white rounded-xl p-3 items-center ${
                selectedStatus === item.status ? 'bg-gray-100' : ''
              } ${index > 0 ? 'ml-2' : ''}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              }}
              onPress={() => setSelectedStatus(item.status)}
            >
              <Text className="text-2xl font-bold text-[#8B0000]">{item.count}</Text>
              <Text className="text-xs text-gray-600 mt-1">{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <Text className="text-red-800 text-center">{error}</Text>
            <TouchableOpacity
              className="bg-[#8B0000] rounded-lg px-4 py-2 mt-2"
              onPress={fetchHistory}
            >
              <Text className="text-white text-center font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredIncidents.length === 0 ? (
          <View className="bg-white rounded-lg p-8 mt-4 items-center">
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center text-lg">
              No incidents found
            </Text>
            <Text className="text-gray-400 mt-2 text-center">
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            {filteredIncidents.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                className="bg-white rounded-lg mb-3 shadow-sm"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={() => handleIncidentClick(incident.trackingNumber)}
              >
                <View className="flex-row">
                  {/* Left border indicator */}
                  <View
                    className="rounded-l-lg"
                    style={{
                      width: 6,
                      backgroundColor: getStatusColor(incident.status)
                    }}
                  />
                  
                  <View className="flex-1 p-4">
                    {/* Title and status */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-gray-900 text-lg flex-1 mr-2">
                        {incident.incidentType}
                      </Text>
                      <View
                        className="rounded-full px-3 py-1 flex-row items-center"
                        style={{
                          backgroundColor: `${getStatusColor(incident.status)}20`
                        }}
                      >
                        <Ionicons 
                          name={getStatusIcon(incident.status) as any} 
                          size={12} 
                          color={getStatusColor(incident.status)} 
                        />
                        <Text
                          className="font-medium text-xs ml-1"
                          style={{ color: getStatusColor(incident.status) }}
                        >
                          {incident.status}
                        </Text>
                      </View>
                    </View>

                    {/* Tracking number */}
                    <Text className="text-gray-600 text-sm mb-2">
                      Tracking: {incident.trackingNumber}
                    </Text>

                    {/* Location */}
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text className="text-gray-500 ml-1 flex-1" numberOfLines={1}>
                        {incident.location}
                      </Text>
                    </View>

                    {/* Date and time */}
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar" size={16} color="#6B7280" />
                      <Text className="text-gray-500 ml-1">
                        {formatDate(incident.submittedAt)}
                      </Text>
                    </View>

                    {/* Description */}
                    <Text className="text-gray-700 text-sm" numberOfLines={2}>
                      {incident.description}
                    </Text>

                    {/* Footer */}
                    <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons name="thumbs-up" size={16} color="#6B7280" />
                        <Text className="text-gray-500 ml-1 text-sm">
                          {incident.upvoteCount || 0}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center">
                        <Ionicons name="eye" size={16} color="#8B0000" />
                        <Text className="text-[#8B0000] ml-1 text-sm font-medium">
                          View Details
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
