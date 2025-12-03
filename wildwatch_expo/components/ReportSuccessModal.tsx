import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReportSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  trackingNumber: string;
  assignedOffice?: string;
}

export default function ReportSuccessModal({
  visible,
  onClose,
  trackingNumber,
  assignedOffice,
}: ReportSuccessModalProps) {
  const handleCopyTrackingNumber = () => {
    Clipboard.setString(trackingNumber);
    Alert.alert('Copied', 'Tracking number copied to clipboard');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Success Header */}
          <View style={styles.headerContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
            </View>
            <Text style={styles.title}>Report Submitted Successfully</Text>
            <Text style={styles.description}>
              Your incident has been reported and will be reviewed by security personnel.
            </Text>
          </View>

          {/* Report Details */}
          <View style={styles.detailsContainer}>
            {/* Tracking Number Card */}
            <View style={styles.detailCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={16} color="#800000" />
                <Text style={styles.cardLabel}>Tracking Number</Text>
              </View>
              <View style={styles.trackingNumberRow}>
                <Text style={styles.trackingNumber}>{trackingNumber}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyTrackingNumber}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Assigned Office Card */}
            {assignedOffice && (
              <View style={styles.detailCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="business" size={16} color="#800000" />
                  <Text style={styles.cardLabel}>Assigned Office</Text>
                </View>
                <Text style={styles.assignedOffice}>{assignedOffice}</Text>
              </View>
            )}

            {/* Information Notice */}
            <View style={styles.infoNotice}>
              <Ionicons name="information-circle" size={20} color="#D4AF37" />
              <Text style={styles.infoText}>
                Please save this tracking number for your records. You can use it to check the status of your report in the dashboard.
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.actionButton} onPress={onClose}>
            <Text style={styles.actionButtonText}>Return to Home</Text>
          </TouchableOpacity>
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  trackingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#800000',
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  assignedOffice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#800000',
  },
  infoNotice: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#800000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
