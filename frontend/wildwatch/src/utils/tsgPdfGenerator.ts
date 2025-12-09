import jsPDF from "jspdf";
import { formatDateOnly } from "@/utils/dateUtils";
import {
  getBuildingCode,
  getBuildingName,
  formatLocationString,
} from "@/utils/locationFormatter";

// Helper function to format date and time
function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const dateStr = formatDateOnly(dateString);
    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  } catch {
    return dateString;
  }
}

interface Evidence {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface IncidentUpdate {
  id?: number;
  title?: string;
  status?: string;
  message?: string;
  description?: string;
  updatedAt: string;
  updatedByName?: string;
  updatedByFullName?: string;
  author?: string;
}

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
  resolutionNotes?: string;
  evidence?: Evidence[];
  witnesses?: any[];
  updates?: IncidentUpdate[];
  administrativeNotes?: string;
  verificationNotes?: string;
  // Location data fields (optional, for enhanced formatting)
  formattedAddress?: string;
  buildingName?: string;
  buildingCode?: string;
  room?: string;
  building?: {
    fullName?: string;
    code?: string;
  };
}

interface PreloadedImage {
  img: HTMLImageElement;
  base64: string;
  imgWidth: number;
  imgHeight: number;
}

export async function generateTSGPDF(
  incident: Incident,
  reportedBy: string,
  titleRole: string,
  signatureImage: string | null,
  preloadedImages: Map<string, PreloadedImage>,
  impactOfIncident?: string | null,
  affectedSystemResources?: string | null,
  initialAssessment?: string | null
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 15;
  const contentWidth = 180;
  let y = 15;
  const lineHeight = 6;
  const pageHeight = 280;
  let currentPage = 1;
  let isFirstPage = true;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const checkNewPage = (requiredSpace: number): boolean => {
    if (y + requiredSpace > pageHeight) {
      doc.addPage();
      currentPage++;
      y = margin;
      isFirstPage = false;
      return true;
    }
    return false;
  };

  // Header with CIT Logo
  const pageWidth = 210;
  if (isFirstPage) {
    try {
      const citLogoImg = new Image();
      citLogoImg.crossOrigin = "anonymous";
      citLogoImg.src = "/cit-logo.png";
      await new Promise((resolve, reject) => {
        citLogoImg.onload = resolve;
        citLogoImg.onerror = reject;
      });
      const logoHeight = 25;
      const logoWidth = (citLogoImg.width / citLogoImg.height) * logoHeight;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(citLogoImg, "PNG", logoX, y, logoWidth, logoHeight);
      y += logoHeight + 8;
    } catch (error) {
      // Logo loading failed, continue without logo
      y += 10;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const titleText = "CIT-U IT Resources Incident Report Form";
    const titleWidth = doc.getTextWidth(titleText);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(titleText, titleX, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
  }

  // Reporter Information Section
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const labelWidth = 30;
  const fieldStart = margin + labelWidth;
  const rightColumnStart = margin + 105;
  const rightLabelWidth = 40;
  const rightFieldStart = rightColumnStart + rightLabelWidth;
  const lineOffset = 3;

  doc.text("REPORTED BY:", margin, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  doc.line(fieldStart, y + lineOffset, rightColumnStart - 5, y + lineOffset);
  doc.text(reportedBy, fieldStart + 2, y);

  doc.text("DATE OF REPORT:", rightColumnStart, y);
  doc.line(
    rightFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  const reportDate = formatDateOnly(new Date().toISOString());
  doc.text(reportDate, rightFieldStart + 2, y);
  y += 8;

  doc.text("TITLE / ROLE:", margin, y);
  doc.line(fieldStart, y + lineOffset, rightColumnStart - 5, y + lineOffset);
  doc.text(titleRole, fieldStart + 2, y);

  doc.text("INCIDENT NO.:", rightColumnStart, y);
  doc.line(
    rightFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  doc.text(incident.trackingNumber, rightFieldStart + 2, y);
  y += 12;

  // Incident Information Section (Blue Bar)
  doc.setFillColor(0, 102, 204);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("INCIDENT INFORMATION", margin + 2, y + 5.5);
  y += 12;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Incident Type
  const incidentLabelWidth = 40;
  const incidentFieldStart = margin + incidentLabelWidth;
  doc.text("INCIDENT TYPE:", margin, y);
  doc.line(
    incidentFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  doc.text(incident.incidentType, incidentFieldStart + 2, y);
  y += 8;

  // Date & Time of Incident
  const dateTimeLabelWidth = 50;
  const dateTimeFieldStart = margin + dateTimeLabelWidth;
  doc.text("DATE & TIME OF INCIDENT:", margin, y);
  doc.line(
    dateTimeFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  const incidentDate = formatDateOnly(incident.dateOfIncident);
  const incidentTime = incident.submittedAt
    ? new Date(incident.submittedAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "";
  const incidentDateTime = incidentTime
    ? `${incidentDate} ${incidentTime}`
    : incidentDate;
  doc.text(incidentDateTime, dateTimeFieldStart + 2, y);
  y += 8;

  // Extract building/room and address parts
  const buildingCode =
    getBuildingCode(incident) || getBuildingName(incident) || null;
  const room = incident.room ? incident.room.trim().replace(/_/g, " ") : null;
  const specificArea = buildingCode && room
    ? `${buildingCode} - ${room}`
    : buildingCode || room || null;

  // Get address (formattedAddress or location, excluding building/room)
  let address = incident.formattedAddress || incident.location || "";

  // If we have structured location data, use formattedAddress directly
  // Otherwise, try to extract address from location string
  if (!incident.formattedAddress && address && address.includes(" - ")) {
    const parts = address.split(" - ").map((p) => p.trim());

    // If we have building/room info from structured data, remove them from location string
    if (buildingCode || room) {
      // Check if first part(s) match building/room
      if (buildingCode && room && parts.length >= 3) {
        // Format: BUILDING - ROOM - ADDRESS
        if (
          parts[0].replace(/_/g, " ").includes(buildingCode.replace(/_/g, " ")) ||
          parts[0].replace(/_/g, " ").toUpperCase().includes(buildingCode.replace(/_/g, " ").toUpperCase())
        ) {
          address = parts.slice(2).join(" - ");
        } else {
          address = parts.slice(1).join(" - ");
        }
      } else if (buildingCode && parts.length >= 2) {
        // Format: BUILDING - ADDRESS
        if (
          parts[0].replace(/_/g, " ").includes(buildingCode.replace(/_/g, " ")) ||
          parts[0].replace(/_/g, " ").toUpperCase().includes(buildingCode.replace(/_/g, " ").toUpperCase())
        ) {
          address = parts.slice(1).join(" - ");
        }
      } else if (room && parts.length >= 2) {
        // Format: ROOM - ADDRESS
        if (
          parts[0].replace(/_/g, " ").includes(room.replace(/_/g, " ")) ||
          parts[0].replace(/_/g, " ").toUpperCase().includes(room.replace(/_/g, " ").toUpperCase())
        ) {
          address = parts.slice(1).join(" - ");
        }
      }
    }
  }

  // Format address (replace underscores)
  address = formatLocationString(address || incident.location || "");

  // If address is empty after processing, use the full location as fallback
  if (!address || address.trim() === "") {
    address = formatLocationString(incident.location || "");
  }

  // Location (address with plus codes, etc.)
  const locationLabelWidth = 25;
  const locationFieldStart = margin + locationLabelWidth;
  doc.text("LOCATION:", margin, y);
  doc.line(
    locationFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  doc.text(address || "-", locationFieldStart + 2, y);
  y += 8;

  // Specific Area of Location (building and room)
  const areaLabelWidth = 75;
  const areaFieldStart = margin + areaLabelWidth;
  doc.text("SPECIFIC AREA OF LOCATION (if applicable):", margin, y);
  doc.line(
    areaFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  if (specificArea) {
    doc.text(specificArea, areaFieldStart + 2, y);
  }
  y += 8;

  // Incident Description
  doc.setFont("helvetica", "bold");
  doc.text("INCIDENT DESCRIPTION:", margin, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.setFillColor(230, 230, 250);
  const descText = incident.description || "-";
  const descLines = doc.splitTextToSize(descText, contentWidth - 4);
  const descHeight = descLines.length * lineHeight + 4;
  if (checkNewPage(descHeight + 5)) {
    doc.setFont("helvetica", "bold");
    doc.text("INCIDENT DESCRIPTION (continued):", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  doc.roundedRect(margin, y - 2, contentWidth, descHeight, 1, 1, "F");
  doc.text(descLines, margin + 2, y + 2);
  y += descHeight + 5;

  // Impact of Incident
  doc.setFont("helvetica", "bold");
  doc.text("IMPACT OF INCIDENT:", margin, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  const impactText = impactOfIncident && impactOfIncident.trim()
    ? impactOfIncident.trim()
    : incident.priorityLevel
      ? `Priority: ${incident.priorityLevel}. ${incident.description || "No additional impact details."
      }`
      : "No impact details available.";
  const impactLines = doc.splitTextToSize(impactText, contentWidth - 4);
  const impactHeight = impactLines.length * lineHeight + 4;
  if (checkNewPage(impactHeight + 5)) {
    doc.setFont("helvetica", "bold");
    doc.text("IMPACT OF INCIDENT (continued):", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  doc.setFillColor(230, 230, 250);
  doc.roundedRect(margin, y - 2, contentWidth, impactHeight, 1, 1, "F");
  doc.text(impactLines, margin + 2, y + 2);
  y += impactHeight + 5;

  // Affected System/Resources
  doc.setFont("helvetica", "bold");
  doc.text("AFFECTED SYSTEM/RESOURCES:", margin, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  const affectedText = affectedSystemResources && affectedSystemResources.trim()
    ? affectedSystemResources.trim()
    : incident.officeAdminName
      ? `Department: ${incident.officeAdminName}. ${incident.location || "Location: " + incident.location
      }`
      : "No specific system/resource details available.";
  const affectedLines = doc.splitTextToSize(affectedText, contentWidth - 4);
  const affectedHeight = affectedLines.length * lineHeight + 4;
  if (checkNewPage(affectedHeight + 5)) {
    doc.setFont("helvetica", "bold");
    doc.text("AFFECTED SYSTEM/RESOURCES (continued):", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  doc.setFillColor(230, 230, 250);
  doc.roundedRect(margin, y - 2, contentWidth, affectedHeight, 1, 1, "F");
  doc.text(affectedLines, margin + 2, y + 2);
  y += affectedHeight + 8;

  // Parties Involved
  if (checkNewPage(30)) {
    // If moved to new page, no need to redraw title
  }
  doc.setFont("helvetica", "bold");
  doc.text("NAME / ROLE / CONTACT OF PARTIES INVOLVED", margin, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  const numberWidth = 5;
  const partyFieldStart = margin + numberWidth;
  doc.text("1.", margin, y);
  doc.line(
    partyFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  if (incident.submittedByFullName) {
    doc.text(
      `${incident.submittedByFullName}${incident.submittedByEmail ? ` - ${incident.submittedByEmail}` : ""
      }${incident.submittedByPhone ? ` - ${incident.submittedByPhone}` : ""
      }`,
      partyFieldStart + 2,
      y
    );
  }
  y += 6;
  doc.text("2.", margin, y);
  doc.line(
    partyFieldStart,
    y + lineOffset,
    margin + contentWidth,
    y + lineOffset
  );
  y += 10;

  // Witnesses
  if (checkNewPage(30)) {
    // If moved to new page, no need to redraw title
  }
  doc.setFont("helvetica", "bold");
  doc.text("NAME / ROLE / CONTACT OF WITNESSES", margin, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  const witnessFieldStart = margin + numberWidth;
  if (incident.witnesses && incident.witnesses.length > 0) {
    incident.witnesses.forEach((witness: any, idx: number) => {
      if (idx < 2) {
        doc.text(`${idx + 1}.`, margin, y);
        doc.line(
          witnessFieldStart,
          y + lineOffset,
          margin + contentWidth,
          y + lineOffset
        );
        const witnessInfo = `${witness.name || "(witness)"}${witness.additionalNotes ? ` - ${witness.additionalNotes}` : ""
          }`;
        doc.text(witnessInfo, witnessFieldStart + 2, y);
        y += 6;
      }
    });
  } else {
    doc.text("1.", margin, y);
    doc.line(
      witnessFieldStart,
      y + lineOffset,
      margin + contentWidth,
      y + lineOffset
    );
    y += 6;
    doc.text("2.", margin, y);
    doc.line(
      witnessFieldStart,
      y + lineOffset,
      margin + contentWidth,
      y + lineOffset
    );
    y += 6;
  }
  y += 8;

  // Assessment and Action
  if (checkNewPage(30)) {
    // If moved to new page
  }
  doc.setFont("helvetica", "bold");
  const severityLabelWidth = 40;
  const severityFieldStart = margin + severityLabelWidth;
  doc.text("INCIDENT SEVERITY:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.line(severityFieldStart, y + lineOffset, margin + 100, y + lineOffset);
  doc.text(incident.priorityLevel || "N/A", severityFieldStart + 2, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("INITIAL ASSESSMENT:", margin, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  const assessmentText = initialAssessment && initialAssessment.trim()
    ? initialAssessment.trim()
    : incident.status
      ? `Status: ${incident.status}. ${incident.description
        ? incident.description.substring(0, 200)
        : "No additional assessment details."
      }`
      : "No initial assessment available.";
  const assessmentLines = doc.splitTextToSize(assessmentText, contentWidth - 4);
  const assessmentHeight = assessmentLines.length * lineHeight + 4;
  if (checkNewPage(assessmentHeight + 5)) {
    doc.setFont("helvetica", "bold");
    doc.text("INITIAL ASSESSMENT (continued):", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  doc.setFillColor(230, 230, 250);
  doc.roundedRect(margin, y - 2, contentWidth, assessmentHeight, 1, 1, "F");
  doc.text(assessmentLines, margin + 2, y + 2);
  y += assessmentHeight + 5;

  doc.setFont("helvetica", "bold");
  doc.text("ACTION TAKEN:", margin, y);
  doc.setFont("helvetica", "normal");
  y += 5;

  // Check if we have updates to display as process flow
  const hasUpdates =
    incident.updates &&
    Array.isArray(incident.updates) &&
    incident.updates.length > 0;

  if (hasUpdates && incident.updates) {
    // Display updates as a process flow timeline
    const updates = incident.updates.filter(
      (update: IncidentUpdate) =>
        update.message || update.description || update.title
    );

    if (updates.length > 0) {
      const stepSpacing = 20; // Space between each step
      const circleRadius = 2.5; // Radius of the process indicator circle
      const lineStartX = margin + circleRadius;
      const contentStartX = margin + 12; // Start of text content
      const contentWidthForSteps = contentWidth - 12;

      updates.forEach((update: IncidentUpdate, index: number) => {
        // Check if we need a new page
        const estimatedStepHeight = stepSpacing + 15; // Approximate height per step
        if (checkNewPage(estimatedStepHeight + 10)) {
          // Draw continuation line from previous page
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(lineStartX, margin - 5, lineStartX, y);
          y = margin;
        }

        const stepY = y;

        // Draw connecting line (except for first step)
        if (index > 0) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          const lineStartY = stepY - stepSpacing;
          doc.line(lineStartX, lineStartY, lineStartX, stepY - circleRadius);
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
        y = stepY + stepSpacing + messageLines.length * 4 + 4;

        // Draw connecting line to next step (if not last)
        if (index < updates.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          const nextLineY = y - stepSpacing + circleRadius;
          doc.line(lineStartX, stepY + circleRadius, lineStartX, nextLineY);
        }
      });

      y += 5;
    } else {
      // Fallback to resolution notes if no valid updates
      const resolutionNotes =
        incident.resolutionNotes ||
        (incident as any).administrativeNotes ||
        (incident as any).verificationNotes;

      let actionText =
        resolutionNotes &&
          typeof resolutionNotes === "string" &&
          resolutionNotes.trim()
          ? resolutionNotes.trim()
          : "No action details specified";

      const actionLines = doc.splitTextToSize(actionText, contentWidth - 4);
      const actionHeight = actionLines.length * lineHeight + 4;
      if (checkNewPage(actionHeight + 15)) {
        doc.setFont("helvetica", "bold");
        doc.text("ACTION TAKEN (continued):", margin, y);
        doc.setFont("helvetica", "normal");
        y += 5;
      }
      doc.setFillColor(230, 230, 250);
      doc.roundedRect(margin, y - 2, contentWidth, actionHeight, 1, 1, "F");
      doc.text(actionLines, margin + 2, y + 2);
      y += actionHeight + 10;
    }
  } else {
    // Fallback to resolution notes if no updates
    const resolutionNotes =
      incident.resolutionNotes ||
      (incident as any).administrativeNotes ||
      (incident as any).verificationNotes;

    let actionText =
      resolutionNotes &&
        typeof resolutionNotes === "string" &&
        resolutionNotes.trim()
        ? resolutionNotes.trim()
        : "No action details specified";

    const actionLines = doc.splitTextToSize(actionText, contentWidth - 4);
    const actionHeight = actionLines.length * lineHeight + 4;
    if (checkNewPage(actionHeight + 15)) {
      doc.setFont("helvetica", "bold");
      doc.text("ACTION TAKEN (continued):", margin, y);
      doc.setFont("helvetica", "normal");
      y += 5;
    }
    doc.setFillColor(230, 230, 250);
    doc.roundedRect(margin, y - 2, contentWidth, actionHeight, 1, 1, "F");
    doc.text(actionLines, margin + 2, y + 2);
    y += actionHeight + 10;
  }

  // Evidence Section - Images
  if (
    incident.evidence &&
    Array.isArray(incident.evidence) &&
    incident.evidence.length > 0
  ) {
    checkNewPage(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("EVIDENCE", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 8;

    const imagePromises = incident.evidence
      .filter((file: Evidence) => file.fileType?.startsWith("image/"))
      .map(async (file: Evidence, index: number) => {
        try {
          const fileId = file.id || file.fileUrl;
          const preloaded = preloadedImages.get(fileId);
          if (preloaded) {
            return {
              img: preloaded.img,
              imgWidth: preloaded.imgWidth,
              imgHeight: preloaded.imgHeight,
              fileName: file.fileName,
              index: index + 1,
              base64: preloaded.base64,
            };
          }

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

          const targetSize = 76.2;
          let imgWidth = img.width;
          let imgHeight = img.height;
          const widthRatio = targetSize / imgWidth;
          const heightRatio = targetSize / imgHeight;
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
          };
        } catch (error) {
          // Image loading failed, skip this image
          return {
            img: null,
            imgWidth: 0,
            imgHeight: 0,
            fileName: file.fileName,
            index: index + 1,
            error: true,
          };
        }
      });

    const loadedImages = await Promise.all(imagePromises);
    const validImages = loadedImages.filter((img) => img !== null);

    if (validImages.length > 0) {
      const imageSize = 76.2;
      const imageGap = 10;
      const captionHeight = 8;
      const imagesPerRow = 2;
      const rowWidth = imagesPerRow * imageSize + (imagesPerRow - 1) * imageGap;

      let currentRow: any[] = [];
      for (let i = 0; i < validImages.length; i++) {
        if (!validImages[i]) continue;
        currentRow.push(validImages[i]);

        if (
          currentRow.length === imagesPerRow ||
          i === loadedImages.length - 1
        ) {
          const totalRowHeight = imageSize + captionHeight + 10;

          if (checkNewPage(totalRowHeight + 20)) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("EVIDENCE (continued)", margin, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            y += 8;
          }

          const rowStartX = margin;
          let xPosition = rowStartX;

          currentRow.forEach((imageData) => {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.roundedRect(
              xPosition,
              y,
              imageSize,
              imageSize + captionHeight,
              2,
              2,
              "FD"
            );

            if (imageData.img && !imageData.error && imageData.base64) {
              try {
                const xOffset = (imageSize - imageData.imgWidth) / 2;
                const yOffset = (imageSize - imageData.imgHeight) / 2;

                let imageFormat = "JPEG";
                if (imageData.base64.startsWith("data:image/png")) {
                  imageFormat = "PNG";
                } else if (
                  imageData.base64.startsWith("data:image/jpeg") ||
                  imageData.base64.startsWith("data:image/jpg")
                ) {
                  imageFormat = "JPEG";
                }

                doc.addImage(
                  imageData.base64,
                  imageFormat,
                  xPosition + xOffset,
                  y + yOffset,
                  imageData.imgWidth,
                  imageData.imgHeight,
                  undefined,
                  "FAST"
                );
              } catch (error) {
                // Error loading image, skip
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                  "Image failed to load",
                  xPosition + imageSize / 2 - 20,
                  y + imageSize / 2
                );
                doc.setTextColor(0, 0, 0);
              }
            } else {
              doc.setFontSize(8);
              doc.setTextColor(150, 150, 150);
              doc.text(
                "Image failed to load",
                xPosition + imageSize / 2 - 20,
                y + imageSize / 2
              );
              doc.setTextColor(0, 0, 0);
            }

            doc.setFontSize(8);
            const filenameLines = doc.splitTextToSize(
              `Image ${imageData.index}: ${imageData.fileName}`,
              imageSize - 4
            );
            doc.text(filenameLines, xPosition + 2, y + imageSize + 5);
            doc.setFontSize(10);

            xPosition += imageSize + imageGap;
          });

          y += imageSize + captionHeight + 15;
          currentRow = [];
        }
      }
      y += 10;
    }
  }

  // Signature
  checkNewPage(30);
  const signatureLabelWidth = 25;
  const signatureFieldStart = margin + signatureLabelWidth;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const signatureText = "SIGNATURE:";
  const signatureTextWidth = doc.getTextWidth(signatureText);

  const signatureSectionOffset = 12;
  const adjustedY = y + signatureSectionOffset;

  if (signatureImage) {
    try {
      const sigImg = new Image();
      sigImg.src = signatureImage;
      await new Promise((resolve, reject) => {
        sigImg.onload = resolve;
        sigImg.onerror = reject;
      });
      const sigWidth = 50;
      const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
      const maxSigHeight = 20;
      const finalSigHeight =
        sigHeight > maxSigHeight ? maxSigHeight : sigHeight;
      const finalSigWidth = (sigImg.width / sigImg.height) * finalSigHeight;
      const sigImageX = margin - 5;
      const sigImageY = adjustedY - 12;
      doc.addImage(
        sigImg,
        "PNG",
        sigImageX,
        sigImageY,
        finalSigWidth,
        finalSigHeight
      );
    } catch (error) {
      // Signature loading failed, continue without signature
    }
  }

  doc.setFont("helvetica", "bold");
  const signatureY = adjustedY + 5;
  doc.text(signatureText, margin, signatureY);
  doc.setFont("helvetica", "normal");

  // Draw signature line only when no signature image is provided
  if (!signatureImage) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    const lineY = adjustedY + 1;
    const lineStartX = margin;
    doc.line(lineStartX, lineY, lineStartX + signatureTextWidth, lineY);

    doc.line(
      signatureFieldStart,
      y + lineOffset,
      margin + 100,
      y + lineOffset
    );
  }

  return doc;
}

