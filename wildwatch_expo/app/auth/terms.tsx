import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../src/features/auth/api/auth_api";
import { storage } from "../../lib/storage";
import Colors from "../../constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { clearUserProfileState } from "../../src/features/users/hooks/useUserProfile";
import { performLogout } from "../../lib/auth";

const sections = [
  {
    title: "Use of the Platform",
    icon: "security",
    content: [
      "WildWatch is intended to facilitate the structured reporting, tracking, and resolution of campus-related incidents within CITU.",
      "• You must be a currently enrolled student or an authorized CITU personnel",
      "• You agree to provide accurate, truthful, and complete information when submitting a report",
    ],
  },
  {
    title: "User Responsibilities",
    icon: "person-outline",
    content: [
      "As a user of WildWatch, you agree:",
      "• Not to impersonate others or use false identities",
      "• Not to upload, share, or distribute content that is harmful, obscene, threatening, discriminatory, or violates the rights of others",
      "• To respect the gamification system and not exploit it for personal gain or manipulation",
    ],
  },
  {
    title: "Privacy and Data Protection",
    icon: "lock-outline",
    content: [
      "• Your personal information will be handled in accordance with our Privacy Policy",
      "• Incident reports and related information will be treated with appropriate confidentiality",
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
      "• CITU and the WildWatch team are not responsible for delays in action due to incomplete, false, or unverifiable reports",
      '• The platform is provided on an "as-is" basis. While we strive for accuracy and promptness, we do not guarantee uninterrupted or error-free operations',
    ],
  },
  {
    title: "Amendments",
    icon: "refresh",
    content: [
      "These Terms may be updated at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.",
    ],
  },
  {
    title: "Contact Us",
    icon: "help-outline",
    content: [
      "For questions or concerns regarding these Terms or your use of the Platform, you may contact the WildWatch Support Team via the official CITU Office of Student Affairs.",
    ],
  },
];

