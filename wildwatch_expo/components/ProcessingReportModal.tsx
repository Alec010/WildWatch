import React, { useEffect, useRef, useState } from 'react';
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
  phase?: 'analyzing' | 'uploading' | 'submitting' | 'finalizing';
}

export default function ProcessingReportModal({ visible, phase = 'analyzing' }: ProcessingReportModalProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Get phase-specific content
  const getPhaseContent = () => {
    switch (phase) {
      case 'analyzing':
        return {
          title: 'Analyzing Content',
          description: 'Our AI is reviewing your report for inappropriate content and finding similar incidents...',
          progress: 0.25,
          icon: 'search' as const,
        };
      case 'uploading':
        return {
          title: 'Uploading Evidence',
          description: 'Uploading your photos and evidence files. This may take a moment...',
          progress: 0.5,
          icon: 'cloud-upload' as const,
        };
      case 'submitting':
        return {
          title: 'Submitting Report',
          description: 'Generating tags, assigning to appropriate office, and saving your report...',
          progress: 0.75,
          icon: 'paper-plane' as const,
        };
      case 'finalizing':
        return {
          title: 'Finalizing',
          description: 'Almost done! Creating notifications and activity logs...',
          progress: 0.9,
          icon: 'checkmark-circle' as const,
        };
      default:
        return {
          title: 'Processing Your Report',
          description: 'Our AI system is analyzing your report and assigning it to the most appropriate office for review...',
          progress: 0.5,
          icon: 'refresh' as const,
        };
    }
  };

  const phaseContent = getPhaseContent();

  // Timer to show elapsed time
  useEffect(() => {
    if (visible) {
      setElapsedSeconds(0);
      const timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [visible]);

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

      // Animate progress to phase-specific value
      const progressAnimation = Animated.timing(progressValue, {
        toValue: phaseContent.progress,
        duration: 1000,
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
      setElapsedSeconds(0);
    }
  }, [visible, phase, spinValue, pulseValue, progressValue]);

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
    outputRange: ['0%', '100%'],
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
              <Ionicons name={phaseContent.icon} size={32} color="#D4AF37" />
            </Animated.View>
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{phaseContent.title}</Text>
            <Text style={styles.description}>
              {phaseContent.description}
            </Text>
            
            {/* Elapsed time indicator */}
            {elapsedSeconds > 10 && (
              <Text style={styles.timeIndicator}>
                {elapsedSeconds}s elapsed... {elapsedSeconds > 30 ? '(Large files may take longer)' : ''}
              </Text>
            )}
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
            <Text style={styles.progressText}>
              {Math.round(phaseContent.progress * 100)}% Complete
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
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#800000',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  timeIndicator: {
    fontSize: 12,
    color: '#D97706',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
