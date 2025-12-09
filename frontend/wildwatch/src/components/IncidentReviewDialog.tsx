"use client";

import { useState, useEffect, useRef, type JSX } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  User,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Tag,
  CheckCircle,
  XCircleIcon,
  ArrowRightLeft,
  Info,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/utils/api";
import { formatLocationDisplay } from "@/utils/locationFormatter";
import { api } from "@/utils/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDateOnly, parseUTCDate, formatTime } from "@/utils/dateUtils";

function getEstimatedResolution(
  submittedAt: string,
  priority: string | null,
  extendedDate?: string
) {
  if (extendedDate) {
    return parseUTCDate(extendedDate);
  }
  if (!priority) {
    return null;
  }
  const base = parseUTCDate(submittedAt);
  let days = 2;
  if (priority === "MEDIUM") days = 3;
  if (priority === "HIGH") days = 5;
  base.setDate(base.getDate() + days);
  return base;
}

interface Witness {
  id: string;
  name: string;
  contactInformation: string;
  additionalNotes: string;
}

interface Evidence {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface Incident {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  assignedOffice: string;
  status: string;
  priorityLevel: string | null;
  submittedBy: string;
  submittedAt: string;
  witnesses: Witness[];
  evidence: Evidence[];
  administrativeNotes: string;
  verified: boolean;
  verificationNotes: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  submittedByFullName: string;
  submittedByIdNumber: string;
  submittedByEmail: string;
  submittedByPhone: string;
  preferAnonymous?: boolean;
  isPrivate?: boolean;
  isIncident?: boolean;
  estimatedResolutionDate?: string;
}

const formatDateSafe = (dateString: string | null | undefined) => {
  if (!dateString) return "Not specified";
  try {
    const formatted = formatDateOnly(dateString);
    if (!formatted || formatted.toLowerCase().includes("invalid")) {
      return "Not specified";
    }
    return formatted;
  } catch {
    return "Not specified";
  }
};

// Format time string (HH:mm or HH:mm:ss) to 12-hour format
const formatTimeTo12Hour = (timeString: string | null | undefined) => {
  if (!timeString) return "Not specified";
  try {
    // Handle formats like "14:30" or "14:30:00"
    const timeParts = timeString.trim().split(":");
    if (timeParts.length < 2) return timeString;

    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const seconds = timeParts[2] || "";

    if (isNaN(hours) || hours < 0 || hours > 23) return timeString;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours}:${minutes}${
      seconds ? `:${seconds}` : ""
    } ${period}`;
  } catch {
    return timeString;
  }
};

interface IncidentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string | null;
  onRefresh?: () => void;
}

export function IncidentReviewDialog({
  open,
  onOpenChange,
  incidentId,
  onRefresh,
}: IncidentReviewDialogProps) {
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [administrativeNotes, setAdministrativeNotes] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState("");
  const [priorityLevel, setPriorityLevel] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    icon: JSX.Element;
    color: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferNotes, setTransferNotes] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [offices, setOffices] = useState<
    { code: string; fullName: string; description: string }[]
  >([]);
  const [officesLoading, setOfficesLoading] = useState(false);
  const [officesError, setOfficesError] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [officeSearchQuery, setOfficeSearchQuery] = useState("");
  const [isIncidentTag, setIsIncidentTag] = useState<boolean>(true);
  const countdownIntervalRef = useState<NodeJS.Timeout | null>(null)[0];
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && incidentId) {
      fetchIncident();
    } else {
      // Reset state when dialog closes
      setIncident(null);
      setError(null);
      setAdministrativeNotes("");
      setVerificationNotes("");
      setIsVerified(false);
      setStatus("");
      setPriorityLevel(null);
    }
  }, [open, incidentId]);

  useEffect(() => {
    if (countdown === 0 && showModal) {
      onOpenChange(false);
      if (onRefresh) onRefresh();
      if (countdownIntervalRef) {
        clearInterval(countdownIntervalRef);
      }
    }
  }, [countdown, showModal, onOpenChange, onRefresh]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef) {
        clearInterval(countdownIntervalRef);
      }
    };
  }, []);

  useEffect(() => {
    if (showTransferModal) {
      setOfficesLoading(true);
      setOfficeSearchQuery("");
      fetch(`${API_BASE_URL}/api/offices`)
        .then((res) => res.json())
        .then(
          (data: { code: string; fullName: string; description: string }[]) => {
            setOffices(data);
            setOfficesLoading(false);
          }
        )
        .catch((err: Error) => {
          setOfficesError("Failed to load offices");
          setOfficesLoading(false);
        });
    } else {
      setOfficeSearchQuery("");
    }
  }, [showTransferModal]);

  const fetchIncident = async () => {
    if (!incidentId) return;
    setLoading(true);
    setError(null);
    try {
      let response = await api.get(`/api/incidents/${incidentId}`);
      if (!response.ok && response.status === 404) {
        response = await api.get(`/api/incidents/track/${incidentId}`);
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Incident & {
        prefer_anonymous?: boolean;
        is_private?: boolean;
      } = await response.json();
      setIncident(data);
      setAdministrativeNotes(data.administrativeNotes || "");
      setIsIncidentTag(data.isIncident !== false);
      setVerificationNotes(data.verificationNotes || "");
      setIsVerified(data.verified);
      setStatus("In Progress"); // Automatically set to In Progress
      setPriorityLevel(data.priorityLevel);
      setIsAnonymous(false);
      const initialPrivate =
        (data as any).isPrivate ?? (data as any).is_private ?? false;
      setIsPrivate(!!initialPrivate);
    } catch (err) {
      console.error("Error fetching incident:", err);
      setError(err instanceof Error ? err.message : "Failed to load incident");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveIncident = async () => {
    if (!incidentId) return;
    if (!isVerified) {
      setVerifyError("You must confirm this incident has been verified.");
      return;
    }
    setVerifyError("");
    if (!status) {
      setStatusError("Please select a status before approving.");
      return;
    }
    setStatusError("");
    if (!priorityLevel) {
      setPriorityError("Please select a priority before approving.");
      return;
    }
    setPriorityError("");
    setIsProcessing(true);
    try {
      const estimatedResolutionDate =
        incident && priorityLevel
          ? getEstimatedResolution(
              incident.submittedAt || incident.dateOfIncident,
              priorityLevel,
              incident.estimatedResolutionDate
            )?.toISOString()
          : undefined;

      const response = await api.put(`/api/incidents/${incidentId}`, {
        administrativeNotes,
        verified: true,
        verificationNotes,
        status: "In Progress",
        priorityLevel,
        preferAnonymous: isAnonymous,
        isPrivate: isPrivate,
        isIncident: isIncidentTag,
        estimatedResolutionDate,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedIncident = await response.json();
      setIncident(updatedIncident);

      // Show success toast
      toast.success("Incident verified successfully", {
        description:
          "The incident has been verified and is now being processed.",
      });

      // Close dialog and refresh incidents list
      onOpenChange(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error approving incident:", error);
      setModalContent({
        title: "Error",
        message: "Failed to verify incident. Please try again.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      });
      setShowModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismissIncident = async () => {
    if (!incidentId) return;
    setIsProcessing(true);
    try {
      const response = await api.put(`/api/incidents/${incidentId}`, {
        administrativeNotes,
        verified: false,
        verificationNotes,
        status: "Dismissed",
        priorityLevel: null,
        preferAnonymous: isAnonymous,
        isPrivate: isPrivate,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedIncident = await response.json();
      setIncident(updatedIncident);

      setModalContent({
        title: "Incident Dismissed",
        message: "The incident has been successfully dismissed.",
        icon: <XCircleIcon className="h-12 w-12 text-gray-500" />,
        color: "bg-gray-50 border-gray-200",
      });
      setShowModal(true);
      setCountdown(3);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error dismissing incident:", error);
      setModalContent({
        title: "Error",
        message: "Failed to dismiss incident. Please try again.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      });
      setShowModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!incidentId) return;
    setIsProcessing(true);
    try {
      const estimatedResolutionDate =
        incident && priorityLevel
          ? getEstimatedResolution(
              incident.submittedAt || incident.dateOfIncident,
              priorityLevel,
              incident.estimatedResolutionDate
            )?.toISOString()
          : undefined;

      const response = await api.put(`/api/incidents/${incidentId}`, {
        administrativeNotes,
        verified: isVerified,
        verificationNotes,
        status,
        priorityLevel,
        preferAnonymous: isAnonymous,
        isPrivate: isPrivate,
        estimatedResolutionDate,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedIncident = await response.json();
      setIncident(updatedIncident);

      setModalContent({
        title: "Status Updated",
        message: `The incident status has been successfully updated to ${status}.`,
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        color: "bg-green-50 border-green-200",
      });
      setShowModal(true);
      setCountdown(3);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error updating incident status:", error);
      setModalContent({
        title: "Error",
        message: "Failed to update incident status. Please try again.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      });
      setShowModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!incidentId) return;
    if (!selectedOffice) {
      setModalContent({
        title: "Error",
        message: "Please select an office to transfer to.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      });
      setShowModal(true);
      return;
    }

    setIsTransferring(true);
    try {
      const response = await api.post(`/api/incidents/${incidentId}/transfer`, {
        newOffice: selectedOffice,
        transferNotes: transferNotes,
        preferAnonymous: isAnonymous,
        isPrivate: isPrivate,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIncident(data);
      setShowTransferModal(false);
      setTransferNotes("");
      setSelectedOffice("");

      setModalContent({
        title: "Success",
        message: "Incident has been transferred successfully.",
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        color: "bg-green-50 border-green-200",
      });
      setShowModal(true);
      setCountdown(3);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error transferring incident:", error);
      setModalContent({
        title: "Error",
        message: "Failed to transfer incident. Please try again.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      });
      setShowModal(true);
    } finally {
      setIsTransferring(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-700 border-orange-200"
          >
            Pending
          </Badge>
        );
      case "In Progress":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-200"
          >
            In Progress
          </Badge>
        );
      case "Resolved":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-700 border-green-200"
          >
            Resolved
          </Badge>
        );
      case "Dismissed":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-700 border-red-200"
          >
            Dismissed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    switch (priority) {
      case "LOW":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-200"
          >
            Low Priority
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-700 border-orange-200"
          >
            Medium Priority
          </Badge>
        );
      case "HIGH":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-700 border-red-200"
          >
            High Priority
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[75vw] h-[85vh] max-w-none max-h-none flex flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl font-bold text-[#8B0000]">
                  Review Incident
                </DialogTitle>
                {incident && (
                  <>
                    {getStatusBadge(incident.status)}
                    {getPriorityBadge(incident.priorityLevel)}
                    {isAnonymous && (
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-800 border-amber-200"
                      >
                        Anonymous
                      </Badge>
                    )}
                    {isPrivate && (
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-800 border-purple-200"
                      >
                        Private
                      </Badge>
                    )}
                    {incidentId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `/office-admin/incidents/${incidentId}`,
                            "_blank"
                          );
                        }}
                        className="h-7 px-2 text-[#8B0000] hover:bg-[#8B0000]/10 hover:text-[#8B0000]"
                        aria-label="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
              {incident && (
                <Button
                  variant="outline"
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center gap-2 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer Case
                </Button>
              )}
            </div>
            {incident && (
              <p className="text-gray-500 mt-2">
                Case #{incident.trackingNumber} • {incident.incidentType}
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B0000] border-r-transparent mb-4"></div>
                  <p className="text-gray-600">Loading incident details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Error Loading Incident
                      </h3>
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : incident ? (
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Main content - takes up 2/3 of the space */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Incident Summary Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-[#8B0000] via-[#9a0000] to-[#8B0000] text-white p-6 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#DAA520]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white/80 text-sm mb-1">
                                Incident Report
                              </p>
                              <h2 className="text-xl font-semibold">
                                {incident.incidentType}
                              </h2>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="text-white/80 text-sm">Reported</p>
                              <p className="font-medium">
                                {formatDateSafe(incident.submittedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4 mb-6">
                          {/* Date and Time Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                                <Calendar className="h-5 w-5 text-[#8B0000]" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Date of Incident
                                </p>
                                <p className="font-medium">
                                  {formatDateSafe(incident.dateOfIncident)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                                <Clock className="h-5 w-5 text-[#8B0000]" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Time of Incident
                                </p>
                                <p className="font-medium">
                                  {formatTimeTo12Hour(incident.timeOfIncident)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Location Row */}
                          <div className="flex items-start gap-3">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                              <MapPin className="h-5 w-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Location</p>
                              <p className="font-medium">
                                {formatLocationDisplay(incident)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <div>
                          <h3 className="text-lg font-medium text-[#8B0000] mb-3">
                            Description
                          </h3>
                          <p className="text-gray-700 whitespace-pre-line">
                            {incident.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Evidence & Witnesses */}
                    <Tabs defaultValue="evidence" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="evidence"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Evidence
                        </TabsTrigger>
                        <TabsTrigger
                          value="witnesses"
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          Witnesses
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="evidence" className="mt-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                        >
                          <div className="p-6">
                            {incident.evidence &&
                            incident.evidence.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {incident.evidence.map((file, index) => (
                                  <motion.div
                                    key={file.id}
                                    className="group relative"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.2,
                                      delay: index * 0.05,
                                    }}
                                  >
                                    {file.fileType.startsWith("image/") ? (
                                      <div
                                        className="relative aspect-square rounded-lg overflow-hidden border border-[#DAA520]/20 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => {
                                          setPreviewImage(file.fileUrl);
                                          setPreviewImageName(file.fileName);
                                        }}
                                      >
                                        <Image
                                          src={
                                            file.fileUrl || "/placeholder.svg"
                                          }
                                          alt={file.fileName}
                                          fill
                                          style={{ objectFit: "cover" }}
                                          unoptimized
                                          className="transition-transform group-hover:scale-105"
                                        />
                                      </div>
                                    ) : file.fileType.startsWith("video/") ? (
                                      <div className="relative aspect-video rounded-lg overflow-hidden border border-[#DAA520]/20 shadow-sm group-hover:shadow-md transition-shadow">
                                        <video
                                          src={file.fileUrl}
                                          controls
                                          className="w-full h-full"
                                        />
                                      </div>
                                    ) : (
                                      <div className="relative aspect-square rounded-lg overflow-hidden border border-[#DAA520]/20 shadow-sm group-hover:shadow-md transition-shadow bg-[#8B0000]/5 flex items-center justify-center">
                                        <FileText className="h-12 w-12 text-[#8B0000]" />
                                      </div>
                                    )}
                                    <div className="mt-2">
                                      <p className="text-sm font-medium text-[#8B0000] truncate">
                                        {file.fileName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(file.fileSize / 1024 / 1024).toFixed(
                                          2
                                        )}{" "}
                                        MB • {formatDateOnly(file.uploadedAt)}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-[#8B0000]/30 mx-auto mb-3" />
                                <p className="text-gray-500">
                                  No evidence files have been uploaded
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </TabsContent>
                      <TabsContent value="witnesses" className="mt-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                        >
                          <div className="p-6">
                            {incident.witnesses &&
                            incident.witnesses.length > 0 ? (
                              <div className="space-y-4">
                                {incident.witnesses.map((witness, index) => (
                                  <motion.div
                                    key={witness.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.2,
                                      delay: index * 0.05,
                                    }}
                                    className="bg-white rounded-lg border border-[#DAA520]/20 overflow-hidden hover:border-[#DAA520]/40 transition-colors"
                                  >
                                    <div className="bg-[#8B0000]/5 p-4 border-b border-[#DAA520]/20">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[#8B0000]/10 flex items-center justify-center">
                                          <User className="h-5 w-5 text-[#8B0000]" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-[#8B0000]">
                                            {witness.name}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {witness.contactInformation}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-4">
                                      <p className="text-gray-700 whitespace-pre-line">
                                        {witness.additionalNotes}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <User className="h-12 w-12 text-[#8B0000]/30 mx-auto mb-3" />
                                <p className="text-gray-500">
                                  No witness information available
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Right sidebar - takes up 1/3 of the space */}
                  <div className="space-y-6">
                    {/* Administrative Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#DAA520]/20">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                            <Shield className="h-5 w-5 text-[#8B0000]" />
                          </div>
                          <h2 className="text-lg font-semibold text-[#8B0000]">
                            Administrative Actions
                          </h2>
                        </div>
                      </div>
                      <div className="p-4">
                        {/* Status */}
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-[#8B0000]">
                            Status <span className="text-red-600">*</span>
                          </Label>
                          <select
                            value={status}
                            onChange={(e) => {
                              setStatus(e.target.value);
                              setStatusError("");
                            }}
                            className={`w-full mt-1 px-3 py-2 border border-[#DAA520]/20 rounded-md bg-white focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all ${
                              statusError ? "border-red-500" : ""
                            }`}
                            required
                          >
                            <option value="">Select Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Dismissed">Dismissed</option>
                          </select>
                          {statusError && (
                            <div className="text-red-600 text-xs mt-1">
                              {statusError}
                            </div>
                          )}
                        </div>

                        {/* Priority Level */}
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-[#8B0000]">
                            Set Priority <span className="text-red-600">*</span>
                          </Label>
                          <select
                            value={priorityLevel || ""}
                            onChange={(e) => {
                              setPriorityLevel(e.target.value || null);
                              setPriorityError("");
                            }}
                            className={`w-full mt-1 px-3 py-2 border border-[#DAA520]/20 rounded-md bg-white focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all ${
                              priorityError ? "border-red-500" : ""
                            }`}
                            required
                          >
                            <option value="">Select Priority</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                          </select>
                          {priorityError && (
                            <div className="text-red-600 text-xs mt-1">
                              {priorityError}
                            </div>
                          )}
                        </div>

                        {/* Administrative Notes */}
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-[#8B0000]">
                            Administrative Notes
                          </Label>
                          <Textarea
                            value={administrativeNotes}
                            onChange={(e) =>
                              setAdministrativeNotes(e.target.value)
                            }
                            placeholder="Add your notes about this incident..."
                            className="mt-1 min-h-[100px] border-[#DAA520]/20 focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                          />
                        </div>

                        {/* Reporter requested anonymity warning */}
                        {incident.preferAnonymous && (
                          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="font-medium">
                                Reporter requested anonymity
                              </p>
                              <p className="text-sm">
                                Treat this reporter's identity as private. Do
                                not disclose or share personally identifiable
                                details.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Anonymous */}
                        <div className="mb-4">
                          <label
                            htmlFor="is-anonymous"
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Switch
                              id="is-anonymous"
                              checked={isAnonymous}
                              onCheckedChange={(checked) =>
                                setIsAnonymous(checked)
                              }
                            />
                            <span className="text-sm font-medium text-[#8B0000]">
                              Mark this report as anonymous
                            </span>
                          </label>
                          <p className="text-xs text-gray-500 ml-9">
                            If enabled, this report will not be displayed in
                            public listings.
                          </p>
                        </div>

                        {/* Private */}
                        <div className="mb-4">
                          <label
                            htmlFor="is-private"
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Switch
                              id="is-private"
                              checked={isPrivate}
                              onCheckedChange={(checked) =>
                                setIsPrivate(checked)
                              }
                            />
                            <span className="text-sm font-medium text-[#8B0000]">
                              Mark this incident as private
                            </span>
                          </label>
                          <p className="text-xs text-gray-500 ml-9">
                            If enabled, this incident will be restricted to
                            authorized personnel only.
                          </p>
                        </div>

                        {/* Tag Report As */}
                        <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <Label className="text-sm font-medium text-[#8B0000] mb-3 block">
                            Tag the report as:
                          </Label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isIncidentTag}
                                onChange={(e) =>
                                  setIsIncidentTag(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-[#8B0000] focus:ring-[#8B0000]"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Incident
                              </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!isIncidentTag}
                                onChange={(e) =>
                                  setIsIncidentTag(!e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-[#8B0000] focus:ring-[#8B0000]"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Concern
                              </span>
                            </label>
                          </div>
                          {incident?.isIncident !== undefined && (
                            <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-xs text-blue-700">
                              <Info className="h-4 w-4 flex-shrink-0" />
                              <span>
                                AI suggests this is{" "}
                                {incident.isIncident
                                  ? "an incident"
                                  : "a concern"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Reporter Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#DAA520]/20">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                            <User className="h-5 w-5 text-[#8B0000]" />
                          </div>
                          <h2 className="text-lg font-semibold text-[#8B0000]">
                            Reporter Information
                          </h2>
                        </div>
                      </div>
                      <div className="p-4">
                        {isPrivate && (
                          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-800 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="font-medium">Private Incident</p>
                              <p className="text-sm">
                                This incident has been marked as private and is
                                restricted to authorized personnel only.
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                              <User className="h-5 w-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-medium text-[#8B0000]">
                                {incident.submittedByFullName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                              <Tag className="h-5 w-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">ID Number</p>
                              <p className="font-medium text-[#8B0000]">
                                {incident.submittedByIdNumber}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                              <Mail className="h-5 w-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium text-[#8B0000]">
                                {incident.submittedByEmail}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                              <Phone className="h-5 w-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="font-medium text-[#8B0000]">
                                {incident.submittedByPhone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                              <Calendar className="h-5 w-5 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Submission Date
                              </p>
                              <p className="font-medium text-[#8B0000]">
                                {formatDateSafe(incident.submittedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Verification */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#DAA520]/20">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-[#8B0000]" />
                          </div>
                          <h2 className="text-lg font-semibold text-[#8B0000]">
                            Verification
                          </h2>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-4 p-3 bg-[#8B0000]/5 rounded-md border border-[#DAA520]/20">
                          <input
                            type="checkbox"
                            id="verified"
                            checked={isVerified}
                            onChange={(e) => {
                              setIsVerified(e.target.checked);
                              setVerifyError("");
                            }}
                            className="h-4 w-4 rounded border-[#DAA520]/20 text-[#8B0000] focus:ring-[#8B0000]"
                          />
                          <Label
                            htmlFor="verified"
                            className="text-sm font-medium text-[#8B0000] cursor-pointer"
                          >
                            I confirm this incident has been verified{" "}
                            <span className="text-red-600">*</span>
                          </Label>
                        </div>
                        {verifyError && (
                          <div className="text-red-600 text-xs mb-2 ml-1">
                            {verifyError}
                          </div>
                        )}

                        <div className="mb-4">
                          <Label className="text-sm font-medium text-[#8B0000]">
                            Verification Notes
                          </Label>
                          <Textarea
                            value={verificationNotes}
                            onChange={(e) =>
                              setVerificationNotes(e.target.value)
                            }
                            placeholder="Add verification notes here..."
                            className="mt-1 min-h-[100px] border-[#DAA520]/20 focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                          />
                        </div>

                        {incident.verifiedBy && (
                          <div className="text-sm bg-[#8B0000]/5 text-[#8B0000] p-3 rounded-md border border-[#DAA520]/20 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5" />
                            <span>
                              Verified by {incident.verifiedBy} on{" "}
                              {incident.verifiedAt
                                ? formatDateSafe(incident.verifiedAt)
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        className="bg-[#8B0000] hover:bg-[#6B0000] text-white flex items-center gap-2"
                        onClick={handleApproveIncident}
                        disabled={
                          isProcessing ||
                          !priorityLevel ||
                          !isVerified ||
                          !status
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isProcessing ? "Processing..." : "Verify"}
                      </Button>
                      <Button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
                        onClick={handleDismissIncident}
                        disabled={isProcessing}
                        variant="outline"
                      >
                        <XCircle className="h-4 w-4" />
                        {isProcessing ? "Processing..." : "Dismiss"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      {incident && (
        <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
          <DialogContent className="max-w-[95vw] w-full sm:max-w-[90vw] md:max-w-[600px] lg:max-w-[650px] xl:max-w-[700px] max-h-[95vh] flex flex-col p-0 gap-0">
            <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-gray-100 px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                  <ArrowRightLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#8B0000] truncate">
                    Transfer Incident
                  </DialogTitle>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
                    Reassign this case to a different office
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-5 py-4 sm:py-5 px-4 sm:px-6 overflow-y-auto flex-1">
              {/* Current Assignment Info */}
              <div className="bg-gradient-to-br from-[#8B0000]/5 via-[#8B0000]/5 to-transparent rounded-lg sm:rounded-xl border border-[#DAA520]/30 p-3 sm:p-4 shadow-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-[#8B0000]/10 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#8B0000]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Currently Assigned To
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-[#8B0000] truncate">
                      {incident.assignedOffice}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      Case #{incident.trackingNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Arrow Visual */}
              <div className="flex items-center justify-center -my-1 sm:-my-2">
                <div className="bg-[#DAA520]/20 p-1.5 sm:p-2 rounded-full">
                  <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#8B0000]" />
                </div>
              </div>

              {/* Office Selection */}
              <div className="space-y-2 sm:space-y-2.5">
                <Label className="text-xs sm:text-sm font-semibold text-[#8B0000] flex items-center gap-1.5 sm:gap-2">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Select Destination Office
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedOffice}
                  onValueChange={setSelectedOffice}
                >
                  <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-[#DAA520]/30 focus:ring-1 focus:ring-[#8B0000]/15 focus:border-[#8B0000]/60 transition-all">
                    <SelectValue
                      placeholder={
                        officesLoading
                          ? "Loading offices..."
                          : "Choose an office to transfer to"
                      }
                    >
                      {selectedOffice
                        ? `${
                            offices.find((o) => o.code === selectedOffice)
                              ?.fullName
                          } (${selectedOffice})`
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="center"
                    sideOffset={8}
                    className="max-h-[min(calc(100vh-450px),200px)] sm:max-h-[min(calc(100vh-400px),220px)] md:max-h-[min(calc(100vh-360px),260px)] w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[min(420px,80vw)] sm:max-w-[min(520px,85vw)] md:max-w-[520px] p-1.5 sm:p-2 overflow-y-auto overflow-x-hidden z-[9999]"
                  >
                    {officesLoading ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-[#8B0000] border-r-transparent mb-2"></div>
                        <p>Loading offices...</p>
                      </div>
                    ) : officesError ? (
                      <div className="px-4 py-4 text-center text-red-500 flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {officesError}
                      </div>
                    ) : (
                      <>
                        {/* Search Input */}
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-2 mb-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search offices..."
                              value={officeSearchQuery}
                              onChange={(e) =>
                                setOfficeSearchQuery(e.target.value)
                              }
                              className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-[#DAA520]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8B0000]/15 focus:border-[#8B0000]/60 transition-all"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Offices List */}
                        <div className="space-y-0.5 sm:space-y-1 pr-0.5 sm:pr-1">
                          {(() => {
                            const filteredOffices = offices.filter(
                              (office) =>
                                office.code !== incident.assignedOffice &&
                                (officeSearchQuery === "" ||
                                  office.fullName
                                    .toLowerCase()
                                    .includes(
                                      officeSearchQuery.toLowerCase()
                                    ) ||
                                  office.code
                                    .toLowerCase()
                                    .includes(
                                      officeSearchQuery.toLowerCase()
                                    ) ||
                                  office.description
                                    .toLowerCase()
                                    .includes(officeSearchQuery.toLowerCase()))
                            );

                            if (filteredOffices.length === 0) {
                              return (
                                <div className="px-4 py-8 text-center text-gray-500">
                                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">No offices found</p>
                                  {officeSearchQuery && (
                                    <p className="text-xs mt-1">
                                      Try adjusting your search
                                    </p>
                                  )}
                                </div>
                              );
                            }

                            return filteredOffices.map((office) => (
                              <SelectItem
                                key={office.code}
                                value={office.code}
                                textValue={`${office.fullName} (${office.code})`}
                                className="py-2.5 sm:py-3.5 px-2 sm:px-3 cursor-pointer hover:bg-[#8B0000]/5 transition-colors group h-auto rounded-md sm:rounded-lg mb-0.5 sm:mb-1 last:mb-0 focus:bg-[#8B0000]/10 data-[highlighted]:bg-[#8B0000]/5"
                              >
                                <div className="flex items-start gap-2 sm:gap-3 w-full max-w-full">
                                  <div className="bg-[#8B0000]/10 p-1.5 sm:p-2 rounded-md sm:rounded-lg mt-0.5 group-hover:bg-[#8B0000]/20 transition-colors flex-shrink-0">
                                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8B0000]" />
                                  </div>
                                  <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                                    <div className="text-sm sm:text-base font-semibold text-[#8B0000] mb-1 sm:mb-1.5 break-words whitespace-normal">
                                      {office.fullName}{" "}
                                      <span className="font-normal text-gray-600 text-xs sm:text-sm">
                                        ({office.code})
                                      </span>
                                    </div>
                                    <div className="text-[10px] sm:text-[11px] text-gray-500 leading-[1.5] line-clamp-3 group-hover:text-gray-700 transition-colors whitespace-normal break-words overflow-hidden">
                                      {office.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ));
                          })()}
                        </div>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5">
                  <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span>
                    Only offices different from the current assignment are shown
                  </span>
                </p>
              </div>

              {/* Transfer Notes */}
              <div className="space-y-2 sm:space-y-2.5">
                <Label className="text-xs sm:text-sm font-semibold text-[#8B0000] flex items-center gap-1.5 sm:gap-2">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Transfer Reason & Notes
                </Label>
                <Textarea
                  placeholder="Explain why this case is being transferred (e.g., jurisdiction, expertise, workload distribution)..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows={3}
                  className="resize-none text-sm sm:text-base border-[#DAA520]/30 focus:ring-1 focus:ring-[#8B0000]/15 focus:border-[#8B0000]/60 transition-all"
                />
              </div>

              {/* Warning Notice */}
              {selectedOffice && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3"
                >
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-amber-900">
                      Confirm Transfer
                    </p>
                    <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5 sm:mt-1">
                      This action will immediately reassign the incident to{" "}
                      <span className="font-semibold break-words">
                        {
                          offices.find((o) => o.code === selectedOffice)
                            ?.fullName
                        }
                      </span>
                      . You will no longer have access to manage this case.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 sm:pt-4 pb-4 sm:pb-6 px-4 sm:px-6 border-t border-gray-100 flex-shrink-0 bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedOffice("");
                  setTransferNotes("");
                }}
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 h-9 sm:h-10 text-sm sm:text-base"
                disabled={isTransferring}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={isTransferring || !selectedOffice}
                className="w-full sm:w-auto bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#8B0000] text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-0 sm:min-w-[120px] md:min-w-[140px] h-9 sm:h-10 text-sm sm:text-base"
              >
                {isTransferring ? (
                  <>
                    <div className="inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                    <span className="text-sm sm:text-base">
                      Transferring...
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-sm sm:text-base">Transfer Case</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewImage(null);
            setPreviewImageName(null);
            setImageScale(1);
            setImageRotation(0);
            setImagePosition({ x: 0, y: 0 });
          }
        }}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 overflow-hidden bg-black/95 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Evidence Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center bg-black/95">
            {/* Control Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <button
                onClick={() =>
                  setImageScale((prev) => Math.max(prev - 0.25, 0.5))
                }
                className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-white text-sm font-medium min-w-[50px] text-center">
                {Math.round(imageScale * 100)}%
              </span>
              <button
                onClick={() =>
                  setImageScale((prev) => Math.min(prev + 0.25, 4))
                }
                className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-white/30 mx-1" />
              <button
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                aria-label="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setImageScale(1);
                  setImageRotation(0);
                  setImagePosition({ x: 0, y: 0 });
                }}
                className="p-2 rounded-md hover:bg-white/20 text-white transition-colors"
                aria-label="Reset"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setPreviewImage(null);
                setPreviewImageName(null);
                setImageScale(1);
                setImageRotation(0);
                setImagePosition({ x: 0, y: 0 });
              }}
              className="absolute top-4 right-4 z-50 rounded-full p-2 bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image Name */}
            {previewImage && (
              <div className="absolute bottom-4 left-4 z-50 bg-black/50 text-white px-3 py-1.5 rounded-md text-sm max-w-[200px] truncate">
                {previewImageName}
              </div>
            )}

            {/* Image Container with Zoom and Pan */}
            {previewImage && (
              <div
                ref={imageContainerRef}
                className="w-full h-full overflow-auto cursor-move"
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setImageScale((prev) =>
                    Math.max(0.5, Math.min(4, prev + delta))
                  );
                }}
                onMouseDown={(e) => {
                  if (imageScale > 1) {
                    setIsDragging(true);
                    setDragStart({
                      x: e.clientX - imagePosition.x,
                      y: e.clientY - imagePosition.y,
                    });
                  }
                }}
                onMouseMove={(e) => {
                  if (isDragging && imageScale > 1) {
                    setImagePosition({
                      x: e.clientX - dragStart.x,
                      y: e.clientY - dragStart.y,
                    });
                  }
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                style={{
                  cursor:
                    imageScale > 1
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                }}
              >
                <div
                  className="flex items-center justify-center min-h-full p-4"
                  style={{
                    transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  }}
                >
                  <img
                    src={previewImage || ""}
                    alt={previewImageName || "Evidence preview"}
                    className="object-contain rounded-lg transition-transform duration-200"
                    style={{
                      transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                      maxWidth: "90vw",
                      maxHeight: "90vh",
                    }}
                    draggable={false}
                    onClick={(e) => {
                      if (imageScale <= 1) {
                        e.stopPropagation();
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success/Error Modal */}
      {showModal && modalContent && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div
            className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${modalContent.color} animate-in fade-in zoom-in duration-300`}
          >
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                {modalContent.icon}
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {modalContent.title}
                </h3>
                <p className="mt-2 text-gray-600">{modalContent.message}</p>
                <div className="mt-4 text-sm text-gray-500">
                  Closing dialog in{" "}
                  <span className="font-bold text-[#8B0000]">{countdown}</span>{" "}
                  seconds...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
