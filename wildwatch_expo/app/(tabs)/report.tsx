import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage } from "../../lib/storage";
import { api } from "../../lib/api";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  type OfficeInfo,
  type ReportForm,
  type WitnessInfo,
} from "../../src/features/reports/models/report";
import { WitnessInput } from "../../src/features/reports/components/WitnessInput";
import { WitnessReviewCard } from "../../src/features/reports/components/WitnessReviewCard";
import { useReportForm } from "../../src/features/reports/hooks/useReportForm";
import { config } from "../../lib/config";
import { CircularLoader } from "../../components/CircularLoader";
import {
  incidentAnalysisAPI,
  type AnalyzeRequest,
  type SimilarIncident,
} from "../../src/features/incidents/api/incident_analysis_api";
import BlockedContentModal from "../../components/BlockedContentModal";
import ProcessingReportModal from "../../components/ProcessingReportModal";
import SimilarIncidentsModal from "../../components/SimilarIncidentsModal";
import ReportSuccessModal from "../../components/ReportSuccessModal";
import ReportErrorModal, {
  type ErrorType,
} from "../../components/ReportErrorModal";
import EmergencyNoteBanner from "../../components/EmergencyNoteBanner";
import EvidenceGuidelinesBanner from "../../components/EvidenceGuidelinesBanner";
import { sanitizeLocation } from "../../src/utils/locationUtils";

// Uses centralized API base URL from config

interface ProgressStepProps {
  number: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}

