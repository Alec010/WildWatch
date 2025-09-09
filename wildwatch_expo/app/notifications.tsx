import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../src/features/notifications/hooks/useNotifications';
import { useResponsive } from '../src/hooks/useResponsive';

export default function NotificationsScreen() {
  const { items, isLoading, isRefreshing, error, hasMore, fetchPage, refresh, markAsRead, markAllAsRead } = useNotifications();
  const { spacing, fontSize } = useResponsive();

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return 'Unknown'; }
  };

  const getNotificationIcon = (activityType: string) => {
    switch (activityType) {
      case 'STATUS_CHANGE': return 'information-circle';
      case 'UPDATE': return 'create';
      case 'NEW_REPORT': return 'warning';
      case 'CASE_RESOLVED': return 'checkmark-circle';
      case 'VERIFICATION': return 'shield-checkmark';
      default: return 'notifications';
    }
  };

  const getNotificationIconColor = (activityType: string) => {
    switch (activityType) {
      case 'STATUS_CHANGE': return '#1976D2';
      case 'UPDATE': return '#9C27B0';
      case 'NEW_REPORT': return '#E53935';
      case 'CASE_RESOLVED': return '#4CAF50';
      case 'VERIFICATION': return '#4CAF50';
      default: return '#757575';
    }
  };

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    if (n.incident?.trackingNumber) router.push(`/case/${n.incident.trackingNumber}` as never);
  };

  const renderItem = (n: any) => (
    <TouchableOpacity key={n.id} style={{ backgroundColor: !n.isRead ? '#EFEFEF' : '#F5F5F5', borderRadius: 12, marginHorizontal: spacing.small, marginVertical: 2, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }} onPress={() => handleNotificationClick(n)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: getNotificationIconColor(n.activityType), alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name={getNotificationIcon(n.activityType) as any} size={16} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <Text style={{ fontWeight: !n.isRead ? 'bold' : '500', fontSize: 15, color: '#333333', flex: 1 }}>{n.activityType.replace('_', ' ')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#666666', marginRight: 8 }}>{formatTimestamp(n.createdAt)}</Text>
              {!n.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B0000' }} />}
            </View>
          </View>
          <Text style={{ fontSize: 14, color: '#666666', lineHeight: 18 }} numberOfLines={2}>{n.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text className="text-[#8B0000] mt-2" style={{ fontSize: fontSize.medium }}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-[#F5F5F5] px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#8B0000" />
            </TouchableOpacity>
            <Text className="font-bold text-[#8B0000]" style={{ fontSize: 20 }}>Notifications</Text>
          </View>
          {items.some(n => !n.isRead) && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={{ color: '#8B0000', fontSize: 14, fontWeight: '500' }}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />} showsVerticalScrollIndicator={false}>
        {error ? (
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons name="alert-circle" size={48} color="#8B0000" />
            <Text className="text-[#8B0000] mt-4 text-center" style={{ fontSize: fontSize.medium }}>{error}</Text>
            <TouchableOpacity className="bg-[#8B0000] rounded-lg px-6 py-3 mt-4" onPress={() => fetchPage(true)}>
              <Text className="text-white font-medium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons name="notifications-off" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center" style={{ fontSize: fontSize.medium }}>No notifications</Text>
          </View>
        ) : (
          <View style={{ paddingVertical: spacing.small }}>
            {items.map(renderItem)}
            {hasMore && (
              <TouchableOpacity className="bg-gray-100 rounded-lg mx-4 my-4 p-4 items-center" onPress={() => fetchPage()}>
                <Text className="text-gray-600 font-medium">Load More</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