export default function TermsPage() {
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // ✅ Handle user canceling/declining terms
  const handleCancelTerms = async () => {
    Alert.alert(
      "Decline Terms?",
      "You must accept the Terms and Conditions to use WildWatch. Declining will log you out and clear your registration data.",
      [
        {
          text: "Continue Reading",
          style: "cancel",
        },
        {
          text: "Decline & Logout",
          style: "destructive",
          onPress: async () => {
            // Clean up ALL session data using centralized logout
            console.log("🧹 User declined terms - logging out");
            await performLogout();
          },
        },
      ]
    );
  };

  const handleAcceptTerms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ✅ FIX: Clear profile state before processing to prevent showing old account data
      clearUserProfileState();

      // ✅ First check if terms are already accepted (prevent redundant calls)
      try {
        const profile = await authAPI.getProfile();
        if (profile.termsAccepted) {
          // Terms already accepted, proceed to app
          console.log("Terms already accepted, proceeding to app");
          clearUserProfileState();
          router.replace("/(tabs)");
          return;
        }
      } catch (e) {
        // If profile fetch fails, continue with normal flow
        console.log(
          "Could not check existing terms status, continuing with acceptance"
        );
      }

      // Accept terms
      await authAPI.acceptTerms();

      // ✅ FIX: Clear profile state before navigating to prevent showing old account data
      clearUserProfileState();

      // Check if setup is needed (for Microsoft OAuth users)
      try {
        const profile = await authAPI.getProfile();
        if (
          profile.authProvider === "microsoft" ||
          profile.authProvider === "microsoft_mobile"
        ) {
          const contactNeedsSetup =
            !profile.contactNumber ||
            profile.contactNumber === "Not provided" ||
            profile.contactNumber === "+639000000000";
          const passwordNeedsSetup =
            profile.passwordNeedsSetup !== undefined
              ? profile.passwordNeedsSetup
              : !profile.password;

          if (contactNeedsSetup || passwordNeedsSetup) {
            console.log(
              "Setup needed after terms acceptance, navigating to setup"
            );
            router.replace("/auth/setup");
            return;
          }
        }
      } catch (e) {
        console.log("Could not check setup status, proceeding to app");
      }

      // All steps completed - navigate to dashboard
      router.replace("/(tabs)");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to accept terms. Please try again.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Top section with gradient and logo */}
      <View style={styles.top}>
        <LinearGradient
          colors={["#9e0202", "#7d0101", "#510000", "#1a0000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.logoWrap} accessible accessibilityRole="image">
          <Image
            source={require("../../assets/images/logos/logo2.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="WildWatch logo"
          />
        </View>
      </View>

      {/* Bottom white card section */}
      <View style={styles.bottom}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content Card */}
          <View style={styles.mainCard}>
            {/* Decorative blur elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <View style={styles.titleBar} />
                <Text style={styles.cardTitle}>Terms and Conditions</Text>
              </View>
              <Text style={styles.subtitle}>
                Effective Date: April 08, 2025
              </Text>

              {/* Intro */}
              <View style={styles.introContainer}>
                <Text style={styles.introText}>
                  Welcome to WildWatch, the official incident reporting and case
                  management platform of Cebu Institute of Technology –
                  University (CITU). By accessing or using the WildWatch website
                  and application (the "Platform"), you agree to comply with and
                  be bound by the following Terms and Conditions. Please read
                  them carefully.
                </Text>
              </View>
            </View>

            {/* Sections */}
            <ScrollView
              style={styles.sectionsScrollView}
              contentContainerStyle={styles.sectionsContainer}
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
                            color={Colors.maroon}
                          />
                        </View>
                        <Text
                          style={[
                            styles.sectionTitleText,
                            expanded && styles.sectionTitleTextEnabled,
                          ]}
                          numberOfLines={2}
                        >
                          {index + 1}. {section.title}
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

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.maroon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <Text style={styles.acknowledgeText}>
                By clicking "Accept Terms", you acknowledge that you have read
                and agree to be bound by these Terms and Conditions.
              </Text>

              {/* Accept Button */}
              <Pressable
                style={[
                  styles.acceptButton,
                  isLoading && styles.acceptButtonDisabled,
                ]}
                onPress={handleAcceptTerms}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Accept Terms"
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.buttonText}>Accepting...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.buttonText}>Accept Terms</Text>
                  </View>
                )}
              </Pressable>

              {/* Decline Button */}
              <Pressable
                style={styles.declineButton}
                onPress={handleCancelTerms}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Decline Terms"
              >
                <Text style={styles.declineButtonText}>Decline & Logout</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} WildWatch - Cebu Institute of
                Technology – University. All rights reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const SHEET_RADIUS = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a0000",
  },
  top: {
    flex: 3,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 180,
  },
  bottom: {
    flex: 7,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    marginTop: -32,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mainCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + "33",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    top: 80,
    right: -100,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Colors.gold + "20",
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: 80,
    left: -100,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Colors.maroon + "20",
    opacity: 0.3,
  },
  cardHeader: {
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold + "30",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  titleBar: {
    width: 4,
    height: 32,
    backgroundColor: Colors.maroon,
    borderRadius: 2,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.maroon,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginLeft: 16,
    marginTop: 4,
  },
  introContainer: {
    backgroundColor: "#FFF8E1",
    marginTop: 24,
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
  },
  sectionsScrollView: {
    maxHeight: 400,
  },
  sectionsContainer: {
    padding: 24,
    paddingTop: 16,
  },
  sectionContainer: {
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.gold + "33",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: "white",
  },
  expandedSection: {
    borderColor: Colors.gold + "66",
    backgroundColor: "#FFF8E1" + "50",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    flex: 1,
  },
  iconChip: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.gold + "20",
    marginRight: 12,
  },
  iconChipEnabled: {
    backgroundColor: Colors.maroon + "15",
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
  },
  sectionTitleTextEnabled: {
    color: Colors.maroon,
    fontWeight: "700",
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gold + "33",
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: Colors.maroon,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#DC2626",
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 24,
    backgroundColor: "#FFF8E1" + "33",
    borderTopWidth: 1,
    borderTopColor: Colors.gold + "33",
    gap: 16,
  },
  acknowledgeText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
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
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  declineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  declineButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footer: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.gold + "33",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
