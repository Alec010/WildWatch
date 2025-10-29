import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FollowUpDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  trackingNumber: string;
}

const PALETTE = {
  maroon: '#8B0000',
  maroonDark: '#6B0000',
  text: '#1F2937',
  subtext: '#6B7280',
  border: '#E5E7EB',
  warn: '#F59E0B',
  warnLight: '#FEF3C7',
  warnDark: '#92400E',
};

export function FollowUpDialog({
  isVisible,
  onClose,
  onConfirm,
  isLoading,
  trackingNumber,
}: FollowUpDialogProps) {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="notifications" size={20} color={PALETTE.maroon} />
              <Text style={styles.title}>Send Follow-up Request</Text>
            </View>
            <Text style={styles.subtitle}>
              Send a notification to the office handling this case
            </Text>
          </View>

          {/* Warning Banner */}
          <View style={styles.warningBanner}>
            <Ionicons name="information-circle" size={20} color={PALETTE.warnDark} />
            <Text style={styles.warningText}>
              You can only send one follow-up request every 24 hours for case #{trackingNumber}.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.confirmButtonText}>Sending...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Send Follow-up</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.maroon,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.subtext,
  },
  warningBanner: {
    backgroundColor: PALETTE.warnLight,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    color: PALETTE.warnDark,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: PALETTE.border,
  },
  confirmButton: {
    backgroundColor: PALETTE.maroon,
  },
  cancelButtonText: {
    color: PALETTE.text,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
