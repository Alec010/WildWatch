/**
 * RecognitionInfoModal Component
 * Mobile-friendly modal explaining how the recognition system works
 * Matches the web frontend design and functionality
 */

import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface RecognitionInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RecognitionInfoModal: React.FC<RecognitionInfoModalProps> = ({ 
  visible, 
  onClose 
}) => {
  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="trophy" size={24} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Recognition System</Text>
              <Text style={styles.headerSubtitle}>Learn how our recognition and points system works</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8B0000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Points System Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#DAA520" />
              <Text style={styles.sectionTitle}>Points System</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Points are awarded based on the quality and quantity of your contributions to the WildWatch platform.
            </Text>
            
            <View style={styles.pointsList}>
              <PointItem 
                number="1"
                title="Report Submission:"
                description="5 points per report"
              />
              <PointItem 
                number="2"
                title="Two-Way Rating System:"
                description="Up to 20 points based on 4-dimensional ratings"
                subDescription="• Honesty, Credibility, Responsiveness, Helpfulness (1-5 stars each)\n• Points awarded when both parties complete ratings"
              />
              <PointItem 
                number="3"
                title="Evidence Provided:"
                description="3 points per piece of evidence"
              />
              <PointItem 
                number="4"
                title="Witness Information:"
                description="2 points per witness"
              />
              <PointItem 
                number="5"
                title="Community Upvotes:"
                description="1 point per upvote received"
              />
            </View>
          </View>

          {/* Recognition Types */}
          <View style={styles.recognitionGrid}>
            <RecognitionCard
              icon="people"
              title="Student Recognition"
              description="Students are recognized for submitting high-quality reports, providing detailed information, and helping maintain campus safety."
              highlight="Top students receive special recognition and rewards!"
            />
            <RecognitionCard
              icon="business"
              title="Office Recognition"
              description="Offices are recognized for their efficiency in handling reports, response time, and overall satisfaction ratings from students."
              highlight="Top offices receive departmental recognition!"
            />
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color="#DAA520" />
              <Text style={styles.sectionTitle}>Benefits of Recognition</Text>
            </View>
            
            <View style={styles.benefitsList}>
              <BenefitItem text="Showcase your commitment to campus safety" />
              <BenefitItem text="Potential for special rewards and recognition events" />
              <BenefitItem text="Build a positive reputation within the community" />
              <BenefitItem text="Contribute to a safer and more secure environment for everyone" />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Point Item Component
const PointItem: React.FC<{
  number: string;
  title: string;
  description: string;
  subDescription?: string;
}> = ({ number, title, description, subDescription }) => (
  <View style={styles.pointItem}>
    <View style={styles.pointNumber}>
      <Text style={styles.pointNumberText}>{number}</Text>
    </View>
    <View style={styles.pointContent}>
      <Text style={styles.pointTitle}>{title}</Text>
      <Text style={styles.pointDescription}>{description}</Text>
      {subDescription && (
        <Text style={styles.pointSubDescription}>{subDescription}</Text>
      )}
    </View>
  </View>
);

// Recognition Card Component
const RecognitionCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  highlight: string;
}> = ({ icon, title, description, highlight }) => (
  <View style={styles.recognitionCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color="#8B0000" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.cardDescription}>{description}</Text>
    <View style={styles.cardHighlight}>
      <Ionicons name="trophy" size={16} color="#DAA520" />
      <Text style={styles.cardHighlightText}>{highlight}</Text>
    </View>
  </View>
);

// Benefit Item Component
const BenefitItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.benefitItem}>
    <View style={styles.benefitCheck}>
      <Text style={styles.benefitCheckText}>✓</Text>
    </View>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#F8F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B0000',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  pointsList: {
    gap: 12,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  pointNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointContent: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  pointDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  pointSubDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 16,
  },
  recognitionGrid: {
    marginTop: 20,
    gap: 16,
  },
  recognitionCard: {
    backgroundColor: '#F8F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHighlightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  benefitsSection: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#FDF2F2',
    borderRadius: 12,
    padding: 16,
  },
  benefitsList: {
    marginTop: 12,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DAA520',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  benefitCheckText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
