"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  ChevronLeft,
  ArrowRightLeft,
  Info,
  Tag,
  CalendarPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { API_BASE_URL } from "@/utils/api";
import { RatingModal } from "@/components/RatingModal";
import ExtendResolutionModal from "@/components/ExtendResolutionModal";
import { api } from "@/utils/apiClient";
import { useSidebar } from "@/contexts/SidebarContext";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Checkbox } from "@/components/ui/checkbox";
import {
  formatDateOnly,
  parseUTCDate,
  formatDateWithYear,
} from "@/utils/dateUtils";
import { PageLoader } from "@/components/PageLoader";

const inter = Inter({ subsets: ["latin"] });

interface IncidentUpdate {
  id: number;
  message: string;
  status: string;
  updatedByFullName: string;
  updatedByName?: string;
  updatedAt: string;
  visibleToReporter: boolean;
}

function getEstimatedResolution(
  submittedAt: string,
  priority: string,
  extendedDate?: string
) {
  // If there's an extended date from the backend, use that
  if (extendedDate) {
    return parseUTCDate(extendedDate);
  }

  // Otherwise, calculate based on priority
  const base = parseUTCDate(submittedAt);
  let days = 2;
  if (priority === "MEDIUM") days = 3;
  if (priority === "HIGH") days = 5;
  base.setDate(base.getDate() + days);
  return base;
}

function formatDate(dateString: string) {
  try {
    if (!dateString) return "Invalid date";
    return formatDateOnly(dateString);
  } catch (error) {
    return "Invalid date";
  }
}

interface Incident {
  id: string;
  trackingNumber: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  incidentType: string;
  description: string;
  submittedByFullName: string;
  submittedByEmail: string;
  submittedByPhone: string;
  submittedByRole: string;
  submittedByIdNumber: string;
  status: string;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW";
  submittedAt?: string;
  estimatedResolutionDate?: string;
  resolutionExtendedBy?: string;
  resolutionExtendedAt?: string;
  isIncident?: boolean;
}

interface UpdateRequest {
  status: string;
  updateMessage: string;
  updatedBy: string;
  visibleToReporter: boolean;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW";
}

interface TransferRequest {
  newOffice: string;
  transferNotes: string;
}

