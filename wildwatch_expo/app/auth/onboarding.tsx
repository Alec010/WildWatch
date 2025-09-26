// onboarding.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthLogin } from "@/src/features/auth/hooks/useAuthLogin";

const COLORS = {
  maroon: "#8B0000",
  maroonDark: "#2B0000",
  gold: "#D4AF37",
  goldSoft: "#E8D8A6",
  white: "#FFFFFF",
  translucentGold: "rgba(212,175,55,0.15)",
};

export default function OnboardingScreen() {
  const goSignIn = () => router.push("/auth/login" as never);
  const goSignUp = () => router.push("/auth/signup" as never);
  const { loginWithMicrosoft } = useAuthLogin();

  const handleMicrosoftLogin = async () => {
    try {
      await loginWithMicrosoft();
    } catch (e: any) {
      Alert.alert(
        "Microsoft Login Error",
        e?.message || "Microsoft login failed. Please try again."
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#9e0202", "#7d0101", "#510000", "#1a0000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Logos at the top */}
        <View style={styles.logoRow}>
          <Image
            source={require("../../assets/images/logos/CIT Logo.png")}
            style={{ width: 140, height: 180, resizeMode: "contain" }}
            accessibilityLabel="CIT logo"
          />
          <View style={{ width: 24 }} />
          <Image
            source={require("../../assets/images/logos/logo2.png")}
            style={{ width: 180, height: 180, resizeMode: "contain" }}
            accessibilityLabel="WildWatch logo"
          />
        </View>

        {/* Centered Content */}
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Welcome to WildWatch!</Text>
          <Text style={styles.subtitle}>
            Safer campuses through smart reporting and fast resolution.
          </Text>

          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={goSignIn}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              <Text style={styles.primaryText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={goSignUp}
              accessibilityRole="button"
              accessibilityLabel="Sign Up"
            >
              <Text style={styles.secondaryText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Section: Microsoft + Footer */}
        <View style={styles.bottomWrap}>
          <TouchableOpacity
            style={styles.msBtn}
            onPress={handleMicrosoftLogin}
            accessibilityRole="button"
            accessibilityLabel="Continue with Microsoft"
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
            <Text style={styles.msText}>Continue with Microsoft</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.gold} />
            <Text style={styles.footerText}> Powered by WildWatch</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const MAX_WIDTH = 520;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 86,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginBottom: 72,
  },
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
    maxWidth: MAX_WIDTH,
  },
  subtitle: {
    color: COLORS.goldSoft,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
    maxWidth: MAX_WIDTH,
  },
  btnGroup: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    marginTop: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    height: 52,
    width: "100%",
    maxWidth: MAX_WIDTH,
  },
  primaryText: {
    color: COLORS.maroon,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    marginTop: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.translucentGold,
    height: 52,
    width: "100%",
    maxWidth: MAX_WIDTH,
  },
  secondaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  msBtn: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 16,
    height: 52,
    width: "100%",
    maxWidth: MAX_WIDTH,
  },
  msText: {
    color: "#5E5E5E",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomWrap: {
    alignItems: "center",
    marginBottom: 64,
    paddingHorizontal: 24,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    opacity: 0.9,
  },
  footerText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "600",
  },
});
