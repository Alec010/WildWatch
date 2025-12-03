import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NeedHelpPanelProps {
  modifier?: any;
}

export default function NeedHelpPanel({ modifier }: NeedHelpPanelProps) {
  const reportingTips = [
    {
      icon: 'location' as const,
      text: 'Be as specific as possible about the location',
    },
    {
      icon: 'time' as const,
      text: 'Include time details even if approximate',
    },
    {
      icon: 'document-text' as const,
      text: 'Photos and videos help security respond effectively',
    },
    {
      icon: 'warning' as const,
      text: 'Mention any witnesses who can provide additional information',
    },
  ];

  return (
    <View style={[styles.container, modifier]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="help-circle" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Need Help?</Text>
          <Text style={styles.subtitle}>Reporting Tips</Text>
        </View>
      </View>

      <View style={styles.tipsContainer}>
        {reportingTips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipIconContainer}>
              <Ionicons name={tip.icon} size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#800000',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 6,
    marginRight: 12,
    marginTop: 2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    opacity: 0.8,
  },
});
