import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

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
  evidence: Evidence[];
  witnesses: Witness[];
}

interface Evidence {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface Witness {
  id: string;
  name: string;
  contactInformation: string;
  additionalNotes: string;
}

interface StatCardProps {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon, iconTint, onPress }) => (
  <TouchableOpacity
    className="flex-1 bg-white rounded-lg shadow-sm"
    style={{
      padding: spacing.medium,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    }}
    onPress={onPress}
  >
    <View className="items-start">
      {/* Icon with background */}
      <View 
        className="rounded-lg items-center justify-center mb-3"
        style={{ 
          width: iconSize.xlarge + 8, 
          height: iconSize.xlarge + 8,
          backgroundColor: `${iconTint}20` 
        }}
      >
        <Ionicons name={icon} size={iconSize.large} color={iconTint} />
      </View>

      {/* Count */}
      <Text 
        className="font-bold text-gray-900 mb-1"
        style={{ fontSize: isSmallIPhone ? 24 : 28 }}
      >
        {count}
      </Text>

      {/* Title */}
      <Text 
        className="text-gray-600"
        style={{ fontSize: fontSize.small }}
      >
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

interface IncidentCardProps {
  incident: Incident;
  onViewDetails: () => void;
  onUpvote?: () => void;
  isUpvoted?: boolean;
  showUpvote?: boolean;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ 
  incident, 
  onViewDetails, 
  onUpvote, 
  isUpvoted = false, 
  showUpvote = false 
}) => {
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return { color: '#1976D2', text: 'In Progress', icon: 'time' };
      case 'resolved':
        return { color: '#4CAF50', text: 'Resolved', icon: 'checkmark-circle' };
      case 'urgent':
        return { color: '#F44336', text: 'Urgent', icon: 'warning' };
      case 'pending':
      default:
        return { color: '#FFA000', text: 'Pending', icon: 'time' };
    }
  };

  const statusInfo = getStatusInfo(incident.status);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-lg mb-3 shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}
      onPress={onViewDetails}
    >
      <View className="flex-row">
        {/* Left border indicator */}
        <View 
          className="rounded-l-lg"
          style={{ 
            width: isSmallIPhone ? 4 : 6,
            backgroundColor: statusInfo.color 
          }}
        />
        
        <View 
          className="flex-1"
          style={{ padding: spacing.medium }}
        >
          {/* Title and timestamp */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center flex-1">
              <Ionicons 
                name="warning" 
                size={iconSize.medium} 
                color={statusInfo.color} 
                style={{ marginRight: spacing.small }}
              />
              <Text 
                className="font-bold text-gray-900 flex-1" 
                numberOfLines={1}
                style={{ fontSize: fontSize.large }}
              >
                {incident.incidentType}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons 
                name="time" 
                size={iconSize.small} 
                color="#6B7280" 
              />
              <Text 
                className="text-gray-500 ml-1"
                style={{ fontSize: fontSize.small }}
              >
                {formatDate(incident.submittedAt)}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className="flex-row items-center mb-2">
            <Ionicons 
              name="location" 
              size={iconSize.small} 
              color="#6B7280" 
            />
            <Text 
              className="text-gray-500 ml-1 flex-1" 
              numberOfLines={1}
              style={{ fontSize: fontSize.small }}
            >
              {incident.location}
            </Text>
          </View>

          {/* Description */}
          <View className="flex-row mb-3">
            <Ionicons 
              name="information-circle" 
              size={iconSize.small} 
              color="#6B7280" 
              style={{ 
                marginTop: 2, 
                marginRight: spacing.small 
              }} 
            />
            <Text 
              className="text-gray-700 flex-1" 
              numberOfLines={2}
              style={{ fontSize: fontSize.medium }}
            >
              {incident.description}
            </Text>
          </View>

          {/* Status chip, upvote, and view details */}
          <View className="flex-row justify-between items-center">
            {/* Status chip */}
            <View 
              className="rounded-full flex-row items-center"
              style={{ 
                paddingHorizontal: spacing.medium,
                paddingVertical: spacing.small,
                backgroundColor: `${statusInfo.color}20` 
              }}
            >
              <Ionicons 
                name={statusInfo.icon as any} 
                size={iconSize.small} 
                color={statusInfo.color} 
              />
              <Text 
                className="font-medium ml-1"
                style={{ 
                  color: statusInfo.color,
                  fontSize: fontSize.small 
                }}
              >
                {statusInfo.text}
              </Text>
            </View>

            {/* Upvote and View Details */}
            <View className="flex-row items-center">
              {showUpvote && (
                <TouchableOpacity 
                  className="flex-row items-center mr-2"
                  onPress={onUpvote}
                >
                  <Ionicons 
                    name={isUpvoted ? "thumbs-up" : "thumbs-up-outline"} 
                    size={iconSize.small} 
                    color={isUpvoted ? "#8B0000" : "#6B7280"} 
                  />
                  <Text 
                    className="ml-1"
                    style={{ 
                      color: isUpvoted ? "#8B0000" : "#6B7280",
                      fontSize: fontSize.small 
                    }}
                  >
                    {incident.upvoteCount || 0}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                className="border border-[#8B0000] rounded-lg flex-row items-center"
                style={{ 
                  paddingHorizontal: spacing.medium,
                  paddingVertical: spacing.small 
                }}
                onPress={onViewDetails}
              >
                <Ionicons name="eye" size={iconSize.small} color="#8B0000" />
                <Text 
                  className="font-medium text-[#8B0000] ml-1"
                  style={{ fontSize: fontSize.small }}
                >
                  View Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DashboardScreen() {
  const { user, token, logout } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotedIncidents, setUpvotedIncidents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch both public and user incidents in parallel
      const [publicIncidentsResponse, userIncidentsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/incidents/public`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/incidents/my-incidents`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!publicIncidentsResponse.ok) {
        throw new Error(`Failed to fetch public incidents: ${publicIncidentsResponse.status}`);
      }

      if (!userIncidentsResponse.ok) {
        throw new Error(`Failed to fetch user incidents: ${userIncidentsResponse.status}`);
      }

      const publicIncidents: Incident[] = await publicIncidentsResponse.json();
      const userIncidents: Incident[] = await userIncidentsResponse.json();

      // Filter out incidents submitted by the current user from public incidents
      const filteredPublicIncidents = publicIncidents.filter(
        incident => incident.submittedByEmail !== user?.email
      );

      setIncidents(filteredPublicIncidents);
      setUserIncidents(userIncidents);

      // Fetch upvote statuses for public incidents
      await fetchUpvoteStatuses(filteredPublicIncidents);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to fetch incidents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpvoteStatuses = async (publicIncidents: Incident[]) => {
    if (!token) return;

    try {
      const upvotePromises = publicIncidents.map(async (incident) => {
        try {
          const response = await fetch(`${API_BASE_URL}/incidents/${incident.id}/upvote-status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const hasUpvoted = await response.json();
            return { incidentId: incident.id, hasUpvoted };
          }
          return { incidentId: incident.id, hasUpvoted: false };
        } catch (error) {
          console.error(`Error fetching upvote status for incident ${incident.id}:`, error);
          return { incidentId: incident.id, hasUpvoted: false };
        }
      });

      const upvoteResults = await Promise.all(upvotePromises);
      const upvotedIds = new Set(
        upvoteResults
          .filter(result => result.hasUpvoted)
          .map(result => result.incidentId)
      );
      setUpvotedIncidents(upvotedIds);
    } catch (error) {
      console.error('Error fetching upvote statuses:', error);
    }
  };

  const handleToggleUpvote = async (incidentId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const isUpvoted = await response.json();
        
        // Update local state
        setUpvotedIncidents(prev => {
          const newSet = new Set(prev);
          if (isUpvoted) {
            newSet.add(incidentId);
          } else {
            newSet.delete(incidentId);
          }
          return newSet;
        });

        // Update incident upvote count
        setIncidents(prev => 
          prev.map(incident => 
            incident.id === incidentId 
              ? { ...incident, upvoteCount: (incident.upvoteCount || 0) + (isUpvoted ? 1 : -1) }
              : incident
          )
        );
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
      Alert.alert('Error', 'Failed to update upvote');
    }
  };

  const handleViewAllCases = () => {
    router.push('/(tabs)/cases');
  };

  const handleIncidentClick = (trackingNumber: string) => {
    router.push(`/(tabs)/tracking/${trackingNumber}` as any);
  };

  const handleUpvote = (incidentId: string) => {
    Alert.alert(
      'Confirm Upvote',
      'Are you sure you want to upvote this incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upvote', onPress: () => handleToggleUpvote(incidentId) },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
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
            Loading...
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
          paddingVertical: isSmallIPhone ? 8 : isMediumIPhone ? 10 : isLargeIPhone ? 12 : isXLargeIPhone ? 14 : isIPhone15Pro ? 16 : 18,
          height: isSmallIPhone ? 60 : isMediumIPhone ? 70 : isLargeIPhone ? 80 : isXLargeIPhone ? 85 : isIPhone15Pro ? 90 : 95
        }}
      >
        <View className="flex-row items-center">
          <Image
            source={require('../../assets/images/WildWatch.png')}
            style={{ 
              width: isSmallIPhone ? 80 : isMediumIPhone ? 90 : isLargeIPhone ? 100 : isXLargeIPhone ? 105 : isIPhone15Pro ? 110 : 115,
              height: isSmallIPhone ? 60 : isMediumIPhone ? 68 : isLargeIPhone ? 75 : isXLargeIPhone ? 79 : isIPhone15Pro ? 83 : 87
            }}
            resizeMode="contain"
          />
        </View>
        
        <View className="flex-row items-center space-x-2">
          {/* Notifications */}
          <TouchableOpacity 
            className="relative"
            style={{ padding: spacing.small }}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Ionicons 
              name="notifications" 
              size={iconSize.medium} 
              color="#8B0000" 
            />
            {hasUnreadNotifications && (
              <View 
                className="absolute rounded-full bg-red-500"
                style={{ 
                  top: -2, 
                  right: -2, 
                  width: isSmallIPhone ? 8 : 12, 
                  height: isSmallIPhone ? 8 : 12 
                }}
              />
            )}
          </TouchableOpacity>
          
          {/* Profile */}
          <TouchableOpacity 
            style={{ padding: spacing.small }}
            onPress={handleLogout}
          >
            <Ionicons 
              name="person" 
              size={iconSize.medium} 
              color="#8B0000" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        style={{ paddingHorizontal: spacing.large }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Title */}
        <View style={{ paddingVertical: spacing.xlarge }}>
          <Text 
            className="font-bold text-[#8B0000] mb-2"
            style={{ fontSize: fontSize.title }}
          >
            Incident Dashboard
          </Text>
          <Text 
            className="text-gray-600"
            style={{ fontSize: fontSize.medium }}
          >
            View and manage reported incidents
          </Text>
        </View>

        {/* Overview Stats */}
        <View 
          className="bg-white rounded-2xl mb-4 shadow-sm"
          style={{ padding: spacing.large }}
        >
          <Text 
            className="font-bold text-[#8B0000] mb-3"
            style={{ fontSize: fontSize.xlarge }}
          >
            Overview
          </Text>
          
          {/* First row of stats */}
          <View 
            className="flex-row mb-3"
            style={{ gap: spacing.medium }}
          >
            <StatCard
              title="Total Reports"
              count={userIncidents.length}
              icon="document-text"
              iconTint="#8B0000"
            />
            <StatCard
              title="Pending"
              count={userIncidents.filter(i => i.status.toLowerCase() === 'pending').length}
              icon="time"
              iconTint="#FFA000"
            />
          </View>
          
          {/* Second row of stats */}
          <View 
            className="flex-row"
            style={{ gap: spacing.medium }}
          >
            <StatCard
              title="In Progress"
              count={userIncidents.filter(i => i.status.toLowerCase() === 'in progress').length}
              icon="time"
              iconTint="#1976D2"
            />
            <StatCard
              title="Resolved"
              count={userIncidents.filter(i => i.status.toLowerCase() === 'resolved').length}
              icon="checkmark-circle"
              iconTint="#4CAF50"
            />
          </View>
        </View>

        {/* View All Cases Button */}
        <TouchableOpacity
          className="bg-[#8B0000] rounded-xl flex-row items-center justify-center mb-4"
          style={{ 
            paddingVertical: spacing.medium,
            paddingHorizontal: spacing.large 
          }}
          onPress={handleViewAllCases}
        >
          <Ionicons 
            name="list" 
            size={iconSize.medium} 
            color="white" 
          />
          <Text 
            className="text-white font-bold ml-2"
            style={{ fontSize: fontSize.medium }}
          >
            View All Cases
          </Text>
        </TouchableOpacity>

        {/* Tab Navigation */}
        <View className="bg-white mb-0">
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 items-center ${
                selectedTab === 0 ? 'border-b-2 border-[#8B0000]' : ''
              }`}
              style={{ 
                paddingVertical: isSmallIPhone ? 16 : isMediumIPhone ? 18 : isLargeIPhone ? 20 : isXLargeIPhone ? 22 : isIPhone15Pro ? 24 : 26,
                paddingHorizontal: spacing.large,
                minHeight: isSmallIPhone ? 60 : isMediumIPhone ? 70 : isLargeIPhone ? 80 : isXLargeIPhone ? 85 : isIPhone15Pro ? 90 : 95
              }}
              onPress={() => setSelectedTab(0)}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="globe" 
                  size={isSmallIPhone ? 18 : isMediumIPhone ? 20 : isLargeIPhone ? 22 : isXLargeIPhone ? 24 : isIPhone15Pro ? 26 : 28} 
                  color={selectedTab === 0 ? '#8B0000' : '#6B7280'} 
                  style={{ marginTop: -8 }}
                />
                <Text 
                  className={`ml-2 font-medium ${
                    selectedTab === 0 ? 'text-[#8B0000]' : 'text-gray-500'
                  }`}
                  style={{ 
                    fontSize: isSmallIPhone ? 14 : isMediumIPhone ? 15 : isLargeIPhone ? 16 : isXLargeIPhone ? 17 : isIPhone15Pro ? 18 : 19
                  }}
                >
                  All Incidents
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 items-center ${
                selectedTab === 1 ? 'border-b-2 border-[#8B0000]' : ''
              }`}
              style={{ 
                paddingVertical: isSmallIPhone ? 16 : isMediumIPhone ? 18 : isLargeIPhone ? 20 : isXLargeIPhone ? 22 : isIPhone15Pro ? 24 : 26,
                paddingHorizontal: spacing.large,
                minHeight: isSmallIPhone ? 60 : isMediumIPhone ? 70 : isLargeIPhone ? 80 : isXLargeIPhone ? 85 : isIPhone15Pro ? 90 : 95
              }}
              onPress={() => setSelectedTab(1)}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="person" 
                  size={isSmallIPhone ? 18 : isMediumIPhone ? 20 : isLargeIPhone ? 22 : isXLargeIPhone ? 24 : isIPhone15Pro ? 26 : 28} 
                  color={selectedTab === 1 ? '#8B0000' : '#6B7280'} 
                  style={{ marginTop: -8 }}
                />
                <Text 
                  className={`ml-2 font-medium ${
                    selectedTab === 1 ? 'text-[#8B0000]' : 'text-gray-500'
                  }`}
                  style={{ 
                    fontSize: isSmallIPhone ? 14 : isMediumIPhone ? 15 : isLargeIPhone ? 16 : isXLargeIPhone ? 17 : isIPhone15Pro ? 18 : 19
                  }}
                >
                  My Incidents
                </Text>
              </View>
            </TouchableOpacity>
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

        {/* Incidents List */}
        <View style={{ marginBottom: isSmallIPhone ? 5 : isMediumIPhone ? 8 : isLargeIPhone ? 10 : isXLargeIPhone ? 12 : isIPhone15Pro ? 15 : 18 }}>
          {(selectedTab === 0 ? incidents : userIncidents).map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onViewDetails={() => handleIncidentClick(incident.trackingNumber)}
              onUpvote={() => handleUpvote(incident.id)}
              isUpvoted={upvotedIncidents.has(incident.id)}
              showUpvote={selectedTab === 0}
            />
          ))}
          
          {/* Empty State */}
          {(selectedTab === 0 ? incidents : userIncidents).length === 0 && !error && (
            <View className="bg-white rounded-lg p-8 items-center">
              <Ionicons 
                name="document-outline" 
                size={iconSize.xlarge} 
                color="#9CA3AF" 
              />
              <Text 
                className="text-gray-500 mt-4 text-center"
                style={{ fontSize: fontSize.medium }}
              >
                {selectedTab === 0 
                  ? 'No public incidents available at the moment.'
                  : 'You haven\'t submitted any incidents yet.'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
