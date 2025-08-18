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
import { useAuth } from '../contexts/AuthContext';
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

// API Base URL - same as AuthContext
const API_BASE_URL = 'http://192.168.1.11:8080/api';

// Notification interfaces
interface NotificationItem {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  incident?: {
    id: string;
    trackingNumber: string;
  };
}

interface NotificationResponse {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    setCurrentPage(0);
    setHasMore(true);
    await fetchNotifications(true);
    setIsRefreshing(false);
  };

  const fetchNotifications = async (refresh = false) => {
    if (!token) return;

    if (refresh) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/activity-logs?page=${currentPage}&size=20`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data: NotificationResponse = await response.json();

      if (refresh) {
        setNotifications(data.content);
      } else {
        setNotifications(prev => [...prev, ...data.content]);
      }

      setHasMore(data.content.length === 20);
      setCurrentPage(prev => prev + 1);

    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/activity-logs/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/activity-logs/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read first
    markNotificationAsRead(notification.id);

    // Navigate to case details if incident exists
    if (notification.incident?.trackingNumber) {
      router.push(`/caseDetails/${notification.incident.trackingNumber}` as any);
    }
  };

  const getNotificationIcon = (activityType: string) => {
    switch (activityType) {
      case 'STATUS_CHANGE':
        return 'information-circle';
      case 'UPDATE':
        return 'create';
      case 'NEW_REPORT':
        return 'warning';
      case 'CASE_RESOLVED':
        return 'checkmark-circle';
      case 'VERIFICATION':
        return 'shield-checkmark';
      default:
        return 'notifications';
    }
  };

  const getNotificationIconColor = (activityType: string) => {
    switch (activityType) {
      case 'STATUS_CHANGE':
        return '#1976D2'; // Blue
      case 'UPDATE':
        return '#9C27B0'; // Purple
      case 'NEW_REPORT':
        return '#E53935'; // Red
      case 'CASE_RESOLVED':
        return '#4CAF50'; // Green
      case 'VERIFICATION':
        return '#4CAF50'; // Green
      default:
        return '#757575'; // Gray
    }
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return 'Status Update';
      case 'UPDATE':
        return 'Case Update';
      case 'NEW_REPORT':
        return 'New Report';
      case 'CASE_RESOLVED':
        return 'Case Resolved';
      case 'VERIFICATION':
        return 'Case Verified';
      default:
        return type.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 86400000)}d ago`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return 'Unknown';
    }
  };

  const renderNotificationItem = (notification: NotificationItem) => (
    <TouchableOpacity
      key={notification.id}
      style={{
        backgroundColor: !notification.isRead ? '#EFEFEF' : '#F5F5F5',
        borderRadius: 12,
        marginHorizontal: spacing.small,
        marginVertical: 2,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
      onPress={() => handleNotificationClick(notification)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Icon */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: getNotificationIconColor(notification.activityType),
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons
            name={getNotificationIcon(notification.activityType) as any}
            size={16}
            color="#FFFFFF"
          />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2
          }}>
            <Text
              style={{
                fontWeight: !notification.isRead ? 'bold' : '500',
                fontSize: 15,
                color: '#333333',
                flex: 1,
              }}
            >
              {formatActivityType(notification.activityType)}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 12,
                  color: '#666666',
                  marginRight: 8,
                }}
              >
                {formatTimestamp(notification.createdAt)}
              </Text>

              {!notification.isRead && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#8B0000',
                  }}
                />
              )}
            </View>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: '#666666',
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {notification.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text
            className="text-[#8B0000] mt-2"
            style={{ fontSize: fontSize.medium }}
          >
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#F5F5F5] px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8, marginRight: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#8B0000" />
            </TouchableOpacity>

            <Text
              className="font-bold text-[#8B0000]"
              style={{ fontSize: 20 }}
            >
              Notifications
            </Text>
          </View>

          {notifications.some(n => !n.isRead) && (
            <TouchableOpacity onPress={markAllNotificationsAsRead}>
              <Text
                style={{
                  color: '#8B0000',
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons name="alert-circle" size={48} color="#8B0000" />
            <Text
              className="text-[#8B0000] mt-4 text-center"
              style={{ fontSize: fontSize.medium }}
            >
              {error}
            </Text>
            <TouchableOpacity
              className="bg-[#8B0000] rounded-lg px-6 py-3 mt-4"
              onPress={() => fetchNotifications(true)}
            >
              <Text className="text-white font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons name="notifications-off" size={48} color="#9CA3AF" />
            <Text
              className="text-gray-500 mt-4 text-center"
              style={{ fontSize: fontSize.medium }}
            >
              No notifications
            </Text>
          </View>
        ) : (
          <View style={{ paddingVertical: spacing.small }}>
            {notifications.map(renderNotificationItem)}

            {hasMore && (
              <TouchableOpacity
                className="bg-gray-100 rounded-lg mx-4 my-4 p-4 items-center"
                onPress={() => fetchNotifications()}
              >
                <Text className="text-gray-600 font-medium">Load More</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
