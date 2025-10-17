import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TopSpacing from '../../components/TopSpacing';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { incidentAPI } from '../../src/features/incidents/api/incident_api';
import { config } from '../../lib/config';
import type { IncidentResponseDto } from '../../src/features/incidents/models/IncidentModels';

function getStatusInfo(status?: string | null) {
  const normalized = (status || 'pending').toLowerCase();
  if (normalized.includes('in progress')) return { color: '#1976D2', text: 'In Progress', icon: 'time' as const };
  if (normalized.includes('resolved')) return { color: '#4CAF50', text: 'Resolved', icon: 'checkmark-circle' as const };
  if (normalized.includes('urgent')) return { color: '#F44336', text: 'Urgent', icon: 'warning' as const };
  return { color: '#FFA000', text: 'Pending', icon: 'time' as const };
}

function formatRelative(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 36e5);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function IncidentCard({ incident, onPress }: { incident: IncidentResponseDto; onPress: () => void }) {
  const status = getStatusInfo(incident.status);
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg mb-3"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}
      accessibilityRole="button"
    >
      <View className="flex-row">
        <View style={{ width: 6, backgroundColor: status.color }} />
        <View className="flex-1" style={{ padding: 16 }}>
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center flex-1">
              <Ionicons name="warning" size={18} color={status.color} style={{ marginRight: 8 }} />
              <Text className="font-bold text-gray-900 flex-1" numberOfLines={1}>
                {incident.incidentType}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text className="text-gray-500 ml-1">{formatRelative(incident.submittedAt as any)}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text className="text-gray-500 ml-1 flex-1" numberOfLines={1}>
              {incident.location}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: `${status.color}20` }} className="rounded-full flex-row items-center">
              <Ionicons name={status.icon} size={14} color={status.color} />
              <Text className="font-medium ml-1" style={{ color: status.color }}>{status.text}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
              <Text className="ml-1 text-gray-600">{incident.upvoteCount || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatCard({ title, count, icon, iconTint, onPress, isActive = false }: { title: string; count: number; icon: keyof typeof Ionicons.glyphMap; iconTint: string; onPress?: () => void; isActive?: boolean }) {
  return (
    <TouchableOpacity
      className={`flex-1 rounded-lg ${isActive ? 'bg-gray-100' : 'bg-white'}`}
      style={{ 
        padding: 8, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: isActive ? 0.15 : 0.06, 
        shadowRadius: 2, 
        elevation: isActive ? 3 : 1,
        borderWidth: isActive ? 1 : 0,
        borderColor: isActive ? iconTint : 'transparent'
      }}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View className="items-start">
        <View className="rounded-lg items-center justify-center mb-2" style={{ width: 24, height: 24, backgroundColor: `${iconTint}20` }}>
          <Ionicons name={icon} size={14} color={iconTint} />
        </View>
        <Text className={`font-bold mb-1 ${isActive ? 'text-gray-800' : 'text-gray-900'}`} style={{ fontSize: 16 }}>{count}</Text>
        <Text className={`${isActive ? 'text-gray-700' : 'text-gray-600'}`} style={{ fontSize: 10 }}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [myIncidents, setMyIncidents] = useState<IncidentResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const screenHeight = Dimensions.get('window').height;

  const fetchData = async () => {
    setError(null);
    try {
      const mine = await incidentAPI.getMyIncidents();
      setMyIncidents(mine);
    } catch (e: any) {
      setError(e?.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await api.get(`${config.API.BASE_URL}/activity-logs`, { params: { page: 0, size: 10 } });
      const data = res.data;
      const content = Array.isArray(data?.content) ? data.content : [];
      setNotifications(content);
      setHasUnread(content.some((n: any) => !n.isRead));
    } catch (err: any) {
      setNotificationsError(err?.message || 'Failed to fetch notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.put(`/activity-logs/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setHasUnread((prev) => notifications.some((n) => !n.isRead));
    } catch {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put(`/activity-logs/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setHasUnread(false);
    } catch {}
  };

  const handleFilterPress = (filterType: string) => {
    if (activeFilter === filterType) {
      setActiveFilter(null); // Clear filter if same filter is pressed
    } else {
      setActiveFilter(filterType);
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    fetchNotifications();
  }, []);


  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      fetchNotifications();
    }, [])
  );

  const visibleIncidents = useMemo(() => {
    const incidents = myIncidents;
    
    if (!activeFilter || activeFilter === 'all') {
      return incidents;
    }
    
    return incidents.filter(incident => {
      const status = (incident.status || '').toLowerCase();
      
      switch (activeFilter) {
        case 'pending':
          return status === 'pending';
        case 'in_progress':
          return status.includes('in progress');
        case 'resolved':
          return status.includes('resolved');
        case 'urgent':
          return status.includes('urgent');
        default:
          return true;
      }
    });
  }, [myIncidents, activeFilter]);

  if (loading) {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Stack.Screen options={{ title: 'Dashboard' }} />
        <ActivityIndicator size="large" color="#8B0000" />
        <Text className="text-[#8B0000] mt-2">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Dashboard' }} />

      {/* Top spacing for notch */}
      <TopSpacing />

      {/* Top App Bar */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Image source={require('../../assets/images/WildWatch.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
        </View>
        <View className="flex-row items-center">
          {/* Notifications */}
          <TouchableOpacity className="relative" style={{ padding: 8, marginLeft: 16 }} onPress={() => setShowNotifications(true)}>
            <Ionicons name="notifications" size={28} color="#8B0000" />
            {hasUnread ? (
              <View className="absolute rounded-full bg-red-500" style={{ top: -2, right: -2, width: 12, height: 12 }} />
            ) : null}
          </TouchableOpacity>
          {/* Profile */}
          <TouchableOpacity className="relative" style={{ padding: 8 }} onPress={() => router.push('/profile' as never)}>
            <Ionicons name="person-circle" size={30} color="#8B0000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); fetchNotifications(); }} />} className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Overview Stats */}
        <View className="bg-white rounded-2xl mb-4" style={{ padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-[#8B0000]" style={{ fontSize: 18 }}>Overview</Text>
            {activeFilter && (
              <TouchableOpacity onPress={clearFilter} className="flex-row items-center">
                <Ionicons name="close-circle" size={16} color="#6B7280" />
                <Text className="text-gray-500 ml-1" style={{ fontSize: 12 }}>Clear filter</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row" style={{ columnGap: 8 }}>
            <StatCard 
              title="Total Reports" 
              count={myIncidents.length} 
              icon="document-text" 
              iconTint="#8B0000" 
              onPress={() => handleFilterPress('all')}
              isActive={activeFilter === 'all'}
            />
            <StatCard 
              title="Pending" 
              count={myIncidents.filter(i => (i.status || '').toLowerCase() === 'pending').length} 
              icon="time" 
              iconTint="#FFA000" 
              onPress={() => handleFilterPress('pending')}
              isActive={activeFilter === 'pending'}
            />
            <StatCard 
              title="In Progress" 
              count={myIncidents.filter(i => (i.status || '').toLowerCase().includes('in progress')).length} 
              icon="time" 
              iconTint="#1976D2" 
              onPress={() => handleFilterPress('in_progress')}
              isActive={activeFilter === 'in_progress'}
            />
            <StatCard 
              title="Resolved" 
              count={myIncidents.filter(i => (i.status || '').toLowerCase().includes('resolved')).length} 
              icon="checkmark-circle" 
              iconTint="#4CAF50" 
              onPress={() => handleFilterPress('resolved')}
              isActive={activeFilter === 'resolved'}
            />
          </View>
        </View>

        {/* My Incidents Header */}
        <View className="bg-white flex-row mb-4 rounded-lg" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }}>
          <View className="flex-1 items-center" style={{ paddingVertical: 16 }}>
            <View className="flex-row items-center justify-center">
              <Ionicons name="person" size={20} color="#8B0000" />
              <Text className="ml-2 font-medium text-[#8B0000]">My Incident Reports</Text>
            </View>
          </View>
        </View>

        {/* Filter Indicator */}
        {activeFilter && activeFilter !== 'all' && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="filter" size={16} color="#1976D2" />
              <Text className="text-blue-800 ml-2 font-medium">
                Showing {activeFilter === 'in_progress' ? 'In Progress' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} incidents
              </Text>
            </View>
            <TouchableOpacity onPress={clearFilter}>
              <Ionicons name="close" size={16} color="#1976D2" />
            </TouchableOpacity>
          </View>
        )}

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <Text className="text-red-800 text-center">{error}</Text>
          </View>
        ) : null}
        {visibleIncidents.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Ionicons name="document-outline" size={28} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              You haven't submitted any incidents yet.
            </Text>
          </View>
        ) : (
          visibleIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} onPress={() => router.push(`/case/${incident.trackingNumber}` as never)} />
          ))
        )}
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end' }} activeOpacity={1} onPress={() => setShowNotifications(false)}>
          <View style={{ width: 320, backgroundColor: '#FFFFFF', borderRadius: 12, margin: 8, marginTop: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' }}>
              <Text style={{ fontWeight: '600', fontSize: 16, color: '#333333' }}>Notifications</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={{ padding: 8, marginRight: 8 }} onPress={fetchNotifications}>
                  <Ionicons name="refresh" size={18} color="#666666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={markAllNotificationsAsRead}>
                  <Text style={{ color: '#666666', fontSize: 14 }}>Mark all as read</Text>
                </TouchableOpacity>
              </View>
            </View>

            {notificationsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#8B0000" />
              </View>
            ) : notificationsError ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#8B0000', fontSize: 14 }}>{notificationsError}</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#666666', fontSize: 14 }}>No notifications</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {notifications.map((n) => (
                  <TouchableOpacity key={n.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: !n.isRead ? '#F8F8F8' : 'transparent' }} onPress={() => { markNotificationAsRead(n.id); if (n.incident?.trackingNumber) { setShowNotifications(false); router.push(`/case/${n.incident.trackingNumber}` as never); } }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B0000', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="notifications" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontWeight: '500', fontSize: 14, color: '#333333' }}>{n.activityType || 'Update'}</Text>
                        <Text style={{ fontSize: 12, color: '#666666' }}>{n.createdAt}</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#666666', lineHeight: 18 }} numberOfLines={2}>{n.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{ borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingVertical: 12, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => { setShowNotifications(false); router.push('/notifications' as never); }}>
                <Text style={{ color: '#8B0000', fontWeight: '500', fontSize: 14 }}>View All Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
