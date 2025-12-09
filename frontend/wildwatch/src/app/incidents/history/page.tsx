"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  History,
  Download,
  Eye,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { API_BASE_URL } from "@/utils/api";
import { formatLocationCompact } from "@/utils/locationFormatter";
import { api } from "@/utils/apiClient";
import { filterIncidentsByPrivacy } from "@/utils/anonymization";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Inter } from "next/font/google";
import { formatDateOnly, parseUTCDate } from "@/utils/dateUtils";
import { PageLoader } from "@/components/PageLoader";
import { useSidebar } from "@/contexts/SidebarContext";

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
  upvoteCount?: number;
  // Add other fields that might be in AnonymizedIncident
  timeOfIncident?: string;
  submittedBy?: string;
  submittedByIdNumber?: string;
  formattedAddress?: string;
  isAnonymous?: boolean;
  isPrivate?: boolean;
  preferAnonymous?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export default function IncidentHistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const res = await api.get("/api/incidents/my-incidents");

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      // Only show Resolved or Dismissed (case-insensitive)
      const statusFiltered = data.filter((i: Incident) =>
        ["resolved", "dismissed"].includes(i.status.toLowerCase())
      );
      // Users can see their own reports even if private (isViewerSubmitter = true)
      const anonymizedData = filterIncidentsByPrivacy(
        statusFiltered,
        false,
        true
      ) as Incident[];
      setIncidents(anonymizedData);
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

  // Calculate statistics
  const resolvedCount = incidents.filter(
    (i) => i.status.toLowerCase() === "resolved"
  ).length;
  const dismissedCount = incidents.filter(
    (i) => i.status.toLowerCase() === "dismissed"
  ).length;
  // removed unused priority counts and priority filters

  // Function to download incident details as PDF (aligned with TSG structure but tailored for report viewers)
  const handleDownloadPDF = async (incident: any) => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      const primary = { r: 139, g: 0, b: 0 };
      const neutral = { r: 55, g: 65, b: 81 };
      let cursorY = 26;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const formatDate = (dateString?: string) =>
        dateString ? formatDateOnly(dateString) : "-";

      const ensureSpace = (required: number) => {
        if (cursorY + required > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
      };

      const addHeader = async () => {
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.rect(0, 0, pageWidth, 38, "F");

        try {
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          logoImg.src = "/logo2.png";
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
          });
          const logoHeight = 18;
          const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
          doc.addImage(logoImg, "PNG", margin, 10, logoWidth, logoHeight);
        } catch (error) {
          // Keep clean header if logo fails to load
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text("Incident Report", pageWidth / 2, 16, { align: "center" });
        doc.setFontSize(11);
        doc.text(`Tracking #: ${incident.trackingNumber}`, pageWidth / 2, 24, {
          align: "center",
        });
        doc.setTextColor(255, 255, 255);
        doc.text(
          `Generated ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          pageWidth - margin,
          16,
          { align: "right" }
        );
        cursorY = 46;
        doc.setTextColor(0, 0, 0);
      };

      const addSectionTitle = (title: string) => {
        ensureSpace(14);
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.roundedRect(margin, cursorY, contentWidth, 9, 2, 2, "F");
        doc.text(title, margin + 4, cursorY + 6);
        cursorY += 14;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      };

      const addKeyValueGrid = (items: { label: string; value: string }[]) => {
        const colWidth = contentWidth / 2 - 4;
        const labelColor = neutral;
        for (let i = 0; i < items.length; i += 2) {
          ensureSpace(10);
          const left = items[i];
          const right = items[i + 1];
          doc.setFont("helvetica", "bold");
          doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
          doc.text(left.label, margin, cursorY);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          const leftLines = doc.splitTextToSize(left.value || "-", colWidth);
          doc.text(leftLines, margin, cursorY + 4);

          if (right) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
            doc.text(right.label, margin + colWidth + 8, cursorY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const rightLines = doc.splitTextToSize(
              right.value || "-",
              colWidth
            );
            doc.text(rightLines, margin + colWidth + 8, cursorY + 4);
            const height =
              Math.max(leftLines.length, rightLines.length) * 5 + 6;
            cursorY += height;
          } else {
            const height = leftLines.length * 5 + 6;
            cursorY += height;
          }
        }
        cursorY += 2;
      };

      const addTagRow = (
        tags: { label: string; value: string; color: string }[]
      ) => {
        ensureSpace(14);
        let x = margin;
        tags.forEach((tag) => {
          const textWidth = doc.getTextWidth(`${tag.label}: ${tag.value}`);
          const boxWidth = textWidth + 10;
          if (x + boxWidth > pageWidth - margin) {
            cursorY += 10;
            ensureSpace(14);
            x = margin;
          }
          const color = tag.color;
          doc.setDrawColor(color);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(x, cursorY, boxWidth, 8, 2, 2, "FD");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(color);
          doc.text(`${tag.label}: `, x + 3, cursorY + 5);
          const labelWidth = doc.getTextWidth(`${tag.label}: `);
          doc.setFont("helvetica", "normal");
          doc.text(tag.value || "-", x + 3 + labelWidth, cursorY + 5);
          x += boxWidth + 4;
        });
        cursorY += 12;
        doc.setTextColor(0, 0, 0);
      };

      const addParagraph = (label: string, text: string) => {
        ensureSpace(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(neutral.r, neutral.g, neutral.b);
        doc.text(label, margin, cursorY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        cursorY += 5;
        const lines = doc.splitTextToSize(text || "-", contentWidth);
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(235, 235, 235);
        const boxHeight = lines.length * 6 + 6;
        doc.roundedRect(
          margin,
          cursorY - 4,
          contentWidth,
          boxHeight,
          2,
          2,
          "FD"
        );
        doc.text(lines, margin + 3, cursorY + 2);
        cursorY += boxHeight + 4;
      };

      const addTable = (
        title: string,
        head: string[],
        body: (string | number)[][]
      ) => {
        if (!body.length) return;
        addSectionTitle(title);
        const startY = cursorY;
        // @ts-ignore - autoTable is attached by the jspdf-autotable plugin
        doc.autoTable({
          head: [head],
          body,
          startY,
          margin: { left: margin, right: margin },
          styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: [primary.r, primary.g, primary.b],
            textColor: 255,
            halign: "left",
          },
          alternateRowStyles: { fillColor: [248, 248, 248] },
          theme: "grid",
        });
        // @ts-ignore - jsPDF autoTable attaches lastAutoTable
        cursorY = doc.lastAutoTable.finalY + 10;
      };

      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(primary.r, primary.g, primary.b);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFontSize(9);
        doc.setTextColor(primary.r, primary.g, primary.b);
        doc.text(`Page ${pageNum} of ${totalPages}`, margin, pageHeight - 8);
        doc.text(
          `Case ${incident.trackingNumber}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
        doc.text("WildWatch", pageWidth - margin, pageHeight - 8, {
          align: "right",
        });
        doc.setTextColor(0, 0, 0);
      };

      await addHeader();

      // Case Snapshot tags
      addTagRow([
        {
          label: "Status",
          value: incident.status || "-",
          color: "#0f766e",
        },
        {
          label: "Priority",
          value: incident.priorityLevel || "Not set",
          color:
            incident.priorityLevel === "HIGH"
              ? "#b91c1c"
              : incident.priorityLevel === "MEDIUM"
              ? "#ea580c"
              : "#15803d",
        },
        {
          label: "Submitted",
          value: formatDate(incident.submittedAt),
          color: "#374151",
        },
        {
          label: "Finished",
          value: formatDate(incident.finishedDate),
          color: "#374151",
        },
      ]);

      // Case Information
      addSectionTitle("Case Information");
      addKeyValueGrid([
        { label: "Case ID", value: incident.trackingNumber || "-" },
        { label: "Incident Type", value: incident.incidentType || "-" },
        {
          label: "Date of Incident",
          value: formatDate(incident.dateOfIncident),
        },
        {
          label: "Time of Incident",
          value: incident.timeOfIncident || "-",
        },
        {
          label: "Location",
          value:
            incident.formattedAddress ||
            formatLocationCompact(incident) ||
            incident.location ||
            "-",
        },
        {
          label: "Assigned Department",
          value: incident.officeAdminName || "-",
        },
      ]);

      // Reporter details and privacy
      addSectionTitle("Reporter");
      addKeyValueGrid([
        {
          label: "Reporter Name",
          value: incident.firstName + " " + incident.lastName || "-",
        },
        { label: "Email", value: incident.email || "-" },
        { label: "Phone", value: incident.phone || "-" },
        {
          label: "Reporter ID",
          value: incident.submittedByIdNumber || "-",
        },
      ]);
      addTagRow([
        {
          label: "Privacy",
          value: incident.isPrivate ? "Private" : "Shareable",
          color: incident.isPrivate ? "#1d4ed8" : "#15803d",
        },
        {
          label: "Prefer Anonymous",
          value: incident.preferAnonymous ? "Yes" : "No",
          color: incident.preferAnonymous ? "#b91c1c" : "#374151",
        },
        {
          label: "Submitted By",
          value: incident.isAnonymous ? "Anonymous" : "Identified",
          color: incident.isAnonymous ? "#6b7280" : "#0f766e",
        },
      ]);

      // Narrative
      addParagraph("Narrative / Description", incident.description || "-");

      // Evidence summary
      if (Array.isArray(incident.evidence) && incident.evidence.length > 0) {
        const evidenceRows = incident.evidence.map((file: any, idx: number) => [
          `${idx + 1}. ${file.fileName || "File"}`,
          file.fileType || "-",
          `${((file.fileSize || 0) / 1024 / 1024).toFixed(2)} MB`,
          formatDate(file.uploadedAt),
        ]);
        addTable(
          "Evidence",
          ["File", "Type", "Size", "Uploaded"],
          evidenceRows
        );
      }

      // Witnesses
      if (Array.isArray(incident.witnesses) && incident.witnesses.length > 0) {
        const witnessRows = incident.witnesses.map(
          (witness: any, idx: number) => [
            `${idx + 1}`,
            witness.name || "(witness)",
            witness.additionalNotes || "-",
          ]
        );
        addTable("Witnesses", ["#", "Name", "Notes"], witnessRows);
      }

      // Case updates timeline
      if (Array.isArray(incident.updates) && incident.updates.length > 0) {
        const updatesRows = incident.updates.map((update: any, idx: number) => [
          formatDate(update.updatedAt),
          update.title || update.status || `Update ${idx + 1}`,
          update.message || update.description || "-",
          update.updatedByName ||
            update.updatedByFullName ||
            update.author ||
            "-",
        ]);
        addTable(
          "Case Updates",
          ["Date", "Title / Status", "Details", "Updated By"],
          updatesRows
        );
      }

      // Additional notes and resolution details
      const resolutionNotes =
        incident.resolutionNotes ||
        incident.administrativeNotes ||
        incident.verificationNotes;
      if (resolutionNotes) {
        addParagraph("Resolution / Administrative Notes", resolutionNotes);
      }

      // Footer for every page
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      doc.save(`Incident_Report_${incident.trackingNumber}.pdf`);
      toast.success("PDF Downloaded Successfully", {
        description: `Incident report for ${incident.trackingNumber} has been downloaded.`,
        duration: 3000,
        id: `pdf-download-success-${Date.now()}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to Download PDF", {
        id: "pdf-download-error",
        description: "There was an error generating the PDF. Please try again.",
        duration: 3000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}
      >
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Navbar */}
          <div className="sticky top-0 z-30 flex-shrink-0">
            <Navbar
              title="Incident History"
              subtitle="View and access past incident reports"
              onSearch={setSearch}
            />
          </div>

          {/* PageLoader - fills the remaining space below Navbar */}
          <PageLoader pageTitle="incident history" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] overflow-x-hidden ${inter.className}`}
    >
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <div className="sticky top-0 z-30 flex-shrink-0">
          <Navbar
            title="Incident History"
            subtitle="View and access past incident reports"
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] pt-16">
          <div
            className={`px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 ${
              collapsed
                ? "max-w-[calc(100vw-5rem-2rem)]"
                : "max-w-[calc(100vw-16rem-2rem)]"
            } mx-auto w-full`}
          >
            <div className="w-full max-w-full -mt-20">
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

              {/* Refresh control */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex justify-end mb-6"
              >
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
                          {/* Priority hidden for regular users */}
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                            {" "}
                            Finished Date{" "}
                          </th>

                          <th className="px-3 py-3 text-center text-xs font-medium text-[#8B0000] uppercase tracking-wider sticky right-0 bg-[#FFFFFF] z-10">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#DAA520]/20">
                        {paginatedIncidents.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-6 text-center">
                              <div className="w-16 h-16 bg-[#8B0000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="h-8 w-8 text-[#8B0000]" />
                              </div>
                              <p className="text-lg font-medium text-gray-800 mb-2">
                                No incidents found
                              </p>
                              <p className="text-gray-500 max-w-md mx-auto">
                                {search || statusFilter !== "All"
                                  ? "No incidents match your search criteria. Try adjusting your filters."
                                  : "There are no historical incidents to display at this time."}
                              </p>
                              {(search || statusFilter !== "All") && (
                                <Button
                                  variant="outline"
                                  className="mt-4 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                  onClick={() => {
                                    setSearch("");
                                    setStatusFilter("All");
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
                                  {formatLocationCompact(incident)}
                                </div>
                              </td>

                              {/* Priority hidden for regular users */}
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
                              <td className="px-3 py-3 whitespace-nowrap text-center sticky right-0 bg-white z-10">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="mr-2 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                                  onClick={() =>
                                    router.push(
                                      `/incidents/tracking/${incident.trackingNumber}`
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
//test
