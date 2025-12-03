import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RatingDimension } from './RatingDimension';
import { ratingAPI } from '../api/rating_api';
import { RATING_DIMENSIONS } from '../models/RatingModels';
import type { RatingRequest, RatingStatus } from '../models/RatingModels';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  type: 'reporter' | 'office';
  onSuccess?: () => void;
}

interface RatingData {
  honesty: number | null;
  credibility: number | null;
  responsiveness: number | null;
  helpfulness: number | null;
  feedback: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  incidentId,
  type,
  onSuccess,
}) => {
  const [ratingData, setRatingData] = useState<RatingData>({
    honesty: null,
    credibility: null,
    responsiveness: null,
    helpfulness: null,
    feedback: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<RatingStatus | null>(null);

  useEffect(() => {
    const fetchRatingStatus = async () => {
      try {
        const data = await ratingAPI.getIncidentRating(incidentId);
        setRatingStatus(data);
      } catch (error) {
        console.error('Error fetching rating status:', error);
      }
    };

    if (isOpen) {
      fetchRatingStatus();
      // Reset form when modal opens
      setRatingData({
        honesty: null,
        credibility: null,
        responsiveness: null,
        helpfulness: null,
        feedback: '',
      });
    }
  }, [isOpen, incidentId]);

  const handleDimensionChange = useCallback((dimension: keyof Omit<RatingData, 'feedback'>, value: number) => {
    setRatingData(prev => ({
      ...prev,
      [dimension]: value,
    }));
  }, []);

  const totalPoints = useMemo(() => {
    return (ratingData.honesty || 0) + 
           (ratingData.credibility || 0) + 
           (ratingData.responsiveness || 0) + 
           (ratingData.helpfulness || 0);
  }, [ratingData.honesty, ratingData.credibility, ratingData.responsiveness, ratingData.helpfulness]);

  const isFormValid = useMemo(() => {
    return ratingData.honesty !== null && 
           ratingData.credibility !== null && 
           ratingData.responsiveness !== null && 
           ratingData.helpfulness !== null;
  }, [ratingData.honesty, ratingData.credibility, ratingData.responsiveness, ratingData.helpfulness]);

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Incomplete Rating', 'Please rate all dimensions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const ratingRequest: RatingRequest = {
        honesty: ratingData.honesty!,
        credibility: ratingData.credibility!,
        responsiveness: ratingData.responsiveness!,
        helpfulness: ratingData.helpfulness!,
        feedback: ratingData.feedback,
      };

      const response = type === 'reporter' 
        ? await ratingAPI.rateReporter(incidentId, ratingRequest)
        : await ratingAPI.rateOffice(incidentId, ratingRequest);

      if (response.pointsAwarded) {
        const pointsAwarded = type === 'reporter' ? response.totalReporterPoints : response.totalOfficePoints;
        Alert.alert(
          'Points Awarded!',
          `You received ${pointsAwarded} points for this rating.`,
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        Alert.alert(
          'Rating Submitted',
          'Thank you for your rating! Points will be awarded once both parties have rated.',
          [{ text: 'OK', onPress: onSuccess }]
        );
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', error.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingStatusMessage = () => {
    if (!ratingStatus) return null;

    if (type === 'reporter') {
      if (!ratingStatus.officeRating) {
        return 'Waiting for the office to rate this incident';
      }
      if (ratingStatus.pointsAwarded) {
        return 'Points have been awarded for this incident';
      }
    } else {
      if (!ratingStatus.reporterRating) {
        return 'Waiting for the reporter to rate this incident';
      }
      if (ratingStatus.pointsAwarded) {
        return 'Points have been awarded for this incident';
      }
    }
    return null;
  };

  const dimensions = RATING_DIMENSIONS[type];
  const isAlreadyRated = type === 'reporter' ? ratingStatus?.reporterRating : ratingStatus?.officeRating;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <Text style={styles.title}>
              {type === 'office' ? 'Rate the Reporter' : 'Rate the Office'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {getRatingStatusMessage() && (
            <View style={styles.statusContainer}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.statusText}>{getRatingStatusMessage()}</Text>
            </View>
          )}

          {isAlreadyRated ? (
            <View style={styles.alreadyRatedContainer}>
              <Text style={styles.alreadyRatedTitle}>
                You have already rated this incident
              </Text>
              <Text style={styles.alreadyRatedSubtitle}>
                Your rating: {isAlreadyRated.totalPoints}/20 points ({isAlreadyRated.averageRating.toFixed(1)}/5 average)
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.dimensionsContainer}>
                <RatingDimension
                  label={dimensions.honesty}
                  value={ratingData.honesty}
                  onChange={(value) => handleDimensionChange('honesty', value)}
                />
                
                <RatingDimension
                  label={dimensions.credibility}
                  value={ratingData.credibility}
                  onChange={(value) => handleDimensionChange('credibility', value)}
                />
                
                <RatingDimension
                  label={dimensions.responsiveness}
                  value={ratingData.responsiveness}
                  onChange={(value) => handleDimensionChange('responsiveness', value)}
                />
                
                <RatingDimension
                  label={dimensions.helpfulness}
                  value={ratingData.helpfulness}
                  onChange={(value) => handleDimensionChange('helpfulness', value)}
                />
              </View>

              <View style={styles.pointsContainer}>
                <View style={styles.pointsHeader}>
                  <Text style={styles.pointsLabel}>Total Points:</Text>
                  <View style={styles.pointsValue}>
                    <Ionicons name="trending-up" size={16} color="#10B981" />
                    <Text style={styles.pointsText}>{totalPoints}/20</Text>
                  </View>
                </View>
                <Text style={styles.pointsDescription}>
                  Points are calculated as 1 point per star (1-5 stars per dimension)
                </Text>
              </View>

              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Feedback (Optional)</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Add your feedback..."
                  value={ratingData.feedback}
                  onChangeText={(text) => setRatingData(prev => ({ ...prev, feedback: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}
        </ScrollView>

        {!isAlreadyRated && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Submit Rating ({totalPoints} points)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  alreadyRatedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  alreadyRatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  alreadyRatedSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  dimensionsContainer: {
    marginTop: 16,
  },
  pointsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  pointsValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 4,
  },
  pointsDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  feedbackContainer: {
    marginVertical: 16,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#800000',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

