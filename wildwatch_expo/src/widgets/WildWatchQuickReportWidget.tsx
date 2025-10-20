import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WildWatchQuickReportWidgetProps {
  onReportIncident?: () => void;
  onOpenApp?: () => void;
  onOpenReportTab?: () => void;
}

export function WildWatchQuickReportWidget({ 
  onReportIncident, 
  onOpenApp,
  onOpenReportTab 
}: WildWatchQuickReportWidgetProps) {
  return (
    <TouchableOpacity 
      style={{ 
        flex: 1, 
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onPress={onOpenReportTab}
      activeOpacity={0.7}
    >
      {/* Logo/Icon */}
      <View style={{ 
        width: 40, 
        height: 40, 
        backgroundColor: '#8B0000',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
      }}>
        <Ionicons name="shield-checkmark" size={24} color="white" />
      </View>

      {/* Title */}
      <Text style={{ 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: '#8B0000',
        marginBottom: 8,
        textAlign: 'center'
      }}>
        WildWatch
      </Text>
      
      {/* Tap to Report indicator */}
      <Text style={{ 
        fontSize: 8, 
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Tap to Report Incident
      </Text>

      {/* Quick Report Button */}
      <TouchableOpacity 
        style={{ 
          backgroundColor: '#8B0000',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 6,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6
        }}
        onPress={onReportIncident}
      >
        <Ionicons name="add-circle" size={14} color="white" />
        <Text style={{ 
          color: 'white', 
          fontWeight: 'bold', 
          marginLeft: 4,
          fontSize: 10
        }}>
          Report
        </Text>
      </TouchableOpacity>

      {/* Open App Button */}
      <TouchableOpacity 
        style={{ 
          backgroundColor: 'transparent',
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#8B0000'
        }}
        onPress={onOpenApp}
      >
        <Text style={{ 
          color: '#8B0000', 
          fontWeight: '500',
          fontSize: 9
        }}>
          Open App
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
