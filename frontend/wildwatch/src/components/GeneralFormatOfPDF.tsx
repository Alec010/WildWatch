import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatDateOnly } from "@/utils/dateUtils";
import { toast } from "sonner";

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

export const generatePDF = async (incident: Incident): Promise<void> => {
  try {
    // Create a new PDF document with better margins
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Manually track page numbers
    let currentPage = 1;
    let pageCount = 1;

    let y = 20;
    const margin = 20;
    const contentWidth = 170;
    const lineHeight = 7;
    const sectionSpacing = 8;
    const pageHeight = 270;

    // Set default font
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    // Header background with gradient
    const createGradient = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      const steps = 100; // Increased steps for even smoother gradient
      const stepWidth = width / steps;

      // Color stops for rich gradient
      const colorStops = [
        { r: 139, g: 0, b: 0 }, // Maroon
        { r: 160, g: 40, b: 0 }, // Dark Red
        { r: 180, g: 80, b: 0 }, // Deep Orange
        { r: 200, g: 120, b: 0 }, // Orange
        { r: 218, g: 165, b: 32 }, // Gold
      ];

      for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);

        // Enhanced cubic easing for smoother transition
        const easedRatio =
          ratio < 0.5
            ? 8 * ratio * ratio * ratio * ratio
            : 1 - Math.pow(-2 * ratio + 2, 4) / 2;

        // Find the two colors to interpolate between
        const colorIndex = Math.floor(easedRatio * (colorStops.length - 1));
        const nextColorIndex = Math.min(colorIndex + 1, colorStops.length - 1);
        const localRatio = easedRatio * (colorStops.length - 1) - colorIndex;

        const startColor = colorStops[colorIndex];
        const endColor = colorStops[nextColorIndex];

        // Smooth interpolation between colors
        const r = Math.round(
          startColor.r + (endColor.r - startColor.r) * localRatio
        );
        const g = Math.round(
          startColor.g + (endColor.g - startColor.g) * localRatio
        );
        const b = Math.round(
          startColor.b + (endColor.b - startColor.b) * localRatio
        );

        doc.setFillColor(r, g, b);
        doc.rect(x + i * stepWidth, y, stepWidth, height, "F");
      }
    };

    // Apply gradient only to header
    createGradient(0, 0, 210, 40);

    // Logo placeholder (replace with actual logo if available)
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = "/logo2.png";
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      const logoHeight = 25;
      const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
      doc.addImage(logoImg, "PNG", 20, 8, logoWidth, logoHeight);
    } catch (error) {
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 20, 10, "F");
    }

    // Add CIT logo to the right side of the header
    try {
      const citLogoImg = new Image();
      citLogoImg.crossOrigin = "anonymous";
      citLogoImg.src = "/citlogo.png";
      await new Promise((resolve, reject) => {
        citLogoImg.onload = resolve;
        citLogoImg.onerror = reject;
      });
      const citLogoHeight = 25;
      const citLogoWidth =
        (citLogoImg.width / citLogoImg.height) * citLogoHeight;
      // Place it 20mm from the right edge, same vertical as the left logo
      doc.addImage(
        citLogoImg,
        "PNG",
        210 - 20 - citLogoWidth,
        8,
        citLogoWidth,
        citLogoHeight
      );
    } catch (error) {
      // If CIT logo fails to load, do nothing
    }

    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("WildWatch", 105, 20, { align: "center" });
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("Incident Report", 105, 30, { align: "center" });
    y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, 45, margin + contentWidth, 45);

    // Helper function to add a section title with modern styling
    const addSectionTitle = (title: string) => {
      // Create solid maroon background for section titles with rounded corners
      doc.setFillColor(139, 0, 0); // Maroon
      doc.roundedRect(margin - 2, y - 2, contentWidth + 4, 10, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 2, y + 5);
      y += 14;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    };

    const addWrappedText = (text: string, indent = 0, isBold = false) => {
      if (isBold) doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      doc.text(lines, margin + indent, y);
      y += lines.length * lineHeight;
      if (isBold) doc.setFont("helvetica", "normal");
    };

    const addField = (label: string, value: string, isLeft = true) => {
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", isLeft ? margin : margin + 85, y);
      doc.setFont("helvetica", "normal");
      const valueWidth = isLeft ? 75 : 85;
      const valueX = isLeft ? margin + 30 : margin + 85 + 30;
      const lines = doc.splitTextToSize(value, valueWidth);
      doc.text(lines, valueX, y);
      return lines.length * lineHeight;
    };

    const addFieldRow = (
      leftLabel: string,
      leftValue: string,
      rightLabel: string,
      rightValue: string
    ) => {
      const leftHeight = addField(leftLabel, leftValue, true);
      const rightHeight = addField(rightLabel, rightValue, false);
      y += Math.max(leftHeight, rightHeight);
    };

    // Update footer styling
    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setDrawColor(139, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, 280, margin + contentWidth, 280);
      doc.setFontSize(9);
      doc.setTextColor(139, 0, 0);
      doc.text(`Page ${pageNum} of ${totalPages}`, margin, 287);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        margin + contentWidth,
        287,
        { align: "right" }
      );
      doc.text(`Case ID: ${incident.trackingNumber}`, 105, 287, {
        align: "center",
      });
    };

    const checkNewPage = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight) {
        addFooter(currentPage, pageCount);
        doc.addPage();
        currentPage++;
        pageCount = Math.max(pageCount, currentPage);
        y = 20;
        return true;
      }
      return false;
    };

    // Case Information Section
    addSectionTitle("Case Information");
    addFieldRow("Case ID", incident.trackingNumber, "Status", incident.status);
    addFieldRow(
      "Priority",
      incident.priorityLevel || "-",
      "Department",
      incident.officeAdminName || "-"
    );
    addFieldRow(
      "Submitted",
      formatDateOnly(incident.submittedAt),
      "Finished Date",
      incident.finishedDate ? formatDateOnly(incident.finishedDate) : "-"
    );
    y += sectionSpacing;

    // Incident Details Section
    addSectionTitle("Incident Details");
    addFieldRow(
      "Incident Type",
      incident.incidentType,
      "Location",
      incident.location
    );
    addFieldRow(
      "Date Reported",
      formatDateOnly(incident.dateOfIncident),
      "",
      ""
    );
    doc.setFont("helvetica", "bold");
    doc.text("Description:", margin, y);
    doc.setFont("helvetica", "normal");
    y += lineHeight;
    const descriptionText = incident.description || "-";
    const descLines = doc.splitTextToSize(descriptionText, contentWidth - 4);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(
      margin,
      y - 4,
      contentWidth,
      descLines.length * lineHeight + 8,
      2,
      2,
      "F"
    );
    doc.text(descLines, margin + 2, y + 2);
    y += descLines.length * lineHeight + 10;

    // Reporter Information Section
    addSectionTitle("Reporter Information");
    addFieldRow(
      "Reporter",
      incident.submittedByFullName,
      "Email",
      incident.submittedByEmail || "-"
    );
    if (incident.submittedByPhone) {
      addFieldRow("Phone", incident.submittedByPhone, "", "");
    }
    y += sectionSpacing;

    // Evidence Section
    if (
      incident.evidence &&
      Array.isArray(incident.evidence) &&
      incident.evidence.length > 0
    ) {
      checkNewPage(40);
      addSectionTitle("Evidence");
      // Process images in parallel (user-side logic)
      const imagePromises = incident.evidence
        .filter((file: any) => file.fileType?.startsWith("image/"))
        .map(async (file: any, index: number) => {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = `${file.fileUrl}?t=${new Date().getTime()}`;
            });
            const maxWidth = 75;
            const maxHeight = 75;
            let imgWidth = img.width;
            let imgHeight = img.height;
            if (imgWidth > maxWidth) {
              const ratio = maxWidth / imgWidth;
              imgWidth = maxWidth;
              imgHeight *= ratio;
            }
            if (imgHeight > maxHeight) {
              const ratio = maxHeight / imgHeight;
              imgWidth *= ratio;
              imgHeight = maxHeight;
            }
            return {
              img,
              imgWidth,
              imgHeight,
              fileName: file.fileName,
              index: index + 1,
            };
          } catch (error) {
            console.error("Error loading image:", error);
            return null;
          }
        });
      const loadedImages = await Promise.all(imagePromises);
      // Add loaded images in a grid layout (2 per row)
      if (loadedImages.some((img) => img !== null)) {
        addWrappedText("Images:", 0, true);
        y += 5;
        const imageGap = 15;
        const imageContainerPadding = 10;
        const captionHeight = 15;
        const availableWidth = contentWidth;
        const optimalImageWidth =
          (availableWidth - imageGap) / 2 - imageContainerPadding * 2;
        const maxImageHeight = 100;
        let currentRow: any[] = [];
        for (let i = 0; i < loadedImages.length; i++) {
          if (!loadedImages[i]) continue;
          currentRow.push(loadedImages[i]);
          if (currentRow.length === 2 || i === loadedImages.length - 1) {
            let rowImageHeight = 0;
            currentRow.forEach((imageData) => {
              let scaledHeight =
                (imageData.imgHeight / imageData.imgWidth) * optimalImageWidth;
              if (scaledHeight > maxImageHeight) {
                scaledHeight = maxImageHeight;
              }
              rowImageHeight = Math.max(rowImageHeight, scaledHeight);
            });
            const totalRowHeight =
              rowImageHeight + imageContainerPadding * 2 + captionHeight + 10;
            if (y + totalRowHeight > pageHeight - 20) {
              addFooter(currentPage, pageCount);
              doc.addPage();
              currentPage++;
              pageCount = Math.max(pageCount, currentPage);
              y = 20;
              addWrappedText("Images (continued):", 0, true);
              y += 5;
            }
            let xPosition = margin;
            currentRow.forEach((imageData) => {
              let scaledWidth = optimalImageWidth;
              let scaledHeight =
                (imageData.imgHeight / imageData.imgWidth) * optimalImageWidth;
              if (scaledHeight > maxImageHeight) {
                scaledHeight = maxImageHeight;
                scaledWidth =
                  (imageData.imgWidth / imageData.imgHeight) * maxImageHeight;
              }
              const xOffset = (optimalImageWidth - scaledWidth) / 2;
              doc.setFillColor(220, 220, 220);
              doc.roundedRect(
                xPosition + 2,
                y + 2,
                optimalImageWidth + imageContainerPadding * 2,
                rowImageHeight + imageContainerPadding * 2 + captionHeight,
                3,
                3,
                "F"
              );
              doc.setFillColor(255, 255, 255);
              doc.setDrawColor(200, 200, 200);
              doc.roundedRect(
                xPosition,
                y,
                optimalImageWidth + imageContainerPadding * 2,
                rowImageHeight + imageContainerPadding * 2 + captionHeight,
                3,
                3,
                "FD"
              );
              doc.addImage(
                imageData.img,
                "JPEG",
                xPosition + imageContainerPadding + xOffset,
                y + imageContainerPadding,
                scaledWidth,
                scaledHeight,
                undefined,
                "FAST"
              );
              doc.setFontSize(8);
              const filenameLines = doc.splitTextToSize(
                `Image ${imageData.index}: ${imageData.fileName}`,
                optimalImageWidth
              );
              doc.text(
                filenameLines,
                xPosition + imageContainerPadding,
                y + imageContainerPadding + rowImageHeight + 10
              );
              doc.setFontSize(11);
              xPosition +=
                optimalImageWidth + imageContainerPadding * 2 + imageGap;
            });
            y +=
              rowImageHeight + imageContainerPadding * 2 + captionHeight + 15;
            currentRow = [];
          }
        }
        y += 5;
      }
    }

    // Witnesses Section
    if (
      incident.witnesses &&
      Array.isArray(incident.witnesses) &&
      incident.witnesses.length > 0
    ) {
      checkNewPage(40);
      addSectionTitle("Witnesses");
      doc.setFont("helvetica", "bold");
      doc.text("#", margin + 5, y + 7);
      doc.text("Name", margin + 20, y + 7);
      doc.text("Notes", margin + 85, y + 7);
      doc.setFont("helvetica", "normal");
      y += 15;
      incident.witnesses.forEach((witness: any, idx: number) => {
        const witnessNum = (idx + 1).toString();
        const witnessName = witness.name || "(witness)";
        const witnessNotes = witness.additionalNotes || "-";
        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, y - 5, contentWidth, 12, "F");
        }
        doc.text(witnessNum, margin + 5, y);
        doc.text(witnessName, margin + 20, y);
        const noteLines = doc.splitTextToSize(witnessNotes, 85);
        doc.text(noteLines, margin + 85, y);
        const lineHeight = Math.max(noteLines.length * 7, 12);
        y += lineHeight + 5;
      });
      y += 10;
    }

    // Updates Section
    if (
      incident.updates &&
      Array.isArray(incident.updates) &&
      incident.updates.length > 0
    ) {
      checkNewPage(40);
      addSectionTitle("Case Updates");
      incident.updates?.forEach((update: any, idx: number) => {
        if (checkNewPage(30)) addSectionTitle("Case Updates (continued)");
        doc.setFillColor(128, 0, 0);
        doc.circle(margin + 4, y + 4, 3, "F");
        if (idx < (incident.updates?.length || 0) - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(margin + 4, y + 8, margin + 4, y + 30);
        }
        doc.setFillColor(248, 248, 248);
        doc.roundedRect(margin + 10, y - 2, contentWidth - 10, 24, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.text(
          update.title || update.status || `Update ${idx + 1}`,
          margin + 15,
          y + 5
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const updateDate = update.updatedAt
          ? formatDateOnly(update.updatedAt)
          : "-";
        const updateAuthor =
          update.updatedByName ||
          update.updatedByFullName ||
          update.author ||
          "-";
        doc.text(`${updateDate} by ${updateAuthor}`, margin + 15, y + 13);
        if (update.message || update.description) {
          const updateMsg = update.message || update.description;
          const msgLines = doc.splitTextToSize(updateMsg, contentWidth - 20);
          doc.text(msgLines, margin + 15, y + 20);
        }
        y += 30;
        doc.setFontSize(11);
      });
    }

    addFooter(currentPage, pageCount);
    for (let i = 1; i < currentPage; i++) {
      doc.setPage(i);
      addFooter(i, pageCount);
    }
    doc.save(`Office_Incident_Report_${incident.trackingNumber}.pdf`);
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
    throw error;
  }
};