const ProgressStep: React.FC<ProgressStepProps> = ({
  number,
  title,
  isActive,
  isCompleted,
}) => {
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight >= 800;
  const isTablet = screenWidth >= 768;

  const getSpacing = () => {
    if (isTablet) return { stepSize: 40, fontSize: 14, titleSize: 14 };
    if (isSmallScreen) return { stepSize: 26, fontSize: 9, titleSize: 9 };
    if (isLargeScreen) return { stepSize: 36, fontSize: 12, titleSize: 12 };
    return { stepSize: 30, fontSize: 10, titleSize: 10 };
  };

  const { stepSize, fontSize, titleSize } = getSpacing();

  return (
    <View style={{ alignItems: "center", minWidth: 80 }}>
      <View
        style={{
          width: stepSize,
          height: stepSize,
          borderRadius: stepSize / 2,
          backgroundColor: isCompleted
            ? "#8B0000"
            : isActive
            ? "#8B0000"
            : "#E5E7EB",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          borderWidth: isCompleted ? 0 : isActive ? 2 : 1,
          borderColor: isActive ? "#8B0000" : "#D1D5DB",
          shadowColor: isCompleted || isActive ? "#8B0000" : "transparent",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isCompleted || isActive ? 0.3 : 0,
          shadowRadius: 4,
          elevation: isCompleted || isActive ? 4 : 0,
        }}
      >
        <Text
          style={{
            color: isCompleted || isActive ? "#FFFFFF" : "#9CA3AF",
            fontSize: fontSize,
            fontWeight: "bold",
          }}
        >
          {isCompleted ? "✓" : number}
        </Text>
      </View>
      <Text
        style={{
          fontSize: titleSize,
          fontWeight: isActive || isCompleted ? "700" : "500",
          color: isActive ? "#8B0000" : isCompleted ? "#8B0000" : "#9CA3AF",
          textAlign: "center",
          lineHeight: titleSize + 2,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  color,
}) => (
  <View
    style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
  >
    <Ionicons name={icon} size={24} color={color} style={{ marginRight: 12 }} />
    <Text style={{ fontSize: 18, fontWeight: "bold", color: color }}>
      {title}
    </Text>
  </View>
);

interface FormNavigationButtonsProps {
  onBackClick: () => void;
  onNextClick: () => void;
  backText: string;
  nextText: string;
  darkRed: string;
  disabled?: boolean;
}

const FormNavigationButtons: React.FC<FormNavigationButtonsProps> = ({
  onBackClick,
  onNextClick,
  backText,
  nextText,
  darkRed,
  disabled = false,
}) => (
  <View
    style={{
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
      paddingHorizontal: Platform.OS === "android" ? 4 : 0,
    }}
  >
    <TouchableOpacity
      onPress={onBackClick}
      style={{
        flex: 1,
        height: Platform.OS === "ios" ? 48 : 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: Platform.OS === "android" ? 2 : 0,
      }}
    >
      <Text
        style={{
          color: "#374151",
          fontSize: Platform.OS === "ios" ? 16 : 17,
          fontWeight: "600",
          lineHeight: Platform.OS === "ios" ? 20 : 22,
        }}
      >
        {backText}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onNextClick}
      disabled={disabled}
      style={{
        flex: 1,
        height: Platform.OS === "ios" ? 48 : 52,
        borderRadius: 8,
        backgroundColor: disabled ? "#D1D5DB" : darkRed,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.6 : 1,
        shadowColor: disabled ? "#000" : darkRed,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: disabled ? 0.1 : 0.3,
        shadowRadius: 4,
        elevation: Platform.OS === "android" ? (disabled ? 1 : 4) : 0,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: Platform.OS === "ios" ? 16 : 17,
          fontWeight: "600",
          lineHeight: Platform.OS === "ios" ? 20 : 22,
        }}
      >
        {nextText}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function ReportScreen() {
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<
    "analyzing" | "uploading" | "submitting" | "finalizing"
  >("analyzing");
  const [submissionError, setSubmissionError] = useState<{
    type: ErrorType;
    message: string;
    statusCode?: number;
    technicalDetails?: string;
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [offices, setOffices] = useState<OfficeInfo[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [showOfficeDescription, setShowOfficeDescription] = useState(false);
  const [selectedOfficeDetails, setSelectedOfficeDetails] =
    useState<OfficeInfo | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => {
    const now = new Date();
    const hour = now.getHours();
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  });
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const now = new Date();
    return now.getMinutes();
  });
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">(() => {
    const now = new Date();
    return now.getHours() >= 12 ? "PM" : "AM";
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Refs for the time picker ScrollViews
  const hourPickerRef = useRef<ScrollView>(null);
  const minutePickerRef = useRef<ScrollView>(null);

  // Use the centralized form hook
  const {
    form,
    updateForm,
    resetForm,
    witnesses,
    addWitness,
    removeWitness,
    updateWitness,
    evidenceFiles,
    addEvidenceFiles,
    removeEvidenceFile,
    clearAllEvidence,
    toggleTag,
  } = useReportForm();

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [hasProcessedLocationParams, setHasProcessedLocationParams] =
    useState(false);

  // Tag generation state
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  
  // Debounce refs for auto-generation
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Image picker state
  const [isUploading, setIsUploading] = useState(false);

  // Confirmation state
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmContact, setConfirmContact] = useState(false);

  // Need Help Dialog state
  const [showNeedHelpDialog, setShowNeedHelpDialog] = useState(false);
  const [hasClosedHelpDialog, setHasClosedHelpDialog] = useState(false);
  const [isLoadingPersistedData, setIsLoadingPersistedData] = useState(true);

  // AI Analysis state
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedReasons, setBlockedReasons] = useState<string[]>([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    trackingNumber: string;
    assignedOffice?: string;
  } | null>(null);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarIncidents, setSimilarIncidents] = useState<SimilarIncident[]>(
    []
  );
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [analysisWhy, setAnalysisWhy] = useState<{
    tags: string[];
    location?: string;
  } | null>(null);

  // Responsive design constants
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 800;
  const isLargeScreen = screenHeight >= 800;
  const isTablet = screenWidth >= 768;
  const isAndroid = Platform.OS === "android";

  const getSpacing = () => {
    if (isTablet) return { padding: 24, margin: 20, fontSize: 16 };
    if (isSmallScreen) return { padding: 14, margin: 10, fontSize: 13 };
    if (isMediumScreen) return { padding: 16, margin: 12, fontSize: 14 };
    if (isLargeScreen) return { padding: 18, margin: 14, fontSize: 15 };
    return { padding: 16, margin: 12, fontSize: 14 };
  };

  const { padding, margin, fontSize } = getSpacing();

  const sanitizedFormLocation = sanitizeLocation(
    form.formattedAddress || form.location
  );
  const resolvedLocationDisplay =
    sanitizedFormLocation ||
    form.buildingName ||
    (form.latitude && form.longitude
      ? `${form.latitude}, ${form.longitude}`
      : null);

  // Fetch token and offices on component mount
  useEffect(() => {
    storage
      .getToken()
      .then(setToken)
      .catch(() => setToken(null));
    fetchOffices();
  }, []);

  // Load persisted form data when screen focuses (but only if no location params)
  useFocusEffect(
    React.useCallback(() => {
      // Mark that user is at report (flow step 3)
      storage.setReportFlowStep(3);

      // Reset the flag when screen focuses
      setHasProcessedLocationParams(false);
      setIsLoadingPersistedData(true);

      const loadPersistedData = async () => {
        try {
          // Load persisted step
          const persistedStep = await storage.getReportStep();
          if (
            persistedStep !== null &&
            persistedStep >= 1 &&
            persistedStep <= 3
          ) {
            console.log("Restoring persisted step:", persistedStep);
            setCurrentStep(persistedStep);
          }

          // Only load persisted form if we don't have location parameters
          // Location parameters should take precedence
          if (!params.latitude || !params.longitude) {
            const persistedForm = await storage.getReportForm();
            if (persistedForm) {
              console.log("Loading persisted form data:", persistedForm);
              // Restore form data
              Object.keys(persistedForm).forEach((key) => {
                if (key in form) {
                  updateForm(key as keyof ReportForm, persistedForm[key]);
                }
              });
            }
          } else {
            console.log("Skipping persisted form load due to location params");
          }
        } catch (error) {
          console.error("Error loading persisted data:", error);
        } finally {
          // Mark loading as complete after a small delay to ensure state updates
          setTimeout(() => {
            setIsLoadingPersistedData(false);
          }, 100);
        }
      };

      loadPersistedData();
    }, [params.latitude, params.longitude])
  );

  // Auto-set current date and time AFTER loading persisted data (only if not already set)
  useEffect(() => {
    // Only run after loading is complete
    if (!isLoadingPersistedData) {
      if (!form.dateOfIncident) {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
        updateForm("dateOfIncident", formatter.format(now));
      }

      if (!form.timeOfIncident) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const amPm = hours >= 12 ? "PM" : "AM";
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const timeString = `${hour12.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")} ${amPm}`;
        updateForm("timeOfIncident", timeString);
      }
    }
  }, [isLoadingPersistedData, form.dateOfIncident, form.timeOfIncident]);

  // Save form data whenever it changes (debounced)
  const saveFormTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveFormTimeoutRef.current) {
      clearTimeout(saveFormTimeoutRef.current);
    }

    saveFormTimeoutRef.current = setTimeout(() => {
      storage.setReportForm(form);
    }, 1000); // Debounce saves by 1 second

    return () => {
      if (saveFormTimeoutRef.current) {
        clearTimeout(saveFormTimeoutRef.current);
      }
    };
  }, [form]);

  // Save current step whenever it changes
  useEffect(() => {
    console.log("Saving current step to storage:", currentStep);
    storage.setReportStep(currentStep);
  }, [currentStep]);

  // Load evidence files when reaching Review & Submit step
  useEffect(() => {
    if (currentStep === 3) {
      const loadEvidenceFiles = async () => {
        try {
          const storedFiles = await storage.getEvidenceFiles();
          if (storedFiles && storedFiles.length > 0) {
            // Clear existing and load fresh from storage to ensure latest state
            clearAllEvidence();
            addEvidenceFiles(storedFiles);
          }
        } catch (error) {
          console.error("Error loading evidence files from storage:", error);
        }
      };

      loadEvidenceFiles();
    }
  }, [currentStep]);

  // Debug: Log form state to verify location data
  useEffect(() => {
    console.log("Current form state:", {
      latitude: form.latitude,
      longitude: form.longitude,
      formattedAddress: form.formattedAddress,
      buildingName: form.buildingName,
      withinCampus: form.withinCampus,
      location: form.location,
    });
  }, [
    form.latitude,
    form.longitude,
    form.formattedAddress,
    form.buildingName,
    form.withinCampus,
    form.location,
  ]);

  // Handle location parameters from location screen
  useEffect(() => {
    console.log("Report screen useEffect triggered with params:", {
      latitude: params.latitude,
      longitude: params.longitude,
      formattedAddress: params.formattedAddress,
      building: params.building,
      buildingName: params.buildingName,
      buildingCode: params.buildingCode,
      room: params.room,
      withinCampus: params.withinCampus,
      hasProcessedLocationParams,
    });

    if (params.latitude && params.longitude && !hasProcessedLocationParams) {
      const latitude = parseFloat(params.latitude as string);
      const longitude = parseFloat(params.longitude as string);
      const formattedAddress = (params.formattedAddress as string) || "";
      const building = (params.building as string) || "";
      const buildingName = (params.buildingName as string) || "";
      const buildingCode = (params.buildingCode as string) || "";
      const room = (params.room as string) || "";
      const withinCampus =
        params.withinCampus === "true"
          ? true
          : params.withinCampus === "false"
          ? false
          : undefined;
      const distanceFromCampusCenter = params.distanceFromCampusCenter
        ? parseFloat(params.distanceFromCampusCenter as string)
        : undefined;
      const location =
        formattedAddress || `${params.latitude}, ${params.longitude}`;

      console.log("Updating location data in form:", {
        latitude,
        longitude,
        formattedAddress,
        building,
        buildingName,
        buildingCode,
        room,
        withinCampus,
        distanceFromCampusCenter,
        location,
        currentFormLat: form.latitude,
        currentFormLng: form.longitude,
      });

      // Always update location data when params change (even if already set)
      // This ensures fresh data from location screen always takes precedence
      updateForm("latitude", latitude);
      updateForm("longitude", longitude);
      updateForm("formattedAddress", formattedAddress);
      updateForm("building", building);
      updateForm("buildingName", buildingName);
      updateForm("buildingCode", buildingCode);
      updateForm("room", room);
      updateForm("withinCampus", withinCampus);
      updateForm("distanceFromCampusCenter", distanceFromCampusCenter);
      updateForm("location", location);

      // Also update storage with the location data
      const locationData = {
        latitude,
        longitude,
        formattedAddress,
        building,
        buildingName,
        buildingCode,
        room,
        withinCampus,
        distanceFromCampusCenter,
        location,
      };
      storage.setLocationData(locationData);

      console.log(
        "Location data updated successfully in form state and storage"
      );

      // Mark that we've processed the location parameters
      setHasProcessedLocationParams(true);

      // Show success message for location update
      if (withinCampus !== undefined) {
        const statusMessage = withinCampus
          ? "Location updated: You are within CITU campus grounds"
          : "Location updated: You are outside CITU campus grounds";
        console.log(statusMessage);
      }
      
      // Auto-generate tags if location changed and description is available
      if (form.description.trim().length >= 10 && token && !isGeneratingTags) {
        // Small delay to ensure form state is updated
        const autoGenTimer = setTimeout(() => {
          generateTags();
        }, 500);
        return () => clearTimeout(autoGenTimer);
      }
    }
  }, [
    params.latitude,
    params.longitude,
    params.formattedAddress,
    params.building,
    params.buildingName,
    params.buildingCode,
    params.withinCampus,
    params.distanceFromCampusCenter,
    updateForm,
    hasProcessedLocationParams,
  ]);

  // Ensure time picker is properly positioned when opened
  useEffect(() => {
    if (showTimePicker) {
      // Small delay to ensure the picker is rendered before positioning
      const timer = setTimeout(() => {
        // Scroll hour picker to selected hour
        if (hourPickerRef.current) {
          const hourIndex = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].indexOf(
            selectedHour
          );
          hourPickerRef.current.scrollTo({
            y: hourIndex * 40,
            animated: false,
          });
        }

        // Scroll minute picker to selected minute
        if (minutePickerRef.current) {
          minutePickerRef.current.scrollTo({
            y: selectedMinute * 40,
            animated: false,
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showTimePicker, selectedHour, selectedMinute]);

  // Show Need Help Dialog when both fields are empty (on step 1 only)
  useEffect(() => {
    // Don't show dialog while loading persisted data
    if (isLoadingPersistedData) {
      return;
    }

    // Only check after a short delay to prevent flash on mount/navigation
    const timer = setTimeout(() => {
      if (currentStep === 1 && !hasClosedHelpDialog) {
        // Only show if BOTH incident title AND description are TRULY empty
        const isBothFieldsEmpty =
          form.incidentType.trim().length === 0 &&
          form.description.trim().length === 0;

        // Only set to true if empty, immediately set to false if not empty
        if (isBothFieldsEmpty) {
          setShowNeedHelpDialog(true);
        } else {
          setShowNeedHelpDialog(false);
        }
      } else {
        // Hide dialog when not on step 1
        setShowNeedHelpDialog(false);
      }
    }, 300); // Small delay to prevent flash

    return () => clearTimeout(timer);
  }, [
    form.incidentType,
    form.description,
    currentStep,
    hasClosedHelpDialog,
    isLoadingPersistedData,
  ]);

  const fetchOffices = async () => {
    if (!token) return;

    setLoadingOffices(true);
    try {
      const response = await fetch(`${config.API.BASE_URL}/offices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const officesData = await response.json();
        setOffices(officesData);
      } else {
        console.error("Failed to fetch offices:", response.status);
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
    } finally {
      setLoadingOffices(false);
    }
  };

  const showOfficeInfo = (office: OfficeInfo) => {
    setSelectedOfficeDetails(office);
    setShowOfficeDescription(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty days for padding
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Group into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleTimeSelection = () => {
    const timeString = `${selectedHour
      .toString()
      .padStart(2, "0")}:${selectedMinute
      .toString()
      .padStart(2, "0")} ${selectedAmPm}`;
    updateForm("timeOfIncident", timeString);
    setShowTimePicker(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      updateForm("dateOfIncident", formatter.format(selectedDate));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const amPm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const timeString = `${hour12.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")} ${amPm}`;
      updateForm("timeOfIncident", timeString);
    }
  };

  // AI Analysis function
  const analyzeIncidentContent = async (
    incidentData: any
  ): Promise<boolean> => {
    try {
      setProcessingPhase("analyzing");
      const analysisRequest: AnalyzeRequest = {
        incidentType: incidentData.incidentType,
        description: incidentData.description,
        location: incidentData.location,
        formattedAddress: incidentData.formattedAddress,
        buildingName: incidentData.buildingName,
        buildingCode: incidentData.buildingCode,
        latitude: incidentData.latitude,
        longitude: incidentData.longitude,
      };

      console.log("🤖 [AI ANALYSIS] Starting AI content analysis...");
      const startTime = Date.now();

      const analysis = await incidentAnalysisAPI.analyzeIncident(
        analysisRequest
      );

      const analysisDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `✅ [AI ANALYSIS] AI analysis completed in ${analysisDuration}s`,
        {
          decision: analysis.decision,
          similarIncidentsFound: analysis.similarIncidents?.length || 0,
        }
      );

      if (analysis.decision === "BLOCK") {
        setShowProcessingModal(false);
        setBlockedReasons(
          analysis.reasons || ["Inappropriate content detected"]
        );
        setShowBlockedModal(true);
        return false;
      }

      // Store context for "Why this suggestion?"
      const locationContext = sanitizeLocation(
        analysis.normalizedLocation ||
          incidentData.formattedAddress ||
          incidentData.location
      );
      setAnalysisWhy({
        tags: Array.isArray(analysis.suggestedTags)
          ? analysis.suggestedTags.slice(0, 8)
          : (incidentData.tags || []).slice(0, 8),
        location: locationContext || undefined,
      });

      // If similar incidents exist, show modal and pause submission
      if (
        Array.isArray(analysis.similarIncidents) &&
        analysis.similarIncidents.length > 0
      ) {
        setSimilarIncidents(analysis.similarIncidents);
        setShowProcessingModal(false);
        setShowSimilarModal(true);
        return false; // Pause submission to show similar incidents
      }

      return true;
    } catch (error: any) {
      console.error("AI Analysis Error:", error);

      // Check if it's a timeout error
      if (error.message?.includes("timeout") || error.code === "ECONNABORTED") {
        console.log("AI analysis timed out, proceeding without analysis");
        // Hide processing modal and continue with submission
        setShowProcessingModal(false);
        return true; // Allow submission to continue
      }

      // Hide processing modal first
      setShowProcessingModal(false);

      // Show user-friendly error message for other errors
      Alert.alert(
        "Analysis Unavailable",
        error.message ||
          "Content analysis is temporarily unavailable. Your report will be submitted for manual review.",
        [
          {
            text: "Continue Anyway",
            onPress: async () => {
              // Continue with submission after analysis failure
              try {
                setShowProcessingModal(true);
                await doSubmit();
              } catch (submitError) {
                console.error(
                  "Error submitting report after analysis failure:",
                  submitError
                );
                Alert.alert(
                  "Error",
                  "Failed to submit report. Please try again."
                );
                setIsSubmitting(false);
                setShowProcessingModal(false);
              }
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setIsSubmitting(false);
              setShowProcessingModal(false);
            },
          },
        ]
      );

      // Return false to pause submission and wait for user choice
      return false;
    }
  };

  // Prepare incident data for submission
  const prepareIncidentData = () => {
    // Parse date and time for backend
    let dateObj = new Date();
    let timeObj = new Date();

    // Parse date (mm/dd/yyyy format)
    if (form.dateOfIncident) {
      const [month, day, year] = form.dateOfIncident.split("/");
      if (month && day && year) {
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }

    // Parse time (HH:MM AM/PM format)
    if (form.timeOfIncident) {
      const timeMatch = form.timeOfIncident.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const amPm = timeMatch[3].toUpperCase();

        if (amPm === "PM" && hours !== 12) hours += 12;
        if (amPm === "AM" && hours === 12) hours = 0;

        timeObj.setHours(hours, minutes, 0, 0);
      }
    }

    return {
      incidentType: form.incidentType.trim(),
      dateOfIncident: dateObj.toISOString().split("T")[0],
      timeOfIncident: timeObj.toTimeString().split(" ")[0],
      location:
        form.formattedAddress ||
        form.location ||
        `${form.latitude}, ${form.longitude}`,
      formattedAddress: form.formattedAddress,
      latitude: form.latitude,
      longitude: form.longitude,
      building: form.building,
      buildingName: form.buildingName,
      buildingCode: form.buildingCode,
      room: form.room,
      withinCampus: form.withinCampus,
      distanceFromCampusCenter: form.distanceFromCampusCenter,
      description: form.description.trim(),
      preferAnonymous: form.preferAnonymous,
      tags: form.tags, // Selected display tags (3-5)
      allTags: form.allTags || [], // All 20 generated tags for backend
      witnesses: witnesses
        .filter((w) => {
          // Include witnesses that have either:
          // 1. A registered user (userId exists)
          // 2. Manual entry with both name and contact
          return w.userId || (w.name.trim() && w.contact.trim());
        })
        .map((w) => ({
          userId: w.userId || undefined,
          name: w.isRegisteredUser ? undefined : w.name.trim() || undefined,
          contactInformation: w.isRegisteredUser
            ? undefined
            : w.contact.trim() || undefined,
          additionalNotes: w.additionalNotes?.trim() || undefined,
        })),
      evidenceFiles: evidenceFiles,
    };
  };

  // Actual submission function - Using fetch API for proper FormData handling in production builds
  // Note: fetch handles FormData better than axios in React Native production builds (APK)
  const doSubmit = async () => {
    // ✅ FIX: Always get fresh token from storage before submission
    // This ensures token is available even if state wasn't updated after OAuth
    const currentToken = await storage.getToken();

    if (!currentToken) {
      Alert.alert("Error", "You must be logged in to report an incident");
      return;
    }

    console.log("🚀 [SUBMISSION] Starting incident submission");
    console.log("📊 [SUBMISSION] Evidence files count:", evidenceFiles.length);

    // Set uploading phase if we have files
    if (evidenceFiles.length > 0) {
      setProcessingPhase("uploading");
    } else {
      setProcessingPhase("submitting");
    }

    const incidentData = prepareIncidentData();

    // Set timeout constant - INCREASED to 3 minutes for image uploads + AI processing
    const SUBMISSION_TIMEOUT = 180000; // 3 minutes (180 seconds)

    try {
      setProcessingPhase("submitting");
      console.log(
        "🌐 [SUBMISSION] Sending POST request to:",
        `${config.API.BASE_URL}/incidents`
      );
      console.log(
        "📦 [SUBMISSION] Evidence files count:",
        evidenceFiles.length
      );
      const startTime = Date.now();

      // Use proper FormData as expected by the backend
      console.log("📤 [SUBMISSION] Creating FormData request...");
      console.log(
        "📋 [SUBMISSION] Platform:",
        Platform.OS,
        "Version:",
        Platform.Version
      );

      console.log("🚀 [SUBMISSION] Preparing files for upload via FormData...");

      // ✅ DEBUG: Log the API configuration to verify environment variables are loaded
      console.log("🔍 [SUBMISSION] API Configuration:", {
        BASE_URL: config.API.BASE_URL,
        TIMEOUT: config.API.TIMEOUT,
        ENV: config.ENV,
        RAW_ENV: process.env.EXPO_PUBLIC_API_BASE_URL,
      });

      // ✅ Validate that BASE_URL is set before proceeding
      if (
        !config.API.BASE_URL ||
        config.API.BASE_URL === "undefined" ||
        config.API.BASE_URL.includes("undefined")
      ) {
        console.error(
          "❌ [SUBMISSION] API_BASE_URL is not configured properly!"
        );
        console.error(
          "❌ [SUBMISSION] Raw env value:",
          process.env.EXPO_PUBLIC_API_BASE_URL
        );
        Alert.alert(
          "Configuration Error",
          "API endpoint is not configured. Please rebuild the app with proper environment variables.",
          [{ text: "OK" }]
        );
        setIsSubmitting(false);
        setShowProcessingModal(false);
        return;
      }

      // Dynamically import react-native-blob-util only when needed (not in Expo Go)
      // This avoids loading native modules at import time
      let RNFetchBlob: any;
      try {
        // Try different import patterns - react-native-blob-util may export differently
        const module = require("react-native-blob-util");
        RNFetchBlob = module.default || module;
        
        // Verify the module is actually available
        if (!RNFetchBlob || typeof RNFetchBlob.fetch !== "function") {
          throw new Error("react-native-blob-util module loaded but fetch method not available");
        }
      } catch (error: any) {
        // Log the actual error for debugging
        console.error("❌ [SUBMISSION] react-native-blob-util import error:", error);
        console.error("❌ [SUBMISSION] Error details:", {
          message: error?.message,
          code: error?.code,
          stack: error?.stack?.substring(0, 200),
        });
        
        // Provide more helpful error message
        const errorMessage = error?.message || "Unknown error";
        if (errorMessage.includes("Cannot find module")) {
          throw new Error(
            "react-native-blob-util is not installed. Please run: npm install react-native-blob-util and rebuild your APK."
          );
        } else if (errorMessage.includes("Native module")) {
          throw new Error(
            "react-native-blob-util native module not linked. Please rebuild your APK after installing the package."
          );
        } else {
          throw new Error(
            `react-native-blob-util error: ${errorMessage}. Please ensure the package is installed and the APK is rebuilt.`
          );
        }
      }

      // Prepare form data array for react-native-blob-util
      const formDataArray: any[] = [];

      // Add incidentData
      formDataArray.push({
        name: "incidentData",
        data: JSON.stringify(incidentData),
      });

      // Verify and prepare files for react-native-blob-util
      for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i];
        if (file.uri) {
          console.log(
            `📎 [SUBMISSION] Processing file ${i + 1}/${evidenceFiles.length}:`,
            file.name
          );

          // ✅ IMPROVED: Better URI normalization for APK builds
          // iOS: Uses file:// format
          // Android: Can use file://, content://, or file paths
          let normalizedUri = file.uri;

          if (Platform.OS === "android") {
            // In APK builds, file URIs can be content://, file://, or absolute paths
            if (normalizedUri.startsWith("content://")) {
              // Content URIs work directly in APK - no normalization needed
              // These are used by Android's MediaStore and work natively
            } else if (
              !normalizedUri.startsWith("file://") &&
              !normalizedUri.startsWith("http") &&
              !normalizedUri.startsWith("ph://") // Photo library on iOS
            ) {
              // Convert relative or absolute paths to file:// URI
              normalizedUri = normalizedUri.startsWith("/")
                ? `file://${normalizedUri}`
                : `file:///${normalizedUri}`;
            }
          } else if (Platform.OS === "ios") {
            // iOS typically already has file:// prefix, but ensure it's correct
            if (
              !normalizedUri.startsWith("file://") &&
              !normalizedUri.startsWith("ph://")
            ) {
              normalizedUri = normalizedUri.startsWith("/")
                ? `file://${normalizedUri}`
                : `file:///${normalizedUri}`;
            }
          }

          // Verify file exists - critical for production builds
          // In production, file URIs may differ from development
          try {
            let fileInfo = await FileSystem.getInfoAsync(normalizedUri);

            // If normalized URI doesn't exist and it's different from original, try original
            if (!fileInfo.exists && normalizedUri !== file.uri) {
              console.log(
                `⚠️ [SUBMISSION] Normalized URI not found, trying original: ${file.uri}`
              );
              const originalInfo = await FileSystem.getInfoAsync(file.uri);
              if (originalInfo.exists) {
                normalizedUri = file.uri;
                fileInfo = originalInfo;
                console.log(`✅ [SUBMISSION] Using original URI: ${file.uri}`);
              }
            }

            // Final check - if file still doesn't exist, throw error
            if (!fileInfo.exists) {
              throw new Error(
                `File not found: ${file.name} (URI: ${normalizedUri})`
              );
            }

            // Log file info for debugging (useful in production)
            const fileSize = "size" in fileInfo ? fileInfo.size : 0;
            console.log(
              `✅ [SUBMISSION] File verified: ${file.name} (${(
                fileSize / 1024
              ).toFixed(2)}KB) - URI: ${normalizedUri.substring(0, 50)}...`
            );
          } catch (fileError: any) {
            console.error(
              `❌ [SUBMISSION] File verification failed for ${file.name}:`,
              fileError.message
            );
            throw new Error(
              `Cannot access file ${file.name}: ${fileError.message}`
            );
          }

          // Determine MIME type
          let mimeType = file.type || "image/jpeg";
          if (!file.type) {
            const extension = file.name?.split(".").pop()?.toLowerCase();
            if (extension === "png") {
              mimeType = "image/png";
            } else if (extension === "jpg" || extension === "jpeg") {
              mimeType = "image/jpeg";
            } else if (extension === "mp4") {
              mimeType = "video/mp4";
            } else if (extension === "mov") {
              mimeType = "video/quicktime";
            }
          }

          // Prepare file for react-native-blob-util upload
          // RNFetchBlob needs the file path without file:// prefix
          // Handle both file:// and file:/// formats
          let filePath = normalizedUri;
          if (filePath.startsWith("file:///")) {
            // Remove file:/// (three slashes) - common on Android
            filePath = filePath.replace("file:///", "/");
          } else if (filePath.startsWith("file://")) {
            // Remove file:// (two slashes)
            filePath = filePath.replace("file://", "");
          }

          // Ensure path starts with / for absolute paths on Android
          if (
            Platform.OS === "android" &&
            !filePath.startsWith("/") &&
            !filePath.startsWith("content://")
          ) {
            filePath = "/" + filePath;
          }

          // Add file to form data array for react-native-blob-util
          formDataArray.push({
            name: "files",
            filename: file.name || `evidence_${i}.jpg`,
            type: mimeType,
            data: RNFetchBlob.wrap(filePath),
          });

          console.log(
            `✅ [SUBMISSION] Added file ${i + 1} for react-native-blob-util: ${file.name} (${mimeType})`
          );
        }
      }

      // Use react-native-blob-util for multipart form data upload
      // This library handles file uploads reliably in React Native, avoiding axios/XMLHttpRequest issues
      // Note: react-native-blob-util requires native modules and only works in production builds (APK), not Expo Go
      try {
        // Use RNFetchBlob.fetch() directly (working pattern from successful implementation)
        // This simpler API is more reliable than config().fetch()
        const uploadResponse = await RNFetchBlob.fetch(
          "POST",
          url,
          {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "multipart/form-data", // Explicit Content-Type header
          },
          formDataArray
        );

        // Parse response
        const responseText = await uploadResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        const status = uploadResponse.info().status;
        const result = {
          status: status,
          data: responseData,
          ok: status >= 200 && status < 300,
        };

        const requestDuration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(
          `✅ [SUBMISSION] Response received in ${requestDuration}s - Status: ${result.status}`
        );

        // Check if request was successful
        if (!result.ok) {
          const errorObj: any = new Error(
            result.data?.message || "Server returned error"
          );
          errorObj.status = result.status;
          errorObj.data = result.data;
          errorObj.response = { status: result.status, data: result.data }; // For compatibility with error handlers
          throw errorObj;
        }

        setProcessingPhase("finalizing");

        const finalResponseData = result.data;

        console.log("🎉 [SUBMISSION] Report submitted successfully!", {
          trackingNumber: finalResponseData.trackingNumber,
          assignedOffice: finalResponseData.assignedOffice?.name,
        });

        // Hide processing modal and show success modal
        setShowProcessingModal(false);
        setSubmissionResult({
          trackingNumber: finalResponseData.trackingNumber,
          assignedOffice: finalResponseData.assignedOffice,
        });
        setShowSuccessModal(true);
      } catch (blobUtilError: any) {
        console.error("❌ [SUBMISSION] react-native-blob-util upload error:", blobUtilError);
        
        // Handle timeout errors
        if (blobUtilError.message?.includes("timeout") || blobUtilError.message?.includes("TIMEOUT")) {
          const timeoutError: any = new Error(
            "Request timed out. The upload is taking too long. Please try again with a better connection."
          );
          timeoutError.code = "ETIMEDOUT";
          timeoutError.name = "TimeoutError";
          throw timeoutError;
        }
        
        // Re-throw other errors
        throw blobUtilError;
      }
    } catch (submitError: any) {
      // ✅ ENHANCED: Better error logging for APK debugging
      console.error("💥 [SUBMISSION] Upload error:", {
        name: submitError.name,
        message: submitError.message,
        code: submitError.code,
        response: submitError.response ? {
          status: submitError.response.status,
          statusText: submitError.response.statusText,
          data: submitError.response.data,
        } : null,
        request: submitError.request ? {
          url: submitError.config?.url || submitError.request.url,
          method: submitError.config?.method || submitError.request.method,
        } : null,
        config: {
          baseURL: submitError.config?.baseURL,
          url: submitError.config?.url,
          timeout: submitError.config?.timeout,
        },
        platform: Platform.OS,
        apiBaseUrl: config.API.BASE_URL,
        error: submitError,
      });

      // Handle AxiosError network errors - check code first
      if (
        submitError.code === "ERR_NETWORK" ||
        submitError.code === "ECONNABORTED" ||
        submitError.code === "ETIMEDOUT" ||
        submitError.code === "ENOTFOUND" ||
        submitError.code === "ECONNREFUSED"
      ) {
        console.error("🌐 [SUBMISSION] Network connection failed (AxiosError)");
        const error = {
          type: "network" as const,
          message:
            "Unable to connect to the server. Please check your internet connection and try again.",
          technicalDetails: `${submitError.code}: ${
            submitError.message || submitError.name
          }`,
        };
        setSubmissionError(error);
        setShowErrorModal(true);
        setIsSubmitting(false);
        setShowProcessingModal(false);
        return; // Return early instead of throwing
      }

      // Handle timeout errors (XMLHttpRequest timeout or AbortError)
      if (
        submitError.name === "AbortError" ||
        submitError.message?.includes("timed out") ||
        submitError.message?.includes("aborted") ||
        submitError.message?.includes("timeout")
      ) {
        console.error("⏰ [SUBMISSION] Request timed out");
        const error = {
          type: "timeout" as const,
          message:
            "The request took too long to complete. This may be due to slow network or large files.",
          technicalDetails: "Request timed out after 180 seconds",
        };
        setSubmissionError(error);
        setShowErrorModal(true);
        setIsSubmitting(false);
        setShowProcessingModal(false);
        return;
      }

      // Handle network errors (XMLHttpRequest onerror or fetch TypeError)
      // Also check for AxiosError "Network Error" message
      if (
        submitError.message?.includes("Network request failed") ||
        submitError.message?.includes("Failed to fetch") ||
        submitError.message?.includes("NetworkError") ||
        submitError.message?.includes("Network request") ||
        submitError.message?.toLowerCase().includes("network error") ||
        (submitError.name === "TypeError" &&
          submitError.message?.includes("fetch")) ||
        // Check if no response (network error in axios)
        (!submitError.response && submitError.request)
      ) {
        console.error("🌐 [SUBMISSION] Network connection failed");
        const error = {
          type: "network" as const,
          message:
            "Unable to connect to the server. Please check your internet connection and try again.",
          technicalDetails:
            submitError.message || submitError.name || "Network Error",
        };
        setSubmissionError(error);
        setShowErrorModal(true);
        setIsSubmitting(false);
        setShowProcessingModal(false);
        return;
      }

      // Handle server errors with response (response.ok === false)
      // Check if we have a status code from the response
      const status = submitError.response?.status || submitError.status;
      if (status) {
        console.error("❌ [SUBMISSION] Server returned error:", {
          status: status,
          data: submitError.response?.data || submitError.data,
        });

        // Determine error type and message based on status code
        let errorType: ErrorType = "server";
        let errorMessage = "Failed to submit report. Please try again.";
        let technicalDetails = `Status: ${status}`;

        if (status >= 500) {
          errorType = "server";
          errorMessage =
            "The server encountered an error and could not process your request. Our team has been notified.";
          if (status === 502 || status === 503) {
            errorMessage =
              "The server is temporarily unavailable. Please try again in a few minutes.";
          } else if (status === 504) {
            errorMessage =
              "The server took too long to respond. Please try again.";
          }
        } else if (status === 400) {
          errorType = "validation";
          errorMessage =
            "Invalid report data. Please check that all required fields are filled correctly.";
        } else if (status === 401) {
          errorType = "validation";
          errorMessage =
            "Your session has expired. Please log out and log back in.";
        } else if (status === 403) {
          errorType = "validation";
          errorMessage =
            "You do not have permission to submit reports. Please check your account status.";
        } else if (status === 413) {
          errorType = "validation";
          errorMessage =
            "Your files are too large. Please reduce file sizes to under 5MB each and try again.";
        } else if (status === 429) {
          errorType = "server";
          errorMessage =
            "Too many requests. Please wait a moment before trying again.";
        }

        // Set error and show modal
        setSubmissionError({
          type: errorType,
          message: errorMessage,
          statusCode: status,
          technicalDetails: technicalDetails,
        });
        setShowErrorModal(true);
        setIsSubmitting(false);
        setShowProcessingModal(false);
        return;
      }

      // Unknown error - but still check for network-related issues
      const error = {
        type: "unknown" as const,
        message:
          submitError.message ||
          "An unexpected error occurred. Please try again.",
        technicalDetails: `${submitError.name || "Unknown"}: ${
          submitError.message || "No error message"
        }`,
      };
      setSubmissionError(error);
      setShowErrorModal(true);
      setIsSubmitting(false);
      setShowProcessingModal(false);
    }
  };

  const handleSuccessModalClose = async () => {
    setShowSuccessModal(false);
    setSubmissionResult(null);

    // Reset form
    resetForm();
    setCurrentStep(1);
    setConfirmAccurate(false);
    setConfirmContact(false);
    setHasClosedHelpDialog(false); // Reset so dialog can appear on next report

    // Clear all persisted data after successful submission
    await storage.clearAllFormData();

    // Navigate back to the dashboard
    router.replace("/(tabs)/dashboard" as never);
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert("Error", "You must be logged in to report an incident");
      return;
    }

    // Validation for all steps
    if (
      !form.incidentType.trim() ||
      !form.dateOfIncident ||
      !form.timeOfIncident ||
      !form.latitude ||
      !form.longitude ||
      !form.description.trim()
    ) {
      Alert.alert(
        "Error",
        "Please fill in all required fields including location before continuing."
      );
      return;
    }

    setIsSubmitting(true);
    setShowProcessingModal(true);
    setSubmissionError(null); // Clear any previous errors

    try {
      const incidentData = prepareIncidentData();

      // AI Content Analysis - Check for inappropriate content
      const isContentApproved = await analyzeIncidentContent(incidentData);
      if (!isContentApproved) {
        setIsSubmitting(false);
        setShowProcessingModal(false);
        return; // Stop submission if content is blocked or similar incidents found
      }

      // If we reach here, proceed with submission
      await doSubmit();
    } catch (error: any) {
      console.error("❌ [SUBMISSION] Error in handleSubmit:", error);
      setShowProcessingModal(false);

      // Set structured error for display if not already set
      if (!submissionError) {
        setSubmissionError({
          type: "unknown",
          message:
            error.message || "Failed to submit report. Please try again.",
          technicalDetails: error.stack?.substring(0, 200),
        });
        setShowErrorModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate Step 1
      console.log("Validating form for nextStep:", {
        incidentType: form.incidentType.trim(),
        dateOfIncident: form.dateOfIncident,
        timeOfIncident: form.timeOfIncident,
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description.trim(),
      });

      if (
        !form.incidentType.trim() ||
        !form.dateOfIncident ||
        !form.timeOfIncident ||
        !form.latitude ||
        !form.longitude ||
        !form.description.trim()
      ) {
        Alert.alert(
          "Error",
          "Please fill in all required fields including location before continuing."
        );
        return;
      }
      // Skip Step 2 and go directly to Review and Submit (Step 3)
      setCurrentStep(3);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();

    if (cameraStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Camera permissions are required to upload evidence.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced from 0.8 to 0.7 for better compression
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `photo_${Date.now()}.jpg`;
        const fileSize = asset.fileSize || 0;

        // Warn if file is larger than 5MB
        if (fileSize > 5 * 1024 * 1024) {
          console.warn(
            `⚠️ [IMAGE] Large file detected: ${(
              fileSize /
              (1024 * 1024)
            ).toFixed(2)}MB`
          );
          Alert.alert(
            "Large File",
            `This photo is ${(fileSize / (1024 * 1024)).toFixed(
              2
            )}MB. Large files may take longer to upload. Consider taking a new photo or using a smaller resolution.`,
            [
              {
                text: "Use Anyway",
                onPress: () => {
                  addEvidenceFiles([
                    {
                      uri: asset.uri,
                      name: fileName,
                      type: "image/jpeg",
                      size: fileSize,
                    },
                  ]);
                },
              },
              { text: "Cancel", style: "cancel" },
            ]
          );
        } else {
          addEvidenceFiles([
            {
              uri: asset.uri,
              name: fileName,
              type: "image/jpeg",
              size: fileSize,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.7, // Reduced from 0.8 to 0.7 for better compression
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || "image/jpeg",
          size: asset.fileSize || 0,
        }));

        // Check total size of all files
        const totalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
        const totalSizeMB = totalSize / (1024 * 1024);

        if (totalSizeMB > 20) {
          console.warn(
            `⚠️ [IMAGE] Large batch detected: ${totalSizeMB.toFixed(2)}MB total`
          );
          Alert.alert(
            "Large Files",
            `The selected images total ${totalSizeMB.toFixed(
              2
            )}MB. This may take longer to upload. Consider selecting fewer or smaller images.`,
            [
              { text: "Use Anyway", onPress: () => addEvidenceFiles(newFiles) },
              { text: "Cancel", style: "cancel" },
            ]
          );
        } else {
          addEvidenceFiles(newFiles);
        }
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };

  const handleClearAllEvidence = () => {
    Alert.alert(
      "Clear All Evidence",
      "Are you sure you want to remove all evidence files?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => clearAllEvidence(),
        },
      ]
    );
  };

  // Function to select 5 unique tags for display, filtering out similar tags (from web version)
  const selectDisplayTags = (allTags: string[]): string[] => {
    if (allTags.length === 0) return [];

    // Shuffle the tags array to randomize selection order
    const shuffledTags = [...allTags];
    for (let i = shuffledTags.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTags[i], shuffledTags[j]] = [shuffledTags[j], shuffledTags[i]];
    }

    const selected: string[] = [];
    const seenNormalized = new Set<string>();
    const seenBuildingPatterns = new Set<string>(); // Track "-Building" patterns

    // Helper function to normalize tag for comparison (case-insensitive)
    const normalizeTag = (tag: string): string => {
      return tag.toLowerCase().trim();
    };

    // Extract words from a tag (split by hyphens, spaces, etc.)
    const extractWords = (tag: string): string[] => {
      const normalized = normalizeTag(tag);
      return normalized.split(/[^a-z0-9]+/).filter((w) => w.length > 0);
    };

    // Extract words from selected location (buildingName, buildingCode, formattedAddress)
    const getLocationWords = (): string[] => {
      const locationWords: string[] = [];

      // Extract words from buildingName
      if (form.buildingName) {
        locationWords.push(...extractWords(form.buildingName));
      }

      // Extract words from buildingCode
      if (form.buildingCode) {
        locationWords.push(...extractWords(form.buildingCode));
      }

      // Extract words from formattedAddress (but be more selective - only significant words)
      if (form.formattedAddress) {
        const addressWords = extractWords(form.formattedAddress);
        // Filter out common address words like "street", "avenue", "road", etc.
        const commonWords = [
          "street",
          "st",
          "avenue",
          "ave",
          "road",
          "rd",
          "boulevard",
          "blvd",
          "drive",
          "dr",
          "lane",
          "ln",
        ];
        locationWords.push(
          ...addressWords.filter(
            (w) => !commonWords.includes(w) && w.length >= 2
          )
        );
      }

      return locationWords;
    };

    // Check if tag contains any word from the selected location
    const containsLocationWord = (
      tag: string,
      locationWords: string[]
    ): boolean => {
      const tagWords = extractWords(tag);
      for (const locationWord of locationWords) {
        if (locationWord.length >= 2) {
          for (const tagWord of tagWords) {
            if (tagWord === locationWord) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Get location words once
    const locationWords = getLocationWords();

    // Helper function to check if two tags are similar
    const areSimilar = (tag1: string, tag2: string): boolean => {
      const norm1 = normalizeTag(tag1);
      const norm2 = normalizeTag(tag2);

      // Exact match (case-insensitive) - e.g., "NGE" === "Nge"
      if (norm1 === norm2) return true;

      // Extract words from both tags
      const words1 = extractWords(tag1);
      const words2 = extractWords(tag2);

      // If tags share any word (length >= 2), they're similar
      for (const word1 of words1) {
        for (const word2 of words2) {
          // Exact word match (case-insensitive) - minimum 2 characters to avoid single letters
          if (word1 === word2 && word1.length >= 2) {
            return true;
          }
        }
      }

      // Check if one tag is contained in the other (e.g., "ST" in "ST-Building")
      if (norm1.length >= 2 && norm2.length >= 2) {
        // Check if the shorter tag appears as a complete word in the longer tag
        const shorter = norm1.length <= norm2.length ? norm1 : norm2;
        const longer = norm1.length > norm2.length ? norm1 : norm2;

        // Extract words from both
        const shorterWords = extractWords(shorter);
        const longerWords = extractWords(longer);

        // If shorter is a single word and it appears in longer's words, they're similar
        if (shorterWords.length === 1 && longerWords.length > 1) {
          const shortWord = shorterWords[0];
          if (shortWord.length >= 2) {
            for (const longWord of longerWords) {
              if (shortWord === longWord) {
                return true;
              }
            }
          }
        }

        // Also check if shorter tag is a prefix/suffix of longer tag
        if (
          longer.startsWith(shorter + "-") ||
          longer.startsWith(shorter + " ") ||
          longer.endsWith("-" + shorter) ||
          longer.endsWith(" " + shorter) ||
          longer === shorter
        ) {
          if (shorter.length >= 2) {
            return true;
          }
        }
      }

      return false;
    };

    // Iterate through shuffled tags and select unique ones
    for (const tag of shuffledTags) {
      if (selected.length >= 5) break;

      const normalized = normalizeTag(tag);

      // Skip if we've already seen this exact tag (case-insensitive)
      if (seenNormalized.has(normalized)) continue;

      // Filter out tags that contain words from the selected location
      if (containsLocationWord(tag, locationWords)) {
        continue;
      }

      // For tags ending with "-Building", only show one (regardless of prefix)
      const isBuildingTag =
        normalized.endsWith("-building") || normalized.endsWith(" building");

      if (isBuildingTag) {
        // If we've already seen a "-Building" tag, skip this one
        if (seenBuildingPatterns.has("building")) {
          continue;
        }

        // Mark that we've seen a "-Building" tag
        seenBuildingPatterns.add("building");
      }

      // Check if we've already selected a similar tag
      let isSimilar = false;
      for (const seenTag of selected) {
        if (areSimilar(tag, seenTag)) {
          isSimilar = true;
          break;
        }
      }

      // If not similar to any selected tag, add it
      if (!isSimilar) {
        selected.push(tag);
        seenNormalized.add(normalized);
      }
    }

    return selected;
  };

  // Tags are now read-only (AI-selected), so no tag click handler needed

  // Generate tags (manual or auto)
  const generateTags = async () => {
    if (!token) {
      Alert.alert("Error", "You must be logged in to generate tags");
      return;
    }

    if (!form.description.trim() || !form.latitude || !form.longitude) {
      Alert.alert(
        "Error",
        "Please provide both description and location to generate tags"
      );
      return;
    }

    setIsGeneratingTags(true);
    setTagsError(null);
    setGeneratedTags([]);

    try {
      // ✅ FIX: Use configured api instance instead of raw fetch for proper baseURL, timeout, and error handling
      const endpoint = "/tags/generate";
      const response = await api.post(endpoint, {
        description: form.description.trim(),
        incidentType: form.incidentType,
        location:
          form.formattedAddress ||
          form.location ||
          `${form.latitude}, ${form.longitude}`,
        formattedAddress: form.formattedAddress,
        buildingName: form.buildingName,
        buildingCode: form.buildingCode,
        latitude: form.latitude,
        longitude: form.longitude,
      });

      const data = response.data;

      // Handle response format: allTags (all 20 generated tags) and top5Tags (top 5 scored tags)
      const allGeneratedTags = data.allTags || data.tags || [];
      
      // Store all generated tags (20 tags) for backend submission
      updateForm("allTags", allGeneratedTags);
      setGeneratedTags(allGeneratedTags);

      // Calculate display tags using smart selection (like web version)
      const displayTags = selectDisplayTags(allGeneratedTags);
      
      // Store display tags (3-5 tags for UI)
      updateForm("tags", displayTags);

      const totalGenerated = data.totalGenerated || allGeneratedTags.length;
      
      // Only show alert for manual generation, not auto-generation
      if (!typingDebounceRef.current) {
        Alert.alert(
          "Success",
          `Tags generated successfully! Generated ${totalGenerated} tags. Selected top 5 most relevant based on weighted scoring.`
        );
      }
    } catch (error: any) {
      console.error("Error generating tags:", error);
      setTagsError(error.message || "Failed to generate tags");
      // Only show alert for manual generation, not auto-generation
      if (!typingDebounceRef.current) {
        Alert.alert(
          "Error",
          error.message || "Failed to generate tags. Please try again."
        );
      }
    } finally {
      setIsGeneratingTags(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#7A0000"
        translucent={Platform.OS === "android"}
      />

      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerAccent} />
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/location" as never)}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              Step 3 (Report Details)
            </Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              Report incident details and description analysis
            </Text>
          </View>

          {/* Help / Info */}
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Tips",
                "Provide accurate details about the incident. Include specific information about what happened, when, and where."
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Tips"
            style={styles.headerHelpBtn}
          >
            <Ionicons name="help-circle" size={22} color="#FFD166" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Important Emergency Note - Only show on step 1 */}
          {currentStep === 1 && <EmergencyNoteBanner />}

          {/* Evidence Guidelines - Only show on step 2 */}
          {currentStep === 2 && <EvidenceGuidelinesBanner />}

          {/* Main Content */}
          <View style={{ paddingHorizontal: padding }}>
            {currentStep === 1 && (
              <>
                {/* Main Form Card */}
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: padding + 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <SectionHeader
                    title="Incident Details"
                    icon="warning"
                    color="#8B0000"
                  />

                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: fontSize - 2,
                      marginBottom: margin + 4,
                    }}
                  >
                    Provide essential information about the incident
                  </Text>

                  {/* Location Status Indicator */}
                  {form.latitude && form.longitude && (
                    <View
                      style={{
                        backgroundColor:
                          form.withinCampus === false ? "#FEF2F2" : "#F0FDF4",
                        borderWidth: 1,
                        borderColor:
                          form.withinCampus === false ? "#FECACA" : "#BBF7D0",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: margin,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={
                          form.withinCampus === false ? "#DC2626" : "#16a34a"
                        }
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color:
                                form.withinCampus === false
                                  ? "#DC2626"
                                  : "#166534",
                              fontSize: fontSize - 2,
                              fontWeight: "600",
                              marginRight: 8,
                            }}
                          >
                            Location Selected
                          </Text>
                          <View
                            style={{
                              backgroundColor:
                                form.withinCampus === false
                                  ? "#FECACA"
                                  : "#DCFCE7",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  form.withinCampus === false
                                    ? "#DC2626"
                                    : "#16a34a",
                                fontSize: fontSize - 3,
                                fontWeight: "600",
                              }}
                            >
                              {form.withinCampus === false
                                ? "Outside Campus"
                                : "On Campus"}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            color:
                              form.withinCampus === false
                                ? "#7F1D1D"
                                : "#14532D",
                            fontSize: fontSize - 2,
                            fontWeight: "500",
                          }}
                          numberOfLines={2}
                        >
                          {resolvedLocationDisplay || "Location not specified"}
                        </Text>
                        {form.buildingName && (
                          <Text
                            style={{
                              color:
                                form.withinCampus === false
                                  ? "#991B1B"
                                  : "#166534",
                              fontSize: fontSize - 3,
                              fontWeight: "600",
                              marginTop: 2,
                            }}
                          >
                            Building: {form.buildingName}{" "}
                            {form.buildingCode && `(${form.buildingCode})`}
                          </Text>
                        )}
                        {form.room && form.room.trim() && (
                          <Text
                            style={{
                              color:
                                form.withinCampus === false
                                  ? "#991B1B"
                                  : "#166534",
                              fontSize: fontSize - 3,
                              fontWeight: "600",
                              marginTop: 4,
                            }}
                          >
                            Specific Location: {form.room}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Date and Time Row */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      marginBottom: margin,
                    }}
                  >
                    {/* Date of Incident */}
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{ fontWeight: "bold", fontSize: fontSize - 1 }}
                        >
                          Date of Incident
                        </Text>
                        <Text
                          style={{
                            color: "#8B0000",
                            fontWeight: "bold",
                            marginLeft: 4,
                          }}
                        >
                          {" "}
                          *
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={{
                          borderWidth: 1,
                          borderColor: form.dateOfIncident
                            ? "#8B0000"
                            : "#D1D5DB",
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: "#FFFFFF",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            color: form.dateOfIncident ? "#000000" : "#9CA3AF",
                            fontSize: fontSize - 1,
                          }}
                        >
                          {form.dateOfIncident || "mm/dd/yyyy"}
                        </Text>
                        <Ionicons name="calendar" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    {/* Time of Incident */}
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{ fontWeight: "bold", fontSize: fontSize - 1 }}
                        >
                          Time of Incident
                        </Text>
                        <Text
                          style={{
                            color: "#8B0000",
                            fontWeight: "bold",
                            marginLeft: 4,
                          }}
                        >
                          {" "}
                          *
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(true)}
                        style={{
                          borderWidth: 1,
                          borderColor: form.timeOfIncident
                            ? "#8B0000"
                            : "#D1D5DB",
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: "#FFFFFF",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            color: form.timeOfIncident ? "#000000" : "#9CA3AF",
                            fontSize: fontSize - 1,
                          }}
                        >
                          {form.timeOfIncident || "--:--"}
                        </Text>
                        <Ionicons name="time" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Date/Time Helper Text */}
                  <Text
                    style={{
                      fontSize: fontSize - 3,
                      color: "#6B7280",
                      marginBottom: margin,
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    Tap the fields above to select date and time
                  </Text>

                  <View style={{ marginBottom: margin }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "bold", fontSize: fontSize - 1 }}
                      >
                        Incident Title
                      </Text>
                      <Text
                        style={{
                          color: "#8B0000",
                          fontWeight: "bold",
                          marginLeft: 4,
                        }}
                      >
                        {" "}
                        *
                      </Text>
                    </View>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: form.incidentType ? "#8B0000" : "#D1D5DB",
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: Platform.OS === "ios" ? 12 : 14,
                        fontSize: fontSize - 1,
                        backgroundColor: "#FFFFFF",
                        minHeight: Platform.OS === "ios" ? 44 : 48,
                        textAlignVertical:
                          Platform.OS === "android" ? "center" : "top",
                      }}
                      placeholder="Incident title"
                      placeholderTextColor="#9CA3AF"
                      value={form.incidentType}
                      onChangeText={(text) => updateForm("incidentType", text)}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>

                  {/* Description */}
                  <View style={{ marginBottom: margin }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "bold", fontSize: fontSize - 1 }}
                      >
                        Description
                      </Text>
                      <Text
                        style={{
                          color: "#8B0000",
                          fontWeight: "bold",
                          marginLeft: 4,
                        }}
                      >
                        {" "}
                        *
                      </Text>
                    </View>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: form.description ? "#8B0000" : "#D1D5DB",
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: Platform.OS === "ios" ? 12 : 14,
                        height: Platform.OS === "ios" ? 120 : 130,
                        fontSize: fontSize - 1,
                        backgroundColor: "#FFFFFF",
                        textAlignVertical: "top",
                        minHeight: Platform.OS === "ios" ? 120 : 130,
                      }}
                      placeholder="Describe what happened in detail"
                      placeholderTextColor="#9CA3AF"
                      value={form.description}
                      onChangeText={(text) => {
                        if (text.length <= 1000) {
                          updateForm("description", text);
                          
                          // Auto-generate tags when user types in description field (debounced)
                          // Clear existing debounce timer
                          if (typingDebounceRef.current) {
                            clearTimeout(typingDebounceRef.current);
                          }

                          // Set new debounce timer (3.5 seconds after user stops typing)
                          typingDebounceRef.current = setTimeout(() => {
                            // Check if description and location are available
                            if (
                              text.trim().length >= 10 &&
                              (form.location ||
                                (form.latitude && form.longitude)) &&
                              !isGeneratingTags &&
                              token
                            ) {
                              generateTags();
                            }
                          }, 3500);
                        }
                      }}
                      onBlur={() => {
                        // Clear typing debounce timer
                        if (typingDebounceRef.current) {
                          clearTimeout(typingDebounceRef.current);
                          typingDebounceRef.current = null;
                        }

                        // Set delay timer for blur (1 second after leaving field)
                        if (blurDelayRef.current) {
                          clearTimeout(blurDelayRef.current);
                        }

                        blurDelayRef.current = setTimeout(() => {
                          // Check if description and location are available
                          if (
                            form.description.trim().length >= 10 &&
                            (form.location ||
                              (form.latitude && form.longitude)) &&
                            !isGeneratingTags &&
                            token
                          ) {
                            generateTags();
                          }
                        }, 1000);
                      }}
                      multiline
                      numberOfLines={6}
                      returnKeyType="default"
                      blurOnSubmit={false}
                    />

                    {/* Character counter */}
                    <Text
                      style={{
                        fontSize: fontSize - 3,
                        color: "#6B7280",
                        textAlign: "right",
                        marginTop: 4,
                      }}
                    >
                      {form.description.length}/1000 characters
                    </Text>
                  </View>

                  {/* Tag Generation */}
                  <View style={{ marginBottom: margin }}>
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: fontSize,
                          color: "#1F2937",
                          marginBottom: 4,
                        }}
                      >
                        AI-Generated Tags
                      </Text>
                      <Text
                        style={{
                          fontSize: fontSize - 2,
                          color: "#6B7280",
                          marginTop: 4,
                        }}
                      >
                        Tags will be automatically generated as you type
                      </Text>
                    </View>

                    {/* Auto-generation Loading Indicator */}
                    {isGeneratingTags &&
                      form.description.trim() &&
                      form.latitude &&
                      form.longitude &&
                      form.tags.length === 0 && (
                        <View
                          style={{
                            backgroundColor: "#F0F9FF",
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#BAE6FD",
                            marginBottom: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            shadowColor: "#0EA5E9",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            elevation: 2,
                          }}
                        >
                          <ActivityIndicator
                            size="small"
                            color="#0EA5E9"
                            style={{ marginRight: 12 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: "#0C4A6E",
                                fontSize: fontSize - 1,
                                fontWeight: "600",
                                marginBottom: 2,
                              }}
                            >
                              Generating AI Tags...
                            </Text>
                            <Text
                              style={{
                                color: "#0369A1",
                                fontSize: fontSize - 2,
                              }}
                            >
                              Analyzing your description and location
                            </Text>
                          </View>
                        </View>
                      )}

                    {/* Info Card - Only show when tags are generated */}
                    {(form.allTags && form.allTags.length > 0) && (
                      <View
                        style={{
                          backgroundColor: "#FFFBEB",
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: "#FEF3C7",
                          marginBottom: 16,
                          shadowColor: "#F59E0B",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 3,
                          elevation: 2,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: "#FEF3C7",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 16,
                              shadowColor: "#F59E0B",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.2,
                              shadowRadius: 2,
                              elevation: 1,
                            }}
                          >
                            <Ionicons name="bulb" size={18} color="#D97706" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: "#92400E",
                                fontSize: fontSize - 1,
                                fontWeight: "600",
                                lineHeight: (fontSize - 1) * 1.3,
                              }}
                          >
                            AI has selected the most relevant tags for your incident
                          </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Error Messages */}
                    {tagsError && (
                      <View
                        style={{
                          backgroundColor: "#FEF2F2",
                          borderWidth: 1,
                          borderColor: "#FECACA",
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 16,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={16}
                            color="#DC2626"
                          />
                          <Text
                            style={{
                              color: "#DC2626",
                              fontSize: fontSize - 2,
                              fontWeight: "500",
                              marginLeft: 8,
                              flex: 1,
                            }}
                          >
                            {tagsError}
                          </Text>
                        </View>
                      </View>
                    )}


                    {/* Selected Tags */}
                    {form.tags.length > 0 && (
                      <View
                        style={{
                          marginBottom: 20,
                          backgroundColor: "#F8FAFC",
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: "#8B0000",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            <Ionicons
                              name="pricetag"
                              size={14}
                              color="#FFFFFF"
                            />
                          </View>
                          <Text
                            style={{
                              fontWeight: "600",
                              fontSize: fontSize - 1,
                              color: "#1F2937",
                              flex: 1,
                            }}
                          >
                            Selected Tags
                          </Text>
                          {/* Regenerate Tags Button */}
                          <TouchableOpacity
                            onPress={generateTags}
                            disabled={isGeneratingTags}
                            style={{
                              backgroundColor: isGeneratingTags
                                ? "#E5E7EB"
                                : "#EAB308",
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              flexDirection: "row",
                              alignItems: "center",
                              shadowColor: isGeneratingTags
                                ? "#000"
                                : "#EAB308",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: isGeneratingTags ? 0.1 : 0.2,
                              shadowRadius: 2,
                              elevation: 2,
                            }}
                          >
                            {isGeneratingTags ? (
                              <>
                                <ActivityIndicator
                                  size="small"
                                  color="#FFFFFF"
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: fontSize - 3,
                                    fontWeight: "600",
                                  }}
                                >
                                  Regenerating...
                                </Text>
                              </>
                            ) : (
                              <>
                                <Ionicons
                                  name="refresh"
                                  size={14}
                                  color="#FFFFFF"
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: fontSize - 3,
                                    fontWeight: "600",
                                  }}
                                >
                                  Regenerate
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 10,
                            marginBottom: 12,
                          }}
                        >
                          {form.tags.map((tag, index) => (
                            <View
                              key={index}
                              style={{
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 6,
                                backgroundColor: "#8B0000",
                                borderWidth: 1,
                                borderColor: "#8B0000",
                                shadowColor: "#8B0000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 2,
                                elevation: 2,
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: fontSize - 2,
                                  fontWeight: "500",
                                }}
                              >
                                {tag}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Tags Count - Below tags */}
                        <View
                          style={{
                            alignItems: "flex-end",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: "#E5E7EB",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: "#D1D5DB",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: fontSize - 3,
                                color: "#6B7280",
                                fontWeight: "500",
                              }}
                            >
                              {form.tags.length}/5
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Witnesses */}
                  <View style={{ marginBottom: margin }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View
                          style={{
                            backgroundColor: "#FEE2E2",
                            borderRadius: 20,
                            padding: 8,
                            marginRight: 12,
                          }}
                        >
                          <Ionicons name="people" size={20} color="#800000" />
                        </View>
                        <View>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontSize: fontSize,
                              color: "#374151",
                            }}
                          >
                            Witness Information
                          </Text>
                          {witnesses.length > 0 && (
                            <Text
                              style={{
                                fontSize: fontSize - 3,
                                color: "#6B7280",
                                marginTop: 2,
                                fontWeight: "500",
                              }}
                            >
                              {witnesses.length} witness
                              {witnesses.length !== 1 ? "es" : ""} added
                            </Text>
                          )}
                        </View>
                      </View>
                      {witnesses.length > 0 && (
                        <TouchableOpacity
                          onPress={addWitness}
                          style={{
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#800000",
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            shadowColor: "#800000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 6,
                            borderWidth: 1,
                            borderColor: "rgba(128, 0, 0, 0.1)",
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {witnesses.length > 0 ? (
                      <View
                        style={{
                          gap: 16,
                          backgroundColor: "#FAFBFC",
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <View
                            style={{
                              width: 4,
                              height: 20,
                              backgroundColor: "#800000",
                              borderRadius: 2,
                              marginRight: 12,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: fontSize - 2,
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            Witness List ({witnesses.length})
                          </Text>
                        </View>
                        {witnesses.map((witness, index) => (
                          <WitnessInput
                            key={index}
                            witness={witness}
                            index={index}
                            onUpdate={updateWitness}
                            onRemove={removeWitness}
                          />
                        ))}
                      </View>
                    ) : (
                      <View
                        style={{
                          alignItems: "center",
                          paddingVertical: 32,
                          paddingHorizontal: 24,
                          borderWidth: 1,
                          borderColor: "#D1D5DB",
                          borderStyle: "dashed",
                          borderRadius: 12,
                          backgroundColor: "#F9FAFB",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "#FEE2E2",
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 12,
                          }}
                        >
                          <Ionicons name="people" size={32} color="#800000" />
                        </View>
                        <Text
                          style={{
                            fontSize: fontSize,
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: 8,
                            textAlign: "center",
                          }}
                        >
                          No Witnesses Added
                        </Text>
                        <Text
                          style={{
                            fontSize: fontSize - 2,
                            color: "#6B7280",
                            textAlign: "center",
                            marginBottom: 16,
                            maxWidth: 280,
                            lineHeight: 20,
                          }}
                        >
                          If anyone witnessed the incident, add their
                          information to help with the investigation.
                        </Text>
                        <TouchableOpacity
                          onPress={addWitness}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#800000",
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 20,
                          }}
                        >
                          <Ionicons
                            name="add"
                            size={16}
                            color="white"
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              color: "white",
                              fontSize: fontSize - 1,
                              fontWeight: "500",
                            }}
                          >
                            Add a Witness
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Continue Button */}
                  <FormNavigationButtons
                    onBackClick={() =>
                      router.push("/(tabs)/dashboard" as never)
                    }
                    onNextClick={nextStep}
                    backText="Cancel"
                    nextText="Continue"
                    darkRed="#8B0000"
                    disabled={
                      !form.incidentType.trim() ||
                      !form.dateOfIncident ||
                      !form.timeOfIncident ||
                      !form.latitude ||
                      !form.longitude ||
                      !form.description.trim()
                    }
                  />
                </View>
              </>
            )}

            {currentStep === 2 && (
              <>
                {/* Main Form Card */}
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: padding + 4,
                    marginBottom: margin,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <SectionHeader
                    title="Evidence & Witnesses"
                    icon="document-text"
                    color="#8B0000"
                  />

                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: fontSize - 2,
                      marginBottom: margin + 4,
                    }}
                  >
                    This step has been removed. All information is now collected
                    in Step 1.
                  </Text>

                  {/* Continue Button */}
                  <FormNavigationButtons
                    onBackClick={() => setCurrentStep(1)}
                    onNextClick={nextStep}
                    backText="Back"
                    nextText="Continue"
                    darkRed="#8B0000"
                    disabled={
                      !form.incidentType.trim() ||
                      !form.dateOfIncident ||
                      !form.timeOfIncident ||
                      !form.latitude ||
                      !form.longitude ||
                      !form.description.trim()
                    }
                  />
                </View>
              </>
            )}

            {currentStep === 3 && (
              <>
                {/* Main Form Card */}
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: padding + 4,
                    marginTop: margin,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <SectionHeader
                    title="Review & Submit"
                    icon="checkmark-circle"
                    color="#8B0000"
                  />

                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: fontSize - 2,
                      marginBottom: margin + 4,
                    }}
                  >
                    Review your report before submitting
                  </Text>

                  {/* Incident Details Review */}
                  <View style={{ marginBottom: margin }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: fontSize - 1,
                        marginBottom: 8,
                      }}
                    >
                      Incident Details
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "600", fontSize: fontSize - 2 }}
                      >
                        Incident Title:
                      </Text>
                      <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>
                        {form.incidentType}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "600", fontSize: fontSize - 2 }}
                      >
                        Date of Incident:
                      </Text>
                      <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>
                        {form.dateOfIncident}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "600", fontSize: fontSize - 2 }}
                      >
                        Time of Incident:
                      </Text>
                      <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>
                        {form.timeOfIncident}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          form.withinCampus === false ? "#FEF2F2" : "#F9FAFB",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor:
                          form.withinCampus === false ? "#FECACA" : "#E5E7EB",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "600",
                            fontSize: fontSize - 2,
                            marginRight: 8,
                            color:
                              form.withinCampus === false
                                ? "#DC2626"
                                : "#374151",
                          }}
                        >
                          Location:
                        </Text>
                        <View
                          style={{
                            backgroundColor:
                              form.withinCampus === false
                                ? "#FECACA"
                                : "#DCFCE7",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: fontSize - 3,
                              color:
                                form.withinCampus === false
                                  ? "#DC2626"
                                  : "#16a34a",
                              fontWeight: "600",
                            }}
                          >
                            {form.withinCampus === false
                              ? "Outside Campus"
                              : "On Campus"}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{
                          fontSize: fontSize - 1,
                          marginBottom: 4,
                          color:
                            form.withinCampus === false ? "#7F1D1D" : "#374151",
                        }}
                      >
                        {resolvedLocationDisplay ||
                          (form.latitude && form.longitude
                            ? `${form.latitude}, ${form.longitude}`
                            : "Location not specified")}
                      </Text>
                      {form.buildingName && (
                        <Text
                          style={{
                            fontSize: fontSize - 2,
                            marginTop: 2,
                            color:
                              form.withinCampus === false
                                ? "#991B1B"
                                : "#6B7280",
                            fontWeight: "500",
                          }}
                        >
                          Building: {form.buildingName}{" "}
                          {form.buildingCode && `(${form.buildingCode})`}
                        </Text>
                      )}
                      {form.room && form.room.trim() && (
                        <Text
                          style={{
                            fontSize: fontSize - 2,
                            color:
                              form.withinCampus === false
                                ? "#991B1B"
                                : "#6B7280",
                            fontWeight: "500",
                            marginTop: 6,
                          }}
                        >
                          Specific Location: {form.room}
                        </Text>
                      )}
                    </View>
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "600", fontSize: fontSize - 2 }}
                      >
                        Description:
                      </Text>
                      <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>
                        {form.description}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "600", fontSize: fontSize - 2 }}
                      >
                        Anonymous:
                      </Text>
                      <Text style={{ fontSize: fontSize - 1, marginTop: 4 }}>
                        {form.preferAnonymous ? "Yes" : "No"}
                      </Text>
                    </View>
                  </View>

                  {/* Witnesses Review */}
                  <View style={{ marginBottom: margin }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#FEE2E2",
                          borderRadius: 20,
                          padding: 8,
                          marginRight: 8,
                        }}
                      >
                        <Ionicons name="people" size={16} color="#800000" />
                      </View>
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: fontSize - 1,
                          color: "#374151",
                        }}
                      >
                        Witnesses ({witnesses.length})
                      </Text>
                    </View>

                    {witnesses.length === 0 ? (
                      <View
                        style={{
                          backgroundColor: "#F9FAFB",
                          borderRadius: 8,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{ fontSize: fontSize - 1, color: "#6B7280" }}
                        >
                          No witnesses provided
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {witnesses.map((witness, index) => (
                          <WitnessReviewCard
                            key={index}
                            witness={witness}
                            index={index}
                          />
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Evidence Files Review */}
                  <View style={{ marginBottom: margin }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 16,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#FEF2F2",
                          borderRadius: 20,
                          padding: 8,
                          marginRight: 12,
                        }}
                      >
                        <Ionicons name="camera" size={20} color="#8B0000" />
                      </View>
                      <View>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: fontSize,
                            color: "#374151",
                          }}
                        >
                          Evidence Files
                        </Text>
                        {evidenceFiles.length > 0 && (
                          <Text
                            style={{
                              fontSize: fontSize - 3,
                              color: "#6B7280",
                              marginTop: 2,
                              fontWeight: "500",
                            }}
                          >
                            {evidenceFiles.length} file
                            {evidenceFiles.length !== 1 ? "s" : ""} attached
                          </Text>
                        )}
                      </View>
                    </View>

                    {evidenceFiles.length === 0 ? (
                      <View
                        style={{
                          backgroundColor: "#F9FAFB",
                          borderRadius: 12,
                          padding: 24,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                          borderStyle: "dashed",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "#FEF2F2",
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 12,
                          }}
                        >
                          <Ionicons name="camera" size={32} color="#8B0000" />
                        </View>
                        <Text
                          style={{
                            fontSize: fontSize,
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: 8,
                            textAlign: "center",
                          }}
                        >
                          No Evidence Files
                        </Text>
                        <Text
                          style={{
                            fontSize: fontSize - 2,
                            color: "#6B7280",
                            textAlign: "center",
                            marginBottom: 16,
                            maxWidth: 280,
                            lineHeight: 20,
                          }}
                        >
                          No images were captured or uploaded for this incident.
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          backgroundColor: "#F8FAFC",
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <View
                            style={{
                              width: 4,
                              height: 20,
                              backgroundColor: "#8B0000",
                              borderRadius: 2,
                              marginRight: 12,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: fontSize - 2,
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            Evidence Images ({evidenceFiles.length})
                          </Text>
                        </View>

                        {/* Images Grid - 4 per row */}
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          {evidenceFiles.map((file, index) => (
                            <View
                              key={index}
                              style={{
                                width: "22%", // 4 per row with gaps
                                aspectRatio: 1,
                                borderRadius: 8,
                                overflow: "hidden",
                                backgroundColor: "#FFFFFF",
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                position: "relative",
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => {
                                  // Show image in modal
                                  setShowImageModal(true);
                                  setSelectedImageIndex(index);
                                }}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                }}
                                activeOpacity={0.7}
                              >
                                <Image
                                  source={{ uri: file.uri }}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                  }}
                                  resizeMode="cover"
                                />

                                {/* Image index overlay */}
                                <View
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    left: 4,
                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                    borderRadius: 12,
                                    width: 24,
                                    height: 24,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: "#FFFFFF",
                                      fontSize: fontSize - 4,
                                      fontWeight: "600",
                                    }}
                                  >
                                    {index + 1}
                                  </Text>
                                </View>
                              </TouchableOpacity>

                              {/* Delete button */}
                              <TouchableOpacity
                                onPress={() => {
                                  Alert.alert(
                                    "Remove Image",
                                    "Are you sure you want to remove this image?",
                                    [
                                      { text: "Cancel", style: "cancel" },
                                      {
                                        text: "Remove",
                                        style: "destructive",
                                        onPress: async () => {
                                          removeEvidenceFile(index);
                                          // Update storage with new list
                                          const updatedFiles =
                                            evidenceFiles.filter(
                                              (_, i) => i !== index
                                            );
                                          await storage.setEvidenceFiles(
                                            updatedFiles
                                          );
                                        },
                                      },
                                    ]
                                  );
                                }}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  backgroundColor: "rgba(220, 38, 38, 0.9)",
                                  borderRadius: 12,
                                  width: 24,
                                  height: 24,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons
                                  name="close"
                                  size={14}
                                  color="#FFFFFF"
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Tags Review */}
                  <View style={{ marginBottom: margin }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: fontSize - 1,
                        marginBottom: 8,
                      }}
                    >
                      Tags
                    </Text>
                    {form.tags.length === 0 ? (
                      <View
                        style={{
                          backgroundColor: "#F9FAFB",
                          borderRadius: 8,
                          padding: 16,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{ fontSize: fontSize - 1, color: "#6B7280" }}
                        >
                          No tags selected.
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          backgroundColor: "#F9FAFB",
                          borderRadius: 8,
                          padding: 16,
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          {form.tags.map((tag, index) => (
                            <View
                              key={index}
                              style={{
                                backgroundColor: "#8B0000",
                                borderRadius: 16,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: fontSize - 2,
                                  fontWeight: "500",
                                }}
                              >
                                {tag}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Confirmation Section */}
                  <View style={{ marginBottom: margin }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: fontSize - 1,
                        marginBottom: 8,
                      }}
                    >
                      Confirmation
                    </Text>

                    {/* Notification Message */}
                    <View
                      style={{
                        backgroundColor: "#E6F7FF",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: "#0070F3",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons
                          name="information-circle"
                          size={20}
                          color="#0070F3"
                          style={{ marginRight: 12 }}
                        />
                        <Text
                          style={{
                            fontSize: fontSize - 1,
                            color: "#374151",
                            lineHeight: 20,
                            flex: 1,
                          }}
                        >
                          Your report will be reviewed by campus security
                          personnel. You will receive a confirmation email with
                          a tracking number once your report is submitted.
                        </Text>
                      </View>
                    </View>

                    {/* Confirmation Checkboxes */}
                    <View style={{ marginBottom: 16 }}>
                      <TouchableOpacity
                        onPress={() => setConfirmAccurate(!confirmAccurate)}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: confirmAccurate
                              ? "#8B0000"
                              : "#D1D5DB",
                            backgroundColor: confirmAccurate
                              ? "#8B0000"
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                            marginTop: 2,
                          }}
                        >
                          {confirmAccurate && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#FFFFFF"
                            />
                          )}
                        </View>
                        <Text
                          style={{
                            color: "#374151",
                            fontSize: fontSize - 1,
                            flex: 1,
                            lineHeight: 20,
                          }}
                        >
                          I confirm that all information provided is accurate to
                          the best of my knowledge.
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setConfirmContact(!confirmContact)}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: confirmContact ? "#8B0000" : "#D1D5DB",
                            backgroundColor: confirmContact
                              ? "#8B0000"
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                            marginTop: 2,
                          }}
                        >
                          {confirmContact && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#FFFFFF"
                            />
                          )}
                        </View>
                        <Text
                          style={{
                            color: "#374151",
                            fontSize: fontSize - 1,
                            flex: 1,
                            lineHeight: 20,
                          }}
                        >
                          I understand that campus security may contact me for
                          additional information.
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Anonymous Option */}
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 8,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name="eye"
                            size={20}
                            color="#8B0000"
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontSize: fontSize - 1,
                              color: "#8B0000",
                            }}
                          >
                            Anonymity
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            updateForm("preferAnonymous", !form.preferAnonymous)
                          }
                          style={{
                            width: 44,
                            height: 24,
                            backgroundColor: form.preferAnonymous
                              ? "#8B0000"
                              : "#D1D5DB",
                            borderRadius: 12,
                            padding: 2,
                            justifyContent: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              backgroundColor: "#FFFFFF",
                              borderRadius: 10,
                              alignSelf: form.preferAnonymous
                                ? "flex-end"
                                : "flex-start",
                            }}
                          />
                        </TouchableOpacity>
                      </View>
                      <Text
                        style={{
                          color: "#6B7280",
                          fontSize: fontSize - 2,
                          lineHeight: 18,
                        }}
                      >
                        If enabled, office will be asked to keep your identity
                        and incident hidden to the public. This may be reviewed
                        by the admin.
                      </Text>
                    </View>
                  </View>

                  {/* Error Banner */}
                  {submissionError && (
                    <View style={{ marginTop: 16, marginBottom: 8 }}>
                      <View
                        style={{
                          backgroundColor: "#FEF2F2",
                          borderLeftWidth: 4,
                          borderLeftColor: "#DC2626",
                          borderRadius: 8,
                          padding: 16,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: "#DC2626",
                              marginLeft: 8,
                              flex: 1,
                            }}
                          >
                            {submissionError.type === "network"
                              ? "🌐 Connection Issue"
                              : submissionError.type === "server"
                              ? "🖥️ Server Error"
                              : submissionError.type === "timeout"
                              ? "⏱️ Request Timed Out"
                              : submissionError.type === "validation"
                              ? "⚠️ Validation Error"
                              : "❌ Submission Failed"}
                          </Text>
                          <Pressable
                            onPress={() => setSubmissionError(null)}
                            style={{ padding: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: "#991B1B" }}>
                              ✕
                            </Text>
                          </Pressable>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#991B1B",
                            lineHeight: 20,
                            marginBottom: 8,
                          }}
                        >
                          {submissionError.message}
                        </Text>
                        {submissionError.type === "network" && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#B91C1C",
                              lineHeight: 20,
                            }}
                          >
                            • Check your internet connection{"\n"}• Make sure
                            you're connected to WiFi or mobile data{"\n"}• Try
                            moving to an area with better signal
                          </Text>
                        )}
                        {submissionError.type === "server" && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#B91C1C",
                              lineHeight: 20,
                            }}
                          >
                            • The server is temporarily unavailable{"\n"}•
                            Please try again in a few moments{"\n"}• If the
                            problem persists, contact support
                          </Text>
                        )}
                        {submissionError.type === "timeout" && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#B91C1C",
                              lineHeight: 20,
                            }}
                          >
                            • The request took too long to complete{"\n"}• Check
                            your internet connection speed{"\n"}• Try again with
                            a more stable connection
                          </Text>
                        )}
                        {submissionError.type === "validation" && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#B91C1C",
                              lineHeight: 20,
                            }}
                          >
                            • Check that all required fields are filled{"\n"}•
                            Ensure file sizes are not too large{"\n"}• Verify
                            your login session is still active
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Submit Button */}
                  <FormNavigationButtons
                    onBackClick={() => setCurrentStep(1)}
                    onNextClick={() => {
                      if (!confirmAccurate || !confirmContact) {
                        Alert.alert(
                          "Confirmation Required",
                          "Please confirm both statements before submitting your report."
                        );
                        return;
                      }
                      handleSubmit();
                    }}
                    backText="Back"
                    nextText="Submit Report"
                    darkRed="#8B0000"
                    disabled={
                      !confirmAccurate || !confirmContact || isSubmitting
                    }
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: padding,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: padding + 4,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: fontSize + 2,
                fontWeight: "bold",
                color: "#8B0000",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Select Date
            </Text>

            {/* Calendar Grid */}
            <View style={{ marginBottom: 16 }}>
              {/* Month/Year Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  paddingHorizontal: 16,
                }}
              >
                <TouchableOpacity onPress={() => handleMonthChange("prev")}>
                  <Ionicons name="chevron-back" size={24} color="#8B0000" />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: fontSize + 1,
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  {formatMonthYear(currentMonth)}
                </Text>
                <TouchableOpacity onPress={() => handleMonthChange("next")}>
                  <Ionicons name="chevron-forward" size={24} color="#8B0000" />
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 8,
                  paddingHorizontal: 16,
                }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <View key={day} style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: fontSize - 2,
                          fontWeight: "600",
                          color: "#6B7280",
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  )
                )}
              </View>

              {/* Calendar Days Grid */}
              <View style={{ paddingHorizontal: 16 }}>
                {getDaysInMonth(currentMonth).map((week, weekIndex) => (
                  <View
                    key={weekIndex}
                    style={{
                      flexDirection: "row",
                      marginBottom: 8,
                    }}
                  >
                    {week.map((day, dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={{
                          flex: 1,
                          height: 36,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 18,
                          backgroundColor:
                            day === new Date().getDate() &&
                            currentMonth.getMonth() === new Date().getMonth() &&
                            currentMonth.getFullYear() ===
                              new Date().getFullYear()
                              ? "#8B0000"
                              : "transparent",
                        }}
                        onPress={() => {
                          if (day) {
                            const selectedDate = new Date(
                              currentMonth.getFullYear(),
                              currentMonth.getMonth(),
                              day
                            );
                            const formatter = new Intl.DateTimeFormat("en-US", {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            });
                            updateForm(
                              "dateOfIncident",
                              formatter.format(selectedDate)
                            );
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!day}
                      >
                        <Text
                          style={{
                            fontSize: fontSize - 1,
                            fontWeight: "500",
                            color:
                              day === new Date().getDate() &&
                              currentMonth.getMonth() ===
                                new Date().getMonth() &&
                              currentMonth.getFullYear() ===
                                new Date().getFullYear()
                                ? "#FFFFFF"
                                : day
                                ? "#374151"
                                : "transparent",
                          }}
                        >
                          {day || ""}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#374151",
                    fontSize: fontSize - 1,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: "#8B0000",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: fontSize - 1,
                    fontWeight: "600",
                  }}
                >
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: padding,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: padding + 4,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: fontSize + 2,
                fontWeight: "bold",
                color: "#8B0000",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Select Time
            </Text>

            {/* Sliding Time Picker */}
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              {/* Digital Time Display */}
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: 20,
                  paddingHorizontal: 32,
                  paddingVertical: 20,
                  marginBottom: 24,
                  borderWidth: 2,
                  borderColor: "#E2E8F0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize + 8,
                    fontWeight: "800",
                    color: "#1E293B",
                    textAlign: "center",
                    letterSpacing: 1,
                  }}
                >
                  {`${selectedHour.toString().padStart(2, "0")}:${selectedMinute
                    .toString()
                    .padStart(2, "0")}`}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize - 1,
                    fontWeight: "600",
                    color: "#64748B",
                    textAlign: "center",
                    marginTop: 4,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                  }}
                >
                  {selectedAmPm}
                </Text>
              </View>

              {/* Time Picker Container */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  paddingHorizontal: 24,
                  paddingVertical: 20,
                  marginBottom: 24,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 12,
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                }}
              >
                {/* Hour Picker */}
                <View style={{ alignItems: "center", marginRight: 24 }}>
                  <Text
                    style={{
                      fontSize: fontSize,
                      fontWeight: "700",
                      color: "#475569",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                    }}
                  >
                    Hour
                  </Text>
                  <View
                    style={{
                      height: 140,
                      width: 70,
                      backgroundColor: "#F8FAFC",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: "#E2E8F0",
                      overflow: "hidden",
                      position: "relative",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {/* Selection Indicator */}
                    <View
                      style={{
                        position: "absolute",
                        top: 50,
                        left: 0,
                        right: 0,
                        height: 40,
                        backgroundColor: "rgba(254, 242, 242, 0.8)",
                        borderWidth: 3,
                        borderColor: "#8B0000",
                        borderRadius: 12,
                        zIndex: 0,
                        shadowColor: "#8B0000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      }}
                    />

                    {/* Gradient Overlay for Selection */}
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 50,
                        backgroundColor: "rgba(139, 0, 0, 0.03)",
                        zIndex: 0,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 50,
                        backgroundColor: "rgba(139, 0, 0, 0.03)",
                        zIndex: 0,
                      }}
                    />

                    <ScrollView
                      ref={hourPickerRef}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      onMomentumScrollEnd={(event) => {
                        const y = event.nativeEvent.contentOffset.y;
                        const index = Math.round(y / 40);
                        const hour =
                          [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11][index] || 12;
                        setSelectedHour(hour);
                      }}
                    >
                      {/* Padding top */}
                      <View style={{ height: 50 }} />
                      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(
                        (hour, index) => (
                          <View
                            key={hour}
                            style={{
                              height: 40,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: fontSize + 4,
                                fontWeight:
                                  hour === selectedHour ? "900" : "700",
                                color:
                                  hour === selectedHour ? "#DC2626" : "#94A3B8",
                                zIndex: 2,
                              }}
                            >
                              {hour.toString().padStart(2, "0")}
                            </Text>
                          </View>
                        )
                      )}
                      {/* Padding bottom */}
                      <View style={{ height: 50 }} />
                    </ScrollView>
                  </View>
                </View>

                {/* Separator */}
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#8B0000",
                    marginHorizontal: 16,
                  }}
                />
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#8B0000",
                    marginHorizontal: 16,
                  }}
                />

                {/* Minute Picker */}
                <View style={{ alignItems: "center", marginLeft: 24 }}>
                  <Text
                    style={{
                      fontSize: fontSize,
                      fontWeight: "700",
                      color: "#475569",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                    }}
                  >
                    Minute
                  </Text>
                  <View
                    style={{
                      height: 140,
                      width: 70,
                      backgroundColor: "#F8FAFC",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: "#E2E8F0",
                      overflow: "hidden",
                      position: "relative",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {/* Selection Indicator */}
                    <View
                      style={{
                        position: "absolute",
                        top: 50,
                        left: 0,
                        right: 0,
                        height: 40,
                        backgroundColor: "rgba(254, 242, 242, 0.8)",
                        borderWidth: 3,
                        borderColor: "#8B0000",
                        borderRadius: 12,
                        zIndex: 0,
                        shadowColor: "#8B0000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      }}
                    />

                    {/* Gradient Overlay for Selection */}
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 50,
                        backgroundColor: "rgba(139, 0, 0, 0.03)",
                        zIndex: 0,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 50,
                        backgroundColor: "rgba(139, 0, 0, 0.03)",
                        zIndex: 0,
                      }}
                    />

                    <ScrollView
                      ref={minutePickerRef}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      onMomentumScrollEnd={(event) => {
                        const y = event.nativeEvent.contentOffset.y;
                        const index = Math.round(y / 40);
                        const minute =
                          [
                            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
                            15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
                            28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                            41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
                            54, 55, 56, 57, 58, 59,
                          ][index] || 0;
                        setSelectedMinute(minute);
                      }}
                    >
                      {/* Padding top */}
                      <View style={{ height: 50 }} />
                      {[
                        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                        16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
                        30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
                        44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
                        58, 59,
                      ].map((minute, index) => (
                        <View
                          key={minute}
                          style={{
                            height: 40,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: fontSize + 4,
                              fontWeight:
                                minute === selectedMinute ? "900" : "700",
                              color:
                                minute === selectedMinute
                                  ? "#DC2626"
                                  : "#94A3B8",
                              zIndex: 2,
                            }}
                          >
                            {minute.toString().padStart(2, "0")}
                          </Text>
                        </View>
                      ))}
                      {/* Padding bottom */}
                      <View style={{ height: 50 }} />
                    </ScrollView>
                  </View>
                </View>
              </View>

              {/* AM/PM Selection */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedAmPm("AM")}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor:
                      selectedAmPm === "AM" ? "#8B0000" : "#FFFFFF",
                    borderWidth: 2,
                    borderColor: selectedAmPm === "AM" ? "#8B0000" : "#E2E8F0",
                    shadowColor: selectedAmPm === "AM" ? "#8B0000" : "#000",
                    shadowOffset: {
                      width: 0,
                      height: selectedAmPm === "AM" ? 4 : 2,
                    },
                    shadowOpacity: selectedAmPm === "AM" ? 0.3 : 0.1,
                    shadowRadius: selectedAmPm === "AM" ? 8 : 4,
                    elevation: selectedAmPm === "AM" ? 8 : 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize,
                      fontWeight: "700",
                      color: selectedAmPm === "AM" ? "#FFFFFF" : "#475569",
                      letterSpacing: 1,
                    }}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedAmPm("PM")}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor:
                      selectedAmPm === "PM" ? "#8B0000" : "#FFFFFF",
                    borderWidth: 2,
                    borderColor: selectedAmPm === "PM" ? "#8B0000" : "#E2E8F0",
                    shadowColor: selectedAmPm === "PM" ? "#8B0000" : "#000",
                    shadowOffset: {
                      width: 0,
                      height: selectedAmPm === "PM" ? 4 : 2,
                    },
                    shadowOpacity: selectedAmPm === "PM" ? 0.3 : 0.1,
                    shadowRadius: selectedAmPm === "PM" ? 8 : 4,
                    elevation: selectedAmPm === "PM" ? 8 : 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize,
                      fontWeight: "700",
                      color: selectedAmPm === "PM" ? "#FFFFFF" : "#475569",
                      letterSpacing: 1,
                    }}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#374151",
                    fontSize: fontSize - 1,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTimeSelection}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: "#8B0000",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: fontSize - 1,
                    fontWeight: "600",
                  }}
                >
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Office Description Dialog */}
      {showOfficeDescription && selectedOfficeDetails && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: padding,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: padding + 4,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: fontSize + 2,
                fontWeight: "bold",
                color: "#8B0000",
                marginBottom: 8,
              }}
            >
              {selectedOfficeDetails.fullName}
            </Text>
            <Text
              style={{
                fontSize: fontSize - 1,
                color: "#4B5563",
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              {selectedOfficeDetails.description}
            </Text>
            <TouchableOpacity
              onPress={() => setShowOfficeDescription(false)}
              style={{
                backgroundColor: "#8B0000",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                alignSelf: "flex-end",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: fontSize - 1,
                  fontWeight: "600",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* AI Content Moderation Modal */}
      <BlockedContentModal
        visible={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        onEditReport={() => {
          setShowBlockedModal(false);
          // Optionally navigate back to edit the description
          setCurrentStep(1);
        }}
        reasons={blockedReasons}
      />

      {/* Processing Report Modal */}
      <ProcessingReportModal
        visible={showProcessingModal}
        phase={processingPhase}
      />

      {/* Error Modal */}
      <ReportErrorModal
        visible={showErrorModal}
        error={submissionError}
        onClose={() => {
          setShowErrorModal(false);
          setSubmissionError(null);
        }}
        onRetry={async () => {
          setShowErrorModal(false);
          setSubmissionError(null);
          // Retry submission
          try {
            setIsSubmitting(true);
            setShowProcessingModal(true);
            await doSubmit();
          } catch (error) {
            console.error("❌ [RETRY] Error retrying submission:", error);
            // Error will be caught and modal will show again
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {/* Similar Incidents Modal */}
      <SimilarIncidentsModal
        visible={showSimilarModal}
        onClose={() => {
          setShowSimilarModal(false);
          setIsSubmitting(false);
        }}
        onCancelReport={() => {
          setShowSimilarModal(false);
          setIsSubmitting(false);
          Alert.alert(
            "Report Canceled",
            "You chose to cancel based on similar resolutions.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Go back to Review & Submit step
                  setCurrentStep(3);
                },
              },
            ]
          );
        }}
        onProceedAnyway={async () => {
          setShowSimilarModal(false);
          // Continue with submission
          try {
            setShowProcessingModal(true);
            await doSubmit();
          } catch (error) {
            console.error("Error proceeding with submission:", error);
            Alert.alert("Error", "Failed to submit report. Please try again.");
            setIsSubmitting(false);
            setShowProcessingModal(false);
          }
        }}
        similarIncidents={similarIncidents}
        analysisWhy={analysisWhy || undefined}
      />

      {/* Report Success Modal */}
      {submissionResult && (
        <ReportSuccessModal
          visible={showSuccessModal}
          onClose={handleSuccessModalClose}
          trackingNumber={submissionResult.trackingNumber}
          assignedOffice={submissionResult.assignedOffice}
        />
      )}

      {/* Evidence Image Modal */}
      {showImageModal && evidenceFiles.length > 0 && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 1000,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowImageModal(false)}
          activeOpacity={1}
        >
          <TouchableOpacity
            style={{
              width: "90%",
              height: "80%",
              backgroundColor: "#000000",
              borderRadius: 16,
              overflow: "hidden",
            }}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderBottomWidth: 1,
                borderBottomColor: "#333333",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Image {selectedImageIndex + 1} of {evidenceFiles.length}
              </Text>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flex: 1,
                position: "relative",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{ uri: evidenceFiles[selectedImageIndex].uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
              {evidenceFiles.length > 1 && (
                <View
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    transform: [{ translateY: -20 }],
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedImageIndex((prev) =>
                        prev > 0 ? prev - 1 : evidenceFiles.length - 1
                      )
                    }
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setSelectedImageIndex((prev) =>
                        prev < evidenceFiles.length - 1 ? prev + 1 : 0
                      )
                    }
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderTopWidth: 1,
                borderTopColor: "#333333",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {evidenceFiles[selectedImageIndex].name}
              </Text>
              <Text
                style={{
                  color: "#CCCCCC",
                  fontSize: 12,
                }}
              >
                {(evidenceFiles[selectedImageIndex].size / 1024 / 1024).toFixed(
                  2
                )}{" "}
                MB
              </Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Need Help Dialog */}
      {showNeedHelpDialog && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: padding,
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: "#800000",
                  padding: 10,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              >
                <Ionicons name="help-circle" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#1F2937",
                    fontSize: 20,
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  Need Help?
                </Text>
                <Text
                  style={{
                    color: "#6B7280",
                    fontSize: 14,
                  }}
                >
                  Reporting Tips
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowNeedHelpDialog(false);
                  setHasClosedHelpDialog(true);
                }}
                style={{
                  padding: 4,
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Tips */}
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    backgroundColor: "#FEE2E2",
                    borderRadius: 10,
                    padding: 8,
                    marginRight: 12,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="location" size={16} color="#800000" />
                </View>
                <Text
                  style={{
                    color: "#374151",
                    fontSize: 14,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  Be as specific as possible about the location
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    backgroundColor: "#FEE2E2",
                    borderRadius: 10,
                    padding: 8,
                    marginRight: 12,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="time" size={16} color="#800000" />
                </View>
                <Text
                  style={{
                    color: "#374151",
                    fontSize: 14,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  Include time details even if approximate
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    backgroundColor: "#FEE2E2",
                    borderRadius: 10,
                    padding: 8,
                    marginRight: 12,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="document-text" size={16} color="#800000" />
                </View>
                <Text
                  style={{
                    color: "#374151",
                    fontSize: 14,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  Photos and videos help security respond effectively
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    backgroundColor: "#FEE2E2",
                    borderRadius: 10,
                    padding: 8,
                    marginRight: 12,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="warning" size={16} color="#800000" />
                </View>
                <Text
                  style={{
                    color: "#374151",
                    fontSize: 14,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  Mention any witnesses who can provide additional information
                </Text>
              </View>
            </View>

            {/* Got It Button */}
            <TouchableOpacity
              onPress={() => {
                setShowNeedHelpDialog(false);
                setHasClosedHelpDialog(true);
              }}
              style={{
                backgroundColor: "#800000",
                paddingVertical: 14,
                paddingHorizontal: 24,
                borderRadius: 10,
                alignItems: "center",
                marginTop: 24,
                shadowColor: "#800000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Got It!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // ------ ScrollView Content ------
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "ios" ? 100 : 120,
  },

  // ------ Header ------
  headerWrap: {
    backgroundColor: "#7A0000",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerAccent: {
    height: 4,
    backgroundColor: "#D4AF37",
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextBox: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: "#FFE8A3",
    fontSize: 12,
    marginTop: 2,
  },
  headerHelpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
