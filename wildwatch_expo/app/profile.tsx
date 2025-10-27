import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { userAPI } from "../src/features/users/api/user_api";
import { useUserProfile } from "../src/features/users/hooks/useUserProfile";
import type {
  UserProfile,
  UserUpdateRequest,
} from "../src/features/users/models/UserProfileModels";
import { storage } from "../lib/storage";
import { config } from "../lib/config";
import Colors from "../constants/Colors";
import { useThemeColor } from "../components/Themed";
import TopSpacing from "../components/TopSpacing";
import { CircularLoader } from "../components/CircularLoader";
import { useBadgeSummary } from "../src/features/badges/hooks";
import { BadgePreview, BadgesModal } from "../src/features/badges/components";
import type { BadgeProgress } from "../src/features/badges/models/BadgeModels";
import { useRankingSummary } from "../src/features/ranking/hooks";
import { RankingDashboard } from "../src/features/ranking/components";
import { RANK_COLORS, RANK_NAMES } from "../src/features/ranking/models/RankingModels";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Theme colors using the established WildWatch brand
const primaryColor = Colors.maroon; // #800000
const accentColor = Colors.gold; // #D4AF37
const backgroundColor = "#F5F5F5";
const cardColor = "#FFFFFF";
const textPrimaryColor = "#1A1A1A";
const textSecondaryColor = "#6B7280";
const borderColor = "#E5E7EB";
const shadowColor = "#000000";

