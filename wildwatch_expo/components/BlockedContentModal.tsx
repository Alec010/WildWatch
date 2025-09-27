import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BlockedContentModalProps {
  visible: boolean;
  onClose: () => void;
  onEditReport: () => void;
  reasons: string[];
}

export default function BlockedContentModal({
  visible,
  onClose,
  onEditReport,
  reasons,
}: BlockedContentModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={24} color="#DC2626" />
              </View>
              <Text style={styles.title}>Cannot Submit Report</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              Your report contains content that violates our community guidelines. 
              Please revise the report and try again.
            </Text>

            {/* Violation Reasons */}
            <View style={styles.reasonsContainer}>
              <Text style={styles.reasonsTitle}>Detected violations:</Text>
              <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
                {reasons.slice(0, 5).map((reason, index) => (
                  <View key={index} style={styles.reasonItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Guidelines Reminder */}
            <View style={styles.guidelinesContainer}>
              <Text style={styles.guidelinesTitle}>Please ensure your report:</Text>
              <Text style={styles.guidelineText}>• Uses neutral, factual language</Text>
              <Text style={styles.guidelineText}>• Focuses on safety concerns</Text>
              <Text style={styles.guidelineText}>• Avoids harassment or abuse</Text>
              <Text style={styles.guidelineText}>• Refrains from office disparagement</Text>
            </View>
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButtonStyle}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onEditReport}
              style={styles.editButtonStyle}
            >
              <Text style={styles.editButtonText}>Edit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  reasonsList: {
    maxHeight: 120,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginTop: 6,
    marginRight: 12,
  },
  reasonText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  guidelinesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    gap: 12,
  },
  closeButtonStyle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  editButtonStyle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
