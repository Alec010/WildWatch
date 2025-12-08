"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  HelpCircle,
  X,
  Clock,
  MapPin,
  FileText,
  Tag,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Upload,
  Camera,
  User,
  Phone,
  PenLine,
  Plus,
  ImageIcon,
  Video,
  File,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/Sidebar";
import ClientMultiUserMentionInput from "@/components/ClientMultiUserMentionInput";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { API_BASE_URL } from "@/utils/api";
import { api } from "@/utils/apiClient";
import { Badge } from "@/components/ui/badge";
import LocationPicker from "@/components/LocationPicker";
import { LocationData } from "@/utils/locationService";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { PageLoader } from "@/components/PageLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  storeFiles,
  getFiles,
  generateFileId,
  deleteFileData,
  clearAllFiles,
} from "@/utils/fileStorage";

export default function IncidentSubmissionPage() {
  const router = useRouter();
  // Helper function to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to get current time in HH:MM format
  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    incidentType: "",
    dateOfIncident: getLocalDateString(),
    timeOfIncident: getCurrentTimeString(),
    location: "",
    formattedAddress: "",
    latitude: null as number | null,
    longitude: null as number | null,
    building: "",
    buildingName: "",
    buildingCode: "",
    room: "", // Optional specific room/location
    description: "",
    tags: [] as string[], // Top 5 selected tags
    allTags: [] as string[], // All 20 generated tags
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSelectError, setTagSelectError] = useState<string | null>(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("details");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Refs for auto-generation timers
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const blurDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track latest formData for tag generation
  const formDataRef = useRef(formData);

  // Update ref whenever formData changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Evidence and Witness state
  interface UserInfo {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    schoolIdNumber: string;
  }

  interface WitnessInfo {
    name: string;
    contactInformation: string;
    additionalNotes: string;
    users: UserInfo[];
  }

  interface FileInfo {
    name: string;
    size: number;
    type: string;
    data: string;
    file?: File;
    id?: string;
  }

  const [evidenceData, setEvidenceData] = useState({
    witnesses: [] as WitnessInfo[],
    fileInfos: [] as FileInfo[],
  });
  const [isDragging, setIsDragging] = useState(false);
  const [expandedWitness, setExpandedWitness] = useState<number | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const [witnessToDelete, setWitnessToDelete] = useState<number | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const loadData = async () => {
      const storedData = sessionStorage.getItem("incidentSubmissionData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Ensure date and time are set if missing
        if (!parsedData.dateOfIncident) {
          parsedData.dateOfIncident = getLocalDateString();
        }
        if (!parsedData.timeOfIncident) {
          parsedData.timeOfIncident = getCurrentTimeString();
        }
        // Preserve both display tags and all tags from sessionStorage
        setFormData(parsedData);
        if (parsedData.tags) {
          setSelectedTags(parsedData.tags);
          // Ensure formData.tags contains the stored display tags (filtered)
          if (!parsedData.tags || parsedData.tags.length === 0) {
            // If no display tags stored but we have allTags, calculate them
            if (parsedData.allTags && parsedData.allTags.length > 0) {
              const displayTags = selectDisplayTags(parsedData.allTags);
              setFormData((prev) => ({ ...prev, tags: displayTags }));
            }
          }
        }
        if (parsedData.allTags) {
          setTags(parsedData.allTags);
        }
      }

      // Load evidence data from sessionStorage
      const storedEvidenceData = sessionStorage.getItem(
        "evidenceSubmissionData"
      );
      if (storedEvidenceData) {
        try {
          const parsedEvidenceData = JSON.parse(storedEvidenceData);

          // Load file data from IndexedDB if files have IDs but no data
          if (
            parsedEvidenceData.fileInfos &&
            parsedEvidenceData.fileInfos.length > 0
          ) {
            const fileIds = parsedEvidenceData.fileInfos
              .filter((f: FileInfo) => f.id && !f.data)
              .map((f: FileInfo) => f.id);

            if (fileIds.length > 0) {
              try {
                const fileDataMap = await getFiles(fileIds);
                // Merge file data back into fileInfos
                parsedEvidenceData.fileInfos = parsedEvidenceData.fileInfos.map(
                  (f: FileInfo) => {
                    if (f.id && fileDataMap.has(f.id)) {
                      return { ...f, data: fileDataMap.get(f.id) };
                    }
                    return f;
                  }
                );
              } catch (error) {
                console.error("Error loading file data from IndexedDB:", error);
              }
            }
          }

          setEvidenceData({
            witnesses: parsedEvidenceData.witnesses || [],
            fileInfos: parsedEvidenceData.fileInfos || [],
          });
        } catch (error) {
          console.error("Error loading evidence data:", error);
        }
      }

      setLoading(false);
      isInitialLoadRef.current = false;
    };

    loadData();
  }, []);

  // Save evidence data to sessionStorage whenever it changes
  useEffect(() => {
    // Skip saving during initial load
    if (isInitialLoadRef.current) {
      return;
    }

    const saveEvidenceData = async () => {
      try {
        // Store file data in IndexedDB
        const filesToStore = evidenceData.fileInfos
          .filter((f) => f.id && f.data)
          .map((f) => ({
            id: f.id!,
            data: f.data,
          }));

        if (filesToStore.length > 0) {
          await storeFiles(filesToStore);
        }

        // Save only metadata to sessionStorage (without base64 data)
        const evidenceDataToSave = {
          witnesses: evidenceData.witnesses,
          fileInfos: evidenceData.fileInfos.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
            id: f.id,
          })),
        };

        sessionStorage.setItem(
          "evidenceSubmissionData",
          JSON.stringify(evidenceDataToSave)
        );
      } catch (error) {
        console.error("Error saving evidence data:", error);
      }
    };

    // Save evidence data (even if empty, to clear it when reset)
    saveEvidenceData();
  }, [evidenceData]);

  // Show help dialog automatically once when in step 1
  useEffect(() => {
    // Wait for page to finish loading
    if (loading) return;

    // Check if user has seen the help dialog in this session
    const helpShownKey = "incidentSubmitHelpShown";
    const hasSeenHelp = sessionStorage.getItem(helpShownKey);

    // Show dialog if not seen before
    if (!hasSeenHelp) {
      // Delay to ensure page is fully loaded and rendered
      const timer = setTimeout(() => {
        setShowHelpDialog(true);
        // Mark as seen in sessionStorage (clears when browser session ends)
        sessionStorage.setItem(helpShownKey, "true");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (
      formData.incidentType ||
      formData.location ||
      formData.description ||
      formData.latitude
    ) {
      const allGeneratedTags = tags.length > 0 ? tags : formData.allTags;
      // Only recalculate display tags if they don't exist or if allTags changed
      // This prevents tags from changing when navigating back and forth
      const storedData = sessionStorage.getItem("incidentSubmissionData");
      let displayTags = formData.tags || []; // Use existing display tags if available

      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          // If we have stored display tags and allTags haven't changed, keep them
          if (
            parsed.tags &&
            parsed.tags.length > 0 &&
            JSON.stringify(parsed.allTags || []) ===
              JSON.stringify(allGeneratedTags)
          ) {
            displayTags = parsed.tags;
          } else if (allGeneratedTags.length > 0 && displayTags.length === 0) {
            // Only calculate if we don't have display tags yet
            displayTags = selectDisplayTags(allGeneratedTags);
          }
        } catch (e) {
          // If parsing fails, calculate display tags
          if (allGeneratedTags.length > 0) {
            displayTags = selectDisplayTags(allGeneratedTags);
          }
        }
      } else if (allGeneratedTags.length > 0 && displayTags.length === 0) {
        // Calculate display tags if we have allTags but no display tags
        displayTags = selectDisplayTags(allGeneratedTags);
      }

      sessionStorage.setItem(
        "incidentSubmissionData",
        JSON.stringify({
          ...formData,
          tags: displayTags, // Save filtered display tags for UI
          allTags: allGeneratedTags, // Save all tags for backend
        })
      );
    }
  }, [formData, tags]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Clear any previous error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Add validation for date of incident
    if (name === "dateOfIncident") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today

      if (selectedDate > today) {
        setFormErrors((prev) => ({
          ...prev,
          dateOfIncident: "Please select a date that is not in the future",
        }));
        return;
      }
    }

    // Clear tags if description or location-related fields are changing
    const shouldClearTags =
      name === "description" ||
      name === "location" ||
      name === "formattedAddress" ||
      name === "buildingName" ||
      name === "buildingCode";

    if (shouldClearTags) {
      // Clear existing tags to force regeneration from scratch
      setTags([]);
      setFormData((prev) => ({ ...prev, allTags: [] }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate tags when user types in description field (debounced)
    if (name === "description") {
      // Clear existing debounce timer
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }

      // Set new debounce timer (2 seconds after user stops typing)
      typingDebounceRef.current = setTimeout(() => {
        // Use formDataRef to get the latest values
        const currentFormData = formDataRef.current;
        // Check if description and location are available
        if (
          currentFormData.description.trim().length >= 10 &&
          (currentFormData.location ||
            (currentFormData.latitude && currentFormData.longitude)) &&
          !tagsLoading &&
          !isGeneratingTags
        ) {
          handleGenerateTags();
        }
      }, 3500);
    }
  };

  // Handle description blur (when user leaves the field)
  const handleDescriptionBlur = () => {
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
      // Use formDataRef to get the latest values
      const currentFormData = formDataRef.current;
      // Check if description and location are available
      if (
        currentFormData.description.trim().length >= 10 &&
        (currentFormData.location ||
          (currentFormData.latitude && currentFormData.longitude)) &&
        !tagsLoading &&
        !isGeneratingTags
      ) {
        handleGenerateTags();
      }
    }, 1000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      if (blurDelayRef.current) {
        clearTimeout(blurDelayRef.current);
      }
    };
  }, []);

  const handleUseCurrentDate = () => {
    const currentDate = getLocalDateString();
    setFormData((prev) => ({ ...prev, dateOfIncident: currentDate }));

    // Clear date error if it exists
    if (formErrors.dateOfIncident) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.dateOfIncident;
        return newErrors;
      });
    }
  };

  const handleUseCurrentTime = () => {
    const currentTime = getCurrentTimeString();
    setFormData((prev) => ({ ...prev, timeOfIncident: currentTime }));

    // Clear time error if it exists
    if (formErrors.timeOfIncident) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.timeOfIncident;
        return newErrors;
      });
    }
  };

  const handleLocationSelect = (locationData: LocationData) => {
    // Check if this is a "cleared" location (coordinates are 0,0)
    const isClearing =
      locationData.latitude === 0 && locationData.longitude === 0;

    if (isClearing) {
      // User is starting to select a new location
      setIsSelectingLocation(true);

      // Clear location error immediately when user starts selecting
      if (formErrors.location) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.location;
          return newErrors;
        });
      }
    } else {
      // User has completed location selection
      setIsSelectingLocation(false);
    }

    // Check if location actually changed (to avoid clearing tags unnecessarily)
    const locationChanged =
      formData.latitude !== locationData.latitude ||
      formData.longitude !== locationData.longitude ||
      formData.buildingName !== locationData.buildingName ||
      formData.buildingCode !== locationData.buildingCode ||
      formData.formattedAddress !== locationData.formattedAddress;

    // Clear existing tags if location changed (to force regeneration from scratch)
    if (locationChanged && !isClearing) {
      setTags([]);
      setFormData((prev) => ({ ...prev, allTags: [] }));
    }

    setFormData((prev) => ({
      ...prev,
      location:
        locationData.formattedAddress ||
        `${locationData.latitude}, ${locationData.longitude}`,
      formattedAddress: locationData.formattedAddress || "",
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      building: locationData.building || "",
      buildingName: locationData.buildingName || "",
      buildingCode: locationData.buildingCode || "",
      room: locationData.room || "",
    }));

    // Clear location error if it exists and location is valid
    if (formErrors.location && !isClearing) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }

    // Auto-generate tags if location changed and description is available
    if (
      locationChanged &&
      !isClearing &&
      formData.description.trim().length >= 10
    ) {
      // Clear any existing timers
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      if (blurDelayRef.current) {
        clearTimeout(blurDelayRef.current);
      }

      // Trigger tag generation after a short delay (using latest formData)
      setTimeout(() => {
        const currentFormData = formDataRef.current;
        if (
          currentFormData.description.trim().length >= 10 &&
          !tagsLoading &&
          !isGeneratingTags
        ) {
          handleGenerateTags();
        }
      }, 500);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.incidentType.trim()) {
      errors.incidentType = "Incident title is required";
    }

    if (!formData.dateOfIncident) {
      errors.dateOfIncident = "Date of incident is required";
    }

    if (!formData.timeOfIncident) {
      errors.timeOfIncident = "Time of incident is required";
    }

    // Location is required - check both old location field and new geolocation fields
    // Skip location validation if user is currently selecting a location
    if (!isSelectingLocation) {
      const hasValidLocation =
        formData.location.trim() ||
        (formData.latitude &&
          formData.longitude &&
          formData.latitude !== 0 &&
          formData.longitude !== 0);

      if (!hasValidLocation) {
        errors.location = "Location is required";
      }
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length > 1000) {
      errors.description = "Description must be less than 1000 characters";
    }

    // Tag validation - must have generated tags
    const allGeneratedTags = tags.length > 0 ? tags : formData.allTags;
    if (allGeneratedTags.length === 0) {
      setTagSelectError("Please generate tags before submitting.");
      return false;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Evidence and Witness handlers
  const handleAddWitness = () => {
    setEvidenceData((prev) => ({
      ...prev,
      witnesses: [
        ...prev.witnesses,
        {
          name: "",
          contactInformation: "",
          additionalNotes: "",
          users: [],
        },
      ],
    }));

    setTimeout(() => {
      setExpandedWitness(evidenceData.witnesses.length);
      const element = document.getElementById(
        `witness-${evidenceData.witnesses.length}`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleWitnessChange = (
    index: number,
    field: keyof WitnessInfo,
    value: string
  ) => {
    const updatedWitnesses = [...evidenceData.witnesses];
    updatedWitnesses[index] = { ...updatedWitnesses[index], [field]: value };
    setEvidenceData((prev) => ({ ...prev, witnesses: updatedWitnesses }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && !isProcessingFiles) {
      await processFiles(Array.from(e.target.files));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const processFiles = async (files: File[]) => {
    if (isProcessingFiles) return;

    setIsProcessingFiles(true);

    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    const invalidFiles = files.filter((file) => file.size > 10 * 1024 * 1024);

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) exceeded the 10MB limit`, {
        description: "Please upload smaller files.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        id: "file-size-error",
      });
    }

    if (validFiles.length === 0) {
      setIsProcessingFiles(false);
      return;
    }

    const loadingToast = toast.loading(
      `Processing ${validFiles.length} file(s)...`,
      {
        description: "Please wait while we process your files.",
      }
    );

    try {
      const fileInfoPromises = validFiles.map(async (file) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const fileId = generateFileId(file.name, file.size);
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          file: file,
          id: fileId,
        };
      });

      const newFileInfos = await Promise.all(fileInfoPromises);

      await storeFiles(
        newFileInfos.map((f) => ({
          id: f.id!,
          data: f.data,
        }))
      );

      setEvidenceData((prev) => ({
        ...prev,
        fileInfos: [...prev.fileInfos, ...newFileInfos],
      }));

      toast.success(`${validFiles.length} file(s) uploaded successfully`, {
        description: "Your evidence has been added to the report.",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        id: `file-upload-success-${Date.now()}`,
        duration: 3000,
      });
    } catch (error) {
      toast.error("Error processing files", {
        description: "Please try again or use different files.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        id: "file-processing-error",
      });
    } finally {
      toast.dismiss(loadingToast);
      setIsProcessingFiles(false);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFileToDelete(indexToRemove);
    setShowDeleteDialog(true);
  };

  const confirmDeleteFile = async () => {
    if (fileToDelete !== null) {
      const fileToRemove = evidenceData.fileInfos[fileToDelete];

      if (fileToRemove?.id) {
        try {
          await deleteFileData(fileToRemove.id);
        } catch (error) {
          console.error("Error deleting file from IndexedDB:", error);
        }
      }

      setEvidenceData((prev) => ({
        ...prev,
        fileInfos: prev.fileInfos.filter((_, index) => index !== fileToDelete),
      }));
      setFileToDelete(null);
      setShowDeleteDialog(false);

      toast.success("File removed", {
        description: "The file has been removed from your evidence.",
        id: "file-removed-success",
      });
    }
  };

  const handleRemoveWitness = (indexToRemove: number) => {
    setWitnessToDelete(indexToRemove);
    setShowDeleteDialog(true);
  };

  const confirmDeleteWitness = () => {
    if (witnessToDelete !== null) {
      setEvidenceData((prev) => ({
        ...prev,
        witnesses: prev.witnesses.filter(
          (_, index) => index !== witnessToDelete
        ),
      }));
      setWitnessToDelete(null);
      setShowDeleteDialog(false);

      toast.success("Witness removed", {
        description:
          "The witness information has been removed from your report.",
        id: "witness-removed-success",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0 &&
      !isProcessingFiles
    ) {
      await processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    } else if (fileType.startsWith("video/")) {
      return <Video className="h-6 w-6 text-purple-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there is any evidence (files or witnesses)
    if (
      evidenceData.fileInfos.length === 0 &&
      evidenceData.witnesses.length === 0
    ) {
      toast.error("Evidence required", {
        description:
          "Please provide at least one piece of evidence (files or witness information) before proceeding.",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        duration: 5000,
        id: "evidence-required-error",
      });
      return;
    }

    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element)
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Please fix the errors in the form", {
        description: "Please check the highlighted fields and try again.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        className: "bg-white border-red-100 text-red-800",
        duration: 5000,
        id: "form-validation-error",
      });
      return;
    }
    const allGeneratedTags = tags.length > 0 ? tags : formData.allTags;
    // Use stored display tags if available, otherwise calculate them
    const displayTags =
      formData.tags && formData.tags.length > 0
        ? formData.tags
        : allGeneratedTags.length > 0
        ? selectDisplayTags(allGeneratedTags)
        : [];
    sessionStorage.setItem(
      "incidentSubmissionData",
      JSON.stringify({
        ...formData,
        tags: displayTags, // Save filtered display tags for UI
        allTags: allGeneratedTags, // Save all tags for backend
      })
    );
    // Save evidence data to sessionStorage
    try {
      // Store file data in IndexedDB
      const filesToStore = evidenceData.fileInfos
        .filter((f) => f.id && f.data)
        .map((f) => ({
          id: f.id!,
          data: f.data,
        }));

      if (filesToStore.length > 0) {
        await storeFiles(filesToStore);
      }

      // Save only metadata to sessionStorage (without base64 data)
      const evidenceDataToSave = {
        witnesses: evidenceData.witnesses,
        fileInfos: evidenceData.fileInfos.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          id: f.id,
        })),
      };

      sessionStorage.setItem(
        "evidenceSubmissionData",
        JSON.stringify(evidenceDataToSave)
      );
    } catch (error) {
      console.error("Error saving evidence data:", error);
      toast.error("Failed to save evidence", {
        description:
          "There was an error saving your evidence. Please try again.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        duration: 5000,
      });
    }

    router.push("/incidents/submit/review");
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = async () => {
    // Temporarily set flag to prevent saving during reset
    isInitialLoadRef.current = true;

    setFormData({
      incidentType: "",
      dateOfIncident: getLocalDateString(),
      timeOfIncident: getCurrentTimeString(),
      location: "",
      formattedAddress: "",
      latitude: null,
      longitude: null,
      building: "",
      buildingName: "",
      buildingCode: "",
      room: "",
      description: "",
      tags: [],
      allTags: [],
    });
    setSelectedTags([]);
    setTags([]);
    setFormErrors({});
    setIsSelectingLocation(false);
    setEvidenceData({ witnesses: [], fileInfos: [] });
    sessionStorage.removeItem("incidentSubmissionData");
    sessionStorage.removeItem("evidenceSubmissionData");
    // Clear IndexedDB files
    try {
      await clearAllFiles();
    } catch (error) {
      console.error("Error clearing files from IndexedDB:", error);
    }

    // Reset flag after a brief delay to allow state updates
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);

    setShowResetDialog(false);
    toast.success("Form has been reset", {
      description: "All form fields have been cleared.",
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      className: "bg-white border-green-100 text-green-800",
      duration: 3000,
      id: "form-reset-success",
    });
  };

  const handleGenerateTags = async () => {
    setTagsError(null);
    setTagsLoading(true);
    setIsGeneratingTags(true);

    // Clear existing tags state to force regeneration from scratch
    setTags([]);
    setFormData((prev) => ({ ...prev, allTags: [] }));

    // Use the latest formData from ref to ensure we have current values
    const currentFormData = formDataRef.current;

    try {
      const response = await api.post("/api/tags/generate", {
        description: currentFormData.description,
        incidentType: currentFormData.incidentType,
        location: currentFormData.location,
        formattedAddress: currentFormData.formattedAddress,
        buildingName: currentFormData.buildingName,
        buildingCode: currentFormData.buildingCode,
        latitude: currentFormData.latitude,
        longitude: currentFormData.longitude,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate tags");
      }

      const data = await response.json();

      // Handle new response format with all tags and top 5 scored tags
      const allGeneratedTags = data.allTags || data.tags || [];
      const top5Tags =
        data.top5Tags ||
        data.top5ScoredTags?.map((ts: any) => ts.tag) ||
        [] ||
        [];

      // Store all generated tags (20 tags)
      setTags(allGeneratedTags);

      // Calculate display tags once when tags are generated
      const displayTags = selectDisplayTags(allGeneratedTags);

      // Store all 20 tags in formData for submission, and the selected display tags
      setFormData((prev) => ({
        ...prev,
        allTags: allGeneratedTags,
        tags: displayTags, // Store the selected display tags
      }));

      // Store all generated tags - no need to select specific tags anymore
      // All tags will be displayed and submitted

      const totalGenerated = data.totalGenerated || allGeneratedTags.length;
      toast.success("Tags generated successfully", {
        description: `Generated ${totalGenerated} tags. Selected top 5 most relevant based on weighted scoring.`,
        icon: <Sparkles className="h-5 w-5 text-green-500" />,
        className: "bg-white border-green-100 text-green-800",
        duration: 3000,
        id: "tags-generated-success",
      });
    } catch (err: any) {
      setTagsError(err.message || "Failed to generate tags");
      toast.error("Failed to generate tags", {
        id: "tags-generation-error",
        description:
          err.message ||
          "There was an error generating tags. Please try again.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        className: "bg-white border-red-100 text-red-800",
        duration: 5000,
      });
    } finally {
      setTagsLoading(false);
      // Keep isGeneratingTags true for a moment to show the animation
      setTimeout(() => {
        setIsGeneratingTags(false);
      }, 500);
    }
  };

  // Function to select 5 unique tags for display, filtering out similar tags
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
      if (formData.buildingName) {
        locationWords.push(...extractWords(formData.buildingName));
      }

      // Extract words from buildingCode
      if (formData.buildingCode) {
        locationWords.push(...extractWords(formData.buildingCode));
      }

      // Extract words from formattedAddress (but be more selective - only significant words)
      if (formData.formattedAddress) {
        const addressWords = extractWords(formData.formattedAddress);
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
      // This handles cases like:
      // - "NGE-Building" and "ST-Building" (both have "Building")
      // - "ST" and "ST-Building" (both have "ST")
      // - "ST" and "st" (same word, case-insensitive)
      for (const word1 of words1) {
        for (const word2 of words2) {
          // Exact word match (case-insensitive) - minimum 2 characters to avoid single letters
          if (word1 === word2 && word1.length >= 2) {
            return true;
          }
        }
      }

      // Check if one tag is contained in the other (e.g., "ST" in "ST-Building")
      // This handles cases where a shorter tag appears as a word in a longer tag
      if (norm1.length >= 2 && norm2.length >= 2) {
        // Check if the shorter tag appears as a complete word in the longer tag
        const shorter = norm1.length <= norm2.length ? norm1 : norm2;
        const longer = norm1.length > norm2.length ? norm1 : norm2;

        // Extract words from both
        const shorterWords = extractWords(shorter);
        const longerWords = extractWords(longer);

        // If shorter is a single word and it appears in longer's words, they're similar
        // e.g., "ST" (one word) appears in "ST-Building" (words: ["ST", "Building"])
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
        // e.g., "ST" is at the start of "ST-Building"
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
      // Check if this tag ends with "-Building" (case-insensitive)
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

  const getCompletionPercentage = () => {
    let completed = 0;
    const totalFields = 5; // incidentType, dateOfIncident, timeOfIncident, location, description

    if (formData.incidentType) completed++;
    if (formData.dateOfIncident) completed++;
    if (formData.timeOfIncident) completed++;
    if (formData.location || (formData.latitude && formData.longitude))
      completed++;
    if (formData.description) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  if (loading) {
    return (
      <div className="flex-1 flex bg-[#f8f8f8]">
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Navbar */}
          <div className="sticky top-0 z-30 flex-shrink-0">
            <Navbar
              title="Report an Incident"
              subtitle="Submit details about a security incident or concern"
              showSearch={false}
            />
          </div>

          {/* PageLoader - fills the remaining space below Navbar */}
          <PageLoader pageTitle="incident form" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-[#f8f8f8]">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <div className="sticky top-0 z-30 flex-shrink-0">
          <Navbar
            title="Report an Incident"
            subtitle="Submit details about a security incident or concern"
            showSearch={false}
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-[#f8f8f8]">
          <div className="px-6 py-10">
            {/* Progress Indicator */}
            <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-[#800000]/10 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-[#800000]" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#800000] mb-1">
                    Report an Incident
                  </h1>
                  <p className="text-gray-600">
                    Complete the form below to report a security incident. Your
                    report helps keep our campus safe.
                  </p>
                </div>
                <div className="md:ml-auto flex-shrink-0 bg-[#800000]/5 rounded-full px-4 py-2 flex items-center">
                  <div className="mr-2 text-sm font-medium text-[#800000]">
                    Completion:
                  </div>
                  <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#800000] rounded-full transition-all duration-500"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="ml-2 text-sm font-medium text-[#800000]">
                    {getCompletionPercentage()}%
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-full w-1/2 bg-[#800000] rounded-full"></div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#800000] text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                      1
                    </div>
                    <span className="text-sm font-medium text-[#800000]">
                      Incident Details
                    </span>
                  </div>

                  <div className="flex flex-col items-center opacity-50">
                    <div className="bg-gray-300 text-gray-600 rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                      2
                    </div>
                    <span className="text-sm text-gray-600">
                      Review & Submit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Note Card */}
            <div className="mb-8">
              <Card className="bg-[#FFF8E1] rounded-xl shadow-sm border border-[#D4AF37]/30 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#D4AF37]/20 p-2 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-1">
                        Important Note
                      </h3>
                      <p className="text-xs text-gray-600">
                        In case of an emergency or immediate danger, please
                        contact Campus Security directly at{" "}
                        <span className="font-medium text-[#800000]">
                          +1 (555) 123-4567
                        </span>{" "}
                        or call{" "}
                        <span className="font-medium text-[#800000]">911</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Incident Form */}
            <div className="space-y-6">
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="border-b border-gray-100">
                  <div className="flex items-center gap-2 p-6">
                    <FileText className="text-[#800000] h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Incident Information
                    </h2>
                  </div>
                </div>

                <form
                  id="incident-form"
                  onSubmit={handleSubmit}
                  className="p-6 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="incidentType"
                        className="text-sm font-medium flex items-center"
                      >
                        Incident Title{" "}
                        <span className="text-[#800000] ml-1">*</span>
                        <div className="flex items-center ml-1.5">
                          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500 ml-1.5">
                            Provide a brief, descriptive title that summarizes
                            the incident (e.g., "Broken Monitor in Computer
                            Lab", "Theft of Personal Belongings").
                          </span>
                        </div>
                      </Label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                        <Input
                          id="incidentType"
                          name="incidentType"
                          placeholder="E.g., Broken Monitor in Computer Lab, Theft of Personal Belongings"
                          value={formData.incidentType}
                          onChange={handleInputChange}
                          className={`pl-10 border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg ${
                            formErrors.incidentType
                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                              : ""
                          }`}
                        />
                      </div>
                      {formErrors.incidentType && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.incidentType}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="dateOfIncident"
                          className="text-sm font-medium flex items-center"
                        >
                          Date of Incident{" "}
                          <span className="text-[#800000] ml-1">*</span>
                        </Label>
                        <div className="space-y-2">
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                            <Input
                              id="dateOfIncident"
                              type="date"
                              name="dateOfIncident"
                              value={formData.dateOfIncident}
                              onChange={handleInputChange}
                              max={getLocalDateString()}
                              className={`pl-10 border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg ${
                                formErrors.dateOfIncident
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                  : ""
                              }`}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleUseCurrentDate}
                            variant="outline"
                            size="sm"
                            className="w-full border-[#800000]/30 text-[#800000] hover:bg-[#800000] hover:text-white flex items-center gap-2"
                          >
                            <Clock className="h-3 w-3" />
                            Use Current Date
                          </Button>
                        </div>
                        {formErrors.dateOfIncident && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {formErrors.dateOfIncident}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="timeOfIncident"
                          className="text-sm font-medium flex items-center"
                        >
                          Time of Incident{" "}
                          <span className="text-[#800000] ml-1">*</span>
                        </Label>
                        <div className="space-y-2">
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                            <Input
                              id="timeOfIncident"
                              type="time"
                              name="timeOfIncident"
                              value={formData.timeOfIncident}
                              onChange={handleInputChange}
                              className={`pl-10 border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg ${
                                formErrors.timeOfIncident
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                  : ""
                              }`}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleUseCurrentTime}
                            variant="outline"
                            size="sm"
                            className="w-full border-[#800000]/30 text-[#800000] hover:bg-[#800000] hover:text-white flex items-center gap-2"
                          >
                            <Clock className="h-3 w-3" />
                            Use Current Time
                          </Button>
                        </div>
                        {formErrors.timeOfIncident && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {formErrors.timeOfIncident}
                          </p>
                        )}
                      </div>
                    </div>

                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={
                        formData.latitude && formData.longitude
                          ? {
                              latitude: formData.latitude,
                              longitude: formData.longitude,
                              formattedAddress: formData.formattedAddress,
                              building: formData.building,
                              buildingName: formData.buildingName,
                              buildingCode: formData.buildingCode,
                              room: formData.room,
                            }
                          : undefined
                      }
                      required={true}
                      className="space-y-2"
                    />
                    {formErrors.location && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.location}
                      </p>
                    )}
                  </div>
                </form>
              </Card>

              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="border-b border-gray-100">
                  <div className="flex items-center gap-2 p-6">
                    <FileText className="text-[#800000] h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Incident Description
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium flex items-center"
                    >
                      Description <span className="text-[#800000] ml-1">*</span>
                      <div className="flex items-center ml-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 ml-1.5">
                          Provide a detailed account of what happened, including
                          any relevant context
                        </span>
                      </div>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe what happened in detail. Include who was involved, what occurred, and any other relevant information."
                      value={formData.description}
                      onChange={handleInputChange}
                      onBlur={handleDescriptionBlur}
                      className={`min-h-[150px] border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg resize-none ${
                        formErrors.description
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : ""
                      }`}
                    />
                    <div className="flex justify-between items-center">
                      <div
                        className={`text-xs ${
                          formData.description.length > 1000
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {formData.description.length}/1000 characters
                      </div>
                      {formErrors.description && (
                        <p className="text-red-500 text-xs flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      {(() => {
                        const hasExistingTags =
                          tags.length > 0 || formData.allTags.length > 0;
                        const isRegenerating = hasExistingTags;

                        return (
                          <Button
                            type="button"
                            onClick={handleGenerateTags}
                            className={`${
                              isRegenerating
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                                : "bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white"
                            } rounded-full px-4 py-2 h-10 flex items-center gap-2 ${
                              tagsLoading ||
                              !formData.description ||
                              !formData.location
                                ? "opacity-70 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={
                              tagsLoading ||
                              !formData.description ||
                              !formData.location
                            }
                          >
                            {tagsLoading ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                <span>
                                  {isRegenerating
                                    ? "Regenerating Tags..."
                                    : "Generating Tags..."}
                                </span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                <span>
                                  {isRegenerating
                                    ? "Regenerate Tags"
                                    : "Generate Tags with AI"}
                                </span>
                              </>
                            )}
                          </Button>
                        );
                      })()}

                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Info className="h-4 w-4 text-[#800000]/70" />
                        <span>
                          AI will generate all relevant tags based on your
                          description and location.
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isGeneratingTags && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mb-4"
                        >
                          <div className="bg-[#800000]/5 rounded-lg p-4 border border-[#800000]/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-[#800000]" />
                              <p className="text-sm font-medium text-[#800000]">
                                AI is analyzing your description...
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"
                                ></div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {tagsError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{tagsError}</span>
                      </div>
                    )}

                    {(tags.length > 0 || formData.allTags.length > 0) &&
                      (() => {
                        const allGeneratedTags =
                          tags.length > 0 ? tags : formData.allTags;
                        // Use stored display tags from formData, or calculate if not available
                        const displayTags =
                          formData.tags && formData.tags.length > 0
                            ? formData.tags
                            : selectDisplayTags(allGeneratedTags);

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4"
                          >
                            <div className="bg-[#800000]/5 rounded-lg p-4 border border-[#800000]/10">
                              <div className="flex items-center gap-2 mb-3">
                                <Tag className="h-4 w-4 text-[#800000]" />
                                <p className="text-sm font-medium text-[#800000]">
                                  Generated Tags
                                </p>
                                <span className="text-xs text-gray-500">
                                  ({displayTags.length} of{" "}
                                  {allGeneratedTags.length} tags displayed)
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {displayTags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="default"
                                    className="select-none px-3 py-1 text-sm bg-[#800000] text-white"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                Showing up to 5 unique tags. All{" "}
                                {allGeneratedTags.length} generated tags will be
                                saved.
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}

                    {/* Evidence Guidelines Card */}
                    <div className="mb-6">
                      <Card className="bg-[#FFF8E1] rounded-xl shadow-sm border border-[#D4AF37]/30 overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start gap-3">
                            <div className="bg-[#D4AF37]/20 p-2 rounded-full">
                              <Info className="h-5 w-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-800 mb-1">
                                Evidence Guidelines
                              </h3>
                              <p className="text-xs text-gray-600">
                                Please provide any evidence that can help in the
                                investigation. This can include photos, videos,
                                or documents. You can also add information about
                                witnesses who saw the incident. At least one
                                piece of evidence (files or witness information)
                                is required.
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Evidence Upload Section */}
                    <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden mb-6">
                      <div className="border-b border-gray-100">
                        <div className="flex items-center gap-2 p-6">
                          <Camera className="text-[#800000] h-5 w-5" />
                          <h2 className="text-lg font-semibold text-gray-800">
                            Evidence Upload
                          </h2>
                        </div>
                      </div>

                      <div className="p-6">
                        <div
                          className={`border-2 ${
                            isDragging
                              ? "border-[#800000]"
                              : "border-dashed border-gray-300"
                          } rounded-xl p-8 text-center transition-all duration-200 ${
                            isDragging ? "bg-[#800000]/5" : "bg-gray-50"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            ref={fileInputRef}
                            accept="image/*,video/*"
                          />
                          <Label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <div className="mb-4 p-4 bg-[#800000]/10 rounded-full">
                              <Upload className="h-8 w-8 text-[#800000]" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">
                              Drag & Drop Files Here
                            </h3>
                            <p className="text-gray-500 mb-4">or</p>
                            <Button
                              type="button"
                              className="bg-[#800000] hover:bg-[#800000]/90 text-white rounded-full"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Browse Files
                            </Button>
                            <p className="text-xs text-gray-500 mt-4">
                              Supports JPG, PNG, MP4 (Max 10MB each)
                            </p>
                          </Label>
                        </div>

                        {/* Uploaded Files */}
                        <AnimatePresence>
                          {evidenceData.fileInfos.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-8"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-medium text-gray-700 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-[#800000]" />
                                  Uploaded Evidence (
                                  {evidenceData.fileInfos.length})
                                </h3>
                                {evidenceData.fileInfos.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 border-gray-200 text-gray-600 hover:text-[#800000] hover:border-[#800000]/20"
                                    onClick={() => {
                                      fileInputRef.current?.click();
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add More
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {evidenceData.fileInfos.map((file, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative group rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="absolute top-2 right-2 z-10">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => handleRemoveFile(index)}
                                        className="h-7 w-7 rounded-full bg-[#800000]/80 hover:bg-[#800000] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    {file.type.startsWith("image/") ? (
                                      <div
                                        className="relative aspect-square cursor-pointer"
                                        onClick={() => {
                                          setSelectedImage({
                                            src: file.data,
                                            name: file.name,
                                          });
                                          setShowImagePreview(true);
                                        }}
                                      >
                                        <Image
                                          src={file.data || "/placeholder.svg"}
                                          alt={file.name}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    ) : file.type.startsWith("video/") ? (
                                      <div className="relative aspect-video bg-black">
                                        <video
                                          src={file.data}
                                          controls
                                          className="w-full h-full"
                                        />
                                      </div>
                                    ) : (
                                      <div className="aspect-square flex items-center justify-center bg-gray-100">
                                        <FileText className="h-16 w-16 text-gray-400" />
                                      </div>
                                    )}

                                    <div className="p-3 border-t border-gray-100">
                                      <div className="flex items-start gap-2">
                                        {getFileIcon(file.type)}
                                        <div className="min-w-0 flex-1">
                                          <p
                                            className="text-sm font-medium text-gray-700 truncate"
                                            title={file.name}
                                          >
                                            {file.name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>

                    {/* Witness Information Section */}
                    <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden mb-6">
                      <div className="border-b border-gray-100">
                        <div className="flex items-center justify-between p-6">
                          <div className="flex items-center gap-2">
                            <User className="text-[#800000] h-5 w-5" />
                            <h2 className="text-lg font-semibold text-gray-800">
                              Witness Information (Optional)
                            </h2>
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddWitness}
                            className="bg-[#800000] hover:bg-[#800000]/90 text-white rounded-full px-4 h-9 flex items-center gap-1.5"
                          >
                            <Plus className="h-4 w-4" />
                            Add Witness
                          </Button>
                        </div>
                      </div>

                      <div className="p-6">
                        <AnimatePresence>
                          {evidenceData.witnesses.length > 0 ? (
                            <div className="space-y-4">
                              {evidenceData.witnesses.map((witness, index) => (
                                <motion.div
                                  key={index}
                                  id={`witness-${index}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{
                                    opacity: 0,
                                    height: 0,
                                    overflow: "hidden",
                                  }}
                                  transition={{ duration: 0.3 }}
                                  className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                                >
                                  <div
                                    className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
                                    onClick={() =>
                                      setExpandedWitness(
                                        expandedWitness === index ? null : index
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="bg-[#800000]/10 p-2 rounded-full">
                                        <User className="h-5 w-5 text-[#800000]" />
                                      </div>
                                      <div>
                                        <h3 className="font-medium text-gray-800">
                                          {witness.name
                                            ? witness.name
                                            : `Witness #${index + 1}`}
                                        </h3>
                                        {witness.contactInformation && (
                                          <p className="text-xs text-gray-500">
                                            {witness.contactInformation}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveWitness(index);
                                        }}
                                        className="h-8 w-8 p-0 text-gray-500 hover:text-[#800000] hover:bg-[#800000]/10 rounded-full"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      {expandedWitness === index ? (
                                        <ChevronUp className="h-5 w-5 text-gray-500" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-500" />
                                      )}
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {expandedWitness === index && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <div className="p-4 space-y-4">
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                              <User className="h-3.5 w-3.5 text-[#800000]/70" />
                                              Witness
                                            </Label>
                                            <ClientMultiUserMentionInput
                                              selectedUsers={
                                                witness.users || []
                                              }
                                              onUsersChange={(users) => {
                                                const updatedWitnesses = [
                                                  ...evidenceData.witnesses,
                                                ];
                                                updatedWitnesses[index] = {
                                                  ...updatedWitnesses[index],
                                                  users: users,
                                                  name:
                                                    users.length > 0
                                                      ? users[0].fullName
                                                      : "",
                                                  contactInformation:
                                                    users.length > 0
                                                      ? users[0].email
                                                      : "",
                                                };
                                                setEvidenceData((prev) => ({
                                                  ...prev,
                                                  witnesses: updatedWitnesses,
                                                }));
                                              }}
                                              placeholder="Type @ to mention a witness"
                                              maxUsers={1}
                                              className="border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20"
                                            />
                                          </div>

                                          {witness.users &&
                                            witness.users.length > 0 && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium flex items-center gap-1.5">
                                                  <Phone className="h-3.5 w-3.5 text-[#800000]/70" />
                                                  Contact Information
                                                </Label>
                                                <div className="flex items-center p-2 border border-gray-200 rounded-md bg-gray-50">
                                                  <span className="text-gray-600">
                                                    {witness.users[0].email}
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                          <div className="space-y-2">
                                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                              <PenLine className="h-3.5 w-3.5 text-[#800000]/70" />
                                              Additional Notes
                                            </Label>
                                            <Textarea
                                              value={witness.additionalNotes}
                                              onChange={(e) =>
                                                handleWitnessChange(
                                                  index,
                                                  "additionalNotes",
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Describe what the witness observed"
                                              className="min-h-[100px] border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 resize-none"
                                            />
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                              <div className="mb-3 bg-[#800000]/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                                <User className="h-8 w-8 text-[#800000]" />
                              </div>
                              <h3 className="text-base font-medium text-gray-700 mb-2">
                                No Witnesses Added
                              </h3>
                              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                                If anyone witnessed the incident, add their
                                information to help with the investigation.
                              </p>
                              <Button
                                type="button"
                                onClick={handleAddWitness}
                                className="bg-[#800000] hover:bg-[#800000]/90 text-white rounded-full px-4"
                              >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add a Witness
                              </Button>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-between pt-6 border-t border-gray-100 mt-6">
                      <Button
                        type="button"
                        onClick={handleReset}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset Form
                      </Button>

                      <Button
                        type="submit"
                        form="incident-form"
                        className="bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white rounded-full px-6 flex items-center gap-2"
                      >
                        Continue to Review
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {fileToDelete !== null ? "Remove File" : "Remove Witness"}
            </DialogTitle>
            <DialogDescription>
              {fileToDelete !== null
                ? "Are you sure you want to remove this file? This action cannot be undone."
                : "Are you sure you want to remove this witness? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setFileToDelete(null);
                setWitnessToDelete(null);
                setShowDeleteDialog(false);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (fileToDelete !== null) {
                  confirmDeleteFile();
                } else if (witnessToDelete !== null) {
                  confirmDeleteWitness();
                }
              }}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#800000]">
              <HelpCircle size={20} /> Need Help?
            </DialogTitle>
            <DialogDescription>
              Here are some tips to help you complete your incident report
              effectively.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-800 mb-3">
                  Reporting Tips
                </h3>
                <ul className="space-y-3">
                  {[
                    {
                      icon: <MapPin size={16} />,
                      text: "Be as specific as possible about the location",
                    },
                    {
                      icon: <Clock size={16} />,
                      text: "Include time details even if approximate",
                    },
                    {
                      icon: <FileText size={16} />,
                      text: "Photos and videos help security respond effectively",
                    },
                    {
                      icon: <AlertTriangle size={16} />,
                      text: "Mention any witnesses who can provide additional information",
                    },
                  ].map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <div className="mt-0.5 bg-[#800000]/10 p-1.5 rounded-full text-[#800000]">
                        {tip.icon}
                      </div>
                      <span>{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowHelpDialog(false)}
              className="bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#800000]" />
              {selectedImage?.name || "Image Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center min-h-[400px]">
            {selectedImage && (
              <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 flex-shrink-0">
            <Button
              onClick={() => setShowImagePreview(false)}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the form? All entered data will be
              lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReset}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              Reset Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
