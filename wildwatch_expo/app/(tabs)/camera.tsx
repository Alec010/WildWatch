// app/(tabs)/camera.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Platform,
  ScrollView,
  useWindowDimensions,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { storage } from "../../lib/storage";

const COLORS = {
  maroon: "#8B0000",
  maroonDark: "#7A0000",
  gold: "#D4AF37",
  bg: "#F5F5F5",
  card: "#FFFFFF",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  subtle: "#F3F4F6",
  error: "#DC2626",
};

const RADIUS = 16;

function CameraHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerAccent} />
      <View style={styles.headerRow}>
        <View style={styles.headerTextBox}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Tips",
              "Use a clear, well-lit photo. Include relevant details and avoid blurry shots."
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
  );
}

interface EvidenceFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

type OpenOrigin = "initial" | "add";

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const isReturningFromLocation = params.fromLocation === "true";

  const [isLoading, setIsLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [capturedImages, setCapturedImages] = useState<EvidenceFile[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const imagesRef = useRef<EvidenceFile[]>([]);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Responsive calculations for image grid
  const screenWidth = width;
  const isSmallDevice = screenWidth < 375; // iPhone SE, small Android phones
  const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
  const imageGap = isSmallDevice ? 6 : isMediumDevice ? 10 : 12;
  const horizontalPadding = isSmallDevice ? 16 : 24;
  const availableWidth = screenWidth - horizontalPadding * 2 - imageGap * 2;
  const imageSize = availableWidth / 3;

  useFocusEffect(
    React.useCallback(() => {
      console.log("Camera screen useFocusEffect triggered:", {
        isReturningFromLocation,
        currentImageCount: capturedImages.length,
        imagesRefCount: imagesRef.current.length,
      });

      // Mark that user is at camera (flow step 1)
      storage.setReportFlowStep(1);

      // Re-check permissions when screen comes into focus
      // This handles the case where user enabled permissions in settings
      const recheckPermissions = async () => {
        try {
          const [cameraStatus, mediaStatus] = await Promise.all([
            ImagePicker.getCameraPermissionsAsync().catch(() => ({ status: "undetermined" })),
            ImagePicker.getMediaLibraryPermissionsAsync().catch(() => ({ status: "undetermined" })),
          ]);
          
          console.log("Permission status on focus - Camera:", cameraStatus.status, "Media:", mediaStatus.status);
          
          // If camera permission was just granted (e.g., from settings), update state
          if (cameraStatus.status === "granted" && cameraPermission === false) {
            console.log("Camera permission now granted (likely from settings), updating state");
            setCameraPermission(true);
            // If we're showing fallback and permission is now granted, we can open camera
            if (showFallback && capturedImages.length === 0) {
              // Don't auto-open, let user tap the button
            }
          }
        } catch (error) {
          console.error("Error rechecking permissions on focus:", error);
        }
      };

      if (!isReturningFromLocation) {
        // Load images from storage if they exist
        const loadStoredImages = async () => {
          try {
            // Re-check permissions first (in case user enabled them in settings)
            await recheckPermissions();
            
            const storedFiles = await storage.getEvidenceFiles();
            console.log("Loaded stored images from storage:", storedFiles);
            if (storedFiles && storedFiles.length > 0) {
              // If there are existing images, go directly to images captured state
              setCapturedImages(storedFiles);
              imagesRef.current = storedFiles;
              setShowFallback(false);
              setHasInitialized(true);
              setIsLoading(false);
              console.log(
                "Set camera to images captured state with",
                storedFiles.length,
                "images"
              );
            } else {
              // No images, initialize camera
              setCapturedImages([]);
              imagesRef.current = [];
              setShowFallback(true);
              setHasInitialized(false);
              initializeCamera();
              console.log("No stored images, initializing camera");
            }
          } catch (error) {
            console.error("Error loading stored images:", error);
            setCapturedImages([]);
            imagesRef.current = [];
            setShowFallback(true);
            setHasInitialized(false);
            initializeCamera();
          }
        };

        loadStoredImages();
      } else {
        // Returning from location, use preserved state but still re-check permissions
        recheckPermissions();
        console.log(
          "Returning from location, using preserved state with",
          imagesRef.current.length,
          "images"
        );
        setCapturedImages(imagesRef.current);
        setShowFallback(imagesRef.current.length === 0);
        setHasInitialized(true);
        setIsLoading(false);
      }
    }, [isReturningFromLocation, cameraPermission, showFallback, capturedImages.length])
  );

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setShowFallback(false);

      // Don't auto-request camera permission on load - only check status
      // This prevents permission dialog conflicts when user wants to use gallery
      try {
        const { status } = await ImagePicker.getCameraPermissionsAsync();
        console.log("Camera permission status on init:", status);
        
        if (status === "granted") {
          setCameraPermission(true);
          try {
            await openCamera({ origin: "initial", skipPermissionCheck: true });
          } catch (cameraError: any) {
            console.error("Error opening camera after permission check:", cameraError);
            // If camera fails to open, show fallback
            setCameraPermission(false);
            setShowFallback(capturedImages.length === 0);
          }
        } else {
          // Permission not granted - show fallback UI
          // User can request permission when they actually want to use camera
          console.log("Camera permission not granted, showing fallback UI");
          setCameraPermission(false);
          setShowFallback(capturedImages.length === 0);
        }
      } catch (permissionError: any) {
        console.error("Error checking camera permission:", permissionError);
        // If we can't check permission, assume it's not granted and show fallback
        setCameraPermission(false);
        setShowFallback(capturedImages.length === 0);
      }
      
      setIsLoading(false);
      setHasInitialized(true);
    } catch (error: any) {
      console.error("Error initializing camera:", error);
      // Ensure we always set a valid state even on error
      setCameraPermission(false);
      setShowFallback(capturedImages.length === 0);
      setIsLoading(false);
      setHasInitialized(true);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      console.log("Requesting camera permissions...");
      
      // First check current permission status
      let currentStatus = "undetermined";
      try {
        const statusCheck = await ImagePicker.getCameraPermissionsAsync();
        currentStatus = statusCheck.status;
        console.log("Current camera permission status:", currentStatus);
      } catch (checkError: any) {
        console.error("Error checking camera permission status:", checkError);
        // Continue to request permission even if check fails
      }
      
      // If already granted, return true immediately
      if (currentStatus === "granted") {
        console.log("Camera permission already granted");
        return true;
      }

      // Request permission
      console.log("Requesting camera permission...");
      let cameraStatus = "undetermined";
      let canAskAgain = true;
      
      try {
        const result = await ImagePicker.requestCameraPermissionsAsync();
        cameraStatus = result.status;
        canAskAgain = result.canAskAgain ?? true;
        console.log("Camera permission request result:", cameraStatus, "canAskAgain:", canAskAgain);
      } catch (requestError: any) {
        console.error("Error during camera permission request:", requestError);
        Alert.alert(
          "Permission Error",
          "Failed to request camera permission. Please try again or enable it in settings.",
          [
            { text: "OK" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return false;
      }
      
      if (cameraStatus !== "granted") {
        // Check if permission was denied permanently
        try {
          const finalCheck = await ImagePicker.getCameraPermissionsAsync();
          canAskAgain = finalCheck.canAskAgain ?? false;
        } catch (err) {
          console.error("Error checking final permission status:", err);
        }
        
        Alert.alert(
          "Camera Permission Required",
          cameraStatus === "denied" && !canAskAgain
            ? "Camera permission is required to take photos. Please enable it in your device settings."
            : "Camera permissions are required to take photos.",
          [
            { text: "OK" },
            ...(cameraStatus === "denied" && !canAskAgain
              ? [
                  {
                    text: "Open Settings",
                    onPress: () => {
                      if (Platform.OS === "ios") {
                        Linking.openURL("app-settings:");
                      } else {
                        Linking.openSettings();
                      }
                    },
                  },
                ]
              : []),
          ]
        );
        return false;
      }
      
      console.log("Camera permission granted successfully");
      return true;
    } catch (error: any) {
      console.error("Unexpected error requesting camera permissions:", error);
      Alert.alert(
        "Permission Error",
        error?.message || "Failed to request camera permissions. Please try again or enable it in settings.",
        [
          { text: "OK" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      return false;
    }
  };

  const openCamera = async ({
    origin,
    skipPermissionCheck = false,
  }: {
    origin: OpenOrigin;
    skipPermissionCheck?: boolean;
  }) => {
    try {
      if (origin === "initial") setIsLoading(false);

      if (!skipPermissionCheck) {
        try {
          const hasPermission = await requestPermissions();
          if (!hasPermission) {
            console.log("Camera permission not granted, showing fallback");
            if (origin === "initial") setShowFallback(true);
            setIsLoading(false);
            setHasInitialized(true);
            return;
          }

          // Double-check permission before launching camera
          const { status } = await ImagePicker.getCameraPermissionsAsync();
          if (status !== "granted") {
            console.log("Camera permission check failed, status:", status);
            Alert.alert(
              "Permission Denied",
              "Camera permission is required. Please enable it in settings.",
              [
                { text: "OK" },
                {
                  text: "Open Settings",
                  onPress: () => {
                    if (Platform.OS === "ios") {
                      Linking.openURL("app-settings:");
                    } else {
                      Linking.openSettings();
                    }
                  },
                },
              ]
            );
            if (origin === "initial") {
              setShowFallback(capturedImages.length === 0);
            }
            setIsLoading(false);
            setHasInitialized(true);
            return;
          }
        } catch (permissionError: any) {
          console.error("Error during camera permission check:", permissionError);
          Alert.alert(
            "Permission Error",
            "Failed to check camera permissions. Please try again or enable it in settings.",
            [
              { text: "OK" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
          if (origin === "initial") {
            setShowFallback(capturedImages.length === 0);
          }
          setIsLoading(false);
          setHasInitialized(true);
          return;
        }
      }

      // Launch camera with error handling
      let res;
      try {
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
      } catch (cameraError: any) {
        console.error("Error launching camera:", cameraError);
        // Check if it's a permission error
        if (cameraError?.message?.toLowerCase().includes("permission") || 
            cameraError?.code === "E_PERMISSION_MISSING") {
          Alert.alert(
            "Permission Required",
            "Camera permission is required to take photos. Please enable it in settings.",
            [
              { text: "OK" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            "Failed to open camera. Please try again.",
            [{ text: "OK" }]
          );
        }
        if (origin === "initial") {
          setShowFallback(capturedImages.length === 0);
        }
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      if (!res) {
        console.error("Camera returned null/undefined result");
        if (origin === "initial") {
          setShowFallback(capturedImages.length === 0);
        }
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      if (res.canceled) {
        // Stay in current view if user cancels from "add" origin
        if (origin === "add") {
          setIsLoading(false);
        } else {
          // Set fallback based on whether there are images
          setShowFallback(capturedImages.length === 0);
          setIsLoading(false);
        }
      } else {
        if (!res.assets || res.assets.length === 0) {
          console.log("No image captured");
          if (origin === "initial") {
            setShowFallback(capturedImages.length === 0);
          }
          setIsLoading(false);
          setHasInitialized(true);
          return;
        }

        const asset = res.assets[0];
        if (!asset || !asset.uri) {
          console.error("Invalid asset received from camera");
          Alert.alert("Error", "Failed to capture image. Please try again.");
          if (origin === "initial") {
            setShowFallback(capturedImages.length === 0);
          }
          setIsLoading(false);
          setHasInitialized(true);
          return;
        }

        const newFile: EvidenceFile = {
          uri: asset.uri,
          name:
            asset.fileName ??
            asset.uri.split("/").pop() ??
            `photo_${Date.now()}.jpg`,
          type: asset.type || "image/jpeg",
          size: asset.fileSize ?? 0,
        };
        setCapturedImages((prev) => {
          const newImages = [...prev, newFile];
          imagesRef.current = newImages;
          // Update storage
          console.log("Saving captured image to storage:", newImages);
          storage.setEvidenceFiles(newImages);
          return newImages;
        });
        setShowFallback(false);
      }

      setHasInitialized(true);
    } catch (error: any) {
      console.error("Error taking photo:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to open camera. Please check your camera permissions and try again.",
        [{ text: "OK" }]
      );
      if (origin === "initial") {
        setShowFallback(capturedImages.length === 0);
      }
      setIsLoading(false);
      setHasInitialized(true);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      console.log("pickImageFromGallery called");
      
      // Verify ImagePicker is available
      if (!ImagePicker || typeof ImagePicker.getMediaLibraryPermissionsAsync !== 'function') {
        console.error("ImagePicker is not available or not properly initialized");
        Alert.alert(
          "Error",
          "Image picker is not available. Please restart the app.",
          [{ text: "OK" }]
        );
        return;
      }

      // On Android, check if camera permission was recently requested to avoid dialog conflicts
      // Android 13+ uses granular permissions and can't show multiple permission dialogs at once
      if (Platform.OS === "android") {
        try {
          const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
          console.log("Camera permission status before gallery request:", cameraStatus.status);
          // If camera permission is undetermined (just requested) or denied (user just dismissed),
          // wait longer to ensure any camera permission dialog has fully closed
          // Android needs more time between permission requests to avoid conflicts
          if (cameraStatus.status === "undetermined" || cameraStatus.status === "denied") {
            console.log("Waiting for camera permission dialog to fully close...");
            // Increased delay to 2 seconds for Android to ensure dialog is fully dismissed
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (err) {
          // Ignore camera permission check errors, continue with media library request
          console.log("Could not check camera permission status:", err);
          // Still wait a bit on Android to be safe
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Request media library permissions with retry logic for Android
      let currentStatus = "undetermined";
      let mediaStatus = "undetermined";
      let canAskAgain = true;
      let retryCount = 0;
      const maxRetries = Platform.OS === "android" ? 2 : 1;

      try {
        console.log("Checking media library permission status...");
        const statusCheck = await ImagePicker.getMediaLibraryPermissionsAsync();
        currentStatus = statusCheck.status;
        console.log("Media library permission status:", currentStatus);
      } catch (checkError: any) {
        console.error("Error checking media library permission:", checkError);
        Alert.alert(
          "Permission Error",
          "Unable to check photo library permission. Please try again or enable it in settings.",
          [
            { text: "OK" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }
      
      if (currentStatus !== "granted") {
        while (retryCount < maxRetries && mediaStatus !== "granted") {
          try {
            console.log(`Requesting media library permission (attempt ${retryCount + 1})...`);
            try {
              const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!result) {
                console.error("Permission request returned null/undefined");
                throw new Error("Permission request failed - no result returned");
              }
              mediaStatus = result.status;
              canAskAgain = result.canAskAgain ?? true;
              console.log(`Media library permission request result: ${mediaStatus}, canAskAgain: ${canAskAgain}`);
            } catch (requestErr: any) {
              console.error(`Error in permission request attempt ${retryCount + 1}:`, requestErr);
              // If this is the first attempt and it fails, it might be a system issue
              if (retryCount === 0) {
                // Wait a bit longer before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              throw requestErr; // Re-throw to be caught by outer catch
            }

            // If permission was granted, break out of retry loop
            if (mediaStatus === "granted") {
              break;
            }

            // If we can't ask again (permanently denied), don't retry
            if (!canAskAgain) {
              break;
            }

            // On Android, if permission is still undetermined after request, wait and retry
            // This can happen if another permission dialog was showing
            if (Platform.OS === "android" && mediaStatus === "undetermined" && retryCount < maxRetries - 1) {
              console.log("Media library permission request may have been interrupted, retrying...");
              // Longer delay on retry to ensure any other dialogs are closed
              await new Promise(resolve => setTimeout(resolve, 2000));
              retryCount++;
            } else {
              break;
            }
          } catch (requestError: any) {
            console.error("Error requesting media library permission (attempt " + (retryCount + 1) + "):", requestError);
            if (retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500));
              retryCount++;
            } else {
              // Final retry failed, show error
              Alert.alert(
                "Permission Error",
                "Failed to request photo library permission. Please enable it in settings.",
                [
                  { text: "OK" },
                  {
                    text: "Open Settings",
                    onPress: () => {
                      if (Platform.OS === "ios") {
                        Linking.openURL("app-settings:");
                      } else {
                        Linking.openSettings();
                      }
                    },
                  },
                ]
              );
              return;
            }
          }
        }
        
        if (mediaStatus !== "granted") {
          // Re-check permission status to get latest canAskAgain value
          try {
            const finalCheck = await ImagePicker.getMediaLibraryPermissionsAsync();
            canAskAgain = finalCheck.canAskAgain ?? false;
            mediaStatus = finalCheck.status;
          } catch (err) {
            console.error("Error checking final permission status:", err);
          }

          Alert.alert(
            "Photo Library Permission Required",
            mediaStatus === "denied" && !canAskAgain
              ? "Photo library permission is required to select images. Please enable it in your device settings."
              : "Photo library permissions are required to select images.",
            [
              { text: "OK" },
              ...(mediaStatus === "denied" && !canAskAgain
                ? [
                    {
                      text: "Open Settings",
                      onPress: () => {
                        if (Platform.OS === "ios") {
                          Linking.openURL("app-settings:");
                        } else {
                          Linking.openSettings();
                        }
                      },
                    },
                  ]
                : []),
            ]
          );
          return;
        }
      }

      // Double-check permission before launching picker
      let finalStatus = "undetermined";
      try {
        const finalCheck = await ImagePicker.getMediaLibraryPermissionsAsync();
        finalStatus = finalCheck.status;
      } catch (checkError: any) {
        console.error("Error verifying media library permission:", checkError);
        Alert.alert(
          "Permission Error",
          "Unable to verify photo library permission. Please try again or enable it in settings.",
          [
            { text: "OK" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Photo library permission is required. Please enable it in settings.",
          [
            { text: "OK" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      // Launch image picker with error handling
      let res;
      try {
        res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          allowsEditing: false,
          quality: 0.8,
        });
      } catch (pickerError: any) {
        console.error("Error launching image picker:", pickerError);
        // Check if it's a permission error
        if (pickerError?.message?.toLowerCase().includes("permission") || 
            pickerError?.code === "E_PERMISSION_MISSING") {
          Alert.alert(
            "Permission Required",
            "Photo library permission is required to select images. Please enable it in settings.",
            [
              { text: "OK" },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            "Failed to open photo library. Please try again.",
            [{ text: "OK" }]
          );
        }
        return;
      }

      if (!res) {
        console.error("Image picker returned null/undefined result");
        return;
      }

      if (res.canceled) {
        console.log("User canceled image picker");
        return;
      }

      if (!res.assets || res.assets.length === 0) {
        console.log("No images selected");
        return;
      }

      // Validate all assets have URIs before processing
      const validAssets = res.assets.filter(asset => asset && asset.uri);
      
      if (validAssets.length === 0) {
        console.error("No valid images selected");
        Alert.alert("Error", "No valid images were selected. Please try again.");
        return;
      }

      try {
        const newFiles: EvidenceFile[] = validAssets.map((asset) => ({
          uri: asset.uri,
          name:
            asset.fileName ??
            asset.uri.split("/").pop() ??
            `image_${Date.now()}.jpg`,
          type: asset.type || "image/jpeg",
          size: asset.fileSize ?? 0,
        }));
        
        setCapturedImages((prev) => {
          const newImages = [...prev, ...newFiles];
          imagesRef.current = newImages;
          // Update storage
          console.log("Saving selected images to storage:", newImages);
          storage.setEvidenceFiles(newImages);
          return newImages;
        });
        setShowFallback(false);
        setHasInitialized(true);
      } catch (fileError: any) {
        console.error("Error processing selected images:", fileError);
        Alert.alert(
          "Error",
          "Failed to process selected images. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Unexpected error picking image:", error);
      // Don't show alert for user cancellation
      if (error?.message?.toLowerCase().includes("cancel") || 
          error?.code === "E_PICKER_CANCELLED") {
        console.log("User canceled image selection");
        return;
      }
      Alert.alert(
        "Error",
        error?.message || "Failed to pick image. Please check your photo library permissions and try again.",
        [
          { text: "OK" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  };

  const handleSkipForNow = () =>
    router.push({
      pathname: "/(tabs)/location",
      params: { hasImages: capturedImages.length > 0 ? "true" : "false" },
    } as any);

  const handleRemoveImage = (index: number) => {
    setCapturedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      imagesRef.current = newImages;
      // Update storage
      console.log("Removing image from storage:", newImages);
      storage.setEvidenceFiles(newImages);
      if (newImages.length === 0) {
        setShowFallback(true);
      }
      return newImages;
    });
  };

  const handleClearAllImages = () => {
    Alert.alert("Clear All Images", "Remove all images?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          setCapturedImages([]);
          imagesRef.current = [];
          setShowFallback(true);
          setShowImageModal(false);
          setLoadingImages(new Set());
          setHasInitialized(true);
          // Clear storage
          await storage.removeEvidenceFiles();
        },
      },
    ]);
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => setShowImageModal(false);
  const handleNextImage = () =>
    setSelectedImageIndex((prev) =>
      prev < capturedImages.length - 1 ? prev + 1 : 0
    );
  const handlePrevImage = () =>
    setSelectedImageIndex((prev) =>
      prev > 0 ? prev - 1 : capturedImages.length - 1
    );

  const handleCameraCardPress = async () => {
    if (showFallback) {
      try {
        console.log("Camera card pressed, requesting camera permission...");
        await openCamera({ origin: "initial" });
      } catch (error: any) {
        console.error("Error in handleCameraCardPress:", error);
        Alert.alert(
          "Error",
          "Failed to open camera. Please try again.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const headerSubtitleDefault = "Add an incident image or upload from gallery";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" />
        <CameraHeader
          title="Step 1 (Image Capture)"
          subtitle={headerSubtitleDefault}
        />

        <View style={styles.centerWrap}>
          <View style={styles.card}>
            <View style={{ marginBottom: 16 }}>
              <ActivityIndicator size="large" color={COLORS.maroon} />
            </View>
            <Text style={styles.loadingTitle}>Opening Camera...</Text>
            <Text style={styles.loadingText}>
              Please wait while we prepare the camera
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraPermission === false) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" />
        <CameraHeader
          title="Step 1 (Capture or Upload Image)"
          subtitle="Camera permission required"
        />

        <View style={styles.centerWrap}>
          <View style={[styles.card, { width: "100%" }]}>
            <View style={styles.bigCircleError}>
              <Ionicons name="camera" size={64} color={COLORS.error} />
            </View>

            <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
            <Text style={styles.permissionText}>
              To use this feature, please grant camera permissions in your
              device settings. You can still choose from your gallery or proceed
              later.
            </Text>

            <View style={styles.stackButtons}>
              <TouchableOpacity
                onPress={pickImageFromGallery}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Ionicons
                  name="images"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.btnPrimaryText}>Choose Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSkipForNow}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={styles.btnGhostText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If camera is closed and no images captured, show fallback
  if (showFallback && capturedImages.length === 0) {
    // Dynamic card height: comfy on portrait, slimmer on landscape
    const cardMinH = Math.max(
      180,
      Math.floor(height * (isLandscape ? 0.4 : 0.45))
    );
    const contentBottomPad = Math.max(insets.bottom, 12) + 8;

    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <StatusBar barStyle="light-content" />
        <CameraHeader
          title="Step 1 (Capture or Upload Image)"
          subtitle={headerSubtitleDefault}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: contentBottomPad,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={handleCameraCardPress}
            style={[
              styles.cameraCard,
              {
                minHeight: cardMinH + 40,
                maxWidth: 640,
                alignSelf: "center",
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.cameraIconCircle}>
              <Ionicons name="camera" size={72} color={COLORS.maroon} />
            </View>
            <Text style={styles.cameraCardTitle}>Tap to Open Camera</Text>
            <Text style={styles.cameraCardText}>
              Capture or select an incident photo
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.stackButtons,
              { alignSelf: "center", maxWidth: 640 },
            ]}
          >
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={pickImageFromGallery}
                style={[styles.btn, styles.btnGallery, styles.buttonRowItem]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="images"
                  size={12}
                  color="#FFE8A3"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.btnGalleryText}>From Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSkipForNow}
                style={[styles.btn, styles.btnSkip, styles.buttonRowItem]}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSkipText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={[
              styles.guidelinesBox,
              { alignSelf: "center", maxWidth: 640 },
            ]}
          >
            {[
              "Clear, well-lit photos work best",
              "Avoid blurry or dark images",
              "Multiple angles help with investigation",
              "You can capture multiple images",
            ].map((t, i) => (
              <View key={i} style={styles.guidelineRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.maroon}
                />
                <Text style={styles.guidelineText}>{t}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (capturedImages.length > 0) {
    const showClearAll = capturedImages.length > 1;
    
    // Calculate actual tab bar height to match the tab layout
    // Tab bar height WITHOUT the safe area insets (those are handled separately)
    const baseTabBarHeight = Platform.OS === "ios" ? 85 : 80;
    const tabBarTopPadding = 12;
    const tabBarVisibleHeight = baseTabBarHeight; // Just the visible tab bar
    
    // Bottom dock should sit just above the tab bar with minimal gap
    const bottomDockHeight = Platform.OS === "ios" ? 72 : 68;
    
    // ScrollView padding should account for both bottom dock and tab bar
    const bottomPad = bottomDockHeight + tabBarVisibleHeight + 16; // Small gap for breathing room

    // Responsive icon and text sizes
    const actionIconSize = isSmallDevice ? 24 : 32;
    const actionTextSize = isSmallDevice ? 11 : 13;
    const infoTextSize = isSmallDevice ? 10 : 12;
    const indexBadgeSize = isSmallDevice ? 20 : 24;

    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <StatusBar barStyle="light-content" />
        <CameraHeader
          title={`${capturedImages.length} Image${
            capturedImages.length !== 1 ? "s" : ""
          } Captured`}
          subtitle="Preview and manage your images"
        />

        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingTop: 16,
              paddingBottom: bottomPad,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.imagesGrid,
                {
                  alignSelf: "center",
                  maxWidth: 640,
                  gap: imageGap,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => openCamera({ origin: "add" })}
                style={[
                  styles.imageItem,
                  {
                    width: imageSize,
                    height: imageSize,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons
                      name="camera"
                      size={actionIconSize}
                      color={COLORS.maroon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.actionCardText,
                      { fontSize: actionTextSize },
                    ]}
                  >
                    Add More
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImageFromGallery}
                style={[
                  styles.imageItem,
                  {
                    width: imageSize,
                    height: imageSize,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons
                      name="images"
                      size={actionIconSize}
                      color={COLORS.maroon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.actionCardText,
                      { fontSize: actionTextSize },
                    ]}
                  >
                    From Gallery
                  </Text>
                </View>
              </TouchableOpacity>

              {capturedImages.map((image, index) => (
                <View
                  key={`captured-${index}`}
                  style={[
                    styles.imageItem,
                    {
                      width: imageSize,
                      height: imageSize,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleImagePress(index)}
                    style={styles.imageTouchable}
                    activeOpacity={0.6}
                  >
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.capturedImage}
                      resizeMode="cover"
                      onLoadStart={() =>
                        setLoadingImages((prev) => new Set(prev).add(index))
                      }
                      onLoad={() =>
                        setLoadingImages((prev) => {
                          const ns = new Set(prev);
                          ns.delete(index);
                          return ns;
                        })
                      }
                      onError={() =>
                        setLoadingImages((prev) => {
                          const ns = new Set(prev);
                          ns.delete(index);
                          return ns;
                        })
                      }
                    />
                    {loadingImages.has(index) && (
                      <View style={styles.imageLoadingOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    style={[
                      styles.removeButton,
                      {
                        width: indexBadgeSize,
                        height: indexBadgeSize,
                        borderRadius: indexBadgeSize / 2,
                      },
                    ]}
                  >
                    <Ionicons
                      name="close"
                      size={isSmallDevice ? 14 : 16}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <View style={styles.imageInfo}>
                    <Text
                      style={[styles.imageName, { fontSize: infoTextSize }]}
                      numberOfLines={1}
                    >
                      {image.name}
                    </Text>
                    <Text
                      style={[styles.imageSize, { fontSize: infoTextSize - 1 }]}
                    >
                      {(image.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.imageIndex,
                      {
                        width: indexBadgeSize,
                        height: indexBadgeSize,
                        borderRadius: indexBadgeSize / 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.imageIndexText,
                        { fontSize: infoTextSize },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View
            style={[
              styles.bottomDock,
              {
                backgroundColor: "transparent", // Remove white/gray background
                borderTopWidth: 0, // Remove top border
                elevation: 0, // Remove Android shadow
                shadowOpacity: 0, // Remove iOS shadow
                paddingBottom: 0, // Remove bottom padding
                paddingTop: 0, // Remove top padding
              },
            ]}
          >
            <View style={[styles.actionRow, { marginBottom: 0, marginTop: 0 }]}>
              <TouchableOpacity
                onPress={async () => {
                  console.log("Saving images to storage:", capturedImages);

                  // Save images to storage before navigating
                  await storage.setEvidenceFiles(capturedImages);

                  const navigationParams = {
                    hasImages: "true",
                    imageCount: capturedImages.length.toString(),
                  };

                  console.log(
                    "Navigating to location with params:",
                    navigationParams
                  );

                  // Navigate to location with images data
                  router.push({
                    pathname: "/(tabs)/location",
                    params: navigationParams,
                  } as any);
                }}
                style={[styles.btn, styles.btnSuccess, styles.actionFlex]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cloud-upload"
                  size={isSmallDevice ? 16 : 18}
                  color="#FFFFFF"
                  style={{ marginRight: isSmallDevice ? 6 : 8 }}
                />
                <Text
                  style={[
                    styles.btnSuccessText,
                    {
                      fontSize: isSmallDevice
                        ? 13
                        : Platform.OS === "ios"
                        ? 15
                        : 14,
                    },
                  ]}
                >
                  Upload to Report
                </Text>
              </TouchableOpacity>

              {showClearAll && (
                <TouchableOpacity
                  onPress={handleClearAllImages}
                  style={[styles.btn, styles.btnDanger, styles.actionFlex]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trash"
                    size={isSmallDevice ? 16 : 18}
                    color="#FFFFFF"
                    style={{ marginRight: isSmallDevice ? 6 : 8 }}
                  />
                  <Text
                    style={[
                      styles.btnDangerText,
                      { fontSize: isSmallDevice ? 11 : 12 },
                    ]}
                  >
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {showImageModal && capturedImages.length > 0 && (
          <TouchableOpacity
            style={styles.imageModalOverlay}
            onPress={handleCloseImageModal}
            activeOpacity={1}
          >
            <TouchableOpacity
              style={styles.imageModalContainer}
              onPress={(e) => e.stopPropagation()}
              activeOpacity={1}
            >
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>
                  Image {selectedImageIndex + 1} of {capturedImages.length}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseImageModal}
                  style={styles.imageModalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.imageModalContent}>
                <Image
                  source={{ uri: capturedImages[selectedImageIndex].uri }}
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
                {capturedImages.length > 1 && (
                  <View style={styles.imageModalNavigation}>
                    <TouchableOpacity
                      onPress={handlePrevImage}
                      style={styles.imageModalNavButton}
                    >
                      <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleNextImage}
                      style={styles.imageModalNavButton}
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

              <View style={styles.imageModalInfo}>
                <Text style={styles.imageModalFileName}>
                  {capturedImages[selectedImageIndex].name}
                </Text>
                <Text style={styles.imageModalFileSize}>
                  {(
                    capturedImages[selectedImageIndex].size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerWrap: {
    backgroundColor: COLORS.maroonDark,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerAccent: { height: 4, backgroundColor: COLORS.gold, width: "100%" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerTextBox: { flex: 1, marginRight: 8 },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.2,
  },
  headerSubtitle: { color: "#FFE8A3", fontSize: 12, marginTop: 2 },
  headerHelpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 520,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: { elevation: 2 },
    }),
  },

  loadingTitle: {
    fontWeight: "700",
    color: COLORS.maroon,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 4,
  },
  loadingText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
  },

  bigCircleError: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  permissionTitle: {
    fontWeight: "800",
    color: COLORS.error,
    textAlign: "center",
    fontSize: 18,
    marginBottom: 8,
  },
  permissionText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14,
  },

  // Fallback
  cameraCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS + 4,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    marginBottom: 18,
  },
  cameraIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  cameraCardTitle: {
    fontWeight: "800",
    color: COLORS.maroon,
    textAlign: "center",
    marginBottom: 6,
    fontSize: 18,
  },
  cameraCardText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
  },

  stackButtons: {
    width: "100%",
    gap: 10,
    marginTop: 12,
  },
  btn: {
    height: Platform.OS === "ios" ? 52 : 48,
    borderRadius: Platform.OS === "ios" ? 14 : 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minWidth: Platform.OS === "ios" ? 120 : 100,
    paddingHorizontal: Platform.OS === "ios" ? 16 : 12,
  },
  btnPrimary: {
    backgroundColor: COLORS.maroon,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.maroon,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  btnPrimaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  btnSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.maroon,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  btnSecondaryText: { color: COLORS.maroon, fontWeight: "600", fontSize: 13 },
  btnDanger: {
    backgroundColor: COLORS.error,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  btnDangerText: { color: "#FFFFFF", fontWeight: "600", fontSize: 12 },
  btnGhost: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  btnGhostText: { color: "#6B7280", fontWeight: "600", fontSize: 13 },
  btnGallery: {
    backgroundColor: COLORS.maroon,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.maroon,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  btnGalleryText: { color: "#FFE8A3", fontWeight: "700", fontSize: 14 },
  btnSkip: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  btnSkipText: { color: COLORS.maroon, fontWeight: "600", fontSize: 13 },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  buttonRowItem: {
    flex: 1,
  },

  capturedPreview: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  previewTitle: {
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
    fontSize: 14,
  },
  previewGrid: {
    flexDirection: "row",
    gap: 8,
  },
  previewItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: COLORS.card,
  },
  previewImage: { width: "100%", height: "100%" },
  previewOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  previewIndex: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  moreImages: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
  },
  moreImagesText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },

  guidelinesBox: {
    width: "100%",
    backgroundColor: "#FFF8E1",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 12,
  },
  guidelineRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  guidelineText: { color: COLORS.textSecondary, marginLeft: 8, fontSize: 13 },

  // Captured grid screen
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  imageItem: {
    borderRadius: Platform.OS === "ios" ? RADIUS : 12,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    marginBottom: 0, // Removed since we're using gap in parent
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  capturedImage: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 8 : 6,
    right: Platform.OS === "ios" ? 8 : 6,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  imageInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    paddingHorizontal: Platform.OS === "ios" ? 8 : 6,
  },
  imageName: { color: "#FFFFFF", fontWeight: "600" },
  imageSize: { color: "#E5E7EB", marginTop: 2 },
  imageIndex: {
    position: "absolute",
    top: Platform.OS === "ios" ? 8 : 6,
    left: Platform.OS === "ios" ? 8 : 6,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  imageIndexText: { color: "#FFFFFF", fontWeight: "700" },

  imageTouchable: { width: "100%", height: "100%" },

  topActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionCardContent: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.card,
    borderRadius: Platform.OS === "ios" ? RADIUS : 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Platform.OS === "ios" ? 16 : 12,
    paddingHorizontal: Platform.OS === "ios" ? 12 : 8,
  },
  actionCardIcon: {
    marginBottom: Platform.OS === "ios" ? 8 : 6,
  },
  actionCardText: {
    color: COLORS.maroon,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FAFBFC",
    paddingHorizontal: Platform.OS === "ios" ? 16 : 14,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },

  actionRow: {
    flexDirection: "row",
    marginBottom: Platform.OS === "ios" ? 8 : 6,
    marginTop: Platform.OS === "ios" ? 4 : 2,
    gap: Platform.OS === "ios" ? 10 : 8,
    width: "100%",
  },
  actionFlex: { flex: 1 },

  imageModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContainer: {
    width: "90%",
    height: "80%",
    backgroundColor: "#000000",
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  imageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  imageModalTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  imageModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalContent: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalImage: { width: "100%", height: "100%" },
  imageModalNavigation: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    transform: [{ translateY: -20 }],
  },
  imageModalNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  imageModalInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  imageModalFileName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  imageModalFileSize: { color: "#CCCCCC", fontSize: 12 },

  btnSuccess: {
    backgroundColor: "#16a34a",
    ...Platform.select({
      ios: {
        shadowColor: "#16a34a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  btnSuccessText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: Platform.OS === "ios" ? 15 : 14,
  },
});
