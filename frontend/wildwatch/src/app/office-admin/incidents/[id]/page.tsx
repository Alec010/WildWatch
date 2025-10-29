"use client";

import { useState, useEffect, use, type JSX } from "react";
import { useRouter, useParams } from "next/navigation";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
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
  ChevronLeft,
  ChevronRight,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "@/contexts/SidebarContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "sonner";

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
  estimatedResolutionDate?: string;
  // Backend may return either camelCase or snake_case
  preferAnonymous?: boolean;
  isPrivate?: boolean;
}

export default function IncidentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { collapsed } = useSidebar();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [estimatedResolutionDate, setEstimatedResolutionDate] = useState("");
  const [estimatedResolutionError, setEstimatedResolutionError] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");

  // Calendar utility functions
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

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(selectedDate);
    setEstimatedResolutionDate(selectedDate.toISOString().split("T")[0]);
    setInputValue(formatInputValue(selectedDate));
    setEstimatedResolutionError("");
    setIsCalendarOpen(false);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  // Format HH:mm or HH:mm:ss to 12-hour time (e.g., 2:05 PM)
  const formatTimeTo12Hour = (time: string): string => {
    if (!time) return "";
    const trimmed = time.trim();
    const lower = trimmed.toLowerCase();
    if (lower.includes("am") || lower.includes("pm")) return trimmed;
    const parts = trimmed.split(":");
    const hour = parseInt(parts[0] || "0", 10);
    const minute = parseInt(parts[1] || "0", 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return trimmed;
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Manual date input handling
  const parseDateInput = (input: string): Date | null => {
    // Handle MM/DD/YYYY format
    const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = input.match(mmddyyyy);

    if (match) {
      const month = parseInt(match[1]) - 1; // JavaScript months are 0-indexed
      const day = parseInt(match[2]);
      const year = parseInt(match[3]);

      const date = new Date(year, month, day);

      // Validate the date
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day &&
        date >= new Date() // Must be today or future
      ) {
        return date;
      }
    }

    return null;
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setEstimatedResolutionError("");

    const parsedDate = parseDateInput(value);
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setEstimatedResolutionDate(parsedDate.toISOString().split("T")[0]);
      setCurrentMonth(parsedDate);
    } else if (value === "") {
      setSelectedDate(null);
      setEstimatedResolutionDate("");
    }
  };

  const formatInputValue = (date: Date | null): string => {
    if (!date) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await api.get(`/api/incidents/${id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: Incident & {
          prefer_anonymous?: boolean;
          is_private?: boolean;
        } = await response.json();

        setIncident(data);
        setAdministrativeNotes(data.administrativeNotes || "");
        setVerificationNotes(data.verificationNotes || "");
        setIsVerified(data.verified);
        setStatus(data.status);
        setPriorityLevel(data.priorityLevel);
        setEstimatedResolutionDate(data.estimatedResolutionDate || "");
        // Initialize selected date for calendar
        if (data.estimatedResolutionDate) {
          const date = new Date(data.estimatedResolutionDate);
          setSelectedDate(date);
          setInputValue(formatInputValue(date));
        }
        // Initialize anonymity toggle to OFF by default (admin controls this, not reporter preference)
        setIsAnonymous(false);
        // Initialize privacy from backend payload (supports snake_case and camelCase)
        const initialPrivate =
          (data as any).isPrivate ?? (data as any).is_private ?? false;
        setIsPrivate(!!initialPrivate);
      } catch (err) {
        console.error("Error fetching incident:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load incident"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [id]);

  useEffect(() => {
    if (showTransferModal) {
      setOfficesLoading(true);
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
    }
  }, [showTransferModal]);

  const handleApproveIncident = async () => {
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
    if (!estimatedResolutionDate) {
      setEstimatedResolutionError(
        "Please set an estimated resolution date before approving."
      );
      return;
    }
    setEstimatedResolutionError("");
    setIsProcessing(true);
    try {
      const response = await api.put(`/api/incidents/${id}`, {
        administrativeNotes,
        verified: true,
        verificationNotes,
        status: "In Progress",
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

      // Show success modal
      setModalContent({
        title: "Incident Verified",
        message:
          "The incident has been successfully verified and is now being processed.",
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        color: "bg-green-50 border-green-200",
      });
      setShowModal(true);
      setCountdown(3);

      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push("/office-admin/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup interval on unmount
      return () => clearInterval(countdownInterval);
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
    setIsProcessing(true);
    try {
      const response = await api.put(`/api/incidents/${id}`, {
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

      // Show success modal
      setModalContent({
        title: "Incident Dismissed",
        message: "The incident has been successfully dismissed.",
        icon: <XCircleIcon className="h-12 w-12 text-gray-500" />,
        color: "bg-gray-50 border-gray-200",
      });
      setShowModal(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/office-admin/dashboard");
      }, 3000);
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
    setIsProcessing(true);
    try {
      const response = await api.put(`/api/incidents/${id}`, {
        administrativeNotes,
        verified: isVerified,
        verificationNotes,
        status,
        priorityLevel,
        preferAnonymous: isAnonymous,
        isPrivate: isPrivate,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedIncident = await response.json();
      setIncident(updatedIncident);

      // Show success modal
      setModalContent({
        title: "Status Updated",
        message: `The incident status has been successfully updated to ${status}.`,
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        color: "bg-green-50 border-green-200",
      });
      setShowModal(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/office-admin/dashboard");
      }, 3000);
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
      const response = await api.post(`/api/incidents/${id}/transfer`, {
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

      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push("/office-admin/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup interval on unmount
      return () => clearInterval(countdownInterval);
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
      // 'Closed' is deprecated; treat as Resolved in UI
      case "Closed":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-700 border-gray-200"
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

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Toaster richColors position="top-right" />
        <OfficeAdminSidebar />
        <div
          className={`flex-1 flex items-center justify-center transition-all duration-300 ${
            collapsed ? "ml-[5rem]" : "ml-64"
          }`}
        >
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">
              Loading incident details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Toaster richColors position="top-right" />
        <OfficeAdminSidebar />
        <div
          className={`flex-1 p-8 transition-all duration-300 ${
            collapsed ? "ml-[5rem]" : "ml-64"
          }`}
        >
          <div className="max-w-7xl mx-auto">
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
                  <Button
                    className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white"
                    onClick={() =>
                      typeof window !== "undefined" && window.location.reload()
                    }
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
      <OfficeAdminSidebar />
      <OfficeAdminNavbar
        title="Incident Details"
        subtitle="Review and manage incident information"
        showSearch={false}
      />
      <Toaster
        richColors
        position="top-right"
        className="z-50"
        style={{ top: "80px" }}
      />
      <div
        className={`flex-1 overflow-auto transition-all duration-300 ${
          collapsed ? "ml-[5rem]" : "ml-64"
        } pt-24`}
      >
        <div
          className={`p-6 -mt-3 mx-4 ${
            collapsed ? "max-w-[95vw]" : "max-w-[calc(100vw-8rem)]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#8B0000]">
                  Review Incident
                </h1>
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
              </div>
              <p className="text-gray-500 mt-1">
                Case #{incident.trackingNumber} • {incident.incidentType}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer Case
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Incidents
              </Button>
            </div>
          </div>

          {/* Two-column layout */}
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
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#DAA520]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEMUFGMzciIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
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
                          {new Date(incident.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-[#8B0000]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Date of Incident
                        </p>
                        <p className="font-medium">
                          {new Date(
                            incident.dateOfIncident
                          ).toLocaleDateString()}
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
                      {incident.evidence && incident.evidence.length > 0 ? (
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
                                <div className="relative aspect-square rounded-lg overflow-hidden border border-[#DAA520]/20 shadow-sm group-hover:shadow-md transition-shadow">
                                  <Image
                                    src={file.fileUrl || "/placeholder.svg"}
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
                                  {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                  •{" "}
                                  {new Date(
                                    file.uploadedAt
                                  ).toLocaleDateString()}
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
                      {incident.witnesses && incident.witnesses.length > 0 ? (
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
                      <option value="Resolved">Resolved</option>
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

                  {/* Estimated Resolution Date */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-[#8B0000] flex items-center gap-2">
                      <div className="bg-[#8B0000]/10 p-1 rounded">
                        <Calendar className="h-3 w-3 text-[#8B0000]" />
                      </div>
                      Estimated Resolution Date{" "}
                      <span className="text-red-600">*</span>
                    </Label>
                    <div className="mt-1">
                      <div className="relative">
                        {/* Manual Input Field */}
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder="MM/DD/YYYY"
                          className={`w-full px-3 py-2 pl-10 pr-10 border rounded-md bg-white focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all ${
                            estimatedResolutionError
                              ? "border-red-500"
                              : "border-[#DAA520]/20"
                          }`}
                        />

                        {/* Calendar Icon */}
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Calendar className="h-4 w-4 text-[#8B0000]/60" />
                        </div>

                        {/* Calendar Button */}
                        <Popover
                          open={isCalendarOpen}
                          onOpenChange={setIsCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-[#8B0000] hover:bg-[#8B0000]/5"
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                              {/* Calendar Header */}
                              <div className="bg-[#8B0000] text-white p-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold">
                                    {formatMonthYear(currentMonth)}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMonthChange("prev")}
                                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMonthChange("next")}
                                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Calendar Body */}
                              <div className="p-4">
                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                  {[
                                    "Sun",
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                  ].map((day) => (
                                    <div
                                      key={day}
                                      className="text-center text-xs font-medium text-gray-500 py-2"
                                    >
                                      {day}
                                    </div>
                                  ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                  {getDaysInMonth(currentMonth).map(
                                    (week, weekIndex) =>
                                      week.map((day, dayIndex) => {
                                        if (day === null) {
                                          return (
                                            <div
                                              key={`${weekIndex}-${dayIndex}`}
                                              className="h-10 w-10"
                                            />
                                          );
                                        }

                                        const isDisabled = isDateDisabled(day);
                                        const isSelected = isDateSelected(day);
                                        const isTodayDate = isToday(day);

                                        return (
                                          <button
                                            key={day}
                                            onClick={() =>
                                              !isDisabled &&
                                              handleDateSelect(day)
                                            }
                                            disabled={isDisabled}
                                            className={`
                                          h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
                                          ${
                                            isDisabled
                                              ? "text-gray-300 cursor-not-allowed"
                                              : "hover:bg-[#8B0000]/10 hover:text-[#8B0000] cursor-pointer"
                                          }
                                          ${
                                            isSelected
                                              ? "bg-[#8B0000] text-white shadow-md"
                                              : ""
                                          }
                                          ${
                                            isTodayDate && !isSelected
                                              ? "bg-gray-100 text-[#8B0000] font-bold border-2 border-gray-300"
                                              : ""
                                          }
                                        `}
                                          >
                                            {day}
                                          </button>
                                        );
                                      })
                                  )}
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const today = new Date();
                                        handleDateSelect(today.getDate());
                                      }}
                                      className="flex-1 text-xs border-gray-300 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                    >
                                      Today
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const nextWeek = new Date();
                                        nextWeek.setDate(
                                          nextWeek.getDate() + 7
                                        );
                                        handleDateSelect(nextWeek.getDate());
                                      }}
                                      className="flex-1 text-xs border-gray-300 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                    >
                                      Next Week
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const nextMonth = new Date();
                                        nextMonth.setMonth(
                                          nextMonth.getMonth() + 1
                                        );
                                        nextMonth.setDate(1);
                                        handleDateSelect(nextMonth.getDate());
                                      }}
                                      className="flex-1 text-xs border-gray-300 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                    >
                                      Next Month
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {estimatedResolutionError && (
                      <div className="text-red-600 text-xs mt-1">
                        {estimatedResolutionError}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        Enter date manually (MM/DD/YYYY) or use the calendar
                      </span>
                    </div>
                  </div>

                  {/* Administrative Notes */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-[#8B0000]">
                      Administrative Notes
                    </Label>
                    <Textarea
                      value={administrativeNotes}
                      onChange={(e) => setAdministrativeNotes(e.target.value)}
                      placeholder="Add your notes about this incident..."
                      className="mt-1 min-h-[100px] border-[#DAA520]/20 focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                    />
                  </div>

                  {/* Anonymous */}
                  <div className="mb-4">
                    <label
                      htmlFor="is-anonymous"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Switch
                        id="is-anonymous"
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked)}
                      />
                      <span className="text-sm font-medium text-[#8B0000]">
                        Mark this report as anonymous
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 ml-9">
                      If enabled, this report will not be displayed in public
                      listings.
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
                        onCheckedChange={(checked) => setIsPrivate(checked)}
                      />
                      <span className="text-sm font-medium text-[#8B0000]">
                        Mark this incident as private
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 ml-9">
                      If enabled, this incident will be restricted to authorized
                      personnel only.
                    </p>
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
                  {incident.preferAnonymous && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Reporter requested anonymity
                        </p>
                        <p className="text-sm">
                          Treat this reporter's identity as private. Do not
                          disclose or share personally identifiable details.
                        </p>
                      </div>
                    </div>
                  )}
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
                        <p className="text-sm text-gray-500">Submission Date</p>
                        <p className="font-medium text-[#8B0000]">
                          {new Date(incident.submittedAt).toLocaleString()}
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
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add verification notes here..."
                      className="mt-1 min-h-[100px] border-[#DAA520]/20 focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                    />
                  </div>

                  {incident.verifiedBy && (
                    <div className="text-sm bg-[#8B0000]/5 text-[#8B0000] p-3 rounded-md border border-[#DAA520]/20 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5" />
                      <span>
                        Verified by {incident.verifiedBy} on{" "}
                        {new Date(incident.verifiedAt!).toLocaleString()}
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
                    !status ||
                    !estimatedResolutionDate
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

          {/* Transfer Modal */}
          <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Transfer to Office
                  </label>
                  <Select
                    value={selectedOffice}
                    onValueChange={setSelectedOffice}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          officesLoading
                            ? "Loading offices..."
                            : "Select an office"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {officesLoading ? (
                        <div className="px-4 py-2 text-gray-500">
                          Loading...
                        </div>
                      ) : officesError ? (
                        <div className="px-4 py-2 text-red-500">
                          {officesError}
                        </div>
                      ) : (
                        offices.map((office) => (
                          <SelectItem
                            key={office.code}
                            value={office.code}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>{office.fullName}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-2 cursor-pointer">
                                    <Info className="h-4 w-4 text-gray-400 hover:text-[#8B0000]" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="font-semibold">
                                    {office.fullName}
                                  </div>
                                  <div className="text-xs text-gray-500 max-w-xs whitespace-pre-line">
                                    {office.description}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transfer Notes</label>
                  <Textarea
                    placeholder="Enter reason for transfer..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    rows={4}
                    className="focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowTransferModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
                >
                  {isTransferring ? "Transferring..." : "Transfer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal */}
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
                    Redirecting to dashboard in{" "}
                    <span className="font-bold text-[#8B0000]">
                      {countdown}
                    </span>{" "}
                    seconds...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add custom styles for animation delays */}
      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
