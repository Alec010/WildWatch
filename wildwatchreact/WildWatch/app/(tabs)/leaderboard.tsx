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
  FlatList,
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

// Leaderboard Entry interface - matching Android Studio exactly
interface LeaderboardEntry {
  id: number;
  name: string;
  totalIncidents?: number;
  averageRating?: number;
  points?: number;
  activeIncidents?: number;
  resolvedIncidents?: number;
}

// Custom Tab Component
interface CustomTabProps {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onClick: () => void;
}

const CustomTab: React.FC<CustomTabProps> = ({ text, icon, isSelected, onClick }) => (
  <TouchableOpacity
    className="flex-1 items-center"
    onPress={onClick}
    style={{ 
      paddingVertical: 12,
      borderRadius: 8,
    }}
  >
    <Ionicons 
      name={icon} 
      size={24} 
      color={isSelected ? '#8B0000' : '#6B7280'} 
    />
    <View style={{ height: 4 }} />
    <Text 
      className={`${isSelected ? 'font-semibold' : 'font-normal'}`}
      style={{ 
        fontSize: 14,
        color: isSelected ? '#8B0000' : '#6B7280'
      }}
    >
      {text}
    </Text>
    <View style={{ height: 8 }} />
    {isSelected && (
      <View 
        className="bg-[#8B0000] rounded"
        style={{ 
          width: 40, 
          height: 3,
          borderRadius: 2
        }}
      />
    )}
  </TouchableOpacity>
);

