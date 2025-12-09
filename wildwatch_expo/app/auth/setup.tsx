import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../src/features/auth/api/auth_api";
import { storage } from "../../lib/storage";
import Colors from "../../constants/Colors";
import { clearUserProfileState } from "../../src/features/users/hooks/useUserProfile";
import { performLogout } from "../../lib/auth";

const COLORS = {
  maroon: Colors.maroon,
  gold: Colors.gold,
  textMuted: "#666666",
  border: "#E5E7EB",
};

export default function SetupPage() {
  const insets = useSafeAreaInsets();
  const [contactNumber, setContactNumber] = useState("+639");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [errors, setErrors] = useState<{
    contactNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // ✅ Check if user has already completed setup on mount
  useEffect(() => {
    checkExistingSetup();
  }, []);

  const checkExistingSetup = async () => {
    setIsCheckingSetup(true);
    try {
      // Try to fetch profile to check if setup is already done
      const profile = await authAPI.getProfile();

      const contactNeedsSetup =
        !profile.contactNumber ||
        profile.contactNumber === "Not provided" ||
        profile.contactNumber === "+639000000000";
      const passwordNeedsSetup =
        profile.passwordNeedsSetup !== undefined
          ? profile.passwordNeedsSetup
          : !profile.password;

      // ✅ Account already set up - proceed to app
      if (!contactNeedsSetup && !passwordNeedsSetup) {
        console.log("Account already set up, proceeding to app");
        clearUserProfileState();
        router.replace("/(tabs)");
        return;
      }
    } catch (error) {
      console.log("Could not check existing setup, continuing with form");
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const formatContactNumber = (value: string) => {
    // Remove all non-digits
    let inputValue = value.replace(/\D/g, "");

    // Always ensure it starts with 639
    if (!inputValue.startsWith("639")) {
      inputValue = "639" + inputValue.replace(/^639/, "");
    }

    // Format the number as +63 ### ### ####
    let formattedValue = "+63";
    if (inputValue.length > 2) {
      const remainingDigits = inputValue.slice(2);
      if (remainingDigits.length > 0) {
        formattedValue += " " + remainingDigits.slice(0, 3);
      }
      if (remainingDigits.length > 3) {
        formattedValue += " " + remainingDigits.slice(3, 6);
      }
      if (remainingDigits.length > 6) {
        formattedValue += " " + remainingDigits.slice(6, 10);
      }
    }

    // Limit total length
    if (formattedValue.length > 16) {
      formattedValue = formattedValue.slice(0, 16);
    }

    return formattedValue;
  };

  const handleContactNumberChange = (value: string) => {
    setContactNumber(formatContactNumber(value));
    if (serverError) clearServerError();
    if (errors.contactNumber) {
      setErrors({ ...errors, contactNumber: undefined });
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (serverError) clearServerError();
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (serverError) clearServerError();
    if (errors.confirmPassword) {
      setErrors({ ...errors, confirmPassword: undefined });
    }
  };

  const getRawContactNumber = (formattedNumber: string) =>
    formattedNumber.replace(/\s/g, "");

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Validate contact number
    const rawContact = getRawContactNumber(contactNumber);
    if (rawContact.length < 12 || rawContact.length > 15) {
      newErrors.contactNumber = "Contact number must be between 11-13 digits";
    } else if (!/^\+63[0-9]+$/.test(rawContact)) {
      newErrors.contactNumber =
        "Contact number must be a valid Philippines number";
    }

    // Validate password
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password =
        "Password must contain at least one special character";
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle user canceling setup
  const handleCancelSetup = async () => {
    Alert.alert(
      "Cancel Setup?",
      "Canceling will log you out. You'll need to complete setup next time you log in.",
      [
        {
          text: "Continue Setup",
          style: "cancel",
        },
        {
          text: "Cancel & Logout",
          style: "destructive",
          onPress: async () => {
            // Clean up ALL session data using centralized logout
            console.log("🧹 User cancelled setup - logging out");
            await performLogout();
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError(null);
    try {
      const rawContact = getRawContactNumber(contactNumber);

      // ✅ Check if setup was already completed (race condition protection)
      try {
        const profile = await authAPI.getProfile();

        const contactAlreadySet =
          profile.contactNumber &&
          profile.contactNumber !== "Not provided" &&
          profile.contactNumber !== "+639000000000";
        const passwordAlreadySet =
          profile.passwordNeedsSetup === false || profile.password;

        if (contactAlreadySet && passwordAlreadySet) {
          // ✅ Setup already complete
          console.log("Setup already complete, skipping redundant call");
          clearUserProfileState();
          router.replace("/(tabs)");
          return;
        }
      } catch (e) {
        // If profile check fails, continue with setup
        console.log("Could not check existing setup, continuing");
      }

      // Proceed with setup
      await authAPI.setupOAuthUser(rawContact, password);

      // ✅ FIX: Clear profile state before navigating to prevent showing old account data
      clearUserProfileState();

      Alert.alert(
        "Setup Complete",
        "Your account setup is complete. You can now access all features.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (error: any) {
      console.error("Setup error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to complete setup. Please try again.";
      setServerError(errorMessage);

      // ⚠️ Do NOT store token if setup fails!
      // Token should only be stored after successful setup
    } finally {
      setIsLoading(false);
    }
  };

  const clearServerError = () => {
    setServerError(null);
  };

  const getErrorType = (
    errorMessage: string | null
  ): "network" | "server" | "validation" | null => {
    if (!errorMessage) return null;
    const lowerError = errorMessage.toLowerCase();

    if (
      lowerError.includes("network") ||
      lowerError.includes("connection") ||
      lowerError.includes("timeout") ||
      lowerError.includes("fetch")
    ) {
      return "network";
    }
    if (
      lowerError.includes("500") ||
      lowerError.includes("server error") ||
      lowerError.includes("internal server")
    ) {
      return "server";
    }
    return "validation";
  };

  const getErrorIcon = (type: "network" | "server" | "validation" | null) => {
    switch (type) {
      case "network":
        return "cloud-offline-outline";
      case "server":
        return "server-outline";
      case "validation":
        return "alert-circle-outline";
      default:
        return "alert-circle-outline";
    }
  };

  const getErrorTitle = (type: "network" | "server" | "validation" | null) => {
    switch (type) {
      case "network":
        return "Connection Issue";
      case "server":
        return "Server Error";
      case "validation":
        return "Setup Failed";
      default:
        return "Error";
    }
  };

  const keyboardBehavior = Platform.OS === "ios" ? "padding" : undefined;
  const keyboardVerticalOffset = Platform.OS === "ios" ? insets.top : 0;

  // Password validation indicators
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardBehavior as any}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled={Platform.OS === "ios"}
      >
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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Main Card */}
            <View style={styles.mainCard}>
              {/* Decorative blur elements */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />

              {/* Title */}
              <View style={styles.headerSection}>
                <Text style={styles.title}>Complete Your Account Setup</Text>
                <Text style={styles.subtitle}>
                  Please provide your contact number and set a password for
                  field login.
                </Text>
              </View>

              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>Note:</Text> Your account setup
                  is almost complete. This information will be used for
                  authentication and important notifications.
                </Text>
              </View>

              {/* Server Error Message */}
              {serverError && (
                <View style={styles.serverErrorContainer}>
                  <View style={styles.errorHeader}>
                    <Ionicons
                      name={getErrorIcon(getErrorType(serverError)) as any}
                      size={20}
                      color="#DC2626"
                    />
                    <Text style={styles.errorTitle}>
                      {getErrorTitle(getErrorType(serverError))}
                    </Text>
                  </View>
                  <Text style={styles.serverErrorMessage}>{serverError}</Text>
                  {getErrorType(serverError) === "network" && (
                    <Text style={styles.errorHint}>
                      • Check your internet connection{"\n"}• Make sure you're
                      connected to WiFi or mobile data
                    </Text>
                  )}
                  {getErrorType(serverError) === "server" && (
                    <Text style={styles.errorHint}>
                      • The server is temporarily unavailable{"\n"}• Please try
                      again in a few moments
                    </Text>
                  )}
                </View>
              )}

              {/* Contact Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Number *</Text>
                <View
                  style={[
                    styles.inputRow,
                    errors.contactNumber && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={COLORS.maroon}
                    style={{ marginLeft: 12 }}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="+63 9## ### ####"
                    placeholderTextColor={COLORS.textMuted}
                    value={contactNumber}
                    onChangeText={handleContactNumberChange}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                </View>
                {errors.contactNumber && (
                  <Text style={styles.errorText}>{errors.contactNumber}</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <View
                  style={[
                    styles.inputRow,
                    errors.password && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.maroon}
                    style={{ marginLeft: 12 }}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a secure password"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ paddingHorizontal: 12 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={COLORS.maroon}
                    />
                  </Pressable>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                {/* Password Requirements Grid (matching web version) */}
                <View style={styles.requirementsGrid}>
                  <View style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementDot,
                        passwordChecks.length && styles.requirementDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        passwordChecks.length && styles.requirementTextActive,
                      ]}
                    >
                      8+ characters
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementDot,
                        passwordChecks.uppercase && styles.requirementDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        passwordChecks.uppercase &&
                          styles.requirementTextActive,
                      ]}
                    >
                      Uppercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementDot,
                        passwordChecks.lowercase && styles.requirementDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        passwordChecks.lowercase &&
                          styles.requirementTextActive,
                      ]}
                    >
                      Lowercase letter
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementDot,
                        passwordChecks.number && styles.requirementDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        passwordChecks.number && styles.requirementTextActive,
                      ]}
                    >
                      Number
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementDot,
                        passwordChecks.special && styles.requirementDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        passwordChecks.special && styles.requirementTextActive,
                      ]}
                    >
                      Special character
                    </Text>
                  </View>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View
                  style={[
                    styles.inputRow,
                    errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.maroon}
                    style={{ marginLeft: 12 }}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ paddingHorizontal: 12 }}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color={COLORS.maroon}
                    />
                  </Pressable>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Error message */}
              {errors.contactNumber ||
              errors.password ||
              errors.confirmPassword ? (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={Colors.maroon}
                  />
                  <Text style={styles.errorContainerText}>
                    {errors.contactNumber ||
                      errors.password ||
                      errors.confirmPassword}
                  </Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading || isCheckingSetup}
                style={[
                  styles.submitButton,
                  (isLoading || isCheckingSetup) && styles.submitButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Complete Setup"
              >
                {isLoading || isCheckingSetup ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.submitButtonText}>
                      {isCheckingSetup ? "Checking..." : "Setting up..."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.submitButtonText}>Complete Setup</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="white"
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                )}
              </Pressable>

              {/* Cancel Button */}
              <Pressable
                onPress={handleCancelSetup}
                disabled={isLoading}
                style={styles.cancelButton}
                accessibilityRole="button"
                accessibilityLabel="Cancel Setup"
              >
                <Text style={styles.cancelButtonText}>Cancel & Logout</Text>
              </Pressable>

              {/* Footer Note */}
              <Text style={styles.footerNote}>
                By completing this setup, you agree to our{" "}
                <Text style={styles.footerLink}>Terms and Conditions</Text> and{" "}
                <Text style={styles.footerLink}>Privacy Policy</Text>.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    paddingTop: 32,
  },
  mainCard: {
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
    paddingBottom: 24,
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
  headerSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.maroon,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    maxWidth: 300,
  },
  infoBanner: {
    backgroundColor: "#FFF8E1",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
    marginHorizontal: 24,
  },
  label: {
    color: Colors.maroon,
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gold + "66",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
  },
  inputError: {
    borderColor: "#DC2626",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#111827",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
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
  errorContainerText: {
    flex: 1,
    fontSize: 14,
    color: "#DC2626",
    marginLeft: 8,
  },
  requirementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
    marginHorizontal: 24,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "30%",
    minWidth: 100,
  },
  requirementDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D1D5DB",
    marginRight: 6,
  },
  requirementDotActive: {
    backgroundColor: "#16A34A",
  },
  requirementText: {
    fontSize: 12,
    color: "#6B7280",
  },
  requirementTextActive: {
    color: "#16A34A",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.maroon,
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    marginHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 56,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginHorizontal: 24,
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 24,
    marginHorizontal: 24,
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.maroon,
    fontWeight: "600",
  },
  serverErrorContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
    borderRadius: 8,
    padding: 12,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
    marginLeft: 8,
  },
  serverErrorMessage: {
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 18,
    marginBottom: 4,
  },
  errorHint: {
    fontSize: 12,
    color: "#B91C1C",
    lineHeight: 18,
    marginTop: 6,
    fontStyle: "italic",
  },
});
