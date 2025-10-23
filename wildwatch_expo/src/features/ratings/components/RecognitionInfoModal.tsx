/**
 * RecognitionInfoModal Component
 * Mobile-friendly modal explaining how the recognition system works
 * Matches the web frontend design and functionality
 * Optimized for both iOS and Android with platform-specific styling
 */

import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Platform,
  StatusBar,
  Animated
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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar 
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
          backgroundColor="#8B0000"
        />
        
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#8B0000', '#A52A2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.closeButtonCircle}>
                <Ionicons name="close" size={22} color="#8B0000" />
              </View>
            </TouchableOpacity>
            
            <Animated.View 
              style={[
                styles.headerContent,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.headerIconLarge}>
                <LinearGradient
                  colors={['#DAA520', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="trophy" size={40} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.headerTitle}>Recognition System</Text>
              <Text style={styles.headerSubtitle}>
                Learn how points and recognition work
              </Text>
            </Animated.View>
          </View>
        </LinearGradient>

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
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 50,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  headerIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 10 : 0,
    right: 20,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 10,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  pointsList: {
    gap: 16,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DAA520',
  },
  pointNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#8B0000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pointNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  pointContent: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  pointDescription: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  pointSubDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 18,
    paddingLeft: 8,
  },
  recognitionGrid: {
    marginTop: 20,
    gap: 16,
  },
  recognitionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#8B0000',
    ...Platform.select({
      ios: {
        shadowColor: '#8B0000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardDescription: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 14,
    lineHeight: 22,
  },
  cardHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#DAA520',
  },
  cardHighlightText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854D0E',
    marginLeft: 8,
    flex: 1,
  },
  benefitsSection: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#16A34A',
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  benefitsList: {
    marginTop: 16,
    gap: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  benefitCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  benefitCheckText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: '#166534',
    lineHeight: 22,
    fontWeight: '500',
  },
});