// Leaderboard Item Component
interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  rank: number;
  isTopThree: boolean;
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ entry, rank, isTopThree }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#4A5568'; // Gray
    }
  };

  const RankIcon: React.FC<{ rank: number; color: string }> = ({ rank, color }) => (
    <View 
      className="rounded-full items-center justify-center"
      style={{ 
        width: 32, 
        height: 32,
        backgroundColor: `${color}20` 
      }}
    >
      <Text 
        className="font-bold"
        style={{ 
          fontSize: 18,
          color: color 
        }}
      >
        {rank}
      </Text>
    </View>
  );

  return (
    <View 
      className="bg-white rounded-xl mb-2 shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isTopThree ? 4 : 2 },
        shadowOpacity: 0.1,
        shadowRadius: isTopThree ? 4 : 2,
        elevation: isTopThree ? 4 : 2,
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <View>
        <TouchableOpacity
          className="flex-row items-center"
          style={{ padding: 16 }}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          {/* Rank and Trophy/Medal */}
          <View 
            className="items-center justify-center"
            style={{ width: 40, height: 40 }}
          >
            {rank <= 3 ? (
              <RankIcon rank={rank} color={getRankColor(rank)} />
            ) : (
              <Text 
                className="font-bold"
                style={{ 
                  fontSize: 18,
                  color: '#4A5568' 
                }}
              >
                {rank}
              </Text>
            )}
          </View>

          <View style={{ width: 16 }} />

          {/* Name and Score */}
          <View className="flex-1">
            <Text 
              className="font-semibold"
              style={{ 
                fontSize: 16,
                color: '#2D3748'
              }}
            >
              {entry.name}
            </Text>
            <Text 
              className="text-gray-600"
              style={{ 
                fontSize: 14,
                color: '#718096'
              }}
            >
              Score: {entry.points || 0}
            </Text>
          </View>

          {/* Expand/Collapse Icon */}
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#718096" 
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View>
            <View className="border-t border-gray-200" style={{ borderTopColor: '#E2E8F0' }} />
            <View style={{ padding: 16 }}>
              {entry.averageRating !== undefined && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text 
                    className="text-gray-600"
                    style={{ 
                      fontSize: 14,
                      color: '#718096'
                    }}
                  >
                    Average Rating
                  </Text>
                  <Text 
                    className="font-medium text-gray-800"
                    style={{ 
                      fontSize: 14,
                      color: '#2D3748'
                    }}
                  >
                    {entry.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
              {entry.totalIncidents !== undefined && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text 
                    className="text-gray-600"
                    style={{ 
                      fontSize: 14,
                      color: '#718096'
                    }}
                  >
                    Total Reports
                  </Text>
                  <Text 
                    className="font-medium text-gray-800"
                    style={{ 
                      fontSize: 14,
                      color: '#2D3748'
                    }}
                  >
                    {entry.totalIncidents}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default function LeaderboardScreen() {
  const { user, token } = useAuth();
  const [topReporters, setTopReporters] = useState<LeaderboardEntry[]>([]);
  const [topOffices, setTopOffices] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (token) {
      fetchLeaderboard();
    }
  }, [token]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeaderboard();
    setIsRefreshing(false);
  };

  const fetchLeaderboard = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch both top reporters and top offices in parallel - matching Android Studio exactly
      const [reportersResponse, officesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/ratings/leaderboard/reporters/top`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/ratings/leaderboard/offices/top`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!reportersResponse.ok) {
        throw new Error(`Failed to fetch top reporters: ${reportersResponse.status}`);
      }

      if (!officesResponse.ok) {
        throw new Error(`Failed to fetch top offices: ${officesResponse.status}`);
      }

      const reportersData: LeaderboardEntry[] = await reportersResponse.json();
      const officesData: LeaderboardEntry[] = await officesResponse.json();
      
      setTopReporters(reportersData);
      setTopOffices(officesData);

    } catch (error: any) {
      console.error('Error fetching leaderboard data:', error);
      setError(error.message || 'Failed to fetch leaderboard');
      
      // For demo purposes, show mock data if API fails
      if (error.message.includes('Failed to fetch')) {
        setTopReporters([
          {
            id: 1,
            name: 'John Doe',
            totalIncidents: 15,
            averageRating: 4.5,
            points: 85
          },
          {
            id: 2,
            name: 'Jane Smith',
            totalIncidents: 12,
            averageRating: 4.2,
            points: 78
          },
          {
            id: 3,
            name: 'Mike Johnson',
            totalIncidents: 10,
            averageRating: 4.0,
            points: 72
          }
        ]);
        
        setTopOffices([
          {
            id: 1,
            name: 'Main Office',
            totalIncidents: 25,
            averageRating: 4.3,
            points: 92
          },
          {
            id: 2,
            name: 'North Branch',
            totalIncidents: 18,
            averageRating: 4.1,
            points: 79
          },
          {
            id: 3,
            name: 'South Branch',
            totalIncidents: 15,
            averageRating: 3.9,
            points: 68
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text 
            className="text-[#8B0000] mt-2"
            style={{ fontSize: fontSize.medium }}
          >
            Loading Leaderboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View>
          <Text className="text-2xl font-bold text-[#8B0000]">Leaderboard</Text>
          <Text className="text-gray-600 mt-1">See who's leading in incident reporting.</Text>
        </View>
      </View>

             <ScrollView
         className="flex-1"
         refreshControl={
           <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
         }
         showsVerticalScrollIndicator={false}
       >
                 {/* Custom Tab Row - matching Android Studio exactly */}
         <View 
           className="bg-white mb-4 shadow-sm rounded-lg"
           style={{
             shadowColor: '#000',
             shadowOffset: { width: 0, height: 2 },
             shadowOpacity: 0.1,
             shadowRadius: 2,
             elevation: 2,
           }}
         >
           <View className="flex-row" style={{ paddingVertical: 8 }}>
            <CustomTab
              text="Students"
              icon="school-outline"
              isSelected={selectedTab === 0}
              onClick={() => setSelectedTab(0)}
            />
            <CustomTab
              text="Offices"
              icon="business"
              isSelected={selectedTab === 1}
              onClick={() => setSelectedTab(1)}
            />
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <Text className="text-red-800 text-center" style={{ fontSize: fontSize.medium }}>
              {error}
            </Text>
          </View>
        )}

        {/* Leaderboard List */}
        <View style={{ marginBottom: spacing.xlarge, paddingHorizontal: 16 }}>
          {(selectedTab === 0 ? topReporters : topOffices).map((entry, index) => (
            <LeaderboardItem
              key={entry.id}
              entry={entry}
              rank={index + 1}
              isTopThree={index < 3}
            />
          ))}
          
          {/* Empty State */}
          {(selectedTab === 0 ? topReporters : topOffices).length === 0 && !error && (
            <View className="bg-white rounded-lg p-8 items-center">
              <Ionicons 
                name="trophy-outline" 
                size={iconSize.xlarge} 
                color="#9CA3AF" 
              />
              <Text 
                className="text-gray-500 mt-4 text-center"
                style={{ fontSize: fontSize.medium }}
              >
                No leaderboard data available
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
