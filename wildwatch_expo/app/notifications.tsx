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

  const toSentenceCase = (value: string) => {
    if (!value) return '';
    const withSpaces = value.replace(/_/g, ' ').toLowerCase();
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  };

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

  const getCategoryStyles = (activityType: string) => {
    switch (activityType) {
      case 'NEW_REPORT':
        return { tint: '#6B7280', tintBg: '#F3F4F6', border: '#E5E7EB' };
      case 'UPDATE':
        return { tint: '#1976D2', tintBg: '#E8F1FD', border: '#CFE0FA' };
      case 'STATUS_CHANGE':
        return { tint: '#D97706', tintBg: '#FEF3C7', border: '#FDE68A' };
      case 'CASE_RESOLVED':
      case 'VERIFICATION':
        return { tint: '#16A34A', tintBg: '#DCFCE7', border: '#A7F3D0' };
      default:
        return { tint: '#6B7280', tintBg: '#F3F4F6', border: '#E5E7EB' };
    }
  };

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    if (n?.incident?.trackingNumber) {
      router.push(`/case/${n.incident.trackingNumber}` as never);
      return;
    }
    if (n?.incidentId) {
      router.push(`/case/${n.incidentId}` as never);
      return;
    }
  };

  const renderItem = (n: any) => {
    const styles = getCategoryStyles(n.activityType);
    return (
      <TouchableOpacity
        key={n.id}
        style={{
          backgroundColor: !n.isRead ? '#F3F4F6' : '#FFFFFF',
          borderRadius: 14,
          marginHorizontal: spacing.small,
          marginVertical: 6,
          padding: 14,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: !n.isRead ? 0.1 : 0.06,
          shadowRadius: 12,
          elevation: !n.isRead ? 4 : 3,
          borderLeftWidth: !n.isRead ? 6 : 4,
          borderLeftColor: styles.tint,
          borderWidth: !n.isRead ? 1 : 0,
          borderColor: !n.isRead ? '#D1D5DB' : 'transparent',
        }}
        onPress={() => handleNotificationClick(n)}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: styles.tintBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name={getNotificationIcon(n.activityType) as any} size={16} color={styles.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontWeight: !n.isRead ? '700' : '600', fontSize: 15, color: '#111827', flex: 1 }} numberOfLines={1}>
                {toSentenceCase(n.activityType || 'Notification')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginRight: 8 }}>{formatTimestamp(n.createdAt)}</Text>
                {!n.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B0000' }} />}
              </View>
            </View>
            {!!n.description && (
              <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }} numberOfLines={2}>
                {n.description}
              </Text>
            )}
            {!!(n.incident?.trackingNumber || n.incidentId) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: styles.tint, fontWeight: '600', marginRight: 4 }}>View details</Text>
                <Ionicons name="chevron-forward" size={14} color={styles.tint} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="bg-[#F5F5F5] px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center" style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={28} color="#8B0000" />
            </TouchableOpacity>
            <Text className="font-bold text-[#8B0000]" style={{ fontSize: 20 }}>Notifications</Text>
          </View>
          {items.some(n => !n.isRead) && (
            <TouchableOpacity onPress={markAllAsRead} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#8B0000', borderRadius: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Mark all as read</Text>
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
              <TouchableOpacity className="rounded-lg mx-4 my-4 p-4 items-center" style={{ backgroundColor: '#F3F4F6' }} onPress={() => fetchPage()}>
                <Text className="text-gray-700 font-semibold">Load more</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


