"use client";

import { useState, useEffect, useRef, type JSX } from "react";
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
  Search,
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
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "@/contexts/SidebarContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

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
  const [officeSearchQuery, setOfficeSearchQuery] = useState("");
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle countdown and navigation
  useEffect(() => {
    if (countdown === 0 && showModal) {
      router.push("/office-admin/dashboard");
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [countdown, showModal, router]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        // Try fetching by ID first
        let response = await api.get(`/api/incidents/${id}`);

        // If 404, try fetching by tracking number
        if (!response.ok && response.status === 404) {
          response = await api.get(`/api/incidents/track/${id}`);
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
        setVerificationNotes(data.verificationNotes || "");
        setIsVerified(data.verified);
        setStatus(data.status);
        setPriorityLevel(data.priorityLevel);
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
      setOfficeSearchQuery(""); // Clear search when modal opens
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
      setOfficeSearchQuery(""); // Clear search when modal closes
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
      <div
        className={`flex-1 overflow-auto transition-all duration-300 ${
          collapsed ? "ml-[5rem]" : "ml-64"
        } pt-24`}
      >
        <div
          className={`p-6 mx-2 ${
            collapsed ? "max-w-[95vw]" : "max-w-[calc(100vw-8rem)]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/office-admin/incidents")}
                  className="text-[#8B0000] hover:bg-[#8B0000]/10 hover:text-[#8B0000]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
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
              <p className="text-gray-500 mt-1 ml-12">
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
                        <p className="font-medium">{incident.timeOfIncident}</p>
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
                    isProcessing || !priorityLevel || !isVerified || !status
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
                      alignOffset={0}
                      avoidCollisions={true}
                      collisionPadding={{
                        top: 140,
                        right: 16,
                        bottom: 80,
                        left: 16,
                      }}
                      sticky="partial"
                      className="max-h-[min(calc(100vh-450px),200px)] sm:max-h-[min(calc(100vh-400px),220px)] md:max-h-[min(calc(100vh-360px),260px)] w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[min(420px,80vw)] sm:max-w-[min(520px,85vw)] md:max-w-[520px] p-1.5 sm:p-2 overflow-y-auto overflow-x-hidden z-[9999]"
                      style={{
                        scrollBehavior: "smooth",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(139, 0, 0, 0.2) transparent",
                      }}
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
                                      .includes(
                                        officeSearchQuery.toLowerCase()
                                      ))
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

                              return filteredOffices.map((office, index) => (
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
                      Only offices different from the current assignment are
                      shown
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
                  <p className="text-[10px] sm:text-xs text-gray-500 flex items-start gap-1 sm:gap-1.5">
                    <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      These notes will be included in the transfer record and
                      visible to the receiving office
                    </span>
                  </p>
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
                      <span className="text-sm sm:text-base">
                        Transfer Case
                      </span>
                    </>
                  )}
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

      {/* Add custom styles for animation delays and scrollbar */}
      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }

        /* Custom scrollbar styling for webkit browsers */
        [data-radix-select-content]::-webkit-scrollbar {
          width: 8px;
        }

        [data-radix-select-content]::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        [data-radix-select-content]::-webkit-scrollbar-thumb {
          background: rgba(139, 0, 0, 0.15);
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        [data-radix-select-content]::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 0, 0, 0.3);
        }

        /* Dialog scrollbar styling */
        [role="dialog"]::-webkit-scrollbar {
          width: 6px;
        }

        [role="dialog"]::-webkit-scrollbar-track {
          background: transparent;
        }

        [role="dialog"]::-webkit-scrollbar-thumb {
          background: rgba(139, 0, 0, 0.2);
          border-radius: 10px;
        }

        [role="dialog"]::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 0, 0, 0.35);
        }

        /* Responsive viewport adjustments */
        @media (max-width: 480px) {
          [role="dialog"] {
            border-radius: 12px !important;
          }
        }

        @media (min-width: 1920px) {
          [role="dialog"][data-state="open"] {
            max-width: 750px !important;
          }
        }

        /* Prevent body scroll when dialog is open */
        body:has([role="dialog"][data-state="open"]) {
          overflow: hidden;
        }

        /* Ensure select dropdown stays within viewport bounds */
        [data-radix-select-content] {
          max-width: calc(100vw - 32px) !important;
          max-height: min(200px, calc(100vh - 450px)) !important;
        }

        /* Position select content properly within viewport */
        [data-radix-select-viewport] {
          max-width: 100%;
          max-height: inherit;
        }

        /* Ensure dropdown doesn't overflow on mobile */
        @media (max-width: 640px) {
          [data-radix-select-content] {
            left: 16px !important;
            right: 16px !important;
            max-width: calc(100vw - 32px) !important;
            max-height: min(180px, calc(100vh - 480px)) !important;
          }
        }

        /* Tablet adjustments */
        @media (min-width: 640px) and (max-width: 768px) {
          [data-radix-select-content] {
            max-height: min(200px, calc(100vh - 440px)) !important;
          }
        }

        /* Desktop adjustments */
        @media (min-width: 768px) {
          [data-radix-select-content] {
            max-height: min(260px, calc(100vh - 380px)) !important;
          }
        }

        /* Constrain dropdown within dialog boundaries */
        [role="dialog"] [data-radix-select-content] {
          max-width: min(calc(100vw - 32px), 520px);
          max-height: min(200px, calc(100vh - 480px)) !important;
        }

        @media (max-width: 640px) {
          [role="dialog"] [data-radix-select-content] {
            max-width: calc(100vw - 32px) !important;
            max-height: min(160px, calc(100vh - 500px)) !important;
          }
        }

        @media (min-width: 640px) and (max-width: 768px) {
          [role="dialog"] [data-radix-select-content] {
            max-height: min(180px, calc(100vh - 460px)) !important;
          }
        }

        @media (min-width: 768px) {
          [role="dialog"] [data-radix-select-content] {
            max-height: min(240px, calc(100vh - 400px)) !important;
          }
        }

        /* Prevent dropdown from extending beyond browser chrome */
        [data-radix-popper-content-wrapper] {
          max-height: calc(100vh - 250px);
        }

        /* Smooth animation for dropdown */
        [data-radix-select-content][data-state="open"] {
          animation: slideDown 0.15s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Ensure dropdown respects boundaries with margins */
        [data-radix-select-content][data-side="bottom"] {
          margin-bottom: 80px;
        }

        [data-radix-select-content][data-side="top"] {
          margin-top: 80px;
        }
      `}</style>
    </div>
  );
}