// Helper function to format role display
const formatRole = (role: string) => {
  if (!role) return "Regular User";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Password Change Modal Component
interface PasswordChangeModalProps {
  visible: boolean;
  onClose: () => void;
  authProvider?: string;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  visible,
  onClose,
  authProvider,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = await storage.getToken();
      const response = await fetch(
        `${config.API.BASE_URL}/api/users/me/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Failed to change password");
      }

      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
    } catch (e: any) {
      setError(e.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  };

  if (authProvider === "microsoft") {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              margin: 20,
              maxWidth: 400,
              width: "90%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="lock-closed" size={20} color={primaryColor} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: primaryColor,
                  marginLeft: 8,
                }}
              >
                Password Management
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#FEF3CD",
                borderColor: "#F59E0B",
                borderWidth: 1,
                borderRadius: 8,
                padding: 16,
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#92400E",
                    marginBottom: 4,
                  }}
                >
                  Password change is not allowed
                </Text>
                <Text style={{ fontSize: 12, color: "#92400E" }}>
                  Microsoft OAuth accounts must change their password through
                  Microsoft.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                backgroundColor: primaryColor,
                padding: 12,
                borderRadius: 8,
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 0,
            width: "100%",
            maxWidth: 400,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header with gradient */}
          <LinearGradient
            colors={["#800000", "#9a0000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingTop: 20,
              paddingBottom: 16,
              paddingHorizontal: 24,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <Ionicons
                  name="lock-closed"
                  size={24}
                  color="white"
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    style={{ fontSize: 18, fontWeight: "700", color: "white" }}
                  >
                    Reset Password
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255, 255, 255, 0.8)",
                      marginTop: 2,
                    }}
                  >
                    Update your credentials
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  padding: 4,
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={{ padding: 24 }}>
            <Text
              style={{
                fontSize: 14,
                color: textSecondaryColor,
                marginBottom: 24,
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              Enter your current password and a new password to update your
              credentials.
            </Text>

            {/* Current Password */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: textSecondaryColor,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Current Password
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    width: "100%",
                    height: 48,
                    paddingRight: 48,
                    paddingLeft: 16,
                    paddingVertical: 12,
                    backgroundColor: "#F8FAFC",
                    borderColor: currentPassword ? primaryColor : "#E2E8F0",
                    borderWidth: 1.5,
                    color: textPrimaryColor,
                    fontSize: 14,
                    borderRadius: 12,
                    fontWeight: "500",
                  }}
                />
                <TouchableOpacity
                  style={{ position: "absolute", right: 16, top: 14 }}
                  onPress={() => setShowCurrent(!showCurrent)}
                >
                  <Ionicons
                    name={showCurrent ? "eye-off" : "eye"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: textSecondaryColor,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                New Password
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="Enter new password (min. 8 characters)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    width: "100%",
                    height: 48,
                    paddingRight: 48,
                    paddingLeft: 16,
                    paddingVertical: 12,
                    backgroundColor: "#F8FAFC",
                    borderColor: newPassword ? primaryColor : "#E2E8F0",
                    borderWidth: 1.5,
                    color: textPrimaryColor,
                    fontSize: 14,
                    borderRadius: 12,
                    fontWeight: "500",
                  }}
                />
                <TouchableOpacity
                  style={{ position: "absolute", right: 16, top: 14 }}
                  onPress={() => setShowNew(!showNew)}
                >
                  <Ionicons
                    name={showNew ? "eye-off" : "eye"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {newPassword && newPassword.length < 8 && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 4,
                    marginLeft: 4,
                  }}
                >
                  Password must be at least 8 characters
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: textSecondaryColor,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Confirm New Password
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    width: "100%",
                    height: 48,
                    paddingRight: 48,
                    paddingLeft: 16,
                    paddingVertical: 12,
                    backgroundColor: "#F8FAFC",
                    borderColor: confirmPassword
                      ? confirmPassword === newPassword
                        ? "#10B981"
                        : "#EF4444"
                      : "#E2E8F0",
                    borderWidth: 1.5,
                    color: textPrimaryColor,
                    fontSize: 14,
                    borderRadius: 12,
                    fontWeight: "500",
                  }}
                />
                <TouchableOpacity
                  style={{ position: "absolute", right: 16, top: 14 }}
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <Ionicons
                    name={showConfirm ? "eye-off" : "eye"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword && confirmPassword !== newPassword && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 4,
                    marginLeft: 4,
                  }}
                >
                  Passwords do not match
                </Text>
              )}
            </View>

            {/* Success Message */}
            {success && (
              <View
                style={{
                  backgroundColor: "#D1FAE5",
                  borderColor: "#10B981",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#10B981"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    color: "#065F46",
                    fontSize: 13,
                    fontWeight: "500",
                    flex: 1,
                  }}
                >
                  {success}
                </Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View
                style={{
                  backgroundColor: "#FEE2E2",
                  borderColor: "#EF4444",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#EF4444"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    color: "#991B1B",
                    fontSize: 13,
                    fontWeight: "500",
                    flex: 1,
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: "#E2E8F0",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Text
                  style={{
                    color: textSecondaryColor,
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={
                  loading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8
                }
                style={{
                  flex: 1,
                  backgroundColor: primaryColor,
                  paddingVertical: 14,
                  borderRadius: 12,
                  opacity:
                    loading ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    newPassword.length < 8
                      ? 0.5
                      : 1,
                  shadowColor: primaryColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface ProfileSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  icon,
  iconTint,
  backgroundColor = "white",
  children,
}) => (
  <View
    style={{
      backgroundColor,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(139, 0, 0, 0.08)",
      overflow: "hidden",
    }}
  >
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: `${iconTint}08`,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(139, 0, 0, 0.1)",
        }}
      >
        <Ionicons
          name={icon}
          size={20}
          color={iconTint}
          style={{ marginRight: 12 }}
        />
        <Text
          style={{
            fontSize: 14,
            color: textPrimaryColor,
            fontWeight: "700",
            letterSpacing: 0.1,
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  </View>
);

interface ProfileTextFieldProps {
  value: string;
  onValueChange: (text: string) => void;
  label: string;
  readOnly?: boolean;
  leadingIcon?: React.ReactNode;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  style?: any;
}

const ProfileTextField: React.FC<ProfileTextFieldProps> = ({
  value,
  onValueChange,
  label,
  readOnly = true,
  leadingIcon,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  style,
}) => (
  <View style={{ marginBottom: 16, ...style }}>
    <Text
      style={{
        fontSize: 12,
        color: textSecondaryColor,
        fontWeight: "600",
        marginBottom: 4,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </Text>
    <View style={{ position: "relative" }}>
      {leadingIcon && (
        <View style={{ position: "absolute", left: 14, top: 14, zIndex: 10 }}>
          {leadingIcon}
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onValueChange}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textAlignVertical="center"
        maxLength={keyboardType === "phone-pad" ? 15 : undefined}
        style={{
          width: "100%",
          height: 44,
          paddingRight: 14,
          paddingLeft: leadingIcon ? 44 : 14,
          paddingVertical: 10,
          backgroundColor: readOnly ? "#F8FAFC" : "white",
          borderColor: readOnly ? "#E2E8F0" : primaryColor,
          borderWidth: readOnly ? 1 : 1.5,
          color: readOnly ? textSecondaryColor : textPrimaryColor,
          fontSize: 13,
          textAlign: "left",
          borderRadius: 8,
          fontWeight: readOnly ? "500" : "400",
          shadowColor: readOnly ? "transparent" : "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: readOnly ? 0 : 0.03,
          shadowRadius: 2,
          elevation: readOnly ? 0 : 1,
        }}
      />
    </View>
  </View>
);

export default function ProfileScreen() {
  const {
    userProfile,
    isLoading,
    error,
    fetchUserProfile,
    updateUserProfile,
    setUserProfile,
  } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Badge state
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [recentBadges, setRecentBadges] = useState<BadgeProgress[]>([]);
  
  // Badge hook
  const { badgeSummary, isLoading: loadingBadges, error: badgeError, refetch: refetchBadges } = 
    useBadgeSummary({ userRole: userProfile?.role, autoFetch: !!userProfile });
  
  // Ranking hook
  const { rankingSummary, rankProgress, isLoading: loadingRanking, refetch: refetchRanking } =
    useRankingSummary({ autoFetch: !!userProfile });


  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [originalValues, setOriginalValues] = useState({
    firstName: "",
    lastName: "",
    middleInitial: "",
    contactNumber: "",
  });


  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName);
      setLastName(userProfile.lastName);
      setMiddleInitial(userProfile.middleInitial || "");
      setContactNumber(userProfile.contactNumber);
      setOriginalValues({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        middleInitial: userProfile.middleInitial || "",
        contactNumber: userProfile.contactNumber,
      });
    }
  }, [userProfile]);

  // Set recent badges when badge summary changes
  useEffect(() => {
    if (badgeSummary) {
      const earnedBadges = badgeSummary.badges
        .filter(badge => badge.currentLevel > 0)
        .sort((a, b) => b.currentLevel - a.currentLevel)
        .slice(0, 3);
      
      setRecentBadges(earnedBadges);
    }
  }, [badgeSummary]);

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert("Validation Error", "First name is required.");
      return;
    }
    if (!lastName.trim()) {
      Alert.alert("Validation Error", "Last name is required.");
      return;
    }
    if (!contactNumber.trim()) {
      Alert.alert("Validation Error", "Contact number is required.");
      return;
    }

    // Validate contact number format
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(contactNumber)) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid contact number (10-15 digits)."
      );
      return;
    }

    // Check if there are any changes
    if (
      firstName === originalValues.firstName &&
      lastName === originalValues.lastName &&
      middleInitial === originalValues.middleInitial &&
      contactNumber === originalValues.contactNumber
    ) {
      Alert.alert("No Changes", "No changes to save.");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const updateRequest: UserUpdateRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial.trim() || undefined,
        contactNumber: contactNumber.trim(),
      };

      const updated = await updateUserProfile(updateRequest);
      setUserProfile(updated);
      setOriginalValues({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial.trim() || "",
        contactNumber: contactNumber.trim(),
      });
      setIsEditing(false);

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", style: "default" },
      ]);
    } catch (e: any) {
      Alert.alert(
        "Update Failed",
        e?.message || "Failed to update profile. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setFirstName(originalValues.firstName);
    setLastName(originalValues.lastName);
    setMiddleInitial(originalValues.middleInitial);
    setContactNumber(originalValues.contactNumber);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    // Update original values with current values before editing
    setOriginalValues({
      firstName: userProfile?.firstName || "",
      lastName: userProfile?.lastName || "",
      middleInitial: userProfile?.middleInitial || "",
      contactNumber: userProfile?.contactNumber || "",
    });
    setIsEditing(true);
  };

  const handleClaimBadge = async (badgeId: number) => {
    try {
      const { badgeAPI } = await import("../src/features/badges/api/badge_api");
      await badgeAPI.claimBadge(badgeId);
      // Refetch badges and user profile to update points
      await Promise.all([refetchBadges(), fetchUserProfile()]);
    } catch (error) {
      Alert.alert("Error", "Failed to claim badge. Please try again.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          // Clear all form data and authentication data
          await Promise.all([
            storage.removeToken(),
            storage.clearAllFormData(),
            storage.clearChatMessages(),
          ]);
          router.replace("/auth/login" as never);
        },
        style: "destructive",
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: backgroundColor }}
        edges={["left", "right", "bottom"]}
      >
        <CircularLoader subtitle="Loading your profile..." />
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: backgroundColor }}
        edges={["left", "right", "bottom"]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Ionicons name="person-circle-outline" size={64} color="#9CA3AF" />
          <Text
            style={{
              color: textSecondaryColor,
              marginTop: 24,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Failed to load profile. Please try again.
          </Text>
          {error ? (
            <Text
              style={{
                color: "#EF4444",
                marginTop: 12,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          ) : null}
          <TouchableOpacity
            style={{
              backgroundColor: primaryColor,
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 12,
              marginTop: 24,
            }}
            onPress={fetchUserProfile}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView
        className="flex-1 bg-gray-50"
        edges={["left", "right", "bottom"]}
      >
        {/* Top spacing for notch */}
        <TopSpacing />

        {/* Fixed Header */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 16,
            paddingTop: 40,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color="#8B0000" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#8B0000",
              flex: 1,
            }}
          >
            Profile
          </Text>
        </View>

        {/* Scrollable Content */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 24 }}>
            {/* User Profile Header Card */}
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
                borderWidth: 1,
                borderColor: "rgba(139, 0, 0, 0.08)",
              }}
            >
              <LinearGradient
                colors={["#800000", "#9a0000", "#800000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 20, position: "relative" }}
              >
                {/* Decorative elements */}
                <View
                  style={{
                    position: "absolute",
                    top: -50,
                    right: -50,
                    width: 100,
                    height: 100,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 50,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -50,
                    left: -50,
                    width: 100,
                    height: 100,
                    backgroundColor: "rgba(212, 175, 55, 0.1)",
                    borderRadius: 50,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: "rgba(212, 175, 55, 0.8)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                        shadowColor: "#D4AF37",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 62,
                          height: 62,
                          borderRadius: 31,
                          backgroundColor: "white",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: primaryColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: "700",
                            color: primaryColor,
                            letterSpacing: 0.5,
                          }}
                        >
                          {firstName.charAt(0).toUpperCase()}
                          {lastName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 8,
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 22,
                            fontWeight: "700",
                            color: "white",
                            flex: 1,
                          }}
                        >
                          {firstName} {lastName}
                        </Text>
                        <View
                          style={{
                            backgroundColor: "#D4AF37",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                            elevation: 2,
                            marginTop: 2,
                            marginLeft: 12,
                          }}
                        >
                          <Ionicons name="trophy" size={12} color="#800000" />
                          <Text
                            style={{
                              color: "#800000",
                              fontSize: 11,
                              fontWeight: "700",
                              marginLeft: 4,
                            }}
                          >
                            {Math.round(userProfile?.points || 0)} pts
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="mail"
                          size={12}
                          color="rgba(255, 255, 255, 0.7)"
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "rgba(255, 255, 255, 0.9)",
                            marginLeft: 6,
                            fontWeight: "500",
                          }}
                        >
                          {userProfile.email}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 10,
                          alignSelf: "flex-start",
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color="white"
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            color: "white",
                            fontWeight: "600",
                            marginLeft: 4,
                          }}
                        >
                          {formatRole(userProfile.role)}
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontSize: 11,
                          color: "rgba(255, 255, 255, 0.8)",
                          fontWeight: "500",
                        }}
                      >
                        ID: {userProfile.schoolIdNumber}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

             {/* Combined Ranking and Badges Section */}
             <ProfileSection
               title="Achievements & Recognition"
               icon="ribbon"
               iconTint={primaryColor}
               backgroundColor="white"
             >
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                {/* Ranking Section */}
                <View style={{ marginBottom: 20 }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    marginBottom: 4,
                  }}>
                    <Ionicons name="trending-up" size={16} color={primaryColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimaryColor }}>Your Ranking</Text>
                  </View>

                  {/* Current Rank Info */}
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginTop: 12,
                    marginBottom: 16,
                    paddingHorizontal: 4,
                  }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: rankProgress ? `${RANK_COLORS[rankProgress.currentRank]}20` : '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons 
                        name={rankProgress?.currentRank === 'NONE' ? "person-outline" : "medal"} 
                        size={18} 
                        color={rankProgress ? RANK_COLORS[rankProgress.currentRank] : '#6B7280'} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 15, 
                        fontWeight: '600', 
                        color: rankProgress ? RANK_COLORS[rankProgress.currentRank] : '#374151',
                        marginBottom: 2,
                      }}>
                        {rankProgress?.rankDisplayName || 'Loading...'}
                      </Text>
                      <Text style={{ 
                        fontSize: 12, 
                        color: '#6B7280',
                      }}>
                        {rankProgress?.currentPoints?.toLocaleString() || '0'} points
                      </Text>
                    </View>
                    {rankProgress?.nextRank && (
                      <View style={{
                        backgroundColor: '#F3F4F6',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                        <Text style={{ 
                          color: '#6B7280', 
                          marginRight: 4, 
                          fontSize: 11,
                        }}>Next Rank</Text>
                        <View style={{
                          backgroundColor: RANK_COLORS[rankProgress.nextRank],
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                          <Ionicons name="medal" size={12} color="white" style={{ marginRight: 2 }} />
                          <Text style={{ color: 'white', fontWeight: '600', fontSize: 10 }}>
                            {RANK_NAMES[rankProgress.nextRank]}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Progress Bar */}
                  <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
                    <View style={{
                      height: 6,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 3,
                      overflow: 'hidden',
                      marginBottom: 6,
                    }}>
                      {rankProgress && (
                        <LinearGradient
                          colors={[
                            RANK_COLORS[rankProgress.currentRank],
                            rankProgress.nextRank ? RANK_COLORS[rankProgress.nextRank] : RANK_COLORS[rankProgress.currentRank]
                          ]}
                          style={{
                            width: `${rankProgress.progressPercentage}%`,
                            height: '100%',
                            borderRadius: 3,
                          }}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      )}
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>
                        {rankProgress?.rankDisplayName || 'Unranked'}
                      </Text>
                      {rankProgress?.nextRank && (
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>
                          {rankProgress.pointsToNextRank.toLocaleString()} more points to reach {RANK_NAMES[rankProgress.nextRank]}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Rank Tiers */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    backgroundColor: '#F9FAFB',
                    borderRadius: 10,
                    padding: 12,
                    marginHorizontal: 4,
                  }}>
                    {/* Bronze */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FDF2F8',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                      }}>
                        <Ionicons name="medal" size={18} color="#CD7F32" />
                      </View>
                      <Text style={{ 
                        color: '#6B7280', 
                        fontSize: 11, 
                        marginBottom: 1,
                      }}>Bronze</Text>
                      <Text style={{ 
                        color: '#374151', 
                        fontWeight: '600', 
                        fontSize: 12,
                      }}>100 pts</Text>
                    </View>

                    {/* Silver */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#F9FAFB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                      }}>
                        <Ionicons name="medal" size={18} color="#9CA3AF" />
                      </View>
                      <Text style={{ 
                        color: '#6B7280', 
                        fontSize: 11, 
                        marginBottom: 1,
                      }}>Silver</Text>
                      <Text style={{ 
                        color: '#374151', 
                        fontWeight: '600', 
                        fontSize: 12,
                      }}>200 pts</Text>
                    </View>

                    {/* Gold */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FFFBEB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                      }}>
                        <Ionicons name="medal" size={18} color="#FCD34D" />
                      </View>
                      <Text style={{ 
                        color: '#6B7280', 
                        fontSize: 11, 
                        marginBottom: 1,
                      }}>Gold</Text>
                      <Text style={{ 
                        color: '#374151', 
                        fontWeight: '600', 
                        fontSize: 12,
                      }}>300 pts</Text>
                    </View>
                  </View>
                </View>

                {/* Badges Section */}
                <View style={{ marginTop: 8 }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <Ionicons name="trophy" size={16} color={primaryColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimaryColor }}>Your Badges</Text>
                  </View>

                  {!loadingBadges && badgeSummary && (
                    <>
                      {recentBadges.length > 0 ? (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          paddingHorizontal: 4 
                        }}>
                          <View style={{ marginRight: 10 }}>
                            <View style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: '#3B82F620',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Ionicons name="alert-circle" size={24} color="#3B82F6" />
                            </View>
                            <View style={{
                              position: 'absolute',
                              bottom: -3,
                              right: -3,
                              backgroundColor: '#3B82F6',
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1.5,
                              borderColor: 'white',
                            }}>
                              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>3</Text>
                            </View>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 1 }}>
                              First Responder
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>Level 3</Text>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setIsBadgeModalOpen(true)}
                          style={{
                            backgroundColor: '#FFFBEB',
                            borderRadius: 10,
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginHorizontal: 4,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View
                              style={{
                                backgroundColor: '#FEF3C7',
                                padding: 8,
                                borderRadius: 8,
                              }}
                            >
                              <Ionicons name="trophy-outline" size={18} color="#D97706" />
                            </View>
                            <View>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>
                                View Your Badges
                              </Text>
                              <Text style={{ fontSize: 11, color: '#92400E', marginTop: 1 }}>
                                {badgeSummary.totalBadgesAvailable} badges available to earn
                              </Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#D97706" />
                        </TouchableOpacity>
                      )}

                      {/* View All Button */}
                      {recentBadges.length > 0 && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: 'white',
                            borderRadius: 8,
                            padding: 8,
                            alignItems: 'center',
                            marginTop: 12,
                            marginHorizontal: 4,
                            borderWidth: 1,
                            borderColor: '#F3F4F6',
                          }}
                          onPress={() => setIsBadgeModalOpen(true)}
                        >
                          <Text style={{ color: '#374151', fontWeight: '500', fontSize: 12 }}>View All</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {/* Badge Loading State */}
                  {loadingBadges && (
                    <View style={{
                      alignItems: 'center',
                      padding: 16,
                    }}>
                      <ActivityIndicator size="small" color="#8B0000" />
                      <Text style={{ marginTop: 6, fontSize: 11, color: '#6B7280' }}>
                        Loading badges...
                      </Text>
                    </View>
                  )}

                  {/* Badge Error State */}
                  {badgeError && (
                    <View style={{
                      backgroundColor: '#FEF2F2',
                      borderRadius: 10,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#FECACA',
                      marginHorizontal: 4,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="warning" size={16} color="#DC2626" />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626' }}>
                          Badge Error
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#DC2626', marginTop: 3 }}>
                        {badgeError}
                      </Text>
                      <TouchableOpacity
                        onPress={refetchBadges}
                        style={{
                          backgroundColor: '#DC2626',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginTop: 6,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>
                          Retry
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
             </ProfileSection>

               {/* Personal Information Section */}
               <ProfileSection
                 title="Personal Information"
                 icon="person"
                 iconTint={primaryColor}
               >
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <View
                  style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}
                >
                  <View style={{ flex: 1 }}>
                    <ProfileTextField
                      value={firstName}
                      onValueChange={(text) =>
                        setFirstName(
                          text.replace(/^./, text[0]?.toUpperCase() || "")
                        )
                      }
                      label="First Name"
                      readOnly={!isEditing}
                      placeholder="Enter first name"
                      style={{ marginBottom: 0 }}
                    />
                  </View>
                  <View style={{ width: 80 }}>
                    <ProfileTextField
                      value={middleInitial}
                      onValueChange={(text) =>
                        setMiddleInitial(text.toUpperCase().slice(0, 1))
                      }
                      label="M.I."
                      readOnly={!isEditing}
                      placeholder="I"
                      autoCapitalize="characters"
                      style={{ marginBottom: 0 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProfileTextField
                      value={lastName}
                      onValueChange={(text) =>
                        setLastName(
                          text.replace(/^./, text[0]?.toUpperCase() || "")
                        )
                      }
                      label="Last Name"
                      readOnly={!isEditing}
                      placeholder="Enter last name"
                      style={{ marginBottom: 0 }}
                    />
                  </View>
                </View>
                <ProfileTextField
                  value={contactNumber}
                  onValueChange={setContactNumber}
                  label="Contact Number"
                  readOnly={!isEditing}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                  leadingIcon={
                    <Ionicons
                      name="call"
                      size={16}
                      color={textSecondaryColor}
                    />
                  }
                />
              </View>
            </ProfileSection>

            {/* Account Information Section */}
            <ProfileSection
              title="Account Information"
              icon="shield-checkmark"
              iconTint={primaryColor}
            >
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: textSecondaryColor,
                      fontWeight: "600",
                      marginBottom: 4,
                      letterSpacing: 0.1,
                    }}
                  >
                    Institutional Email
                  </Text>
                  <View style={{ position: "relative" }}>
                    <View
                      style={{
                        position: "absolute",
                        left: 14,
                        top: 14,
                        zIndex: 10,
                      }}
                    >
                      <Ionicons
                        name="mail"
                        size={16}
                        color={textSecondaryColor}
                      />
                    </View>
                    <TextInput
                      value={userProfile.email}
                      editable={false}
                      style={{
                        width: "100%",
                        height: 44,
                        paddingRight: 14,
                        paddingLeft: 44,
                        paddingVertical: 10,
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                        borderWidth: 1,
                        color: textSecondaryColor,
                        fontSize: 13,
                        borderRadius: 8,
                        fontWeight: "500",
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: textSecondaryColor,
                      fontStyle: "italic",
                      marginTop: 4,
                      marginLeft: 4,
                    }}
                  >
                    Email cannot be changed
                  </Text>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: textSecondaryColor,
                      fontWeight: "600",
                      marginBottom: 4,
                      letterSpacing: 0.1,
                    }}
                  >
                    Role
                  </Text>
                  <View style={{ position: "relative" }}>
                    <View
                      style={{
                        position: "absolute",
                        left: 14,
                        top: 14,
                        zIndex: 10,
                      }}
                    >
                      <Ionicons
                        name="school"
                        size={16}
                        color={textSecondaryColor}
                      />
                    </View>
                    <TextInput
                      value={formatRole(userProfile.role)}
                      editable={false}
                      style={{
                        width: "100%",
                        height: 44,
                        paddingRight: 14,
                        paddingLeft: 44,
                        paddingVertical: 10,
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                        borderWidth: 1,
                        color: textSecondaryColor,
                        fontSize: 13,
                        borderRadius: 8,
                        fontWeight: "500",
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: textSecondaryColor,
                      fontStyle: "italic",
                      marginTop: 4,
                      marginLeft: 4,
                    }}
                  >
                    Role is assigned by the system
                  </Text>
                </View>
              </View>
            </ProfileSection>

            {/* Password Management Section */}
            <ProfileSection
              title="Password Management"
              icon="lock-closed"
              iconTint={primaryColor}
            >
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <View style={{ gap: 12 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: textSecondaryColor,
                      lineHeight: 20,
                    }}
                  >
                    For security reasons, we recommend changing your password
                    regularly.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowPasswordModal(true)}
                    style={{
                      backgroundColor: primaryColor,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: primaryColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="lock-closed" size={18} color="white" />
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "600",
                        marginLeft: 8,
                        fontSize: 14,
                      }}
                    >
                      Reset Password
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ProfileSection>

            {/* Account Actions Section */}
            <ProfileSection
              title="Account Actions"
              icon="settings"
              iconTint={primaryColor}
            >
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {isEditing ? (
                    <>
                      {/* Save Button */}
                      <TouchableOpacity
                        onPress={handleSaveProfile}
                        disabled={isSaving}
                        style={{
                          flex: 1,
                          backgroundColor: primaryColor,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: primaryColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                          opacity: isSaving ? 0.7 : 1,
                        }}
                      >
                        {isSaving ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <Ionicons name="save" size={18} color="white" />
                            <Text
                              style={{
                                color: "white",
                                fontWeight: "600",
                                marginLeft: 8,
                                fontSize: 14,
                              }}
                            >
                              Save Changes
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* Cancel Button */}
                      <TouchableOpacity
                        onPress={handleCancelEdit}
                        style={{
                          flex: 1,
                          backgroundColor: "#6B7280",
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#6B7280",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="close" size={18} color="white" />
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "600",
                            marginLeft: 8,
                            fontSize: 14,
                          }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {/* Edit Profile Button */}
                      <TouchableOpacity
                        onPress={handleStartEdit}
                        style={{
                          flex: 1,
                          backgroundColor: primaryColor,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: primaryColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="create" size={18} color="white" />
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "600",
                            marginLeft: 8,
                            fontSize: 14,
                          }}
                        >
                          Edit Profile
                        </Text>
                      </TouchableOpacity>

                      {/* Logout Button */}
                      <TouchableOpacity
                        onPress={handleLogout}
                        style={{
                          flex: 1,
                          backgroundColor: primaryColor,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: primaryColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="log-out" size={18} color="white" />
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "600",
                            marginLeft: 8,
                            fontSize: 14,
                          }}
                        >
                          Logout
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </ProfileSection>
          </View>
        </ScrollView>

        {/* Password Change Modal */}
        <PasswordChangeModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          authProvider={userProfile.authProvider}
        />

        {/* Badges Modal */}
        <BadgesModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          badgeSummary={badgeSummary}
          isLoading={loadingBadges}
          onClaimBadge={handleClaimBadge}
        />
      </SafeAreaView>
    </View>
  );
}
