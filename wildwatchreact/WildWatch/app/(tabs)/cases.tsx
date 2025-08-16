import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchCases();
    }
  }, [token]);

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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchCases();
    setIsRefreshing(false);
  };

  const handleCaseClick = (trackingNumber: string) => {
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
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text className="text-[#8B0000] mt-2">Loading cases...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-[#8B0000]">Case Tracking</Text>
        <Text className="text-gray-600 mt-1">Track your reported cases here</Text>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <Text className="text-red-800 text-center">{error}</Text>
            <TouchableOpacity
              className="bg-[#8B0000] rounded-lg px-4 py-2 mt-2"
              onPress={fetchCases}
            >
              <Text className="text-white text-center font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : incidents.length === 0 ? (
          <View className="bg-white rounded-lg p-8 mt-4 items-center">
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center text-lg">
              No cases found
            </Text>
            <Text className="text-gray-400 mt-2 text-center">
              You haven't submitted any incidents yet.
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            {incidents.map((incident) => (
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
                        className="rounded-full px-3 py-1"
                        style={{
                          backgroundColor: `${getStatusColor(incident.status)}20`
                        }}
                      >
                        <Text
                          className="font-medium text-xs"
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
                        {formatDate(incident.dateOfIncident)} at {incident.timeOfIncident}
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
