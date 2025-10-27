import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
  StyleSheet,
  Platform,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
// NOTE: Design-only refactor. **Logic, hooks, data flow preserved**
import { useIncidentDetails } from "../../src/features/incidents/hooks/useIncidentDetails";
import { useUpvoteStatus } from "../../src/features/incidents/hooks/useUpvoteStatus";
import { config } from "../../lib/config";
import { RatingModal } from "../../src/features/ratings/components/RatingModal";
import { RatingAnalytics } from "../../src/features/ratings/components/RatingAnalytics";
import { useRating } from "../../src/features/ratings/hooks/useRating";
import { useUserProfile } from "../../src/features/users/hooks/useUserProfile";
import { CircularLoader } from "../../components/CircularLoader";
import { getReporterDisplayName, getReporterDisplayEmail, getReporterDisplayPhone } from "../../src/utils/anonymousUtils";

interface ProgressStep {
  title: string;
  icon: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

// ---- THEME ---------------------------------------------------------------
const PALETTE = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  cardElev: "#F8F9FA",
  text: "#1F2937",
  subtext: "#6B7280",
  border: "#E5E7EB",
  maroon: "#8B0000",
  maroonSoft: "#A52A2A",
  gold: "#D97706",
  goldSoft: "#F59E0B",
  accent: "#8B0000",
  success: "#16A34A",
  blue: "#1976D2",
  warn: "#F59E0B",
  muted: "#9CA3AF",
};

const RADIUS = 16;
const GAP = 14;

