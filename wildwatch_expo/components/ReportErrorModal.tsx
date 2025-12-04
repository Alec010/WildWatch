import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ErrorType = 'network' | 'server' | 'validation' | 'timeout' | 'unknown';

interface ErrorDetails {
  type: ErrorType;
  message: string;
  statusCode?: number;
  technicalDetails?: string;
}

interface ReportErrorModalProps {
  visible: boolean;
  error: ErrorDetails | null;
  onClose: () => void;
  onRetry: () => void;
}

const getErrorIcon = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'cloud-offline-outline';
    case 'server':
      return 'server-outline';
    case 'timeout':
      return 'time-outline';
    case 'validation':
      return 'alert-circle-outline';
    default:
      return 'warning-outline';
  }
};

const getErrorColor = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return '#EF4444'; // Red
    case 'server':
      return '#F59E0B'; // Amber
    case 'timeout':
      return '#F59E0B'; // Amber
    case 'validation':
      return '#DC2626'; // Dark Red
    default:
      return '#991B1B'; // Darker Red
  }
};

const getErrorTitle = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'Connection Problem';
    case 'server':
      return 'Server Error';
    case 'timeout':
      return 'Request Timed Out';
    case 'validation':
      return 'Validation Error';
    default:
      return 'Submission Failed';
  }
};

const getErrorSuggestions = (type: ErrorType): string[] => {
  switch (type) {
    case 'network':
      return [
        'Check your internet connection',
        'Make sure you\'re connected to WiFi or mobile data',
        'Try moving to an area with better signal',
        'Disable VPN if you\'re using one',
      ];
    case 'server':
      return [
        'The server is temporarily unavailable',
        'Our team has been notified',
        'Please try again in a few minutes',
        'If the problem persists, contact support',
      ];
    case 'timeout':
      return [
        'The request took too long to complete',
        'Check your internet connection speed',
        'Try uploading fewer or smaller images',
        'Use WiFi instead of mobile data if possible',
      ];
    case 'validation':
      return [
        'Check that all required fields are filled',
        'Ensure images are not too large (< 5MB each)',
        'Verify your login session is still active',
        'Try logging out and logging back in',
      ];
    default:
      return [
        'An unexpected error occurred',
        'Please try again',
        'If the issue continues, contact support',
      ];
  }
};

export default function ReportErrorModal({
  visible,
  error,
  onClose,
  onRetry,
}: ReportErrorModalProps) {
  if (!error) return null;

  const errorColor = getErrorColor(error.type);
  const errorIcon = getErrorIcon(error.type);
  const errorTitle = getErrorTitle(error.type);
  const suggestions = getErrorSuggestions(error.type);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Error Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${errorColor}15` }]}>
            <Ionicons name={errorIcon as any} size={48} color={errorColor} />
          </View>

          {/* Error Title */}
          <Text style={[styles.title, { color: errorColor }]}>
            {errorTitle}
          </Text>

          {/* Status Code Badge */}
          {error.statusCode && (
            <View style={[styles.statusBadge, { backgroundColor: `${errorColor}20` }]}>
              <Text style={[styles.statusText, { color: errorColor }]}>
                Error {error.statusCode}
              </Text>
            </View>
          )}

          {/* Error Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{error.message}</Text>
          </View>

          {/* Suggestions */}
          <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.suggestionsTitle}>What you can try:</Text>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <View style={styles.bulletPoint}>
                  <View style={[styles.bullet, { backgroundColor: errorColor }]} />
                </View>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}

            {/* Technical Details (if available) */}
            {error.technicalDetails && (
              <View style={styles.technicalContainer}>
                <Text style={styles.technicalTitle}>Technical Details:</Text>
                <Text style={styles.technicalText}>{error.technicalDetails}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Retry Button */}
            <TouchableOpacity
              style={[styles.button, styles.retryButton, { backgroundColor: errorColor }]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Help */}
          <View style={styles.helpContainer}>
            <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.helpText}>
              Need help? Contact support at support@wildwatch.com
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: Dimensions.get('window').height * 0.8,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsContainer: {
    width: '100%',
    maxHeight: 200,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 20,
    paddingTop: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  technicalContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9CA3AF',
  },
  technicalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  technicalText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
});