export default function UpdateVerifiedCasePage() {
  const params = useParams();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [isVisibleToReporter, setIsVisibleToReporter] = useState(true);
  // Status is read-only in this view; use incident.status directly
  const [priorityLevel, setPriorityLevel] = useState<"HIGH" | "MEDIUM" | "LOW">(
    "MEDIUM"
  );
  const [isSending, setIsSending] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [dismissalNotes, setDismissalNotes] = useState("");
  const [confirmResolution, setConfirmResolution] = useState(false);
  const [confirmAIGuideline, setConfirmAIGuideline] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferNotes, setTransferNotes] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [offices, setOffices] = useState<
    { code: string; fullName: string; description: string }[]
  >([]);
  const [officesLoading, setOfficesLoading] = useState(false);
  const [officesError, setOfficesError] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState<string>("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  // Removed editable status tracking

  // Fetch user's office name when component mounts
  useEffect(() => {
    const fetchOfficeName = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const profile = await response.json();
        if (profile.officeCode) {
          // Fetch office details to get the full name
          const officeResponse = await fetch(`${API_BASE_URL}/api/offices`);
          if (officeResponse.ok) {
            const offices = await officeResponse.json();
            const office = offices.find(
              (o: any) => o.code === profile.officeCode
            );
            if (office) {
              setOfficeName(office.fullName);
              setUpdatedBy(office.fullName); // Set the initial value
            }
          }
        }
      } catch (error) {
        console.error("Error fetching office name:", error);
      }
    };

    fetchOfficeName();
  }, []);

  const fetchUpdates = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${params.id}/updates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw updates data from API:", data);

      // Transform and validate the data
      const transformedData = data.map((update: any) => {
        const transformed = {
          ...update,
          visibleToReporter: Boolean(update.visibleToReporter),
        };
        console.log("Transformed update:", transformed);
        return transformed;
      });

      console.log("Final transformed updates:", transformedData);
      setUpdates(transformedData);
    } catch (error) {
      console.error("Error fetching updates:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          throw new Error("No authentication token found");
        }

        // Fetch incident details
        const incidentResponse = await fetch(
          `${API_BASE_URL}/api/incidents/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!incidentResponse.ok) {
          throw new Error(`HTTP error! status: ${incidentResponse.status}`);
        }

        const incidentData = await incidentResponse.json();
        setIncident(incidentData);

        // Fetch updates
        await fetchUpdates();
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (incident) {
      setPriorityLevel(incident.priorityLevel);
    }
  }, [incident]);

  const formatDateTime = (dateString: string) => {
    const date = parseUTCDate(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const handleSendUpdate = async () => {
    if (!incident || !updateMessage.trim() || !updatedBy.trim()) return;

    try {
      setIsSending(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const updateRequest: UpdateRequest = {
        status: incident.status,
        updateMessage: updateMessage.trim(),
        updatedBy: updatedBy.trim(),
        visibleToReporter: isVisibleToReporter,
        priorityLevel,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${params.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Update sent successfully", {
        id: `update-sent-success-${Date.now()}`,
        description:
          "The incident has been updated and the reporter will be notified.",
        duration: 5000,
      });

      setUpdateMessage("");
      // Keep updatedBy field populated with office name
      setIsVisibleToReporter(true);

      // Refresh the updates list
      await fetchUpdates();
    } catch (error) {
      console.error("Error sending update:", error);
      toast.error("Failed to send update", {
        id: "update-send-error",
        description:
          "There was an error sending your update. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveCase = async () => {
    if (!resolutionNotes.trim() || !confirmResolution || !confirmAIGuideline) {
      toast.error("Please complete the resolution form", {
        description: !resolutionNotes.trim()
          ? "Add resolution notes before submitting."
          : "Please check both confirmation boxes before submitting.",
        duration: 5000,
        id: "resolution-form-incomplete-error",
      });
      return;
    }
    try {
      setIsSending(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const updateRequest: UpdateRequest = {
        status: "Resolved",
        updateMessage: "Case marked as resolved.",
        updatedBy: updatedBy || "System",
        visibleToReporter: true,
        priorityLevel,
        // @ts-ignore backend accepts this extra field
        resolutionNotes: resolutionNotes.trim(),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${params.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Case resolved successfully", {
        description: "The incident has been marked as resolved.",
        duration: 5000,
        id: `case-resolved-success-${Date.now()}`,
      });

      setIncident((prev) => (prev ? { ...prev, status: "Resolved" } : prev));
      await fetchUpdates();
      setShowRatingModal(true);
    } catch (error) {
      console.error("Error resolving case:", error);
      toast.error("Failed to resolve case", {
        description: "There was an error resolving the case. Please try again.",
        duration: 5000,
        id: "case-resolve-error",
      });
    } finally {
      setIsSending(false);
      setIsResolveDialogOpen(false);
      setResolutionNotes("");
      setConfirmResolution(false);
      setConfirmAIGuideline(false);
    }
  };

  const handleCloseCase = async () => {
    if (!dismissalNotes.trim()) {
      toast.error("Dismissal notes are required", {
        description: "Please provide notes explaining why this case is being dismissed.",
        duration: 5000,
        id: "dismissal-notes-required",
      });
      return;
    }

    try {
      setIsSending(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const updateRequest: UpdateRequest = {
        status: "Dismissed",
        updateMessage: dismissalNotes.trim(),
        updatedBy: updatedBy || "System",
        visibleToReporter: true,
        priorityLevel,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${params.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Case dismissed successfully", {
        description: "The incident has been dismissed.",
        duration: 5000,
        id: `case-dismissed-success-${Date.now()}`,
      });

      setIncident((prev) => (prev ? { ...prev, status: "Dismissed" } : prev));
      await fetchUpdates();
      setDismissalNotes("");
    } catch (error) {
      console.error("Error closing case:", error);
      toast.error("Failed to dismiss case", {
        description: "Please try again.",
        duration: 5000,
        id: "case-dismiss-error",
      });
    } finally {
      setIsSending(false);
      setIsCloseDialogOpen(false);
    }
  };

  // Removed destructive resolve-and-dismiss action per request

  const handleTransfer = async () => {
    if (!selectedOffice) {
      toast.error("Please select an office to transfer to", {
        id: "transfer-office-required-error",
      });
      return;
    }

    try {
      setIsTransferring(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const transferRequest: TransferRequest = {
        newOffice: selectedOffice,
        transferNotes: transferNotes,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/incidents/${params.id}/transfer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transferRequest),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Case transferred successfully", {
        id: `case-transferred-success-${Date.now()}`,
        description:
          "The incident has been transferred to the selected office.",
        duration: 5000,
      });

      // Refresh the incident data
      await fetchUpdates();
      setShowTransferModal(false);
    } catch (error) {
      console.error("Error transferring case:", error);
      toast.error("Failed to transfer case", {
        id: "case-transfer-error",
        description:
          "There was an error transferring the case. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleExtendResolution = async (newDate: string) => {
    try {
      const response = await api.extendResolutionDate(
        params.id as string,
        newDate
      );
      // Update the incident data with the response
      setIncident(response);
      toast.success("Resolution date extended successfully", {
        id: `resolution-extended-success-${Date.now()}`,
        description: `New estimated resolution date: ${new Date(
          newDate
        ).toLocaleDateString()}`,
        duration: 4000,
      });
    } catch (error: any) {
      console.error("Failed to extend resolution date:", error);
      throw new Error(error.message || "Failed to extend resolution date");
    }
  };

  // Fetch offices when transfer modal is opened
  useEffect(() => {
    if (showTransferModal) {
      setOfficesLoading(true);
      fetch(`${API_BASE_URL}/api/offices`)
        .then((res) => res.json())
        .then((data) => {
          setOffices(data);
          setOfficesLoading(false);
        })
        .catch((err) => {
          setOfficesError("Failed to load offices");
          setOfficesLoading(false);
        });
    }
  }, [showTransferModal]);

  const handleRatingSuccess = () => {
    setShowRatingModal(false);
    setShowSuccessDialog(true);
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    router.push("/office-admin/dashboard");
  };

  // Status is not editable on this page

  if (loading) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="Update Case"
              subtitle="Manage and update incident case details"
              showSearch={false}
              showQuickActions={true}
            />
          </div>
          <PageLoader pageTitle="case details" />
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="Update Case"
              subtitle="Manage and update incident case details"
              showSearch={false}
              showQuickActions={true}
            />
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] pt-16">
            <div
              className={`px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 ${
                collapsed
                  ? "max-w-[calc(100vw-5rem-2rem)]"
                  : "max-w-[calc(100vw-16rem-2rem)]"
              } mx-auto w-full`}
            >
              <div className="w-full max-w-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Error Loading Case
                      </h3>
                      <p className="text-red-700">
                        {error || "Incident not found"}
                      </p>
                      <Button
                        className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white"
                        onClick={() =>
                          router.push("/office-admin/approved-cases")
                        }
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Return to Case
                        List
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Dismissed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      <div
        className={`flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] overflow-x-hidden ${inter.className}`}
      >
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="Update Case"
              subtitle="Manage and update incident case details"
              showSearch={false}
              showQuickActions={true}
            />
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] pt-16">
            <div
              className={`px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 ${
                collapsed
                  ? "max-w-[calc(100vw-5rem-2rem)]"
                  : "max-w-[calc(100vw-16rem-2rem)]"
              } mx-auto w-full`}
            >
              <div className="w-full max-w-full">
                {/* Breadcrumb and Header */}
                <div className="mb-6">
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Link
                      href="/office-admin/approved-cases"
                      className="hover:text-[#8B0000] transition-colors font-medium"
                    >
                      Verified Case Tracker
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-2" />
                    <span>Update Case</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-[#8B0000]">
                          Case #{incident.trackingNumber}
                        </h1>
                        <Badge
                          className={`${getStatusColor(
                            incident.status
                          )} border`}
                        >
                          {incident.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="bg-[#8B0000]/5 text-[#8B0000] border-[#DAA520]/30"
                        >
                          {incident.incidentType}
                        </Badge>
                        <Badge
                          className={`${getPriorityColor(
                            incident.priorityLevel
                          )} border`}
                        >
                          {incident.priorityLevel} Priority
                        </Badge>
                        {incident.isIncident !== undefined && (
                          <Badge
                            variant="outline"
                            className={
                              incident.isIncident
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-purple-50 text-purple-700 border-purple-300"
                            }
                          >
                            {incident.isIncident
                              ? "Report is an Incident"
                              : "Report is a Concern"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                        onClick={() => setShowTransferModal(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transfer Case
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => setIsResolveDialogOpen(true)}
                              disabled={
                                incident.status === "Resolved" ||
                                incident.status === "Dismissed" ||
                                isSending
                              }
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">
                                Mark as Resolved
                              </span>
                              <span className="sm:hidden">Resolve</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Mark this case as resolved
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => setIsCloseDialogOpen(true)}
                              disabled={
                                incident.status === "Dismissed" || isSending
                              }
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">
                                Resolve Case
                              </span>
                              <span className="sm:hidden">Resolve</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Resolve and dismiss this case
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Incident Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#DAA520]/20">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-[#8B0000]" />
                          </div>
                          <h2 className="text-lg font-semibold text-[#8B0000]">
                            Incident Summary
                          </h2>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                <div className="bg-[#8B0000]/10 p-1 rounded mr-2">
                                  <Calendar className="h-4 w-4 text-[#8B0000]" />
                                </div>
                                Date & Time
                              </h3>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {formatDate(incident.dateOfIncident)} at{" "}
                                {incident.timeOfIncident}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                <div className="bg-[#8B0000]/10 p-1 rounded mr-2">
                                  <Clock className="h-4 w-4 text-[#8B0000]" />
                                </div>
                                Est. Resolution
                                {incident.estimatedResolutionDate && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                    Extended
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {incident.submittedAt
                                  ? formatDate(
                                      getEstimatedResolution(
                                        incident.submittedAt,
                                        incident.priorityLevel,
                                        incident.estimatedResolutionDate
                                      ).toISOString()
                                    )
                                  : "Not available"}
                              </p>
                              {incident.resolutionExtendedBy && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Extended by {incident.resolutionExtendedBy}
                                </p>
                              )}
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                <div className="bg-[#8B0000]/10 p-1 rounded mr-2">
                                  <MapPin className="h-4 w-4 text-[#8B0000]" />
                                </div>
                                Location
                              </h3>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {incident.location}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                              Description
                            </h3>
                            <div className="bg-[#8B0000]/5 p-3 rounded-md border border-[#DAA520]/20 text-sm whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                              {incident.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Send Update to Reporter */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#DAA520]/20">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                            <Clock className="h-5 w-5 text-[#8B0000]" />
                          </div>
                          <h2 className="text-lg font-semibold text-[#8B0000]">
                            Send Update to Reporter
                          </h2>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#8B0000]">
                              Updated By
                            </label>
                            <Input
                              value={updatedBy}
                              disabled
                              className="bg-[#8B0000]/5 border-[#DAA520]/20"
                              placeholder="Office name"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#8B0000]">
                              Status
                            </label>
                            <Input
                              value={incident.status || "In Progress"}
                              disabled
                              className="bg-[#8B0000]/5 border-[#DAA520]/20"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#8B0000]">
                              Priority
                            </label>
                            <Select
                              value={priorityLevel}
                              onValueChange={(value) =>
                                setPriorityLevel(
                                  value as "HIGH" | "MEDIUM" | "LOW"
                                )
                              }
                            >
                              <SelectTrigger className="border-[#DAA520]/20 focus:ring-[#8B0000]/20 focus:border-[#8B0000]">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="HIGH"
                                  className="text-red-600 font-medium"
                                >
                                  High Priority
                                </SelectItem>
                                <SelectItem
                                  value="MEDIUM"
                                  className="text-orange-600 font-medium"
                                >
                                  Medium Priority
                                </SelectItem>
                                <SelectItem
                                  value="LOW"
                                  className="text-green-600 font-medium"
                                >
                                  Low Priority
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#8B0000]">
                              Visibility
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setIsVisibleToReporter(!isVisibleToReporter)
                              }
                              className={`w-full justify-start border-[#DAA520]/20 ${
                                isVisibleToReporter
                                  ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                  : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                              }`}
                            >
                              {isVisibleToReporter ? (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visible to reporter
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Not visible to reporter
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#8B0000] flex items-center justify-between">
                            <span>Update Message</span>
                            <span
                              className={`text-xs ${
                                updateMessage.length > 255
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-500"
                              }`}
                            >
                              {updateMessage.length}/255
                            </span>
                          </label>
                          <Textarea
                            value={updateMessage}
                            onChange={(e) => setUpdateMessage(e.target.value)}
                            placeholder="Provide an update on the incident investigation..."
                            maxLength={255}
                            className="min-h-[120px] resize-none border-[#DAA520]/20 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
                          />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowExtendModal(true)}
                            disabled={isSending}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                          >
                            <CalendarPlus className="h-4 w-4" />
                            Extend Resolution
                          </Button>

                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setUpdateMessage("");
                                // Keep updatedBy populated with office name
                                setIsVisibleToReporter(true);
                                if (incident) {
                                  setPriorityLevel(incident.priorityLevel);
                                }
                              }}
                              disabled={isSending}
                              className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000]/5"
                            >
                              Reset
                            </Button>
                            <Button
                              onClick={handleSendUpdate}
                              disabled={
                                !updateMessage.trim() ||
                                !updatedBy.trim() ||
                                isSending
                              }
                              className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
                            >
                              {isSending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-6">
                    {/* Reporter Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
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
                      <div className="p-0">
                        <div className="divide-y divide-[#DAA520]/20">
                          <div className="px-6 py-3 flex items-center">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg mr-3">
                              <User className="h-4 w-4 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Name</p>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {incident.submittedByFullName}
                              </p>
                            </div>
                          </div>
                          <div className="px-6 py-3 flex items-center">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg mr-3">
                              <Mail className="h-4 w-4 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Email</p>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {incident.submittedByEmail}
                              </p>
                            </div>
                          </div>
                          <div className="px-6 py-3 flex items-center">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg mr-3">
                              <Phone className="h-4 w-4 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {incident.submittedByPhone || "Not provided"}
                              </p>
                            </div>
                          </div>
                          <div className="px-6 py-3 flex items-center">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg mr-3">
                              <Briefcase className="h-4 w-4 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Role</p>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {incident.submittedByRole || "Student"}
                              </p>
                            </div>
                          </div>
                          <div className="px-6 py-3 flex items-center">
                            <div className="bg-[#8B0000]/10 p-2 rounded-lg mr-3">
                              <Tag className="h-4 w-4 text-[#8B0000]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">ID Number</p>
                              <p className="text-sm font-medium text-[#8B0000]">
                                {incident.submittedByIdNumber || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Update History */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#DAA520]/20">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                            <Clock className="h-5 w-5 text-[#8B0000]" />
                          </div>
                          <h2 className="text-lg font-semibold text-[#8B0000]">
                            Update History
                          </h2>
                        </div>
                      </div>
                      <div className="p-0 max-h-[500px] overflow-y-auto">
                        {updates.length === 0 ? (
                          <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-[#8B0000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Clock className="h-8 w-8 text-[#8B0000]" />
                            </div>
                            <p className="text-sm text-gray-500">
                              No updates yet
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#DAA520]/20">
                            {updates.map((update, index) => (
                              <motion.div
                                key={update.id}
                                className="p-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: index * 0.05,
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-8 w-8 rounded-full bg-[#8B0000]/10 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-[#8B0000]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                      <p className="text-sm font-medium text-[#8B0000]">
                                        {update.updatedByName ||
                                          update.updatedByFullName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatDateTime(update.updatedAt)}
                                      </p>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-[#8B0000]/5 p-3 rounded-md border border-[#DAA520]/20">
                                      {update.message}
                                    </div>
                                    <div className="mt-2">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          update.visibleToReporter
                                            ? "bg-green-50 text-green-600 border-green-200"
                                            : "bg-red-50 text-red-600 border-red-200"
                                        }`}
                                      >
                                        {update.visibleToReporter ? (
                                          <>
                                            <Eye className="inline-block h-3 w-3 mr-1" />
                                            Visible to reporter
                                          </>
                                        ) : (
                                          <>
                                            <EyeOff className="inline-block h-3 w-3 mr-1" />
                                            Not visible to reporter
                                          </>
                                        )}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Resolved</AlertDialogTitle>
            <AlertDialogDescription>
              Provide resolution notes. These notes will be shared with the
              reporter and help future cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8B0000] flex items-center justify-between">
                <span>Resolution Notes</span>
                <span
                  className={`text-xs ${
                    resolutionNotes.length > 255
                      ? "text-red-600 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {resolutionNotes.length}/255
                </span>
              </label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe what was done to resolve the incident..."
                maxLength={255}
                className="min-h-[120px] resize-none border-[#DAA520]/20 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={confirmResolution}
                  onCheckedChange={(v) => setConfirmResolution(Boolean(v))}
                  className="mt-0.5"
                />
                <span>
                  I confirm this incident is fully resolved and the notes are
                  accurate.
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={confirmAIGuideline}
                  onCheckedChange={(v) => setConfirmAIGuideline(Boolean(v))}
                  className="mt-0.5"
                />
                <span>
                  I understand these resolution notes may be used by AI to
                  improve solutions for similar incidents.
                </span>
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveCase}
              disabled={
                isSending ||
                !resolutionNotes.trim() ||
                !confirmResolution ||
                !confirmAIGuideline
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Resolution"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Case</AlertDialogTitle>
            <AlertDialogDescription>
              Provide dismissal notes explaining why this case is being dismissed.
              These notes will be shared with the reporter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8B0000] flex items-center justify-between">
                <span>Dismissal Notes</span>
                <span
                  className={`text-xs ${
                    dismissalNotes.length > 255
                      ? "text-red-600 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {dismissalNotes.length}/255
                </span>
              </label>
              <Textarea
                value={dismissalNotes}
                onChange={(e) => setDismissalNotes(e.target.value)}
                placeholder="Explain why this case is being dismissed..."
                maxLength={255}
                className="min-h-[120px] resize-none border-[#DAA520]/20 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseCase}
              disabled={isSending || !dismissalNotes.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Dismiss Case"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Modal */}
      <AlertDialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#8B0000]">
              Transfer Case
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Transfer this case to another office. This will notify both the
              new office and the case reporter.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B0000] flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer To
                </label>
                <Select
                  value={selectedOffice}
                  onValueChange={setSelectedOffice}
                >
                  <SelectTrigger className="border-[#DAA520]/20 focus:ring-[#8B0000]/20 focus:border-[#8B0000] h-12">
                    <SelectValue
                      placeholder={
                        officesLoading ? "Loading offices..." : "Select office"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {officesLoading ? (
                      <div className="px-4 py-2 text-gray-500">Loading...</div>
                    ) : officesError ? (
                      <div className="px-4 py-2 text-red-500">
                        {officesError}
                      </div>
                    ) : (
                      offices.map((office) => (
                        <SelectItem
                          key={office.code}
                          value={office.code}
                          className="flex items-center justify-between gap-2 py-3"
                        >
                          <span className="font-medium">{office.fullName}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedOffice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#8B0000]/5 rounded-lg border border-[#DAA520]/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                      <Info className="h-5 w-5 text-[#8B0000]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#8B0000] mb-1">
                        {
                          offices.find((o) => o.code === selectedOffice)
                            ?.fullName
                        }
                      </h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {
                          offices.find((o) => o.code === selectedOffice)
                            ?.description
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8B0000] flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transfer Notes
              </label>
              <Textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Provide a reason for transferring this case..."
                className="min-h-[120px] resize-none border-[#DAA520]/20 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
              />
            </div>
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              disabled={isTransferring}
              className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000]/5"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={isTransferring || !selectedOffice}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer Case
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        incidentId={params.id as string}
        type="office"
        onSuccess={handleRatingSuccess}
      />

      {/* Extend Resolution Modal */}
      <ExtendResolutionModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        onExtend={handleExtendResolution}
        currentEstimatedDate={incident?.estimatedResolutionDate}
        incidentId={incident?.trackingNumber || ""}
      />

      {/* Add custom styles for animation delays */}
      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </>
  );
}
