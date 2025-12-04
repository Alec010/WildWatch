"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";
import { formatDateOnly } from "@/utils/dateUtils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

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
  updates?: any[];
}

interface TSGPDFProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
}

export function TSGPDFModal({ incident, isOpen, onClose }: TSGPDFProps) {
  const [reportedBy, setReportedBy] = useState("");
  const [titleRole, setTitleRole] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setSignatureImage(null);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
  };

  const generatePDF = async () => {
    if (!reportedBy.trim()) {
      toast.error("Please enter 'Reported By'");
      return;
    }
    if (!titleRole.trim()) {
      toast.error("Please enter 'Title / Role'");
      return;
    }

    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = 15;
      const contentWidth = 180;
      let y = 15;
      const lineHeight = 6;
      const sectionSpacing = 8;
      const pageHeight = 280; // A4 height is 297mm, leaving margin at bottom
      let currentPage = 1;
      let pageCount = 1;
      let isFirstPage = true;

      // Set default font
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Helper function to check if new page is needed and add it
      const checkNewPage = (requiredSpace: number): boolean => {
        if (y + requiredSpace > pageHeight) {
          doc.addPage();
          currentPage++;
          pageCount = Math.max(pageCount, currentPage);
          y = margin; // Reset to top margin on new page
          isFirstPage = false;
          return true;
        }
        return false;
      };

      // Header with CIT Logo - Centered at top (only on first page)
      const pageWidth = 210; // A4 width in mm
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
          // Center the logo horizontally
          const logoX = (pageWidth - logoWidth) / 2;
          doc.addImage(citLogoImg, "PNG", logoX, y, logoWidth, logoHeight);
          y += logoHeight + 8; // Space after logo
        } catch (error) {
          console.error("Error loading CIT logo:", error);
          y += 10; // Add space even if logo fails
        }

        // Title - Centered below logo (only on first page)
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
      const labelWidth = 30; // Standard label width for alignment
      const fieldStart = margin + labelWidth;
      const rightColumnStart = margin + 105;
      const rightLabelWidth = 40;
      const rightFieldStart = rightColumnStart + rightLabelWidth;

      // First row: REPORTED BY and DATE OF REPORT
      const lineOffset = 3; // Distance below text baseline for lines
      doc.text("REPORTED BY:", margin, y);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.line(
        fieldStart,
        y + lineOffset,
        rightColumnStart - 5,
        y + lineOffset
      );
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

      // Second row: TITLE / ROLE and INCIDENT NO.
      doc.text("TITLE / ROLE:", margin, y);
      doc.line(
        fieldStart,
        y + lineOffset,
        rightColumnStart - 5,
        y + lineOffset
      );
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
      doc.setFillColor(0, 102, 204); // Blue color
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

      // Location
      const locationLabelWidth = 25;
      const locationFieldStart = margin + locationLabelWidth;
      doc.text("LOCATION:", margin, y);
      doc.line(
        locationFieldStart,
        y + lineOffset,
        margin + contentWidth,
        y + lineOffset
      );
      doc.text(incident.location, locationFieldStart + 2, y);
      y += 8;

      // Specific Area of Location
      const areaLabelWidth = 75;
      const areaFieldStart = margin + areaLabelWidth;
      doc.text("SPECIFIC AREA OF LOCATION (if applicable):", margin, y);
      doc.line(
        areaFieldStart,
        y + lineOffset,
        margin + contentWidth,
        y + lineOffset
      );
      y += 8;

      // Incident Description
      doc.setFont("helvetica", "bold");
      doc.text("INCIDENT DESCRIPTION:", margin, y);
      doc.setFont("helvetica", "normal");
      y += 5;
      doc.setFillColor(230, 230, 250); // Light blue-grey
      const descText = incident.description || "-";
      const descLines = doc.splitTextToSize(descText, contentWidth - 4);
      const descHeight = descLines.length * lineHeight + 4;
      // Check if description fits on current page
      if (checkNewPage(descHeight + 5)) {
        // If we moved to new page, redraw the label
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
      const impactText = incident.priorityLevel
        ? `Priority: ${incident.priorityLevel}. ${
            incident.description || "No additional impact details."
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
      const affectedText = incident.officeAdminName
        ? `Department: ${incident.officeAdminName}. ${
            incident.location || "Location: " + incident.location
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
          `${incident.submittedByFullName}${
            incident.submittedByEmail ? ` - ${incident.submittedByEmail}` : ""
          }${
            incident.submittedByPhone ? ` - ${incident.submittedByPhone}` : ""
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
            const witnessInfo = `${witness.name || "(witness)"}${
              witness.additionalNotes ? ` - ${witness.additionalNotes}` : ""
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
      doc.line(
        severityFieldStart,
        y + lineOffset,
        margin + 100,
        y + lineOffset
      );
      doc.text(incident.priorityLevel || "N/A", severityFieldStart + 2, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.text("INITIAL ASSESSMENT:", margin, y);
      doc.setFont("helvetica", "normal");
      y += 5;
      const assessmentText = incident.status
        ? `Status: ${incident.status}. ${
            incident.description
              ? incident.description.substring(0, 200)
              : "No additional assessment details."
          }`
        : "No initial assessment available.";
      const assessmentLines = doc.splitTextToSize(
        assessmentText,
        contentWidth - 4
      );
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
      // Use resolution notes from incident, or fallback to "No action details specified"
      const resolutionNotes = incident.resolutionNotes;
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

      // Evidence Section - Images (4x4 inches = 101.6mm)
      if (
        incident.evidence &&
        Array.isArray(incident.evidence) &&
        incident.evidence.length > 0
      ) {
        checkNewPage(120); // Check if we need new page for evidence section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("EVIDENCE", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        y += 8;

        // Process images in parallel - same way as tracking page
        const imagePromises = incident.evidence
          .filter((file: Evidence) => file.fileType?.startsWith("image/"))
          .map(async (file: Evidence, index: number) => {
            try {
              const img = new Image();
              img.crossOrigin = "anonymous";

              // Set timeout for image loading
              const loadPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error("Image load timeout"));
                }, 10000); // 10 second timeout

                img.onload = () => {
                  clearTimeout(timeout);
                  resolve(img);
                };
                img.onerror = (error) => {
                  clearTimeout(timeout);
                  reject(error);
                };

                // Add timestamp to avoid caching issues
                img.src = `${file.fileUrl}?t=${new Date().getTime()}`;
              });

              await loadPromise;

              // Target size: 4x4 inches = 101.6mm x 101.6mm
              const targetSize = 101.6; // 4 inches in mm
              let imgWidth = img.width;
              let imgHeight = img.height;

              // Scale to fit 4x4 inches while maintaining aspect ratio
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
              };
            } catch (error) {
              console.error(`Error loading image ${file.fileName}:`, error);
              // Return a placeholder object so we can still show the filename
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

        // Filter out null/error images but keep track of them for display
        const validImages = loadedImages.filter((img) => img !== null);

        // Add loaded images in a grid layout (2-3 per row depending on available space)
        if (validImages.length > 0) {
          const imageSize = 101.6; // 4x4 inches
          const imageGap = 10; // Gap between images
          const captionHeight = 8;
          const imagesPerRow = 2; // 2 images per row for 4x4 inch images
          const rowWidth =
            imagesPerRow * imageSize + (imagesPerRow - 1) * imageGap;

          let currentRow: any[] = [];
          for (let i = 0; i < validImages.length; i++) {
            if (!validImages[i]) continue;
            currentRow.push(validImages[i]);

            if (
              currentRow.length === imagesPerRow ||
              i === loadedImages.length - 1
            ) {
              // Calculate total row height
              const totalRowHeight = imageSize + captionHeight + 10;

              // Check if we need a new page
              if (checkNewPage(totalRowHeight + 20)) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.text("EVIDENCE (continued)", margin, y);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                y += 8;
              }

              // Center the row if it has fewer images
              const rowStartX = margin + (contentWidth - rowWidth) / 2;
              let xPosition = rowStartX;

              currentRow.forEach((imageData) => {
                // Draw image container
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

                // Add image (centered in the 4x4 inch box) if loaded successfully
                if (imageData.img && !imageData.error) {
                  try {
                    const xOffset = (imageSize - imageData.imgWidth) / 2;
                    const yOffset = (imageSize - imageData.imgHeight) / 2;
                    doc.addImage(
                      imageData.img,
                      "JPEG",
                      xPosition + xOffset,
                      y + yOffset,
                      imageData.imgWidth,
                      imageData.imgHeight,
                      undefined,
                      "FAST"
                    );
                  } catch (error) {
                    console.error(
                      `Error adding image to PDF: ${imageData.fileName}`,
                      error
                    );
                    // Draw error message
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
                  // Draw error message if image failed to load
                  doc.setFontSize(8);
                  doc.setTextColor(150, 150, 150);
                  doc.text(
                    "Image failed to load",
                    xPosition + imageSize / 2 - 20,
                    y + imageSize / 2
                  );
                  doc.setTextColor(0, 0, 0);
                }

                // Add caption
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

      // Signature - Make sure it fits on current page
      checkNewPage(30);
      const signatureLabelWidth = 25;
      const signatureFieldStart = margin + signatureLabelWidth;

      // Calculate "SIGNATURE:" text width for line length
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const signatureText = "SIGNATURE:";
      const signatureTextWidth = doc.getTextWidth(signatureText);

      // Move entire signature section down by 12mm
      const signatureSectionOffset = 12;
      const adjustedY = y + signatureSectionOffset;

      // Place signature image first (moved more above)
      if (signatureImage) {
        try {
          const sigImg = new Image();
          sigImg.src = signatureImage;
          await new Promise((resolve, reject) => {
            sigImg.onload = resolve;
            sigImg.onerror = reject;
          });
          const sigWidth = 50; // Proper signature width
          const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
          // Limit signature height to reasonable size
          const maxSigHeight = 20;
          const finalSigHeight =
            sigHeight > maxSigHeight ? maxSigHeight : sigHeight;
          const finalSigWidth = (sigImg.width / sigImg.height) * finalSigHeight;
          // Position signature image more above (moved higher)
          const sigImageX = margin - 5; // Move 5mm more to the left
          const sigImageY = adjustedY - 12; // Start 12mm above the text (moved more above)
          doc.addImage(
            sigImg,
            "PNG",
            sigImageX,
            sigImageY,
            finalSigWidth,
            finalSigHeight
          );
        } catch (error) {
          console.error("Error loading signature:", error);
        }
      }

      // Add a line directly above the "SIGNATURE:" text (moved to left, same length as text, moved more above)
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      const lineY = adjustedY + 1; // Line positioned 1mm below adjusted y (moved more above)
      const lineStartX = margin; // Line starts at margin (to the left)
      doc.line(lineStartX, lineY, lineStartX + signatureTextWidth, lineY);

      // Place "SIGNATURE:" label (moved lower)
      doc.setFont("helvetica", "bold");
      const signatureY = adjustedY + 5; // Move text 5mm lower from adjusted y
      doc.text(signatureText, margin, signatureY);
      doc.setFont("helvetica", "normal");

      // Draw line below the label if no image was provided
      if (!signatureImage) {
        doc.line(
          signatureFieldStart,
          y + lineOffset,
          margin + 100,
          y + lineOffset
        );
      }

      // Save PDF
      doc.save(`CIT-U_IT_Incident_Report_${incident.trackingNumber}.pdf`);
      toast.success("PDF Downloaded Successfully", {
        description: `IT Incident Report for ${incident.trackingNumber} has been downloaded.`,
        duration: 3000,
      });
      onClose();
      // Reset form
      setReportedBy("");
      setTitleRole("");
      setSignatureImage(null);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to Download PDF", {
        description: "There was an error generating the PDF. Please try again.",
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setReportedBy("");
      setTitleRole("");
      setSignatureImage(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            CIT-U IT Resources Incident Report Form
          </DialogTitle>
          <DialogDescription>
            Fill in the required information to generate the IT Incident Report
            PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reported By */}
          <div className="space-y-2">
            <Label htmlFor="reportedBy" className="text-sm font-medium">
              Reported By <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reportedBy"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Enter reporter name"
              disabled={isGenerating}
              required
            />
          </div>

          {/* Title / Role */}
          <div className="space-y-2">
            <Label htmlFor="titleRole" className="text-sm font-medium">
              Title / Role <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titleRole"
              value={titleRole}
              onChange={(e) => setTitleRole(e.target.value)}
              placeholder="Enter title or role"
              disabled={isGenerating}
              required
            />
          </div>

          {/* Date of Report - Auto-filled */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date of Report</Label>
            <Input
              value={formatDateOnly(new Date().toISOString())}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Automatically set to today's date
            </p>
          </div>

          {/* Signature Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Signature</Label>
            {signatureImage ? (
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4">
                <img
                  src={signatureImage}
                  alt="Signature preview"
                  className="max-h-32 mx-auto object-contain"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveSignature}
                  className="absolute top-2 right-2"
                  disabled={isGenerating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                  id="signature-upload"
                  disabled={isGenerating}
                />
                <label
                  htmlFor="signature-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload signature image
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG, or GIF (max 5MB)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Incident Preview */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Incident Details Preview:</h4>
            <div className="text-xs space-y-1 text-gray-600">
              <p>
                <span className="font-medium">Incident No.:</span>{" "}
                {incident.trackingNumber}
              </p>
              <p>
                <span className="font-medium">Type:</span>{" "}
                {incident.incidentType}
              </p>
              <p>
                <span className="font-medium">Location:</span>{" "}
                {incident.location}
              </p>
              <p>
                <span className="font-medium">Status:</span> {incident.status}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGenerating || !reportedBy.trim() || !titleRole.trim()}
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
          >
            {isGenerating ? "Generating PDF..." : "Generate PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
