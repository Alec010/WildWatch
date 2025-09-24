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

interface SimilarIncident {
  id: string;
  similarityScore: number;
  assignedOffice?: string;
  submittedAt?: string;
  finishedDate?: string;
  resolutionNotes?: string;
  trackingNumber?: string;
}

interface SimilarIncidentsModalProps {
  visible: boolean;
  onClose: () => void;
  onCancelReport: () => void;
  onProceedAnyway: () => void;
  similarIncidents: SimilarIncident[];
  analysisWhy?: {
    tags: string[];
    location?: string;
  };
}

export default function SimilarIncidentsModal({
  visible,
  onClose,
  onCancelReport,
  onProceedAnyway,
  similarIncidents,
  analysisWhy,
}: SimilarIncidentsModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return '#DC2626'; // High similarity - red
    if (score >= 0.6) return '#F59E0B'; // Medium similarity - amber
    return '#10B981'; // Low similarity - green
  };

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
                <Ionicons name="search" size={24} color="#8B0000" />
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>Similar Resolved Cases Found</Text>
                <Text style={styles.subtitle}>
                  Review how similar cases were resolved. You can cancel if the suggested resolution already addresses your concern, or proceed to submit your report.
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Similar Incidents List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {similarIncidents.slice(0, 3).map((incident, index) => (
              <View key={incident.id || index} style={styles.incidentCard}>
                {/* Similarity Score */}
                <View style={styles.similarityHeader}>
                  <Text style={styles.similarityLabel}>Similarity</Text>
                  <View style={[
                    styles.similarityScore,
                    { backgroundColor: getSimilarityColor(incident.similarityScore) }
                  ]}>
                    <Text style={styles.similarityScoreText}>
                      {Math.round(incident.similarityScore * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Incident Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Resolved By Office</Text>
                    <Text style={styles.detailValue}>
                      {incident.assignedOffice || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Reported At</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(incident.submittedAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Resolved At</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(incident.finishedDate)}
                    </Text>
                  </View>

                  {incident.trackingNumber && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Tracking Number</Text>
                      <Text style={styles.detailValue}>
                        {incident.trackingNumber}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Resolution Notes */}
                {incident.resolutionNotes && (
                  <View style={styles.resolutionSection}>
                    <Text style={styles.resolutionLabel}>Resolution Notes</Text>
                    <View style={styles.resolutionNotes}>
                      <Text style={styles.resolutionText}>
                        {incident.resolutionNotes}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Why This Suggestion */}
            {analysisWhy && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisTitle}>Why this suggestion?</Text>
                
                {analysisWhy.location && (
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>Location context:</Text>
                    <Text style={styles.analysisValue}>{analysisWhy.location}</Text>
                  </View>
                )}

                {analysisWhy.tags && analysisWhy.tags.length > 0 && (
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>Matching tags:</Text>
                    <View style={styles.tagsContainer}>
                      {analysisWhy.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onCancelReport}
              style={styles.cancelButton}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
              <Text style={styles.cancelButtonText}>Cancel Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onProceedAnyway}
              style={styles.proceedButton}
            >
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              <Text style={styles.proceedButtonText}>Proceed Anyway</Text>
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
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  incidentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  similarityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  similarityLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  similarityScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  similarityScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  resolutionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resolutionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  resolutionNotes: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resolutionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  analysisSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  analysisItem: {
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  proceedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#8B0000',
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
