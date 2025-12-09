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
import { formatLocationCompact } from "@/utils/locationFormatter";
import { api } from "@/utils/apiClient";
import { filterIncidentsByPrivacy } from "@/utils/anonymization";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Inter } from "next/font/google";
import { formatDateOnly, parseUTCDate, formatTime } from "@/utils/dateUtils";
import { PageLoader } from "@/components/PageLoader";
import { useSidebar } from "@/contexts/SidebarContext";

const inter = Inter({ subsets: ["latin"] });

/* -------------------------------------------------------------------------- */
/*                                INTERFACES                                  */
/* -------------------------------------------------------------------------- */

interface Incident {
  id: string;
  trackingNumber: string;
  dateOfIncident: string;
  submittedAt: string;
  incidentType: string;
  location: string;
  submittedByFullName: string;
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

/* -------------------------------------------------------------------------- */
/*                            COMPONENT START                                  */
/* -------------------------------------------------------------------------- */

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

  /* ------------------------- INITIAL QUERY PARAM PARSE ------------------------- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("status");
      if (s) setStatusFilter(s);
    }
  }, []);

  /* ------------------------------- FETCH INCIDENTS ------------------------------ */
  const fetchIncidents = async () => {
    try {
      setError(null);
      const res = await api.get("/api/incidents/my-incidents");

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      const statusFiltered = data.filter((i: Incident) =>
        ["resolved", "dismissed"].includes(i.status.toLowerCase())
      );

      const anonymized = filterIncidentsByPrivacy(statusFiltered, false, true);

      setIncidents(anonymized as Incident[]);
    } catch (e) {
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

  /* -------------------------------------------------------------------------- */
  /*                                FILTER AND PAGING                            */
  /* -------------------------------------------------------------------------- */

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

  const resolvedCount = incidents.filter(
    (i) => i.status.toLowerCase() === "resolved"
  ).length;

  const dismissedCount = incidents.filter(
    (i) => i.status.toLowerCase() === "dismissed"
  ).length;

  /* -------------------------------------------------------------------------- */
  /*                          PDF GENERATION (REFORMATTED)                      */
  /* -------------------------------------------------------------------------- */

  const handleDownloadPDF = async (incident: any) => {
    setIsDownloading(true);

    try {
      await import("jspdf-autotable");

      /* ---------------------------- FETCH FULL CASE ---------------------------- */
      const fullIncidentRes = await api.get(
        `/api/incidents/track/${incident.trackingNumber}`
      );
      if (!fullIncidentRes.ok)
        throw new Error(
          `Failed to fetch full incident: ${fullIncidentRes.status}`
        );

      const fullIncident = await fullIncidentRes.json();

      /* ------------------------------ FETCH UPDATES ----------------------------- */
      let updates: any[] = [];
      if (fullIncident.id) {
        try {
          const updatesRes = await api.get(
            `/api/incidents/${fullIncident.id}/updates`
          );
          if (updatesRes.ok) {
            updates = await updatesRes.json();
            updates.sort(
              (a: any, b: any) =>
                new Date(a.updatedAt).getTime() -
                new Date(b.updatedAt).getTime()
            );
          }
        } catch {}
      }

      fullIncident.updates = updates;

      /* ------------------------------ PDF BASE SETUP ----------------------------- */

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

      /* ------------------------------- HELPERS ---------------------------------- */

      const formatDate = (d?: string) => (d ? formatDateOnly(d) : "-");

      const formatDateTime = (d?: string) => {
        if (!d) return "-";
        try {
          const dt = new Date(d);
          const hours = dt.getHours();
          const minutes = dt.getMinutes();
          const ampm = hours >= 12 ? "PM" : "AM";
          const displayHours = hours % 12 || 12;
          const displayMinutes = minutes.toString().padStart(2, "0");
          const timeString = `${displayHours}:${displayMinutes} ${ampm}`;
          return `${formatDateOnly(d)} ${timeString}`;
        } catch {
          return formatDateOnly(d);
        }
      };

      const ensureSpace = (needed: number) => {
        if (cursorY + needed > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
      };

      /* ----------------------------- HEADER SECTION ----------------------------- */

      const addHeader = async () => {
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.rect(0, 0, pageWidth, 38, "F");

        try {
          const logoImg = new Image();
          logoImg.src = "/logo2.png";
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
          });

          const logoHeight = 18;
          const logoWidth = (logoImg.width / logoImg.height) * logoHeight;

          doc.addImage(logoImg, "PNG", margin, 10, logoWidth, logoHeight);
        } catch {}

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text("Incident Report", pageWidth / 2, 16, { align: "center" });

        doc.setFontSize(11);
        doc.text(
          `Tracking #: ${fullIncident.trackingNumber}`,
          pageWidth / 2,
          24,
          {
            align: "center",
          }
        );

        doc.text(
          `Generated ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          pageWidth - margin,
          16,
          { align: "right" }
        );

        cursorY = 46;
        doc.setTextColor(0, 0, 0);
      };

      /* ---------------------------- SECTION TITLE + GRID ---------------------------- */

      const addSectionTitle = (title: string) => {
        ensureSpace(14);
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.roundedRect(margin, cursorY, contentWidth, 9, 2, 2, "F");
        doc.text(title, margin + 4, cursorY + 6);
        cursorY += 14;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
      };

      const addKeyValueGrid = (items: { label: string; value: string }[]) => {
        const colWidth = contentWidth / 2 - 4;

        for (let i = 0; i < items.length; i += 2) {
          ensureSpace(10);

          const left = items[i];
          const right = items[i + 1];

          doc.setFont("helvetica", "bold");
          doc.setTextColor(neutral.r, neutral.g, neutral.b);
          doc.text(left.label, margin, cursorY);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);

          const leftLines = doc.splitTextToSize(left.value || "-", colWidth);
          doc.text(leftLines, margin, cursorY + 4);

          let height = leftLines.length * 5 + 6;

          if (right) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(neutral.r, neutral.g, neutral.b);
            doc.text(right.label, margin + colWidth + 8, cursorY);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);

            const rightLines = doc.splitTextToSize(
              right.value || "-",
              colWidth
            );
            doc.text(rightLines, margin + colWidth + 8, cursorY + 4);

            height = Math.max(leftLines.length, rightLines.length) * 5 + 6;
          }

          cursorY += height;
        }

        cursorY += 2;
      };

      /* ---------------------------- TAG ROWS ----------------------------------- */

      const addTagRow = (
        tags: {
          label: string;
          value: string;
          color: string;
          description?: string;
        }[]
      ) => {
        const hasDescriptions = tags.some((tag) => tag.description);
        const gap = 6; // Gap between columns
        const colWidth = (contentWidth - gap * (tags.length - 1)) / tags.length;
        const baseTagHeight = 8;
        const descLineHeight = 3.5;

        // Calculate max height needed
        let maxHeight = baseTagHeight;
        tags.forEach((tag) => {
          if (tag.description) {
            doc.setFontSize(7);
            const descLines = doc.splitTextToSize(
              tag.description,
              colWidth - 6
            );
            const tagText = `${tag.label}: ${tag.value}`;
            doc.setFontSize(10);
            const valueLines = doc.splitTextToSize(tagText, colWidth - 6);
            const totalHeight =
              5 + valueLines.length * 5 + descLines.length * descLineHeight + 2;
            if (totalHeight > maxHeight) {
              maxHeight = totalHeight;
            }
          }
        });
        doc.setFontSize(11);

        ensureSpace(maxHeight + 4);

        let x = margin;

        tags.forEach((tag) => {
          const boxWidth = colWidth;
          const boxX = x;

          // Draw tag box
          doc.setDrawColor(tag.color);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(boxX, cursorY, boxWidth, maxHeight, 2, 2, "FD");

          // Draw tag label and value
          doc.setFont("helvetica", "bold");
          doc.setTextColor(tag.color);
          doc.setFontSize(10);
          doc.text(`${tag.label}: `, boxX + 3, cursorY + 5);

          const labelWidth = doc.getTextWidth(`${tag.label}: `);

          doc.setFont("helvetica", "normal");
          const valueLines = doc.splitTextToSize(
            tag.value,
            boxWidth - labelWidth - 6
          );
          doc.text(valueLines, boxX + 3 + labelWidth, cursorY + 5);
          doc.setFontSize(11);

          // Draw description if present
          let descY = cursorY + 5 + valueLines.length * 5 + 2;
          if (tag.description) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            const descLines = doc.splitTextToSize(
              tag.description,
              boxWidth - 6
            );
            doc.text(descLines, boxX + 3, descY);
            doc.setFontSize(11);
          }

          x += boxWidth + gap;
        });

        cursorY += maxHeight + 4;
        doc.setTextColor(0, 0, 0);
      };

      /* ---------------------------- PARAGRAPH BLOCK ---------------------------- */

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

      /* ---------------------------- TABLES ------------------------------------- */

      const addTable = (
        title: string,
        head: string[],
        body: (string | number)[][]
      ) => {
        if (!body.length) return;

        addSectionTitle(title);

        const startY = cursorY;

        if (typeof (doc as any).autoTable === "function") {
          (doc as any).autoTable({
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

          cursorY = (doc as any).lastAutoTable.finalY + 10;
        }
      };

      /* ---------------------------- FOOTER ------------------------------------- */

      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(primary.r, primary.g, primary.b);
        doc.setLineWidth(0.4);

        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(9);
        doc.setTextColor(primary.r, primary.g, primary.b);

        doc.text(`Page ${pageNum} of ${totalPages}`, margin, pageHeight - 8);

        doc.text(
          `Case ${fullIncident.trackingNumber}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );

        doc.text("WildWatch", pageWidth - margin, pageHeight - 8, {
          align: "right",
        });

        doc.setTextColor(0, 0, 0);
      };

      /* ---------------------------- HEADER RENDER ------------------------------- */
      await addHeader();

      /* ---------------------------- CASE SNAPSHOT TAGS --------------------------- */

      addTagRow([
        {
          label: "Status",
          value: fullIncident.status || "-",
          color: "#0f766e",
        },
        {
          label: "Submitted",
          value: formatDate(fullIncident.submittedAt),
          color: "#374151",
        },
        {
          label: "Finished",
          value: formatDate(fullIncident.finishedDate),
          color: "#374151",
        },
      ]);

      /* ---------------------------- CASE INFO ----------------------------------- */

      addSectionTitle("Case Information");

      addKeyValueGrid([
        { label: "Case ID", value: fullIncident.trackingNumber || "-" },
        { label: "Incident Type", value: fullIncident.incidentType || "-" },
        {
          label: "Date of Incident",
          value: formatDate(fullIncident.dateOfIncident),
        },
        {
          label: "Time of Incident",
          value: fullIncident.timeOfIncident || "-",
        },
        {
          label: "Location",
          value:
            fullIncident.formattedAddress ||
            formatLocationCompact(fullIncident) ||
            fullIncident.location ||
            "-",
        },
        {
          label: "Assigned Department",
          value: fullIncident.officeAdminName || "-",
        },
      ]);

      /* ---------------------------- REPORTER ------------------------------------ */

      addSectionTitle("Reporter");

      const reporterName =
        fullIncident.submittedByFullName ||
        (fullIncident.firstName && fullIncident.lastName
          ? `${fullIncident.firstName} ${fullIncident.lastName}`
          : "-");

      addKeyValueGrid([
        { label: "Reporter Name", value: reporterName },
        { label: "Email", value: fullIncident.submittedByEmail || "-" },
        { label: "Phone", value: fullIncident.submittedByPhone || "-" },
        {
          label: "Reporter ID",
          value: fullIncident.submittedByIdNumber || "-",
        },
      ]);

      addTagRow([
        {
          label: "Privacy",
          value: fullIncident.isPrivate ? "Private" : "Shareable",
          color: fullIncident.isPrivate ? "#1d4ed8" : "#15803d",
          description: fullIncident.isPrivate
            ? "Report is private and not visible to other users"
            : "Report can be shared and viewed by other users",
        },
        {
          label: "Prefer Anonymous",
          value: fullIncident.preferAnonymous ? "Yes" : "No",
          color: fullIncident.preferAnonymous ? "#b91c1c" : "#374151",
          description: fullIncident.preferAnonymous
            ? "Reporter prefers to remain anonymous. This can be changed by the office admin."
            : "Reporter is identified in the report",
        },
      ]);

      /* ---------------------------- NARRATIVE ---------------------------------- */

      addParagraph("Narrative / Description", fullIncident.description || "-");

      /* ---------------------------- EVIDENCE ----------------------------------- */

      // Evidence summary table
      if (
        Array.isArray(fullIncident.evidence) &&
        fullIncident.evidence.length > 0
      ) {
        const evidenceRows = fullIncident.evidence.map(
          (file: any, idx: number) => [
            `${idx + 1}. ${file.fileName || "File"}`,
            file.fileType || "-",
            `${((file.fileSize || 0) / 1024 / 1024).toFixed(2)} MB`,
            formatDate(file.uploadedAt),
          ]
        );

        addTable(
          "Evidence",
          ["File", "Type", "Size", "Uploaded"],
          evidenceRows
        );

        // Load and display evidence images
        const imageFiles = fullIncident.evidence.filter((file: any) =>
          file.fileType?.startsWith("image/")
        );

        if (imageFiles.length > 0) {
          ensureSpace(30);
          addSectionTitle("Evidence Images");
          cursorY += 5;

          const imagePromises = imageFiles.map(
            async (file: any, index: number) => {
              try {
                if (!file.fileUrl || !file.fileUrl.trim()) {
                  throw new Error("No fileUrl provided");
                }

                const imageUrl = `${file.fileUrl}?t=${new Date().getTime()}`;
                let response: Response;
                try {
                  response = await fetch(imageUrl, {
                    method: "GET",
                    mode: "cors",
                    credentials: "omit",
                    cache: "no-cache",
                  });
                } catch (fetchError) {
                  // Retry without CORS mode
                  response = await fetch(imageUrl, {
                    method: "GET",
                    credentials: "omit",
                    cache: "no-cache",
                  });
                }

                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch image: ${response.status} ${response.statusText}`
                  );
                }

                const blob = await response.blob();
                if (!blob.type.startsWith("image/")) {
                  throw new Error(`Blob is not an image: ${blob.type}`);
                }

                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (typeof reader.result === "string") {
                      resolve(reader.result);
                    } else {
                      reject(new Error("Failed to convert blob to base64"));
                    }
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });

                const img = new Image();
                img.crossOrigin = "anonymous";

                await new Promise<HTMLImageElement>((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error("Image load timeout"));
                  }, 15000);

                  img.onload = () => {
                    clearTimeout(timeout);
                    resolve(img);
                  };
                  img.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                  };
                  img.src = base64;
                });

                // Scale images to fit PDF (max 75mm width or height)
                const maxSize = 75;
                let imgWidth = img.width;
                let imgHeight = img.height;
                const widthRatio = maxSize / imgWidth;
                const heightRatio = maxSize / imgHeight;
                const ratio = Math.min(widthRatio, heightRatio);
                imgWidth = imgWidth * ratio;
                imgHeight = imgHeight * ratio;

                return {
                  img,
                  imgWidth,
                  imgHeight,
                  fileName: file.fileName,
                  index: index + 1,
                  base64,
                  error: false,
                };
              } catch (error) {
                console.error(`Error loading image ${file.fileName}:`, error);
                return {
                  img: null,
                  imgWidth: 0,
                  imgHeight: 0,
                  fileName: file.fileName,
                  index: index + 1,
                  error: true,
                };
              }
            }
          );

          const loadedImages = await Promise.all(imagePromises);
          const validImages = loadedImages.filter(
            (img) => img && !img.error && img.img !== null
          );

          if (validImages.length > 0) {
            const imageSize = 75;
            const imageGap = 10;
            const captionHeight = 8;
            const imagesPerRow = 2;
            const rowWidth =
              imagesPerRow * imageSize + (imagesPerRow - 1) * imageGap;
            const startX = margin + (contentWidth - rowWidth) / 2;

            let currentRow: any[] = [];
            for (let i = 0; i < validImages.length; i++) {
              if (!validImages[i]) continue;
              currentRow.push(validImages[i]);

              if (
                currentRow.length === imagesPerRow ||
                i === validImages.length - 1
              ) {
                const totalRowHeight = imageSize + captionHeight + 10;

                if (cursorY + totalRowHeight > pageHeight - 20) {
                  doc.addPage();
                  cursorY = 20;
                  addSectionTitle("Evidence Images (continued)");
                  cursorY += 5;
                }

                let xPosition = startX;
                currentRow.forEach((imageData) => {
                  // Draw image container background
                  doc.setFillColor(248, 248, 248);
                  doc.setDrawColor(200, 200, 200);
                  doc.roundedRect(
                    xPosition,
                    cursorY,
                    imageSize,
                    imageSize + captionHeight,
                    2,
                    2,
                    "FD"
                  );

                  // Add image
                  if (imageData.base64) {
                    try {
                      doc.addImage(
                        imageData.base64,
                        "JPEG",
                        xPosition + (imageSize - imageData.imgWidth) / 2,
                        cursorY + 2,
                        imageData.imgWidth,
                        imageData.imgHeight,
                        undefined,
                        "FAST"
                      );
                    } catch (error) {
                      console.error("Error adding image to PDF:", error);
                    }
                  }

                  // Add caption
                  doc.setFontSize(8);
                  doc.setFont("helvetica", "normal");
                  doc.setTextColor(0, 0, 0);
                  const captionText = `Image ${imageData.index}: ${imageData.fileName}`;
                  const captionLines = doc.splitTextToSize(
                    captionText,
                    imageSize - 4
                  );
                  doc.text(
                    captionLines,
                    xPosition + 2,
                    cursorY + imageSize + 4
                  );
                  doc.setFontSize(11);

                  xPosition += imageSize + imageGap;
                });

                cursorY += totalRowHeight;
                currentRow = [];
              }
            }
            cursorY += 5;
          }
        }
      }

      /* ---------------------------- WITNESSES ----------------------------------- */

      if (
        Array.isArray(fullIncident.witnesses) &&
        fullIncident.witnesses.length
      ) {
        const witnessRows = fullIncident.witnesses.map((w: any, i: number) => [
          `${i + 1}`,
          w.name || "(witness)",
          w.additionalNotes || "-",
        ]);

        addTable("Witnesses", ["#", "Name", "Notes"], witnessRows);
      }

      /* ---------------------------- ACTION TAKEN -------------------------------- */

      addSectionTitle("Action Taken");

      if (
        Array.isArray(fullIncident.updates) &&
        fullIncident.updates.length > 0
      ) {
        // Filter out updates without content
        const validUpdates = fullIncident.updates.filter(
          (u: any) => u.message || u.description || u.title
        );

        if (validUpdates.length > 0) {
          const stepSpacing = 20; // Space between each step
          const circleRadius = 2.5; // Radius of the process indicator circle
          const lineStartX = margin + circleRadius;
          const contentStartX = margin + 12; // Start of text content
          const contentWidthForSteps = contentWidth - 12;

          validUpdates.forEach((update: any, index: number) => {
            // Estimate step height for page break checking
            const estimatedStepHeight = stepSpacing + 15;
            if (cursorY + estimatedStepHeight > pageHeight - 20) {
              // Draw continuation line from previous page
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.5);
              doc.line(lineStartX, margin - 5, lineStartX, cursorY);
              cursorY = margin;
              addSectionTitle("Action Taken (continued)");
              cursorY += 5;
            }

            const stepY = cursorY;

            // Draw connecting line from previous step (except for first step)
            if (index > 0) {
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.5);
              const lineStartY = stepY - stepSpacing;
              doc.line(
                lineStartX,
                lineStartY,
                lineStartX,
                stepY - circleRadius
              );
            }

            // Draw process indicator circle
            doc.setFillColor(70, 130, 180); // Steel blue color
            doc.circle(lineStartX, stepY, circleRadius, "F");

            // Draw date/time
            const dateTime = formatDateTime(update.updatedAt);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(dateTime, contentStartX, stepY - 1);

            // Draw action title/status
            const actionTitle =
              update.title ||
              update.status ||
              (update.message?.toLowerCase().includes("verified")
                ? "Verification"
                : update.message?.toLowerCase().includes("transferred")
                ? "Case Transfer"
                : update.message?.toLowerCase().includes("resolved")
                ? "Resolution"
                : update.message?.toLowerCase().includes("dismissed")
                ? "Dismissal"
                : "Update") ||
              "Action";

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(actionTitle, contentStartX, stepY + 4);

            // Draw action message/description
            const actionMessage =
              update.message || update.description || "No details provided";
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const messageLines = doc.splitTextToSize(
              actionMessage,
              contentWidthForSteps - 2
            );
            doc.text(messageLines, contentStartX, stepY + 8);

            // Update Y position for next step
            cursorY = stepY + stepSpacing + messageLines.length * 4 + 4;

            // Draw connecting line to next step (if not last)
            if (index < validUpdates.length - 1) {
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.5);
              const nextLineY = cursorY - stepSpacing + circleRadius;
              doc.line(lineStartX, stepY + circleRadius, lineStartX, nextLineY);
            }
          });

          cursorY += 5;
        } else {
          // No valid updates, fall through to resolution notes
          const notes =
            fullIncident.resolutionNotes ||
            fullIncident.administrativeNotes ||
            fullIncident.verificationNotes ||
            "No action details specified";

          ensureSpace(20);

          const lines = doc.splitTextToSize(notes, contentWidth - 4);
          const height = lines.length * 6 + 4;

          doc.setFillColor(230, 230, 250);
          doc.roundedRect(margin, cursorY - 2, contentWidth, height, 2, 2, "F");
          doc.text(lines, margin + 2, cursorY + 2);

          cursorY += height + 10;
        }
      } else {
        const notes =
          fullIncident.resolutionNotes ||
          fullIncident.administrativeNotes ||
          fullIncident.verificationNotes ||
          "No action details specified";

        ensureSpace(20);

        const lines = doc.splitTextToSize(notes, contentWidth - 4);
        const height = lines.length * 6 + 4;

        doc.setFillColor(230, 230, 250);
        doc.roundedRect(margin, cursorY - 2, contentWidth, height, 2, 2, "F");
        doc.text(lines, margin + 2, cursorY + 2);

        cursorY += height + 10;
      }

      /* ---------------------------- FOOTERS PER PAGE ---------------------------- */

      const total = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        addFooter(i, total);
      }

      /* ---------------------------- SAVE FILE ----------------------------------- */

      doc.save(`Incident_Report_${fullIncident.trackingNumber}.pdf`);

      toast.success("PDF Downloaded Successfully");
    } catch (error) {
      toast.error("Failed to Download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              UI RENDER START                                */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div
        className={`flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <Navbar
              title="Incident History"
              subtitle="View and access past incident reports"
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
