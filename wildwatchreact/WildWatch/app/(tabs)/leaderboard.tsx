import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device-specific constants for iPhone compatibility
const isIPhone = Platform.OS === 'ios';
const isSmallIPhone = screenHeight <= 667; // iPhone SE, iPhone 8
const isMediumIPhone = screenHeight > 667 && screenHeight <= 812; // iPhone X, XS, 11 Pro, 12 mini
const isLargeIPhone = screenHeight > 812 && screenHeight <= 844; // iPhone XR, 11, 12, 13
const isXLargeIPhone = screenHeight > 844 && screenHeight <= 932; // iPhone 12 Pro Max, 13 Pro Max, 14 Plus, 15 Plus
const isIPhone15Pro = screenHeight > 932 && screenHeight <= 1000; // iPhone 15 Pro, 16 Pro, 17 Pro
const isIPhone15ProMax = screenHeight > 1000; // iPhone 15 Pro Max, 16 Pro Max, 17 Pro Max

// Responsive spacing and sizing
const getResponsiveSpacing = () => {
  if (isSmallIPhone) return { small: 8, medium: 12, large: 16, xlarge: 20 };
  if (isMediumIPhone) return { small: 10, medium: 14, large: 18, xlarge: 24 };
  if (isLargeIPhone) return { small: 12, medium: 16, large: 20, xlarge: 28 };
  if (isXLargeIPhone) return { small: 14, medium: 18, large: 22, xlarge: 30 };
  if (isIPhone15Pro) return { small: 16, medium: 20, large: 24, xlarge: 32 };
  return { small: 18, medium: 22, large: 26, xlarge: 34 }; // iPhone 15 Pro Max and larger
};

const spacing = getResponsiveSpacing();

// Responsive font sizes
const getResponsiveFontSize = () => {
  if (isSmallIPhone) return { small: 10, medium: 12, large: 14, xlarge: 16, xxlarge: 20, title: 22 };
  if (isMediumIPhone) return { small: 11, medium: 13, large: 15, xlarge: 17, xxlarge: 22, title: 24 };
  if (isLargeIPhone) return { small: 12, medium: 14, large: 16, xlarge: 18, xxlarge: 24, title: 26 };
  if (isXLargeIPhone) return { small: 13, medium: 15, large: 17, xlarge: 19, xxlarge: 25, title: 27 };
  if (isIPhone15Pro) return { small: 14, medium: 16, large: 18, xlarge: 20, xxlarge: 26, title: 28 };
  return { small: 15, medium: 17, large: 19, xlarge: 21, xxlarge: 27, title: 29 }; // iPhone 15 Pro Max and larger
};

const fontSize = getResponsiveFontSize();

// Responsive icon sizes
const getResponsiveIconSize = () => {
  if (isSmallIPhone) return { small: 12, medium: 16, large: 20, xlarge: 24 };
  if (isMediumIPhone) return { small: 14, medium: 18, large: 22, xlarge: 26 };
  if (isLargeIPhone) return { small: 16, medium: 20, large: 24, xlarge: 28 };
  if (isXLargeIPhone) return { small: 18, medium: 22, large: 26, xlarge: 30 };
  if (isIPhone15Pro) return { small: 20, medium: 24, large: 28, xlarge: 32 };
  return { small: 22, medium: 26, large: 30, xlarge: 34 }; // iPhone 15 Pro Max and larger
};

const iconSize = getResponsiveIconSize();

// API Base URL - same as AuthContext
const API_BASE_URL = 'http://192.168.1.11:8080/api';

interface LeaderboardEntry {
  id: number | string; // Backend uses Long, can be converted to string
  name: string;
  totalIncidents: number | null;
  averageRating: number | null;
  points: number | null;
  activeIncidents?: number | null;
  resolvedIncidents?: number | null;
}

