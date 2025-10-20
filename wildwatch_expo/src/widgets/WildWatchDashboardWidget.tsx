import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WidgetData {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  recentIncidents: Array<{
    id: string;
    title: string;
    status: string;
    location: string;
    submittedAt: string;
  }>;
}

interface WildWatchDashboardWidgetProps {
  data?: WidgetData;
  onRefresh?: () => void;
  onReportIncident?: () => void;
  onViewIncident?: (incidentId: string) => void;
  onOpenReportTab?: () => void;
}

export function WildWatchDashboardWidget({ 
  data, 
  onRefresh, 
  onReportIncident, 
  onViewIncident,
  onOpenReportTab 
}: WildWatchDashboardWidgetProps) {
  const defaultData: WidgetData = {
    totalReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    recentIncidents: []
  };

  const widgetData = data || defaultData;

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('in progress')) return '#1976D2';
    if (normalized.includes('resolved')) return '#4CAF50';
    if (normalized.includes('urgent')) return '#F44336';
    return '#FFA000';
  };

  const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('in progress')) return 'time';
    if (normalized.includes('resolved')) return 'checkmark-circle';
    if (normalized.includes('urgent')) return 'warning';
    return 'time';
  };

  return (
    <TouchableOpacity 
      style={{ 
        flex: 1, 
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 8
      }}
      onPress={onOpenReportTab}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: 'bold', 
            color: '#8B0000' 
          }}>
            WildWatch
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#8B0000" style={{ marginLeft: 4 }} />
        </View>
        <Text style={{ 
          fontSize: 8, 
          color: '#666',
          fontStyle: 'italic',
          position: 'absolute',
          bottom: 2,
          right: 8
        }}>
          Tap to Report
        </Text>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onRefresh?.();
          }}
        >
          <Ionicons name="refresh" size={20} color="#8B0000" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={{ 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8
      }}>
        <View style={{ 
          flex: 1, 
          minWidth: '45%',
          backgroundColor: '#f8f9fa',
          padding: 8,
          borderRadius: 6,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8B0000' }}>
            {widgetData.totalReports}
          </Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Total Reports</Text>
        </View>
        
        <View style={{ 
          flex: 1, 
          minWidth: '45%',
          backgroundColor: '#fff3cd',
          padding: 8,
          borderRadius: 6,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFA000' }}>
            {widgetData.pendingReports}
          </Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Pending</Text>
        </View>
        
        <View style={{ 
          flex: 1, 
          minWidth: '45%',
          backgroundColor: '#d1ecf1',
          padding: 8,
          borderRadius: 6,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1976D2' }}>
            {widgetData.inProgressReports}
          </Text>
          <Text style={{ fontSize: 10, color: '#666' }}>In Progress</Text>
        </View>
        
        <View style={{ 
          flex: 1, 
          minWidth: '45%',
          backgroundColor: '#d4edda',
          padding: 8,
          borderRadius: 6,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CAF50' }}>
            {widgetData.resolvedReports}
          </Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Resolved</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ 
        flexDirection: 'row', 
        marginBottom: 12,
        gap: 8
      }}>
        <TouchableOpacity 
          style={{ 
            flex: 1,
            backgroundColor: '#8B0000',
            padding: 10,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onPress={onReportIncident}
        >
          <Ionicons name="add-circle" size={16} color="white" />
          <Text style={{ 
            color: 'white', 
            fontWeight: 'bold', 
            marginLeft: 4,
            fontSize: 12
          }}>
            Report Incident
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Incidents */}
      {widgetData.recentIncidents.length > 0 && (
        <View>
          <Text style={{ 
            fontSize: 12, 
            fontWeight: 'bold', 
            color: '#333',
            marginBottom: 6
          }}>
            Recent Activity
          </Text>
          {widgetData.recentIncidents.slice(0, 2).map((incident) => (
            <TouchableOpacity 
              key={incident.id}
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 6,
                backgroundColor: '#f8f9fa',
                borderRadius: 4,
                marginBottom: 4
              }}
              onPress={() => onViewIncident?.(incident.id)}
            >
              <Ionicons 
                name={getStatusIcon(incident.status) as any} 
                size={12} 
                color={getStatusColor(incident.status)} 
              />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={{ 
                  fontSize: 10, 
                  fontWeight: '500',
                  color: '#333'
                }} numberOfLines={1}>
                  {incident.title}
                </Text>
                <Text style={{ 
                  fontSize: 8, 
                  color: '#666'
                }} numberOfLines={1}>
                  {incident.location} • {new Date(incident.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
