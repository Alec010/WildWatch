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
            <View style={styles.titleTextContainer}>
              <Text style={styles.title}>Similar Resolved Cases Found</Text>
              <Text style={styles.subtitle}>
                Review how similar cases were resolved. You can cancel if the suggested resolution already addresses your concern, or proceed to submit your report.
              </Text>
            </View>
          </View>

          {/* Similar Incidents List */}
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '95%',
    minHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleTextContainer: {
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B0000',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: 20,
    minHeight: 0, // Allow flex to work properly
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  resolutionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  analysisSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tagText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 0,
  },
  cancelButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  proceedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#8B0000',
    gap: 4,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 0,
  },
  proceedButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
});
