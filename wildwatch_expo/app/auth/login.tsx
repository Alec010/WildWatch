import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthLogin } from "../../src/features/auth/hooks/useAuthLogin";

const COLORS = {
  maroon: "#8B0000",
  gold: "#D4AF37",
  goldSoft: "#E8D8A6",
  textMuted: "#666666",
  border: "#E5E7EB",
};

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Dynamic content width
  const contentMaxWidth = useMemo(() => {
    const isWide = width >= 768;
    const phoneCap = Math.max(320, width - 32 - 8 - 8);
    const wideCap = Math.min(width * 0.6, 720);
    return Math.round(isWide ? wideCap : Math.min(phoneCap, 560));
  }, [width]);

  // Dynamic logo size
  const logoSize = useMemo(() => {
    const base = Math.min(width * 0.45, height * 0.28);
    return Math.max(120, Math.min(base, 200));
  }, [width, height]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, login, loginWithMicrosoft, clearError } = useAuthLogin();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (error) clearError();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    try {
      await login(email, password);
    } catch {}
  };

  const handleMicrosoftLogin = async () => {
    // Clear any existing errors when user attempts Microsoft login
    if (error) clearError();
    
    try {
      await loginWithMicrosoft();
    } catch (e: any) {
      // Check if user cancelled - if so, don't log as error
      if (e?.message?.includes('cancelled') || e?.message?.includes('User cancelled')) {
        // User intentionally cancelled, no action needed
        return;
      }
      // For other errors, log for debugging
      console.error('Microsoft login error:', e);
    }
  };

  const getErrorType = (errorMessage: string | null): 'network' | 'server' | 'auth' | 'oauth' | null => {
    if (!errorMessage) return null;
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('microsoft') || lowerError.includes('oauth') || 
        lowerError.includes('cancelled') || lowerError.includes('no token')) {
      return 'oauth';
    }
    if (lowerError.includes('network') || lowerError.includes('connection') || 
        lowerError.includes('timeout') || lowerError.includes('fetch')) {
      return 'network';
    }
    if (lowerError.includes('500') || lowerError.includes('server error') || 
        lowerError.includes('internal server')) {
      return 'server';
    }
    return 'auth';
  };

  const getErrorIcon = (type: 'network' | 'server' | 'auth' | 'oauth' | null) => {
    switch (type) {
      case 'network':
        return 'cloud-offline-outline';
      case 'server':
        return 'server-outline';
      case 'oauth':
        return 'logo-microsoft';
      case 'auth':
        return 'alert-circle-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  const getErrorTitle = (type: 'network' | 'server' | 'auth' | 'oauth' | null) => {
    switch (type) {
      case 'network':
        return 'Connection Issue';
      case 'server':
        return 'Server Error';
      case 'oauth':
        return 'Microsoft Login Issue';
      case 'auth':
        return 'Login Failed';
      default:
        return 'Error';
    }
  };

  const keyboardBehavior = Platform.OS === "ios" ? "padding" : undefined;
  const keyboardVerticalOffset = Platform.OS === "ios" ? insets.top : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1a0000" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardBehavior as any}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled={Platform.OS === "ios"}
      >
        {/* Top (flex) Gradient with centered logo */}
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
              style={{
                width: logoSize,
                height: logoSize,
                resizeMode: "contain",
              }}
              accessibilityLabel="WildWatch logo"
            />
          </View>
        </View>

        {/* Bottom (flex) White Sheet with overlap */}
        <View style={styles.bottom}>
          <ScrollView
            contentContainerStyle={[
              styles.sheetContent,
              { alignItems: "center" },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View
              style={{
                alignItems: "center",
                marginBottom: 8,
                width: "100%",
                maxWidth: contentMaxWidth,
              }}
            >
              <Text style={styles.title}>Sign In</Text>
              <Text style={styles.subtitle}>Access your WildWatch account</Text>
            </View>

            {/* Email */}
            <View
              style={{
                marginTop: 16,
                width: "100%",
                maxWidth: contentMaxWidth,
              }}
            >
              <Text style={styles.label}>CIT Email *</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.maroon}
                  style={{ marginLeft: 12 }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your.name@cit.edu"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View
              style={{
                marginTop: 14,
                width: "100%",
                maxWidth: contentMaxWidth,
              }}
            >
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password *</Text>
                <Pressable
                  onPress={() => router.push("/auth/forgot-password" as never)}
                >
                  <Text style={styles.linkMuted}>Forgot Password?</Text>
                </Pressable>
              </View>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.maroon}
                  style={{ marginLeft: 12 }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={{ paddingHorizontal: 12 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.maroon}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { width: "100%", maxWidth: contentMaxWidth },
                ]}
              >
                <View style={styles.errorHeader}>
                  <Ionicons
                    name={getErrorIcon(getErrorType(error)) as any}
                    size={20}
                    color="#DC2626"
                  />
                  <Text style={styles.errorTitle}>
                    {getErrorTitle(getErrorType(error))}
                  </Text>
                </View>
                <Text style={styles.errorMessage}>{error}</Text>
                {getErrorType(error) === 'network' && (
                  <Text style={styles.errorHint}>
                    • Check your internet connection{'\n'}
                    • Make sure you're connected to WiFi or mobile data
                  </Text>
                )}
                {getErrorType(error) === 'server' && (
                  <Text style={styles.errorHint}>
                    • The server is temporarily unavailable{'\n'}
                    • Please try again in a few moments
                  </Text>
                )}
                {getErrorType(error) === 'oauth' && (
                  <Text style={styles.errorHint}>
                    • Make sure you're using a valid Microsoft account{'\n'}
                    • Check your internet connection{'\n'}
                    • Try again or use email/password login
                  </Text>
                )}
              </View>
            )}

            {/* Sign In Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={[
                styles.primaryBtn,
                { width: "100%", maxWidth: contentMaxWidth },
                isLoading && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              <Text style={styles.primaryText}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </Pressable>

            {/* Divider */}
            <View
              style={[
                styles.dividerRow,
                { width: "100%", maxWidth: contentMaxWidth },
              ]}
            >
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Microsoft Button */}
            <Pressable
              onPress={handleMicrosoftLogin}
              disabled={isLoading}
              style={[
                styles.msBtn,
                { width: "100%", maxWidth: contentMaxWidth },
                isLoading && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Microsoft"
            >
              <Image
                source={require("../../assets/images/logos/microsoft_logo.png")}
                style={{
                  width: 20,
                  height: 20,
                  marginRight: 8,
                  resizeMode: "contain",
                }}
              />
              <Text style={styles.msText}>
                {isLoading ? "Signing in…" : "Sign in with Microsoft"}
              </Text>
            </Pressable>

            {/* Note */}
            <Text
              style={[
                styles.note,
                { width: "100%", maxWidth: contentMaxWidth },
              ]}
            >
              Note: When signing in with Microsoft, additional credentials may
              be required after authentication.
            </Text>

            {/* Sign Up */}
            <View
              style={{
                marginTop: 18,
                alignItems: "center",
                width: "100%",
                maxWidth: contentMaxWidth,
              }}
            >
              <Text style={{ color: "#4B5563" }}>
                Don&apos;t have an account?{" "}
                <Text
                  onPress={() => router.push("/auth/signup" as never)}
                  style={styles.linkMaroon}
                >
                  Create Account
                </Text>
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SHEET_RADIUS = 20;

const styles = StyleSheet.create({
  top: {
    flex: 3, // was 30%
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    flex: 7, // was 70%
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    marginTop: -32, // overlap the gradient
    overflow: "hidden",
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    color: COLORS.maroon,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  label: {
    color: COLORS.maroon,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#111827",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  linkMuted: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },
  linkMaroon: {
    color: COLORS.maroon,
    fontWeight: "600",
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#6B7280",
    fontSize: 12,
  },
  msBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  msText: {
    color: "#5E5E5E",
    fontSize: 15,
    fontWeight: "700",
  },
  note: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
  },
  errorContainer: {
    marginTop: 14,
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
  errorMessage: {
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
