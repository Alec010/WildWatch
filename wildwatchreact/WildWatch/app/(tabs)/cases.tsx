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

export default function CasesScreen() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTab, setSelectedTab] = useState(0);

  const priorities = ['All', 'High', 'Medium', 'Low'];

  useEffect(() => {
    if (token) {
      fetchCases();
    }
  }, [token]);

  useEffect(() => {
    filterIncidents();
  }, [incidents, searchQuery, selectedPriority, selectedStatus]);

  const fetchCases = async () => {
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
        throw new Error(`Failed to fetch cases: ${response.status}`);
      }

      const casesData = await response.json();
      setIncidents(casesData);
    } catch (error: any) {
      console.error('Error fetching cases:', error);
      setError(error.message || 'Failed to fetch cases');
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

    // Apply priority filter
    if (selectedPriority !== 'All') {
      filtered = filtered.filter(incident =>
        incident.priorityLevel?.toLowerCase() === selectedPriority.toLowerCase()
      );
    }

    // Apply status filter
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(incident =>
        incident.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    setFilteredIncidents(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchCases();
    setIsRefreshing(false);
  };

  const handleCaseClick = (trackingNumber: string) => {
    router.push(`/caseDetails/${trackingNumber}` as any);
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#FFA000'; // Default color for null/undefined status
    
    switch (status.toLowerCase()) {
      case 'in progress':
        return '#2196F3';
      case 'resolved':
        return '#4CAF50';
      case 'urgent':
        return '#F44336';
      case 'pending':
      default:
        return '#FFA000';
    }
  };

  const getPriorityColor = (priority: string) => {
    if (!priority) return '#757575'; // Default color for null/undefined priority
    
    switch (priority.toLowerCase()) {
      case 'high':
        return '#E53935';
      case 'medium':
        return '#FFA000';
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return 'information-circle'; // Default icon for null/undefined status
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'time';
      case 'in progress':
        return 'time';
      case 'resolved':
        return 'checkmark-circle';
      default:
        return 'information-circle';
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

  // Calculate counts
  const pendingCount = incidents.filter(i => i.status?.toLowerCase() === 'pending').length;
  const inProgressCount = incidents.filter(i => i.status?.toLowerCase() === 'in progress').length;
  const allCount = incidents.length;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#B71C1C" />
          <Text className="text-[#B71C1C] mt-2">Loading cases...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-bold text-[#B71C1C]">Case Tracking</Text>
          <Text className="text-gray-600 mt-1">Track the status of your incident reports.</Text>
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

        {/* Priority Filters */}
        <View className="flex-row mb-4">
          {priorities.map((priority, index) => (
            <TouchableOpacity
              key={priority}
              className={`px-4 py-2 rounded-lg ${
                selectedPriority === priority ? 'bg-[#B71C1C]' : 'bg-white'
              } ${index > 0 ? 'ml-2' : ''}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={() => setSelectedPriority(priority)}
            >
              <Text
                className={`font-medium ${
                  selectedPriority === priority ? 'text-white' : 'text-black'
                }`}
              >
                {priority}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Cards */}
        <View className="flex-row mb-4">
          {[
            { status: 'Pending', count: pendingCount },
            { status: 'In Progress', count: inProgressCount },
            { status: 'All', count: allCount }
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
              <Text className="text-2xl font-bold text-[#B71C1C]">{item.count}</Text>
              <Text className="text-xs text-[#374151] mt-1">
                {item.status === 'All' ? 'All Cases' : item.status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <View className="bg-gray-100 rounded-xl p-1 mb-4">
          <View className="flex-row">
            {['My Cases', 'Recent Activity'].map((tab, index) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 py-3 px-2 rounded-lg ${
                  selectedTab === index ? 'bg-white' : 'bg-transparent'
                }`}
                onPress={() => setSelectedTab(index)}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedTab === index ? 'text-[#B71C1C] font-bold' : 'text-gray-500'
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        {selectedTab === 0 ? (
          // My Cases Tab
          <>
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <Text className="text-red-800 text-center">{error}</Text>
                <TouchableOpacity
                  className="bg-[#B71C1C] rounded-lg px-4 py-2 mt-2"
                  onPress={fetchCases}
                >
                  <Text className="text-white text-center font-medium">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredIncidents.length === 0 ? (
              <View className="bg-white rounded-lg p-8 mt-4 items-center">
                <Text className="text-gray-500 text-center">
                  No cases found matching your criteria
                </Text>
              </View>
            ) : (
              <View className="mb-4">
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
                    onPress={() => handleCaseClick(incident.trackingNumber)}
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
                              {incident.status || 'Unknown'}
                            </Text>
                          </View>
                        </View>

                        {/* Tracking number */}
                        <Text className="text-gray-600 text-sm mb-2">
                          Tracking: {incident.trackingNumber || 'Unknown'}
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
                            {formatDate(incident.dateOfIncident)} {incident.timeOfIncident}
                          </Text>
                        </View>

                        {/* Assigned office if available */}
                        {incident.assignedOffice && (
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="person" size={16} color="#6B7280" />
                            <Text className="text-gray-500 ml-1">
                              Assigned to: {incident.assignedOffice}
                            </Text>
                          </View>
                        )}

                        {/* Description if available */}
                        {incident.description && (
                          <Text className="text-gray-700 text-sm mt-2" numberOfLines={2}>
                            {incident.description}
                          </Text>
                        )}

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
          </>
        ) : (
          // Recent Activity Tab
          <View className="bg-white rounded-lg p-8 mt-4 items-center">
            <Text className="text-gray-500 text-center">
              No recent activity
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
