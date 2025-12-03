import React, { useMemo, useState } from "react";
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
import TermsModal from "../../components/TermsModal";
import { useAuthSignup } from "../../src/features/auth/hooks/useAuthSignup";

const COLORS = {
  maroon: "#8B0000",
  gold: "#D4AF37",
  textMuted: "#666666",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

export default function SignupScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const contentMaxWidth = useMemo(() => {
    const isWide = width >= 768;
    const phoneCap = Math.max(320, width - 32 - 8 - 8);
    const wideCap = Math.min(width * 0.6, 720);
    return Math.round(isWide ? wideCap : Math.min(phoneCap, 560));
  }, [width]);

  const logoSize = useMemo(() => {
    const base = Math.min(width * 0.45, height * 0.28);
    return Math.max(120, Math.min(base, 200));
  }, [width, height]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [email, setEmail] = useState("");
  const [schoolIdNumber, setSchoolIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { isLoading, register } = useAuthSignup();

  const handleSignup = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !schoolIdNumber.trim() ||
      !password ||
      !confirmPassword ||
      !contactNumber.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }
    if (!acceptTerms) {
      Alert.alert(
        "Error",
        "Please accept the Terms of Service and Privacy Policy"
      );
      return;
    }

    try {
      const rawContactNumber = getRawContactNumber(contactNumber.trim());
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial.trim() || undefined,
        email: email.trim(),
        schoolIdNumber: schoolIdNumber.trim(),
        password,
        confirmPassword,
        contactNumber: rawContactNumber,
        termsAccepted: acceptTerms,
      });

      Alert.alert(
        "Account Created",
        "Your account has been created successfully. Please sign in.",
        [{ text: "OK", onPress: () => router.replace("/auth/login" as never) }]
      );
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";
      Alert.alert("Registration Error", errorMessage);
    }
  };

  const formatSchoolId = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(
      6,
      9
    )}`;
  };

  const formatContactNumber = (value: string) => {
    let inputValue = value.replace(/\D/g, "");
    if (!inputValue.startsWith("639")) {
      inputValue = "639" + inputValue.replace(/^639/, "");
    }
    let formattedValue = "+63";
    if (inputValue.length > 2) {
      const remaining = inputValue.slice(2);
      if (remaining.length > 0) formattedValue += " " + remaining.slice(0, 3);
      if (remaining.length > 3) formattedValue += " " + remaining.slice(3, 6);
      if (remaining.length > 6) formattedValue += " " + remaining.slice(6, 10);
    }
    return formattedValue;
  };

  const getRawContactNumber = (formattedNumber: string) =>
    formattedNumber.replace(/\s/g, "");

  const keyboardBehavior = Platform.OS === "ios" ? "padding" : "height";
  const keyboardVerticalOffset = Platform.OS === "ios" ? insets.top : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1a0000" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardBehavior as any}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {/* Top gradient with centered logo */}
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

        {/* Bottom white sheet (overlap) */}
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join WildWatch to report and track campus incidents
              </Text>
            </View>

            {/* Name row */}
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                maxWidth: contentMaxWidth,
                marginTop: 16,
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>First Name *</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.maroon}
                    style={{ marginLeft: 12 }}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter first name"
                    placeholderTextColor={COLORS.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={{ width: 64 }}>
                <Text style={styles.label}>M.I.</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { textAlign: "center" }]}
                    placeholder="M"
                    placeholderTextColor={COLORS.textMuted}
                    value={middleInitial}
                    onChangeText={(t) =>
                      setMiddleInitial(t.toUpperCase().slice(0, 1))
                    }
                    maxLength={1}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Last Name *</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.maroon}
                    style={{ marginLeft: 12 }}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter last name"
                    placeholderTextColor={COLORS.textMuted}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* CIT Email */}
            <View
              style={{
                width: "100%",
                maxWidth: contentMaxWidth,
                marginTop: 14,
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
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* School ID Number */}
            <View
              style={{
                width: "100%",
                maxWidth: contentMaxWidth,
                marginTop: 14,
              }}
            >
              <Text style={styles.label}>School ID Number *</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={COLORS.maroon}
                  style={{ marginLeft: 12 }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="22-0603-284"
                  placeholderTextColor={COLORS.textMuted}
                  value={schoolIdNumber}
                  onChangeText={(text) =>
                    setSchoolIdNumber(formatSchoolId(text))
                  }
                  keyboardType="numeric"
                  maxLength={11}
                />
              </View>
            </View>

            {/* Password */}
            <View
              style={{
                width: "100%",
                maxWidth: contentMaxWidth,
                marginTop: 14,
              }}
            >
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputRow}>
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
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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

            {/* Confirm Password */}
            <View
              style={{
                width: "100%",
                maxWidth: contentMaxWidth,
                marginTop: 14,
              }}
            >
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputRow}>
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
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
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
            </View>

            {/* Contact Number */}
            <View
              style={{
                width: "100%",
                maxWidth: contentMaxWidth,
                marginTop: 14,
              }}
            >
              <Text style={styles.label}>Contact Number *</Text>
              <View style={styles.inputRow}>
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
                  onChangeText={(text) =>
                    setContactNumber(formatContactNumber(text))
                  }
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Terms */}
            <View
              style={{
                width: "100%",
                maxWidth: contentMaxWidth,
                backgroundColor: "#FFF8E1",
                borderRadius: 12,
                padding: 12,
                marginTop: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Pressable
                  onPress={() => setAcceptTerms((v) => !v)}
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 4,
                    marginRight: 8,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                  }}
                >
                  {acceptTerms && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={COLORS.maroon}
                    />
                  )}
                </Pressable>
                <Text style={{ fontSize: 13, color: "#4B5563", flex: 1 }}>
                  By creating an account, you agree to our{" "}
                  <Text
                    onPress={() => setShowTerms(true)}
                    style={{ color: COLORS.maroon, fontWeight: "600" }}
                  >
                    Terms and Conditions
                  </Text>
                  .
                </Text>
              </View>
            </View>

            {/* Create Account */}
            <Pressable
              onPress={handleSignup}
              disabled={isLoading}
              style={[
                styles.primaryBtn,
                { width: "100%", maxWidth: contentMaxWidth, marginTop: 18 },
                isLoading && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.primaryText}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Text>
            </Pressable>

            {/* Sign In link */}
            <View
              style={{
                marginTop: 18,
                alignItems: "center",
                width: "100%",
                maxWidth: contentMaxWidth,
              }}
            >
              <Text style={{ color: "#4B5563" }}>
                Already have an account?{" "}
                <Text
                  onPress={() => router.push("/auth/login" as never)}
                  style={{ color: COLORS.maroon, fontWeight: "600" }}
                >
                  Sign in
                </Text>
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setAcceptTerms(true);
          setShowTerms(false);
        }}
        isLoading={isLoading}
      />
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
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    marginTop: -32, // overlap
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
  primaryBtn: {
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
});
