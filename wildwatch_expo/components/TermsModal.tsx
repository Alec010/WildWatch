// components/TermsModal.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Pressable,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import { Text } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

const sections = [
  {
    title: "Use of the Platform",
    icon: "security",
    content: [
      "WildWatch is intended to facilitate the structured reporting, tracking, and resolution of campus-related incidents within CITU.",
      "• You must be a currently enrolled student or an authorized CITU personnel",
      "• You agree to provide accurate and truthful information",
    ],
  },
  {
    title: "User Responsibilities",
    icon: "person-outline",
    content: [
      "As a user of WildWatch, you agree:",
      "• Not to impersonate others or use false identities",
      "• Not to upload harmful, obscene, or threatening content",
      "• To respect the gamification system",
    ],
  },
  {
    title: "Privacy and Data Protection",
    icon: "lock-outline",
    content: [
      "• Your personal information will be handled in accordance with our Privacy Policy",
      "• Incident reports and related information will be treated with confidentiality",
      "• Access to incident details will be restricted to authorized personnel only",
    ],
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
    ],
  },
  {
    title: "Limitation of Liability",
    icon: "info-outline",
    content: [
      "• CITU and WildWatch team are not responsible for delays due to incomplete reports",
      "• The platform is provided on an 'as-is' basis",
      "• We do not guarantee uninterrupted or error-free operations",
    ],
  },
  {
    title: "Amendments",
    icon: "refresh",
    content: [
      "These Terms may be updated at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.",
    ],
  },
  {
    title: "Contact Us",
    icon: "help-outline",
    content: [
      "For questions or concerns, contact the WildWatch Support Team via the official CITU Office of Student Affairs.",
    ],
  },
];

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
}

export default function TermsModal({
  visible,
  onClose,
  onAccept,
  isLoading,
}: TermsModalProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleSection = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === index ? null : index);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.gradientBorder} />
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <View style={styles.titleBar} />
                <Text style={styles.headerTitle}>Terms and Conditions</Text>
              </View>
              <Text style={styles.subtitle}>
                Effective Date: April 08, 2025
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Intro */}
          <View style={styles.introContainer}>
            <Text style={styles.introText}>
              Welcome to WildWatch, the official incident reporting and case
              management platform of Cebu Institute of Technology – University
              (CITU). Please read these terms carefully.
            </Text>
          </View>

          {/* Sections */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section, index) => {
              const expanded = expandedSection === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.sectionContainer,
                    expanded && styles.expandedSection,
                  ]}
                >
                  {/* Accent strip */}
                  <View
                    style={[
                      styles.enabledAccentBase,
                      expanded && styles.enabledAccentOn,
                    ]}
                  />

                  <Pressable
                    onPress={() => toggleSection(index)}
                    android_ripple={{ color: Colors.maroon + "22" }}
                    style={styles.sectionHeader}
                    accessibilityRole="button"
                    accessibilityLabel={section.title}
                    accessibilityState={{ expanded }}
                    hitSlop={8}
                  >
                    <View style={styles.sectionTitleRow}>
                      <View
                        style={[
                          styles.iconChip,
                          expanded && styles.iconChipEnabled,
                        ]}
                      >
                        <MaterialIcons
                          name={section.icon as any}
                          size={20}
                          color={expanded ? Colors.maroon : Colors.maroon}
                        />
                      </View>
                      <Text
                        style={[
                          styles.sectionTitleText,
                          expanded && styles.sectionTitleTextEnabled,
                        ]}
                        numberOfLines={2}
                      >
                        {section.title}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-down"
                      size={22}
                      color={expanded ? Colors.maroon : "#6B7280"}
                      style={{
                        transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                      }}
                    />
                  </Pressable>

                  {expanded && (
                    <View style={styles.sectionContent}>
                      {section.content.map((line, i) => (
                        <Text key={i} style={styles.contentText}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Accept */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.acceptButton}
              onPress={onAccept}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Accept Terms"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color="white"
                    style={styles.buttonIcon}
                  />
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

const CARD_RADIUS = 12;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#f5f5f7",
    height: "95%",
    marginTop: "auto",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  header: {
    backgroundColor: "white",
    position: "relative",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold + "30",
  },
  gradientBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.maroon,
  },
  headerContent: {
    position: "relative",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    position: "absolute",
    right: 16,
    top: 16,
    padding: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.maroon,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  introContainer: {
    backgroundColor: "#FFF8E1",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // card base
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: CARD_RADIUS,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },

  // accent strip
  enabledAccentBase: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    backgroundColor: Colors.maroon,
  },
  enabledAccentOn: {
    width: 4,
  },

  expandedSection: {
    borderColor: Colors.maroon, // maroon border
    backgroundColor: "#FFFFFFS", // light gold background
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  iconChip: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.maroon + "10",
    marginRight: 10,
  },
  iconChipEnabled: {
    backgroundColor: Colors.maroon + "15", // lighter maroon background
    borderWidth: 1,
    borderColor: Colors.maroon,
  },

  sectionTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
  },
  sectionTitleTextEnabled: {
    color: Colors.maroon,
  },

  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.gold + "30",
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
    marginTop: 10,
  },

  buttonContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.gold + "30",
  },
  acceptButton: {
    backgroundColor: Colors.maroon,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.maroon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: { marginRight: 8 },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
