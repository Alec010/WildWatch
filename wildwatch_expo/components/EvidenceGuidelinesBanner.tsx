import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EvidenceGuidelinesBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle" size={20} color="#D4AF37" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Evidence Guidelines</Text>
        <Text style={styles.message}>
          Please provide any evidence that can help in the investigation. This can include photos, videos, or documents. You can also add information about witnesses who saw the incident. At least one piece of evidence (files or witness information) is required.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
