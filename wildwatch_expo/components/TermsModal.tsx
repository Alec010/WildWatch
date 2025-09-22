import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, ActivityIndicator, Pressable } from 'react-native';
import { Text } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const sections = [
  {
    title: "Use of the Platform",
    icon: "security",
    content: [
      "WildWatch is intended to facilitate the structured reporting, tracking, and resolution of campus-related incidents within CITU.",
      "• You must be a currently enrolled student or an authorized CITU personnel",
      "• You agree to provide accurate and truthful information",
    ]
  },
  {
    title: "User Responsibilities",
    icon: "person-outline",
    content: [
      "As a user of WildWatch, you agree:",
      "• Not to impersonate others or use false identities",
      "• Not to upload harmful, obscene, or threatening content",
      "• To respect the gamification system",
    ]
  },
  {
    title: "Privacy and Data Protection",
    icon: "lock-outline",
    content: [
      "• Your personal information will be handled in accordance with our Privacy Policy",
      "• Incident reports and related information will be treated with confidentiality",
      "• Access to incident details will be restricted to authorized personnel only",
    ]
  },
  {
    title: "Platform Rules",
    icon: "warning-amber",
    content: [
      "Users must NOT:",
      "• Submit false or malicious reports",
      "• Harass or intimidate other users",
      "• Share confidential information about incidents publicly",
      "• Attempt to compromise the platform's security",
      "• Use the platform for any illegal activities",
    ]
  },
  {
    title: "Limitation of Liability",
    icon: "info-outline",
    content: [
      "• CITU and WildWatch team are not responsible for delays due to incomplete reports",
      "• The platform is provided on an 'as-is' basis",
      "• We do not guarantee uninterrupted or error-free operations",
    ]
  },
  {
    title: "Amendments",
    icon: "refresh",
    content: [
      "These Terms may be updated at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms."
    ]
  },
  {
    title: "Contact Us",
    icon: "help-outline",
    content: [
      "For questions or concerns, contact the WildWatch Support Team via the official CITU Office of Student Affairs."
    ]
  }
];

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
}

export default function TermsModal({ visible, onClose, onAccept, isLoading }: TermsModalProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
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
          {/* Header with gradient border */}
          <View style={styles.header}>
            <View style={styles.gradientBorder} />
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <View style={styles.titleBar} />
                <Text style={styles.title}>Terms and Conditions</Text>
              </View>
              <Text style={styles.subtitle}>Effective Date: April 08, 2025</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Introduction */}
          <View style={styles.introContainer}>
            <Text style={styles.introText}>
              Welcome to WildWatch, the official incident reporting and case management platform of Cebu Institute of Technology – University (CITU). Please read these terms carefully.
            </Text>
          </View>

          {/* Terms Sections */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {sections.map((section, index) => (
              <Pressable
                key={index}
                style={[
                  styles.sectionContainer,
                  expandedSection === index && styles.expandedSection
                ]}
                onPress={() => toggleSection(index)}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MaterialIcons
                      name={section.icon as any}
                      size={24}
                      color={Colors.maroon}
                      style={styles.sectionIcon}
                    />
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  <Ionicons
                    name={expandedSection === index ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={Colors.maroon}
                  />
                </View>
                
                {expandedSection === index && (
                  <View style={styles.sectionContent}>
                    {section.content.map((text, i) => (
                      <Text key={i} style={styles.contentText}>{text}</Text>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>

          {/* Accept Button */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.acceptButton}
              onPress={onAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={24} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Accept Terms</Text>
                </>
              )}
            </Pressable>
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
  },
  modalContent: {
    backgroundColor: '#f5f5f7',
    height: '95%',
    marginTop: 'auto',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    backgroundColor: 'white',
    position: 'relative',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold + '30', // 30% opacity
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.maroon,
  },
  headerContent: {
    position: 'relative',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleBar: {
    width: 4,
    height: 24,
    backgroundColor: Colors.maroon,
    borderRadius: 2,
    marginRight: 12,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.maroon,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  introContainer: {
    backgroundColor: '#FFF8E1',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold + '20', // 20% opacity
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expandedSection: {
    borderColor: Colors.gold + '40', // 40% opacity
    backgroundColor: '#FFF8E1' + '30', // 30% opacity
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    marginRight: 12,
    backgroundColor: Colors.maroon + '10', // 10% opacity
    padding: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.gold + '20', // 20% opacity
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    marginBottom: 10,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.gold + '30', // 30% opacity
  },
  acceptButton: {
    backgroundColor: Colors.maroon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.maroon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
