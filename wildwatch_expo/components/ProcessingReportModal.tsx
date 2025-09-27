import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProcessingReportModalProps {
  visible: boolean;
}

export default function ProcessingReportModal({ visible }: ProcessingReportModalProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start spinning animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      // Start pulse animation for the glow effect
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Start progress animation
      const progressAnimation = Animated.timing(progressValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      });

      spinAnimation.start();
      pulseAnimation.start();
      progressAnimation.start();

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
        progressAnimation.stop();
      };
    } else {
      // Reset animations when modal is hidden
      spinValue.setValue(0);
      pulseValue.setValue(0);
      progressValue.setValue(0);
    }
  }, [visible, spinValue, pulseValue, progressValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '75%'],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Animated Spinner */}
          <View style={styles.spinnerContainer}>
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  opacity: pulseOpacity,
                },
              ]}
            />
            
            {/* Main spinner */}
            <Animated.View
              style={[
                styles.spinner,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <Ionicons name="refresh" size={32} color="#D4AF37" />
            </Animated.View>
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Processing Your Report</Text>
            <Text style={styles.description}>
              Our AI system is analyzing your report and assigning it to the most appropriate office for review. This may take a moment...
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
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
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinnerContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  glowEffect: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    backgroundColor: '#800000',
    opacity: 0.3,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#D4AF37',
    borderTopColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#800000',
    borderRadius: 5,
  },
});
