"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import {
  Eye,
  Clock,
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Layers,
  ArrowUpRight,
  Activity,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/utils/api";
import { motion } from "framer-motion";
import { filterIncidentsByPrivacy } from "@/utils/anonymization";
import {
  formatRelativeDate,
  formatDateWithYear,
  formatDateOnly,
  parseUTCDate,
} from "@/utils/dateUtils";
import { formatLocationForTable } from "@/utils/locationFormatter";
import { PageLoader } from "@/components/PageLoader";

interface Incident {
  id: string; // UUID from backend
  trackingNumber?: string; // Add this field for backend tracking number
  caseNumber?: string; // Case number like INC-2025-0001
  incidentType: string;
  location: string;
  dateOfIncident: string;
  status: string;
  priorityLevel?: "HIGH" | "MEDIUM" | "LOW" | null;
  estimatedResolutionDate?: string;
  // Optional location data fields for enhanced formatting
  formattedAddress?: string;
  buildingName?: string;
  buildingCode?: string;
  room?: string;
  building?: {
    fullName?: string;
    code?: string;
  };
}

export default function CaseTrackingPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Proper formatter for missing case numbers
  const formatCaseNumber = (index: number): string => {
    const year = new Date().getFullYear();
    const number = String(index + 1).padStart(4, "0");
    return `INC-${year}-${number}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        // Fetch incidents
        const incidentsResponse = await fetch(
          `${API_BASE_URL}/api/incidents/my-incidents`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!incidentsResponse.ok)
          throw new Error(`HTTP error! status: ${incidentsResponse.status}`);

        const incidentsData = await incidentsResponse.json();
        // Only show PENDING and IN PROGRESS status (case-insensitive, with space)
        const statusFiltered = incidentsData.filter((i: Incident) =>
          ["pending", "in progress"].includes(i.status.toLowerCase())
        );
        // Users can see their own reports even if private (isViewerSubmitter = true)
        const anonymizedData = filterIncidentsByPrivacy(
          statusFiltered,
          false,
          true
        );
        setIncidents(anonymizedData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Helper function to format dates for activities
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  };

  const formatEstimatedDate = (dateString: string) => {
    return formatDateOnly(dateString);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "NEW_REPORT":
        return <AlertTriangle size={18} />;
      case "STATUS_CHANGE":
        return <Clock size={18} />;
      case "UPDATE":
        return <RefreshCw size={18} />;
      case "CASE_RESOLVED":
        return <CheckCircle size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "NEW_REPORT":
        return "bg-gradient-to-br from-red-500 to-red-600";
      case "STATUS_CHANGE":
        return "bg-gradient-to-br from-blue-500 to-blue-600";
      case "UPDATE":
        return "bg-gradient-to-br from-amber-500 to-amber-600";
      case "CASE_RESOLVED":
        return "bg-gradient-to-br from-green-500 to-green-600";
      default:
        return "bg-gradient-to-br from-gray-500 to-gray-600";
    }
  };

  // Helper function to get status styling
  const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "pending") {
      return {
        border: "border-l-4 border-l-amber-500",
        badge:
          "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200",
        icon: "bg-gradient-to-br from-amber-400 to-amber-500",
        accent: "from-amber-500/10 to-amber-500/5",
      };
    } else if (normalizedStatus === "in progress") {
      return {
        border: "border-l-4 border-l-blue-500",
        badge:
          "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200",
        icon: "bg-gradient-to-br from-blue-400 to-blue-500",
        accent: "from-blue-500/10 to-blue-500/5",
      };
    } else {
      return {
        border: "border-l-4 border-l-green-500",
        badge:
          "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200",
        icon: "bg-gradient-to-br from-green-400 to-green-500",
        accent: "from-green-500/10 to-green-500/5",
      };
    }
  };

  // Helper function to get priority styling
  const getPriorityStyles = (priority?: string | null) => {
    if (!priority) return null;
    const normalizedPriority = priority.toLowerCase();
    if (normalizedPriority === "high") {
      return {
        badge:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30",
        dot: "bg-red-500",
      };
    } else if (normalizedPriority === "medium") {
      return {
        badge:
          "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30",
        dot: "bg-orange-500",
      };
    } else if (normalizedPriority === "low") {
      return {
        badge:
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30",
        dot: "bg-emerald-500",
      };
    }
    return null;
  };

  // Only show incidents matching selected status and search
  const filteredCases = incidents.filter(
    (item) =>
      (selectedStatus === "All" || item.status === selectedStatus) &&
      (selectedPriority === "All" ||
        (item.priorityLevel &&
          item.priorityLevel.toLowerCase() ===
            selectedPriority.toLowerCase())) &&
      ((item.trackingNumber || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
        (item.caseNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        item.incidentType.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.status.toLowerCase().includes(search.toLowerCase()))
  );

  // Get counts for dashboard stats
  const pendingCount = incidents.filter(
    (item) => item.status === "Pending"
  ).length;
  const inProgressCount = incidents.filter(
    (item) => item.status === "In Progress"
  ).length;

  const goToCase = (idOrTracking: string) => {
    try {
      sessionStorage.setItem("ww_keep_sidebar", "1");
    } catch {}
    router.push(`/incidents/tracking/${idOrTracking}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Navbar */}
          <div className="sticky top-0 z-30 flex-shrink-0">
            <Navbar
              title="Case Tracking"
              subtitle="Track and manage your security incident reports"
              onSearch={setSearch}
            />
          </div>

          {/* PageLoader - fills the remaining space below Navbar */}
          <PageLoader pageTitle="cases" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Navbar */}
          <div className="sticky top-0 z-30 flex-shrink-0">
            <Navbar
              title="Case Tracking"
              subtitle="Track and manage your security incident reports"
              onSearch={setSearch}
            />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
            <div className="px-6 py-10">
              <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-[#8B0000] mb-4">
                  Case Tracking
                </h1>
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Error Loading Cases
                      </h3>
                      <p>{error}</p>
                      <Button
                        className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white"
                        onClick={() =>
                          typeof window !== "undefined" &&
                          window.location.reload()
                        }
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
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

  return (
    <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <div className="sticky top-0 z-30 flex-shrink-0">
          <Navbar
            title="Case Tracking"
            subtitle="Track and manage your security incident reports"
            onSearch={setSearch}
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
          <div className="px-6 py-10">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-white to-[#fff9f9] p-6 rounded-xl shadow-md border border-[#f0e0e0] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#8B0000]/5 to-[#8B0000]/10 rounded-bl-full"></div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-3 rounded-lg shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Pending Cases
                    </p>
                    <h3 className="text-3xl font-bold text-[#8B0000]">
                      {pendingCount}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedStatus("Pending")}
                    className="text-[#8B0000] text-sm font-medium flex items-center hover:underline"
                  >
                    View Pending Cases <ArrowUpRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-gradient-to-br from-white to-[#fff9f9] p-6 rounded-xl shadow-md border border-[#f0e0e0] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#DAA520]/5 to-[#DAA520]/10 rounded-bl-full"></div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#DAA520] to-[#B8860B] p-3 rounded-lg shadow-md">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      In Progress
                    </p>
                    <h3 className="text-3xl font-bold text-[#DAA520]">
                      {inProgressCount}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedStatus("In Progress")}
                    className="text-[#DAA520] text-sm font-medium flex items-center hover:underline"
                  >
                    View Active Cases <ArrowUpRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Filters Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 mb-8 border border-[#f0e0e0] relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-2 rounded-lg shadow-md">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                    <Activity className="mr-2 h-4 w-4 text-[#8B0000]" />
                    Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Pending", "In Progress"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedStatus === status
                            ? "bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white shadow-md"
                            : "bg-white/50 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-[#8B0000]" />
                    Priority
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["All", "HIGH", "MEDIUM", "LOW"].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setSelectedPriority(priority)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedPriority === priority
                            ? priority === "HIGH"
                              ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                              : priority === "MEDIUM"
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                              : priority === "LOW"
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                              : "bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white shadow-md"
                            : "bg-white/50 text-gray-700 hover:bg-white border border-gray-200"
                        }`}
                      >
                        {priority === "All"
                          ? priority
                          : priority.charAt(0) +
                            priority.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Incident Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-2 rounded-lg shadow-md mr-3">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  Your Cases
                  <span className="ml-3 text-sm bg-[#8B0000]/10 text-[#8B0000] px-3 py-1 rounded-full font-semibold">
                    {filteredCases.length}
                  </span>
                </h2>
                <div className="text-sm text-gray-500 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-200">
                  Showing {filteredCases.length} of {incidents.length} cases
                </div>
              </div>

              {filteredCases.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-12 text-center border border-[#f0e0e0] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100/50 to-transparent rounded-bl-full"></div>
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      No cases found
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      We couldn't find any cases matching your current filters.
                      Try adjusting your search or filters.
                    </p>
                    <Button
                      variant="outline"
                      className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                      onClick={() => {
                        setSelectedStatus("All");
                        setSelectedPriority("All");
                        setSearch("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredCases.map((item, index) => {
                    const statusStyles = getStatusStyles(item.status);
                    const priorityStyles = getPriorityStyles(
                      item.priorityLevel
                    );
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -2 }}
                        className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md border border-[#f0e0e0] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300"
                        onClick={() =>
                          goToCase(
                            item.trackingNumber ? item.trackingNumber : item.id
                          )
                        }
                      >
                        {/* Decorative gradient overlay */}
                        <div
                          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${statusStyles.accent} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        ></div>

                        <div className="relative p-6">
                          {/* Header Section */}
                          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-3 rounded-lg shadow-md flex-shrink-0">
                                  <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h1 className="text-2xl font-bold text-[#8B0000] mb-1">
                                    Case{" "}
                                    {item.trackingNumber
                                      ? item.trackingNumber
                                      : item.caseNumber
                                      ? item.caseNumber
                                      : formatCaseNumber(index)}
                                  </h1>
                                  <p className="text-gray-600 text-sm">
                                    Security Incident Report
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {/* Priority chip */}
                                {priorityStyles && (
                                  <span
                                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                                      item.priorityLevel === "HIGH"
                                        ? "bg-red-100 text-red-800"
                                        : item.priorityLevel === "MEDIUM"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {item.priorityLevel} Priority
                                  </span>
                                )}
                                <span
                                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    item.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : item.status === "In Progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                goToCase(
                                  item.trackingNumber
                                    ? item.trackingNumber
                                    : item.id
                                );
                              }}
                              className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#6B0000] hover:to-[#800000] text-white shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
                              size="sm"
                            >
                              <Eye size={16} className="mr-2" /> View Details
                            </Button>
                          </div>

                          {/* Incident Type */}
                          <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                              <FileText className="mr-2 h-5 w-5 text-[#8B0000]" />
                              {item.incidentType}
                            </h2>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Incident Date */}
                            <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
                              <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                <Calendar className="mr-1 h-4 w-4" />
                                Incident Date
                              </div>
                              <p className="text-gray-800 font-semibold">
                                {item.dateOfIncident}
                              </p>
                            </div>

                            {/* Estimated Resolution Date */}
                            {item.estimatedResolutionDate ? (
                              <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
                                <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                  <Calendar className="mr-1 h-4 w-4 text-[#8B0000]" />
                                  Est. Resolution
                                </div>
                                <p className="text-[#8B0000] font-semibold">
                                  {formatEstimatedDate(
                                    item.estimatedResolutionDate
                                  )}
                                </p>
                              </div>
                            ) : (
                              <div></div>
                            )}

                            {/* Location */}
                            <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
                              <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                                <MapPin className="mr-1 h-4 w-4" />
                                Location
                              </div>
                              <p className="text-gray-800 font-semibold truncate">
                                {formatLocationForTable(item)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