// Subtle shadow for iOS + elevation for Android
const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  android: {
    elevation: 2,
    shadowColor: "#000",
  },
  default: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default function CaseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { token, incident, isLoading, error, refetch } = useIncidentDetails(id);
  const { ratingStatus, fetchRatingStatus } = useRating(id || "");
  const { hasUpvoted, setHasUpvoted, refetchUpvoteStatus } = useUpvoteStatus(
    incident?.id?.toString()
  );
  const { userProfile } = useUserProfile();

  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [showImageModal, setShowImageModal] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [ratingType, setRatingType] = React.useState<"reporter" | "office">(
    "reporter"
  );

  const H = Dimensions.get("window").height;
  const W = Dimensions.get("window").width;
  const isSmall = H < 700;
  const isNarrow = W < 620;
  const base = isSmall ? 13 : 14;
  const chipFontSize = isNarrow ? 11 : 12;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), fetchRatingStatus(), refetchUpvoteStatus()]);
    setRefreshing(false);
  };

  const handleRatingPress = (type: "reporter" | "office") => {
    setRatingType(type);
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => fetchRatingStatus();

  // Check if current user is the reporter to prevent self-rating
  const isCurrentUserReporter = React.useMemo(() => {
    if (!userProfile?.email || !incident?.submittedByEmail) return false;
    return userProfile.email.toLowerCase() === incident.submittedByEmail.toLowerCase();
  }, [userProfile?.email, incident?.submittedByEmail]);

  const handleUpvote = async () => {
    if (!token || !incident) return;
    try {
      const res = await fetch(
        `${config.API.BASE_URL}/incidents/${incident.id}/upvote`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;
      const wasUpvoted = !hasUpvoted;
      setHasUpvoted(wasUpvoted);
      Toast.show({
        type: "success",
        text1: wasUpvoted
          ? "Upvoted Successfully!"
          : "Removed Upvote Successfully!",
        position: "bottom",
        visibilityTime: 2000,
      });
      await Promise.all([refetch(), refetchUpvoteStatus()]);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Failed to update upvote",
        text2: "Please try again",
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  const getProgressSteps = (status: string): ProgressStep[] => {
    const steps: ProgressStep[] = [
      {
        title: "Submitted",
        icon: "time-outline",
        isCompleted: false,
        isCurrent: false,
      },
      {
        title: "Reviewing",
        icon: "eye-outline",
        isCompleted: false,
        isCurrent: false,
      },
      {
        title: "In Progress",
        icon: "ellipsis-horizontal",
        isCompleted: false,
        isCurrent: false,
      },
      {
        title: "Resolved",
        icon: "checkmark-outline",
        isCompleted: false,
        isCurrent: false,
      },
    ];
    const isDismissed = status?.toUpperCase() === "DISMISSED";
    if (isDismissed)
      steps.push({
        title: "Dismissed",
        icon: "close-outline",
        isCompleted: false,
        isCurrent: false,
      });

    const normalizedStatus = status?.toUpperCase().replace(/\s+/g, "_");
    switch (normalizedStatus) {
      case "SUBMITTED":
        steps[0].isCompleted = true;
        break;
      case "PENDING":
        steps[0].isCompleted = true;
        steps[1].isCurrent = true;
        break;
      case "REVIEWED":
        steps[0].isCompleted = true;
        steps[1].isCurrent = true;
        break;
      case "IN_PROGRESS":
        steps[0].isCompleted = true;
        steps[1].isCompleted = true;
        steps[2].isCurrent = true;
        break;
      case "RESOLVED":
        steps[0].isCompleted = true;
        steps[1].isCompleted = true;
        steps[2].isCompleted = true;
        steps[3].isCompleted = true;
        break;
      case "DISMISSED":
        steps[0].isCompleted = true;
        steps[4].isCurrent = true;
        break;
    }

    // Rename to "Reviewed" only if the line after is colored (isCompleted = true)
    if (steps[1].isCompleted) {
      steps[1].title = "Reviewed";
    }

    return steps;
  };

  const formatDate = (d?: string) => {
    try {
      if (!d) return "-";
      const date = new Date(d);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d || "-";
    }
  };

  const formatFullDate = (d?: string) => {
    try {
      if (!d) return "-";
      const date = new Date(d);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d || "-";
    }
  };

  const formatDateTime = (dateString?: string, timeString?: string) => {
    try {
      if (!dateString) return "-";
      const date = new Date(dateString);
      const t = timeString ? new Date(`2000-01-01T${timeString}`) : null;
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (t) {
        const timeStr = t.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return `${dateStr} ${timeStr}`;
      }
      return dateStr;
    } catch {
      return "N/A";
    }
  };

  if (isLoading && !incident) {
    return (
      <View style={styles.screen}>
        <CircularLoader subtitle="Loading incident details..." />
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View
        style={[
          styles.screen,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
          },
        ]}
      >
        <Ionicons name="alert-circle" size={48} color={PALETTE.warn} />
        <Text
          style={{
            marginTop: 12,
            color: PALETTE.subtext,
            fontSize: base + 1,
            textAlign: "center",
          }}
        >
          {error || "Failed to load incident details"}
        </Text>
        <TouchableOpacity
          onPress={refetch}
          style={[styles.btn, { marginTop: 14 }]}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = getProgressSteps(incident.status);
  const isDismissed = incident.status?.toUpperCase() === "DISMISSED";

  const getStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase().replace(/\s+/g, "_");
    switch (statusUpper) {
      case "SUBMITTED":
      case "PENDING":
        return { bg: "#F59E0B", icon: "hourglass-outline" };
      case "IN_PROGRESS":
        return { bg: "#1976D2", icon: "sync-outline" };
      case "ON_HOLD":
        return { bg: "#DC2626", icon: "pause-outline" };
      case "RESOLVED":
        return { bg: "#16A34A", icon: "checkmark-done-outline" };
      case "DISMISSED":
        return { bg: "#6B7280", icon: "close-outline" };
      default:
        return { bg: PALETTE.maroonSoft, icon: "shield-checkmark" };
    }
  };

  const statusColor = getStatusColor(incident.status);

  // Derived handy chips
  const StatusPill = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: statusColor.bg,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
      ]}
    >
      <Ionicons name={statusColor.icon as any} size={16} color="#FFFFFF" />
      <Text style={[styles.pillText, { fontSize: 13 }]}>
        {(incident.status || "").replace(/_/g, " ")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* TOP BAR */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={28} color="#FDB022" />
        </TouchableOpacity>
        <Text
          style={[styles.title, { color: "#FFFFFF", flex: 1 }]}
          numberOfLines={1}
        >
          Case Details
        </Text>
        <TouchableOpacity
          onPress={handleUpvote}
          style={{
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            padding: 8,
          }}
        >
          <Ionicons
            name={hasUpvoted ? "thumbs-up" : "thumbs-up-outline"}
            size={24}
            color="#FDB022"
          />
          <Text style={{ color: "#FDB022", fontWeight: "700", fontSize: 16 }}>
            {incident.upvoteCount || 0}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ backgroundColor: "#FFFFFF" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PALETTE.gold}
          />
        }
        contentContainerStyle={{ padding: GAP }}
      >
        {/* CASE HEADER */}
        <Card>
          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.overline}>CASE ID</Text>
                <Text
                  style={styles.h2}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {incident.trackingNumber}
                </Text>
              </View>
              <View style={{ flexShrink: 0 }}>{StatusPill}</View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {incident.estimatedResolutionDate ? (
                (() => {
                  const isResolved =
                    incident.status?.toUpperCase().replace(/\s+/g, "_") ===
                    "RESOLVED";
                  const etrDate = new Date(incident.estimatedResolutionDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  etrDate.setHours(0, 0, 0, 0);
                  const isPastDue = !isResolved && etrDate < today;
                  const displayColor = isResolved
                    ? PALETTE.success
                    : isPastDue
                    ? "#DC2626"
                    : PALETTE.gold;
                  return (
                    <Chip
                      icon="calendar"
                      label={`ETR: ${formatDate(
                        incident.estimatedResolutionDate
                      )}`}
                      bold
                      fontSize={chipFontSize}
                      iconColor={displayColor}
                      textColor={displayColor}
                    />
                  );
                })()
              ) : (
                <Chip
                  icon="time"
                  label={"ETR: Pending"}
                  bold
                  fontSize={chipFontSize}
                />
              )}
              <Chip
                icon="refresh"
                label={`Updated: ${formatFullDate(incident.submittedAt)}`}
                fontSize={chipFontSize}
              />
            </View>
          </View>
        </Card>

        {/* CASE STATUS TIMELINE */}
        <Card title="Case Status">
          <View style={{ position: "relative" }}>
            {/* Icons row with connecting line */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              {/* Connecting line background */}
              <View
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  height: 4,
                  backgroundColor: PALETTE.border,
                  top: "50%",
                  marginTop: -2,
                  borderRadius: 2,
                }}
              />
              {/* Progress line overlay */}
              <View
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  height: 4,
                  top: "50%",
                  marginTop: -2,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    width: `${Math.min(
                      100,
                      (progress.filter((s) => s.isCompleted).length /
                        (progress.length - 1)) *
                        100
                    )}%`,
                    height: 4,
                    backgroundColor:
                      incident.status?.toUpperCase().replace(/\s+/g, "_") ===
                      "RESOLVED"
                        ? PALETTE.success
                        : incident.status
                            ?.toUpperCase()
                            .replace(/\s+/g, "_") === "IN_PROGRESS"
                        ? PALETTE.blue
                        : PALETTE.maroon,
                    borderRadius: 2,
                  }}
                />
              </View>
              {progress.map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        s.isCompleted || s.isCurrent
                          ? incident.status
                              ?.toUpperCase()
                              .replace(/\s+/g, "_") === "RESOLVED"
                            ? PALETTE.success
                            : incident.status
                                ?.toUpperCase()
                                .replace(/\s+/g, "_") === "IN_PROGRESS"
                            ? PALETTE.blue
                            : PALETTE.maroon
                          : "#FFFFFF",
                      borderColor:
                        s.isCompleted || s.isCurrent
                          ? incident.status
                              ?.toUpperCase()
                              .replace(/\s+/g, "_") === "RESOLVED"
                            ? PALETTE.success
                            : incident.status
                                ?.toUpperCase()
                                .replace(/\s+/g, "_") === "IN_PROGRESS"
                            ? PALETTE.blue
                            : PALETTE.maroon
                          : PALETTE.muted,
                      zIndex: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={s.icon as any}
                    size={14}
                    color={
                      s.isCompleted || s.isCurrent ? "#FFFFFF" : PALETTE.muted
                    }
                  />
                </View>
              ))}
            </View>
            {/* Labels row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
                position: "relative",
              }}
            >
              {progress.map((s, i) => {
                const isFirst = i === 0;
                const isLast = i === progress.length - 1;
                const isMiddle = !isFirst && !isLast;
                return (
                  <View
                    key={i}
                    style={{
                      width: 32,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          textAlign: "center",
                          color:
                            s.isCompleted || s.isCurrent
                              ? PALETTE.text
                              : PALETTE.subtext,
                          fontSize: isNarrow ? 10 : 11,
                          width: 80,
                        },
                      ]}
                      numberOfLines={2}
                      adjustsFontSizeToFit={isMiddle}
                      minimumFontScale={0.8}
                    >
                      {s.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Card>

        {/* REPORT DOCUMENT BUTTON - Only for Resolved Cases */}
        {incident.status?.toUpperCase().replace(/\s+/g, "_") === "RESOLVED" && (
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/report-document/${incident.trackingNumber}` as never
              )
            }
            style={[
              styles.card,
              shadow,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                backgroundColor: "#FFB300", // slightly darker medium gold/yellow
                marginBottom: GAP,
              },
            ]}
            activeOpacity={0.8}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  padding: 10,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              >
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 2,
                  }}
                >
                  View Report Document
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  Download or print official PDF report
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* INCIDENT DETAILS */}
        <Card title="Incident Details">
          <Row
            icon="warning"
            label="Incident Title"
            value={incident.incidentType}
            iconColor={PALETTE.maroon}
          />
          <Divider />

          {/* Location Row - Clickable to open Google Maps */}
          <TouchableOpacity
            onPress={() => {
              if (incident.location) {
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  incident.location
                )}`;
                Linking.openURL(url);
              }
            }}
            disabled={!incident.location}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="location" size={16} color={PALETTE.maroon} />
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.rowLabel}>Location</Text>
                {incident.location && (
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={PALETTE.maroon}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.rowValue,
                  incident.location && {
                    color: PALETTE.maroon,
                    textDecorationLine: "underline",
                  },
                ]}
              >
                {incident.location || "Not specified"}
              </Text>
            </View>
          </TouchableOpacity>

          <Divider />
          <Row
            icon="time"
            label="Date & Time"
            value={formatDateTime(
              incident.dateOfIncident,
              incident.timeOfIncident
            )}
            iconColor={PALETTE.maroon}
          />
          <Divider />
          <Row
            icon="document-text"
            label="Description"
            value={incident.description}
            multiline
            iconColor={PALETTE.maroon}
          />
          <Divider />
          <Row
            icon="calendar-outline"
            label="Reported On"
            value={formatDate(incident.submittedAt)}
            iconColor={PALETTE.maroon}
          />
        </Card>

        {/* EVIDENCE */}
        {incident.evidence && incident.evidence.length > 0 && (
          <Card title="Submitted Evidence">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {incident.evidence.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.evidenceTile,
                    W > 670 && { width: "31%", aspectRatio: 1.5 },
                  ]}
                  onPress={() => {
                    setSelectedImage(item.fileUrl);
                    setShowImageModal(true);
                  }}
                >
                  <Image
                    source={{ uri: item.fileUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <View style={styles.evidenceOverlay}>
                    <Ionicons name="image" size={14} color="#FFFFFF" />
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: base - 1,
                        marginLeft: 6,
                      }}
                    >
                      {formatDate(item.uploadedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* WITNESSES */}
        {incident.witnesses && incident.witnesses.length > 0 && (
          <Card title="Witnesses">
            {incident.witnesses.map((w, i) => (
              <View
                key={i}
                style={[
                  styles.witnessRow,
                  i < (incident.witnesses?.length || 0) - 1 && {
                    marginBottom: 10,
                  },
                ]}
              >
                <View style={styles.avatar}>
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    {(w.name || "W")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 3)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: PALETTE.text,
                      fontWeight: "600",
                      fontSize: base + 1,
                    }}
                  >
                    {w.name}
                  </Text>
                  {!!(w.contactInformation && w.contactInformation.trim()) && (
                    <Text
                      style={{
                        color: PALETTE.subtext,
                        fontSize: base - 1,
                        marginTop: 2,
                      }}
                    >
                      {w.contactInformation}
                    </Text>
                  )}
                  {!!(w.additionalNotes && w.additionalNotes.trim()) && (
                    <Text
                      style={{
                        color: PALETTE.text,
                        opacity: 0.9,
                        fontSize: base,
                        marginTop: 6,
                        lineHeight: 20,
                      }}
                    >
                      {w.additionalNotes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* REPORTER INFORMATION */}
        <Card title="Reporter Information">
          <Row
            icon="person"
            label="Name"
            value={getReporterDisplayName(incident)}
            iconColor={PALETTE.maroon}
          />
          <Divider />
          <Row
            icon="mail"
            label="Email"
            value={getReporterDisplayEmail(incident)}
            iconColor={PALETTE.maroon}
          />
          <Divider />
          <Row
            icon="call"
            label="Phone"
            value={getReporterDisplayPhone(incident)}
            iconColor={PALETTE.maroon}
          />
        </Card>

        {/* RESOLUTION DETAILS - Only for Resolved Cases */}
        {incident.status?.toUpperCase().replace(/\s+/g, "_") === "RESOLVED" && (
          <Card title="Resolution Details">
            {incident.resolutionNotes && (
              <>
                <Row
                  icon="document-text"
                  label="Resolution Notes"
                  value={incident.resolutionNotes}
                  multiline
                  iconColor={PALETTE.success}
                />
                <Divider />
              </>
            )}
            {incident.finishedDate && (
              <>
                <Row
                  icon="checkmark-circle"
                  label="Completed On"
                  value={formatFullDate(incident.finishedDate)}
                  iconColor={PALETTE.success}
                />
                <Divider />
              </>
            )}
            <Row
              icon="calendar-outline"
              label="Case Closed"
              value={formatFullDate(incident.finishedDate || incident.submittedAt)}
              iconColor={PALETTE.success}
            />
            
            {/* Success Banner */}
            <View style={{ marginTop: 12 }}>
              <Banner
                icon="checkmark-circle"
                tone="success"
                text="This case has been successfully resolved and closed."
              />
            </View>
          </Card>
        )}

        {/* NEXT STEPS */}
        <Card title="Next Steps">
          {isDismissed ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="warning" size={18} color={PALETTE.subtext} />
              <Text
                style={{
                  marginLeft: 8,
                  color: PALETTE.subtext,
                  fontSize: base + 1,
                }}
              >
                This case has been dismissed. No further action will be taken.
              </Text>
            </View>
          ) : (
            <View>
              {[
                {
                  label: "Initial Review",
                  description: "Case reviewed by security team",
                },
                {
                  label: "Incident Updates",
                  description:
                    "Gathering security footage and witness statements",
                },
                {
                  label: "In Progress",
                  description:
                    "Implementing security measures based on findings",
                },
                {
                  label: "Case Resolution",
                  description: "Final report and case closure",
                },
              ].map((s, i) => {
                const order = [
                  "SUBMITTED",
                  "PENDING",
                  "REVIEWED",
                  "IN_PROGRESS",
                  "RESOLVED",
                ];
                const normalizedStatus =
                  incident.status?.toUpperCase().replace(/\s+/g, "_") || "";
                let idx = order.indexOf(normalizedStatus);
                // Map PENDING to complete Initial Review (index 0)
                if (normalizedStatus === "PENDING") {
                  idx = 0;
                } else if (normalizedStatus === "REVIEWED") {
                  idx = 1;
                } else if (normalizedStatus === "IN_PROGRESS") {
                  idx = 2;
                } else if (normalizedStatus === "RESOLVED") {
                  idx = 3;
                } else if (normalizedStatus === "SUBMITTED") {
                  idx = -1;
                }
                const done = idx >= i;
                const curr = idx === i;
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: i < 3 ? 12 : 0,
                    }}
                  >
                    <View
                      style={[
                        styles.vStepDot,
                        {
                          backgroundColor: done
                            ? PALETTE.success
                            : curr
                            ? PALETTE.maroon
                            : PALETTE.border,
                        },
                      ]}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : curr ? (
                        <Ionicons name="time" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: done || curr ? PALETTE.text : PALETTE.subtext,
                          fontWeight: "600",
                          fontSize: base + 1,
                        }}
                      >
                        {s.label}
                      </Text>
                      <Text style={{ color: PALETTE.subtext, marginTop: 4 }}>
                        {s.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* RATING SECTION - Only show for the reporter or office admin */}
        {incident.status?.toUpperCase() === "RESOLVED" && isCurrentUserReporter && (
          <Card title="Rating & Feedback">
            {ratingStatus && (
              <View style={{ gap: 8, marginBottom: 10 }}>
                {!ratingStatus.reporterRating && (
                  <Banner
                    icon="information-circle"
                    tone="warn"
                    text="Waiting for reporter to rate this incident"
                  />
                )}
                {!ratingStatus.officeRating && (
                  <Banner
                    icon="information-circle"
                    tone="warn"
                    text="Waiting for office to rate this incident"
                  />
                )}
                {ratingStatus.pointsAwarded && (
                  <Banner
                    icon="checkmark-circle"
                    tone="success"
                    text="Points have been awarded for this incident"
                  />
                )}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  {
                    backgroundColor: ratingStatus?.reporterRating
                      ? PALETTE.border
                      : PALETTE.maroon,
                  },
                ]}
                onPress={() => handleRatingPress("reporter")}
                disabled={!!ratingStatus?.reporterRating}
              >
                <Ionicons
                  name="star"
                  size={16}
                  color={
                    ratingStatus?.reporterRating ? PALETTE.text : "#FFFFFF"
                  }
                />
                <Text
                  style={[
                    styles.btnText,
                    ratingStatus?.reporterRating && { color: PALETTE.text },
                  ]}
                >
                  {ratingStatus?.reporterRating
                    ? "Rated Office"
                    : "Rate Office"}
                </Text>
              </TouchableOpacity>

              {/* Show message that other users can rate you */}
              <View style={[
                styles.btn,
                {
                  backgroundColor: PALETTE.border,
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              ]}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={PALETTE.subtext}
                />
                <Text
                  style={[
                    styles.btnText,
                    { color: PALETTE.subtext, fontSize: 12 }
                  ]}
                >
                  Cannot rate yourself
                </Text>
              </View>
            </View>

            {ratingStatus?.reporterRating && (
              <View style={{ marginTop: 12 }}>
                <RatingAnalytics
                  rating={ratingStatus.reporterRating}
                  title="Office Rating"
                  showBreakdown
                />
              </View>
            )}
            {ratingStatus?.officeRating && (
              <View style={{ marginTop: 12 }}>
                <RatingAnalytics
                  rating={ratingStatus.officeRating}
                  title="Reporter Rating"
                  showBreakdown
                />
              </View>
            )}
          </Card>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* IMAGE LIGHTBOX */}
      {showImageModal && selectedImage && (
        <ImageViewerModal
          imageUri={selectedImage}
          onClose={() => setShowImageModal(false)}
        />
      )}

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        incidentId={id || ""}
        type={ratingType}
        onSuccess={handleRatingSuccess}
      />
    </SafeAreaView>
  );
}

// ---- UI PRIMITIVES -------------------------------------------------------
function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, shadow]}>
      {title ? (
        <View
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={styles.titleBar}>
            <View style={styles.titleDot} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Chip({
  icon,
  label,
  bold,
  fontSize,
  iconColor,
  textColor,
}: {
  icon: any;
  label: string;
  bold?: boolean;
  fontSize?: number;
  iconColor?: string;
  textColor?: string;
}) {
  const isSmallFont = fontSize ? fontSize < 11 : false;
  return (
    <View
      style={[
        styles.chip,
        isSmallFont ? { paddingHorizontal: 8, paddingVertical: 5 } : null,
        { flexShrink: 1, maxWidth: "100%" },
      ]}
    >
      <Ionicons
        name={icon}
        size={fontSize ? fontSize + 2 : 14}
        color={iconColor || PALETTE.gold}
        style={{ flexShrink: 0 }}
      />
      <Text
        style={[
          styles.chipText,
          bold ? { fontWeight: "700" } : null,
          fontSize ? { fontSize } : null,
          { flexShrink: 1, flexWrap: "wrap" },
          textColor ? { color: textColor } : null,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </View>
  );
}

function ImageViewerModal({
  imageUri,
  onClose,
}: {
  imageUri: string;
  onClose: () => void;
}) {
  const [rotation, setRotation] = React.useState(0);
  const [scale, setScale] = React.useState(1);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.lightbox} edges={["top"]}>
        {/* Control Bar */}
        <View style={styles.lightboxBar}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={handleZoomOut}
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "600",
                minWidth: 45,
                textAlign: "center",
              }}
            >
              {Math.round(scale * 100)}%
            </Text>
            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={handleZoomIn}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={handleRotate}
            >
              <Ionicons name="sync" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000000",
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View
            style={{
              transform: [{ scale: scale }, { rotate: `${rotation}deg` }],
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={{
                width: Dimensions.get("window").width,
                height: Dimensions.get("window").height - 120,
              }}
              resizeMode="contain"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Row({
  icon,
  label,
  value,
  multiline,
  iconColor,
}: {
  icon: any;
  label: string;
  value?: string;
  multiline?: boolean;
  iconColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
      }}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={iconColor || PALETTE.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, multiline && { lineHeight: 20 }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Banner({
  icon,
  tone,
  text,
}: {
  icon: any;
  tone: "warn" | "success";
  text: string;
}) {
  const bg =
    tone === "warn" ? "rgba(245, 158, 11, 0.15)" : "rgba(22, 163, 74, 0.15)";
  const ic = tone === "warn" ? PALETTE.warn : PALETTE.success;
  const tx = tone === "warn" ? "#92400E" : "#14532D";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: bg,
        padding: 10,
        borderRadius: 12,
      }}
    >
      <Ionicons name={icon} size={16} color={ic} style={{ flexShrink: 0 }} />
      <Text
        style={{
          marginLeft: 8,
          color: tx,
          flex: 1,
          flexWrap: "wrap",
          fontSize: 13,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ---- STYLES --------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.maroon },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GAP,
    paddingVertical: 10,
    backgroundColor: PALETTE.maroon,
    borderBottomWidth: 0,
  },
  title: { color: PALETTE.text, fontSize: 18, fontWeight: "700" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 0,
    overflow: "hidden",
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: RADIUS,
    padding: GAP,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
    marginBottom: GAP,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
  },
  cardTitle: { color: PALETTE.text, fontWeight: "800", fontSize: 16 },
  titleBar: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: PALETTE.cardElev,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
  },
  titleDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: PALETTE.gold,
  },
  overline: { color: PALETTE.subtext, letterSpacing: 1, fontSize: 11 },
  h2: {
    color: PALETTE.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0,
    overflow: "hidden",
  },
  pillText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "capitalize",
    fontSize: 11,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PALETTE.cardElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
    overflow: "hidden",
  },
  chipText: { color: PALETTE.text, fontSize: 12 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: { height: 2, flex: 1, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: PALETTE.text },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PALETTE.border,
    marginVertical: 10,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PALETTE.cardElev,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
  },
  rowLabel: { color: PALETTE.subtext, fontSize: 12 },
  rowValue: { color: PALETTE.text, fontSize: 14, marginTop: 2 },
  evidenceTile: {
    width: "48%",
    aspectRatio: 1.2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: PALETTE.cardElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
  },
  evidenceOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  witnessRow: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PALETTE.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  vStepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PALETTE.maroon,
    overflow: "hidden",
  },
  btnText: { color: "#FFFFFF", fontWeight: "700" },
  btnGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: PALETTE.cardElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
  },
  btnGhostText: { color: PALETTE.gold, fontWeight: "700" },
  lightbox: {
    flex: 1,
    backgroundColor: "#000000",
  },
  lightboxBar: {
    height: 64,
    backgroundColor: "rgba(0,0,0,0.8)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
});
