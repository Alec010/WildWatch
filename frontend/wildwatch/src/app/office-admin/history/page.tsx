"use client";

import { useEffect, useState } from "react";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Download,
  Eye,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";
import { generatePDF } from "@/components/GeneralFormatOfPDF";
import { TSGPDFModal } from "@/components/format/TSG";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";
import { Inter } from "next/font/google";
import { formatDateOnly, parseUTCDate } from "@/utils/dateUtils";
import { PageLoader } from "@/components/PageLoader";
import userProfileService from "@/utils/userProfileService";

const inter = Inter({ subsets: ["latin"] });

interface Incident {
  id: string;
  trackingNumber: string;
  dateOfIncident: string;
  submittedAt: string;
  incidentType: string;
  location: string;
  submittedByFullName: string;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW" | null;
  status: string;
  officeAdminName?: string;
  finishedDate?: string;
  description?: string;
  submittedByEmail?: string;
  submittedByPhone?: string;
  evidence?: any[];
  witnesses?: any[];
  updates?: any[];
}

export default function OfficeAdminIncidentHistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tsgModalOpen, setTSGModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const { collapsed } = useSidebar();

  const incidentsPerPage = 5;
  const router = useRouter();

  useEffect(() => {
    // Get status from URL query parameter
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const statusFromUrl = searchParams.get("status");
      if (statusFromUrl) {
        setStatusFilter(statusFromUrl);
      }
    }
  }, []);

  const fetchIncidents = async () => {
    try {
      setError(null);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      if (!token) {
        throw new Error("No authentication token found");
      }
      const res = await fetch(`${API_BASE_URL}/api/incidents/office`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      // Only show Resolved or Dismissed (case-insensitive)
      setIncidents(
        data.filter((i: Incident) =>
          ["resolved", "dismissed"].includes(i.status.toLowerCase())
        )
      );
    } catch (e) {
      console.error("Error fetching incidents:", e);
      setError(e instanceof Error ? e.message : "Failed to load incidents");
      setIncidents([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchIncidents();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchIncidents();
  };

  const filteredIncidents = incidents.filter(
    (i) =>
      (statusFilter === "All" || i.status === statusFilter) &&
      (priorityFilter === "All" ||
        (i.priorityLevel &&
          i.priorityLevel.toLowerCase() === priorityFilter.toLowerCase())) &&
      (i.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.incidentType.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase()) ||
        i.status.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedIncidents = filteredIncidents.slice(
    (page - 1) * incidentsPerPage,
    page * incidentsPerPage
  );

  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  // Determine PDF format based on user email
  const getPDFFormat = (): "default" | "tsg" => {
    if (typeof window === "undefined") return "default";

    try {
      const userProfile = userProfileService.getUserProfile();
      if (!userProfile || !userProfile.email) return "default";

      const email = userProfile.email.toLowerCase();
      // Check if email contains "tsg" and ends with "@cit.edu"
      if (email.includes("tsg") && email.endsWith("@cit.edu")) {
        return "tsg";
      }
    } catch (error) {
      console.error("Error getting user profile:", error);
    }

    return "default";
  };

  const handleDownloadPDF = async (incident: any) => {
    const pdfFormat = getPDFFormat();

    switch (pdfFormat) {
      case "tsg":
        // Open TSG modal for user input
        setSelectedIncident(incident);
        setTSGModalOpen(true);
        break;

      case "default":
      default:
        // Use default PDF format
        setIsDownloading(true);
        try {
          await generatePDF(incident);
        } catch (error) {
          // Error is already handled in generatePDF
        } finally {
          setIsDownloading(false);
        }
        break;
    }
  };

  // Calculate statistics
  const resolvedCount = incidents.filter(
    (i) => i.status.toLowerCase() === "resolved"
  ).length;
  const dismissedCount = incidents.filter(
    (i) => i.status.toLowerCase() === "dismissed"
  ).length;
  const highPriorityCount = incidents.filter(
    (i) => i.priorityLevel === "HIGH"
  ).length;
  const mediumPriorityCount = incidents.filter(
    (i) => i.priorityLevel === "MEDIUM"
  ).length;
  const lowPriorityCount = incidents.filter(
    (i) => i.priorityLevel === "LOW"
  ).length;

  if (loading) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="Office  Incident History"
              subtitle="View and access past incident reports"
              showSearch={true}
              searchPlaceholder="Search incidents..."
              onSearch={setSearch}
            />
          </div>
          <PageLoader pageTitle="incident history" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] overflow-x-hidden ${inter.className}`}
    >
      <OfficeAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-30 flex-shrink-0">
          <OfficeAdminNavbar
            title="Office  Incident History"
            subtitle="View and access past incident reports"
            showSearch={true}
            searchPlaceholder="Search incidents..."
            onSearch={setSearch}
          />
        </div>

        {/* Loading Modal */}
        {isDownloading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
              </div>
              <p className="text-gray-700 font-medium">Generating PDF...</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] pt-16">
          <div
            className={`px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 ${
              collapsed
                ? "max-w-[calc(100vw-5rem-2rem)]"
                : "max-w-[calc(100vw-16rem-2rem)]"
            } mx-auto w-full`}
          >
            <div className="w-full max-w-full">
              {/* Status Filter Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-xl shadow-md border overflow-hidden relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    statusFilter === "All"
                      ? "border-[#8B0000] bg-[#fff9f9]"
                      : "border-gray-100"
                  }`}
                  onClick={() => setStatusFilter("All")}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg shadow-md ${
                          statusFilter === "All"
                            ? "bg-gradient-to-br from-[#8B0000] to-[#6B0000]"
                            : "bg-gradient-to-br from-gray-500 to-gray-600"
                        }`}
                      >
                        <History className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">
                          All Cases
                        </p>
                        <h3 className="text-3xl font-bold text-[#8B0000]">
                          {incidents.length}
                        </h3>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className={`bg-white rounded-xl shadow-md border overflow-hidden relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    statusFilter === "Resolved"
                      ? "border-[#8B0000] bg-[#fff9f9]"
                      : "border-gray-100"
                  }`}
                  onClick={() => setStatusFilter("Resolved")}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg shadow-md ${
                          statusFilter === "Resolved"
                            ? "bg-gradient-to-br from-[#8B0000] to-[#6B0000]"
                            : "bg-gradient-to-br from-green-500 to-green-600"
                        }`}
                      >
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">
                          Resolved
                        </p>
                        <h3 className="text-3xl font-bold text-green-500">
                          {resolvedCount}
                        </h3>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className={`bg-white rounded-xl shadow-md border overflow-hidden relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    statusFilter === "Dismissed"
                      ? "border-[#8B0000] bg-[#fff9f9]"
                      : "border-gray-100"
                  }`}
                  onClick={() => setStatusFilter("Dismissed")}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg shadow-md ${
                          statusFilter === "Dismissed"
                            ? "bg-gradient-to-br from-[#8B0000] to-[#6B0000]"
                            : "bg-gradient-to-br from-gray-500 to-gray-600"
                        }`}
                      >
                        <XCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">
                          Dismissed
                        </p>
                        <h3 className="text-3xl font-bold text-gray-500">
                          {dismissedCount}
                        </h3>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex flex-col gap-4 mb-6"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                      <Filter className="h-5 w-5 text-[#8B0000]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#8B0000]">
                      Priority Filters
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={priorityFilter === "All" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriorityFilter("All")}
                      className={
                        priorityFilter === "All"
                          ? "bg-[#8B0000] hover:bg-[#6B0000]"
                          : "border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                      }
                    >
                      All Priorities
                    </Button>
                    <Button
                      variant={
                        priorityFilter === "HIGH" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setPriorityFilter("HIGH")}
                      className={
                        priorityFilter === "HIGH"
                          ? "bg-red-600 hover:bg-red-700"
                          : "border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                      }
                    >
                      High
                    </Button>
                    <Button
                      variant={
                        priorityFilter === "MEDIUM" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setPriorityFilter("MEDIUM")}
                      className={
                        priorityFilter === "MEDIUM"
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "border-orange-200 text-orange-500 hover:bg-orange-500 hover:text-white"
                      }
                    >
                      Medium
                    </Button>
                    <Button
                      variant={priorityFilter === "LOW" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriorityFilter("LOW")}
                      className={
                        priorityFilter === "LOW"
                          ? "bg-green-600 hover:bg-green-700"
                          : "border-green-200 text-green-600 hover:bg-green-600 hover:text-white"
                      }
                    >
                      Low
                    </Button>
                  </div>

                  <div className="ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      {isRefreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
              >
                <div className="p-4 border-b border-[#DAA520]/20">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-[#8B0000]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#8B0000]">
                      Incident History
                      <span className="ml-2 text-sm bg-[#8B0000]/10 text-[#8B0000] px-2 py-0.5 rounded-full">
                        {filteredIncidents.length}
                      </span>
                    </h2>
                  </div>
                </div>

                {error ? (
                  <div className="p-6 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm inline-flex items-start gap-4">
                      <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                          Error Loading Incidents
                        </h3>
                        <p className="text-red-700">{error}</p>
                        <Button
                          className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white"
                          onClick={handleRefresh}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#DAA520]/20">
                      <thead className="bg-[#8B0000]/5">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Case ID
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Date Reported
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Incident Type
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Reporter
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Finished Date
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#DAA520]/20">
                        {paginatedIncidents.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-6 text-center">
                              <div className="w-16 h-16 bg-[#8B0000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="h-8 w-8 text-[#8B0000]" />
                              </div>
                              <p className="text-lg font-medium text-gray-800 mb-2">
                                No incidents found
                              </p>
                              <p className="text-gray-500 max-w-md mx-auto">
                                {search ||
                                statusFilter !== "All" ||
                                priorityFilter !== "All"
                                  ? "No incidents match your search criteria. Try adjusting your filters."
                                  : "There are no historical incidents to display at this time."}
                              </p>
                              {(search ||
                                statusFilter !== "All" ||
                                priorityFilter !== "All") && (
                                <Button
                                  variant="outline"
                                  className="mt-4 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                  onClick={() => {
                                    setSearch("");
                                    setStatusFilter("All");
                                    setPriorityFilter("All");
                                  }}
                                >
                                  Clear Filters
                                </Button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          paginatedIncidents.map((incident, index) => (
                            <motion.tr
                              key={incident.id}
                              className="hover:bg-[#8B0000]/5 transition-colors"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.2,
                                delay: index * 0.05,
                              }}
                            >
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className={`flex-shrink-0 h-8 w-1 rounded-full mr-3 ${
                                      incident.priorityLevel === "HIGH"
                                        ? "bg-red-400"
                                        : incident.priorityLevel === "MEDIUM"
                                        ? "bg-orange-400"
                                        : "bg-green-400"
                                    }`}
                                  ></div>
                                  <div className="text-sm font-medium text-[#8B0000]">
                                    {incident.trackingNumber}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                  {formatDateOnly(incident.submittedAt)}
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className={`bg-[#8B0000]/5 text-[#8B0000] border-[#DAA520]/30`}
                                >
                                  {incident.incidentType}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                  {incident.location}
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-700">
                                  <User className="h-4 w-4 text-gray-400 mr-2" />
                                  {incident.submittedByFullName}
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <Badge
                                  className={
                                    incident.priorityLevel === "HIGH"
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : incident.priorityLevel === "MEDIUM"
                                      ? "bg-orange-100 text-orange-800 border-orange-200"
                                      : "bg-green-100 text-green-800 border-green-200"
                                  }
                                >
                                  {incident.priorityLevel || "N/A"}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <Badge
                                  className={
                                    incident.status.toLowerCase() === "resolved"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-gray-100 text-gray-800 border-gray-200"
                                  }
                                >
                                  {incident.status.toLowerCase() === "dismissed"
                                    ? "Dismissed"
                                    : incident.status}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                                {incident.finishedDate
                                  ? formatDateOnly(incident.finishedDate)
                                  : "-"}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="mr-2 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                  onClick={() =>
                                    router.push(
                                      `/office-admin/incidents/tracking/${incident.trackingNumber}`
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                  onClick={() => handleDownloadPDF(incident)}
                                  disabled={isDownloading}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-[#DAA520]/20 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing{" "}
                      {paginatedIncidents.length === 0
                        ? 0
                        : (page - 1) * incidentsPerPage + 1}
                      -
                      {(page - 1) * incidentsPerPage +
                        paginatedIncidents.length}{" "}
                      of {filteredIncidents.length} incidents
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-[#DAA520]/30"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous page</span>
                      </Button>

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <Button
                              key={i}
                              variant={
                                page === pageNumber ? "default" : "outline"
                              }
                              size="sm"
                              className={`h-8 w-8 p-0 ${
                                page === pageNumber
                                  ? "bg-[#8B0000] text-white hover:bg-[#8B0000]/90"
                                  : "border-[#DAA520]/30"
                              }`}
                              onClick={() => setPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        }
                      )}

                      {totalPages > 5 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-[#DAA520]/30"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next page</span>
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* TSG PDF Modal */}
      {selectedIncident && (
        <TSGPDFModal
          incident={selectedIncident}
          isOpen={tsgModalOpen}
          onClose={() => {
            setTSGModalOpen(false);
            setSelectedIncident(null);
          }}
        />
      )}

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