export default function LeaderboardScreen() {
  const { user, token } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Students, 1: Offices
  const [topReporters, setTopReporters] = useState<LeaderboardEntry[]>([]);
  const [topOffices, setTopOffices] = useState<LeaderboardEntry[]>([]);

  // Debug logging
  console.log('LeaderboardScreen render:', {
    hasUser: !!user,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    isLoading,
    error,
    reportersCount: topReporters.length,
    officesCount: topOffices.length
  });

  useEffect(() => {
    if (token && user) {
      // Validate token format
      if (token.length < 10) {
        setError('Invalid token format');
        setIsLoading(false);
        return;
      }
      
      console.log('Token validation passed, fetching leaderboard...');
      fetchLeaderboard();
    } else if (!token) {
      setError('Authentication required. Please login again.');
      setIsLoading(false);
    } else if (!user) {
      setError('User data not available. Please wait...');
      setIsLoading(false);
    }
  }, [token, user]);

  const fetchLeaderboard = async () => {
    if (!token) {
      setError('No authentication token available');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching leaderboard with token:', token.substring(0, 20) + '...');
      
      // Test connection first
      const connectionTest = await fetch(`${API_BASE_URL}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!connectionTest.ok) {
        throw new Error(`Cannot connect to server: ${connectionTest.status}`);
      }
      
      console.log('Connection test passed, proceeding with API calls...');
      
      // Fetch top reporters
      const reportersResponse = await fetch(`${API_BASE_URL}/ratings/leaderboard/reporters/top`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Reporters response status:', reportersResponse.status);
      
      if (!reportersResponse.ok) {
        const errorText = await reportersResponse.text();
        console.error('Reporters API error:', errorText);
        throw new Error(`Failed to fetch top reporters: ${reportersResponse.status} - ${errorText}`);
      }

      const reportersData = await reportersResponse.json();
      console.log('Reporters data received:', reportersData);
      setTopReporters(reportersData);

      // Fetch top offices
      const officesResponse = await fetch(`${API_BASE_URL}/ratings/leaderboard/offices/top`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Offices response status:', officesResponse.status);
      
      if (!officesResponse.ok) {
        const errorText = await officesResponse.text();
        console.error('Offices API error:', errorText);
        throw new Error(`Failed to fetch top offices: ${officesResponse.status} - ${errorText}`);
      }

      const officesData = await officesResponse.json();
      console.log('Offices data received:', officesData);
      setTopOffices(officesData);
      
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network error: Cannot connect to server. Please check your internet connection.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        setError('Authentication failed. Please login again.');
      } else if (error.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else if (error.message.includes('404')) {
        setError('Leaderboard data not found. Please try again later.');
      } else {
        setError(error.message || 'Failed to load leaderboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeaderboard();
    setIsRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#4A5568'; // Gray
    }
  };

  if (!user || !token) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons 
            name="person-circle-outline" 
            size={48} 
            color="#8B0000" 
          />
          <Text 
            className="text-[#8B0000] mt-4 text-center"
            style={{ fontSize: fontSize.medium }}
          >
            {!token ? 'Authentication required' : 'User data not available'}
          </Text>
          <Text 
            className="text-gray-500 mt-2 text-center"
            style={{ fontSize: fontSize.small }}
          >
            {!token ? 'Please login again to access leaderboards' : 'Please wait while loading user data'}
          </Text>
          {!token && (
            <TouchableOpacity
              className="bg-[#8B0000] rounded-xl px-6 py-3 mt-4"
              onPress={() => router.push('/login')}
            >
              <Text className="text-white font-medium">Go to Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Top App Bar */}
        <View 
          className="bg-white flex-row justify-between items-center border-b border-gray-200"
          style={{ 
            paddingHorizontal: spacing.large,
            paddingVertical: isSmallIPhone ? 6 : isMediumIPhone ? 8 : isLargeIPhone ? 10 : isXLargeIPhone ? 12 : isIPhone15Pro ? 14 : 16,
            height: isSmallIPhone ? 45 : isMediumIPhone ? 55 : isLargeIPhone ? 65 : isXLargeIPhone ? 70 : isIPhone15Pro ? 75 : 80
          }}
        >
          <View className="flex-row items-center">
            <Text 
              className="font-bold text-[#8B0000]"
              style={{ fontSize: fontSize.title }}
            >
              Leaderboard
            </Text>
          </View>
          
          <View className="flex-row items-center space-x-3">
            {/* Profile Button - Removed from Leaderboard */}
          </View>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text 
            className="text-[#8B0000] mt-2"
            style={{ fontSize: fontSize.medium }}
          >
            Loading leaderboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Top App Bar */}
      <View 
        className="bg-white flex-row justify-between items-center border-b border-gray-200"
        style={{ 
          paddingHorizontal: spacing.large,
          paddingVertical: isSmallIPhone ? 6 : isMediumIPhone ? 8 : isLargeIPhone ? 10 : isXLargeIPhone ? 12 : isIPhone15Pro ? 14 : 16,
          height: isSmallIPhone ? 45 : isMediumIPhone ? 55 : isLargeIPhone ? 65 : isXLargeIPhone ? 70 : isIPhone15Pro ? 75 : 80
        }}
      >
        <View className="flex-row items-center">
          <View>
            <Text 
              className="font-bold text-[#8B0000]"
              style={{ fontSize: fontSize.title }}
            >
              Leaderboard
            </Text>
            <Text 
              className="text-gray-600"
              style={{ fontSize: fontSize.small }}
            >
              See who's leading in incident reporting.
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center space-x-2">
          {/* Profile Button - Removed from Leaderboard */}
        </View>
      </View>

      {/* Custom Tab Row */}
      <View className="bg-white shadow-sm">
        <View className="flex-row px-4 py-2">
          <TouchableOpacity 
            className={`flex-1 items-center py-3 rounded-lg ${selectedTab === 0 ? 'bg-red-50' : ''}`}
            onPress={() => setSelectedTab(0)}
          >
            <Ionicons 
              name="school-outline" 
              size={iconSize.medium} 
              color={selectedTab === 0 ? '#8B0000' : '#6B7280'} 
            />
            <Text 
              className={`mt-1 font-medium ${selectedTab === 0 ? 'text-[#8B0000]' : 'text-gray-500'}`}
              style={{ fontSize: fontSize.small }}
            >
              Students
            </Text>
            {selectedTab === 0 && (
              <View className="w-10 h-0.5 bg-[#8B0000] rounded mt-2" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            className={`flex-1 items-center py-3 rounded-lg ${selectedTab === 1 ? 'bg-red-50' : ''}`}
            onPress={() => setSelectedTab(1)}
          >
            <Ionicons 
              name="business" 
              size={iconSize.medium} 
              color={selectedTab === 1 ? '#8B0000' : '#6B7280'} 
            />
            <Text 
              className={`mt-1 font-medium ${selectedTab === 1 ? 'text-[#8B0000]' : 'text-gray-500'}`}
              style={{ fontSize: fontSize.small }}
            >
              Offices
            </Text>
            {selectedTab === 1 && (
              <View className="w-10 h-0.5 bg-[#8B0000] rounded mt-2" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color="#8B0000" />
          <Text 
            className="text-gray-600 mt-4 text-center"
            style={{ fontSize: fontSize.large }}
          >
            {error}
          </Text>
          <TouchableOpacity
            className="bg-[#8B0000] rounded-lg px-6 py-3 mt-4"
            onPress={fetchLeaderboard}
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (selectedTab === 0 ? topReporters : topOffices).length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
          <Text 
            className="text-gray-500 mt-4 text-center"
            style={{ fontSize: fontSize.large }}
          >
            No leaderboard data available
          </Text>
          <Text 
            className="text-gray-400 mt-2 text-center"
            style={{ fontSize: fontSize.medium }}
          >
            {selectedTab === 0 ? 'No students have been rated yet' : 'No offices have been rated yet'}
          </Text>
          <TouchableOpacity
            className="bg-[#8B0000] rounded-lg px-6 py-3 mt-4"
            onPress={fetchLeaderboard}
          >
            <Text className="text-white font-medium">Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          style={{ paddingHorizontal: spacing.large }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Leaderboard List */}
          <View className="py-4 space-y-3">
            {(selectedTab === 0 ? topReporters : topOffices).map((entry, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              
              // Debug logging
              console.log(`Rendering entry ${index}:`, entry);
              
              return (
                <View
                  key={entry.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100"
                  style={{ 
                    padding: spacing.large,
                    elevation: isTopThree ? 4 : 2,
                    shadowOpacity: isTopThree ? 0.15 : 0.1
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    {/* Rank and Trophy/Medal */}
                    <View className="flex-row items-center space-x-3">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: getRankColor(rank) }}
                      >
                        <Text 
                          className="font-bold text-white"
                          style={{ fontSize: fontSize.large }}
                        >
                          {getRankIcon(rank)}
                        </Text>
                      </View>
                      
                      <View>
                        <Text 
                          className="font-bold text-gray-900"
                          style={{ fontSize: fontSize.large }}
                        >
                          {entry.name || 'Unknown'}
                        </Text>
                        <Text 
                          className="text-gray-600"
                          style={{ fontSize: fontSize.small }}
                        >
                          Score: {entry.points || 0}
                        </Text>
                      </View>
                    </View>

                    {/* Additional Stats */}
                    <View className="items-end">
                      {entry.averageRating && (
                        <Text 
                          className="text-gray-600 text-right"
                          style={{ fontSize: fontSize.small }}
                        >
                          Rating: {entry.averageRating.toFixed(1)}
                        </Text>
                      )}
                      {entry.totalIncidents && (
                        <Text 
                          className="text-gray-600 text-right"
                          style={{ fontSize: fontSize.small }}
                        >
                          Reports: {entry.totalIncidents}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: spacing.xlarge }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
