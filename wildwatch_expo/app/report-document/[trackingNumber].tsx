import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { incidentAPI } from "../../src/features/incidents/api/incident_api";
import type { IncidentResponseDto } from "../../src/features/incidents/models/IncidentModels";
import { CircularLoader } from "../../components/CircularLoader";
import { getReporterDisplayName, getReporterDisplayEmail, getReporterDisplayPhone } from "../../src/utils/anonymousUtils";
import { sanitizeLocation } from "../../src/utils/locationUtils";

export default function ReportDocumentScreen() {
  const { trackingNumber } = useLocalSearchParams<{ trackingNumber: string }>();
  const [incident, setIncident] = useState<IncidentResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState<number>(
    Dimensions.get("window").width
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isCompact = screenWidth < 670;

  useEffect(() => {
    fetchIncidentDetails();
  }, [trackingNumber]);

  const fetchIncidentDetails = async () => {
    if (!trackingNumber) {
      setError("No tracking number provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await incidentAPI.getByTrackingNumber(
        trackingNumber as string
      );

      if (data.status?.toLowerCase() !== "resolved") {
        setError("This report is not resolved yet");
        setIsLoading(false);
        return;
      }

      setIncident(data);
    } catch (err: any) {
      setError(err.message || "Failed to load incident details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const formatDateWithTime = (
    dateString?: string | null,
    timeString?: string | null
  ) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const dateFormatted = date.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      });

      if (!timeString) return dateFormatted;

      // Parse time string (format: HH:mm or HH:mm:ss)
      const timeParts = timeString.split(":");
      const hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1] || "00";

      // Convert to 12-hour format
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;

      return `${dateFormatted} at ${hours12}:${minutes} ${period}`;
    } catch {
      return "N/A";
    }
  };

  const getDisplayLocation = (value?: string | null) =>
    sanitizeLocation(value) || value || "Not specified";

  const generateHTMLContent = () => {
    if (!incident) return "";

    const isIOS = Platform.OS === "ios";
    const pageMargin = isIOS ? "1in" : "0.75in";
    const bodyMargin = isIOS ? "0.25in" : "0";
    const bodyPadding = isIOS ? "0.5in" : "0";
    const wrapperPadding = isIOS ? "0.75in" : "0.5in";
    const headerPrintPadding = isIOS ? "40px 30px" : "30px 20px";
    const sectionMarginBottom = isIOS ? "28px" : "32px";
    const footerMarginTop = isIOS ? "40px" : "48px";
    const printBodyPadding = isIOS ? "0.5in" : "0";
    const printBodyMargin = isIOS ? "0.25in" : "0";
    const printWrapperPadding = isIOS ? "0.5in" : "0";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              margin: ${pageMargin};
              size: letter;
            }
            
            body {
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.6;
              color: #1a1a1a;
              background: #ffffff;
              max-width: 100%;
              margin: ${bodyMargin};
              padding: ${bodyPadding};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .document-wrapper {
              max-width: 8.5in;
              margin: 0 auto;
              padding: ${wrapperPadding};
              background: white;
            }
            
            .header {
              text-align: center;
              background: linear-gradient(135deg, #8B0000 0%, #A52A2A 100%);
              background-color: #8B0000;
              padding: 40px 30px;
              border-radius: 8px 8px 0 0;
              color: #ffffff;
              position: relative;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .header .seal {
              width: 80px;
              height: 80px;
              border-radius: 40px;
              background: rgba(212, 175, 55, 0.2);
              background-color: rgba(212, 175, 55, 0.2);
              border: 3px solid #D4AF37;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 40px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .header h1 {
              color: #D4AF37;
              font-size: 26px;
              font-weight: bold;
              margin-bottom: 5px;
              letter-spacing: 2px;
            }
            
            .header .subtitle {
              color: #FDE68A;
              font-size: 13px;
              letter-spacing: 0.5px;
              margin-bottom: 20px;
            }
            
            .header .divider {
              width: 200px;
              height: 2px;
              background: #D4AF37;
              margin: 15px auto;
              opacity: 0.6;
            }
            
            .header .doc-title {
              color: white;
              font-size: 20px;
              font-weight: bold;
              letter-spacing: 1px;
              margin-top: 15px;
            }
            
            .header .doc-subtitle {
              color: rgba(255,255,255,0.9);
              font-size: 13px;
              font-style: italic;
              margin-top: 5px;
            }
            
            .document-title {
              text-align: center;
              margin: 32px 0;
              padding: 24px 0;
              border-bottom: 3px double #8B0000;
              page-break-after: avoid;
            }
            
            .document-title h2 {
              font-size: 20px;
              color: #1a1a1a;
              font-weight: bold;
              letter-spacing: 1px;
              margin-top: 12px;
            }
            
            .status-badge {
              display: inline-block;
              background-color: #16A34A;
              color: #ffffff;
              padding: 10px 24px;
              border-radius: 24px;
              font-size: 13px;
              font-weight: bold;
              box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
              letter-spacing: 0.5px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .section {
              margin-bottom: 32px;
              page-break-inside: avoid;
            }
            
            .section:last-of-type {
              margin-bottom: 20px;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #8B0000;
              margin-bottom: 16px;
              margin-top: 8px;
              padding-bottom: 10px;
              border-bottom: 2px solid #8B0000;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              display: flex;
              align-items: center;
              page-break-after: avoid;
            }
            
            .section-title::before {
              content: "📋";
              margin-right: 10px;
              background: rgba(139, 0, 0, 0.1);
              background-color: rgba(139, 0, 0, 0.1);
              padding: 6px 8px;
              border-radius: 6px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 8px;
            }
            
            .info-item {
              background: #F9FAFB;
              background-color: #F9FAFB;
              padding: 14px;
              border-radius: 8px;
              border: 1px solid #E5E7EB;
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .info-item.resolution-status {
              background: #F9FAFB;
              background-color: #F9FAFB;
              border: 1px solid #E5E7EB;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .info-item.resolution-status .info-value {
              color: #1a1a1a;
              font-weight: 600;
            }
            
            .info-label {
              font-size: 10px;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
              font-weight: bold;
              line-height: 1.3;
            }
            
            .info-value {
              font-size: 13px;
              color: #1a1a1a;
              font-weight: 600;
              line-height: 1.5;
              word-wrap: break-word;
            }
            
            .description-box {
              background: #F9FAFB;
              background-color: #F9FAFB;
              padding: 18px;
              border-radius: 8px;
              border-left: 4px solid #8B0000;
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .description-box p {
              font-size: 13px;
              line-height: 1.8;
              color: #1a1a1a;
              margin: 0;
              word-wrap: break-word;
              text-align: justify;
            }
            
            .timeline-item {
              background: #f9f9f9;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 10px;
              border-left: 4px solid #8B0000;
            }
            
            .timeline-date {
              font-size: 11px;
              color: #8B0000;
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .timeline-content {
              font-size: 13px;
              color: #333;
            }
            
            .footer {
              margin-top: 48px;
              padding: 24px 32px;
              background: #F9FAFB;
              background-color: #F9FAFB;
              border-radius: 12px;
              border: 2px dashed #E5E7EB;
              text-align: center;
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .footer .stamp {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 10px;
            }
            
            .footer .stamp-icon {
              font-size: 20px;
              margin-right: 8px;
            }
            
            .footer strong {
              color: #8B0000;
              font-size: 13px;
              letter-spacing: 0.8px;
              font-weight: bold;
            }
            
            .footer p {
              font-size: 11px;
              color: #6B7280;
              margin: 6px 0;
              line-height: 1.4;
            }
            
            .footer .disclaimer {
              font-size: 10px;
              color: #9CA3AF;
              font-style: italic;
              margin-top: 14px;
              line-height: 1.7;
              max-width: 90%;
              margin-left: auto;
              margin-right: auto;
            }
            
            .signature-section {
              margin-top: 40px;
              padding: 20px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            
            .signature-line {
              margin-top: 30px;
              padding-top: 2px;
              border-top: 2px solid #333;
              width: 250px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            
            /* Evidence and Witness Items */
            .evidence-item,
            .witness-item {
              background: #F9FAFB;
              background-color: #F9FAFB;
              padding: 14px;
              border-radius: 8px;
              margin-bottom: 12px;
              border: 1px solid #E5E7EB;
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .evidence-item img,
            .witness-item img {
              max-width: 400px;
              max-height: 300px;
              width: auto;
              height: auto;
              border-radius: 8px;
              margin-top: 10px;
              border: 1px solid #E5E7EB;
              display: block;
            }
            
            .witness-notes {
              margin-top: 10px;
              padding: 10px;
              background: #ffffff;
              background-color: #ffffff;
              border-radius: 6px;
              font-size: 12px;
              color: #374151;
              line-height: 1.7;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .evidence-item .file-meta,
            .witness-item .contact-info {
              font-size: 11px;
              color: #6B7280;
              margin-top: 4px;
            }
            
            .evidence-item .file-url {
              margin-top: 10px;
              font-size: 10px;
              color: #9CA3AF;
              word-break: break-all;
            }
            
            /* Print Optimization */
            @media print {
              body {
                padding: ${printBodyPadding};
                margin: ${printBodyMargin};
              }
              
              .document-wrapper {
                padding: ${printWrapperPadding};
                max-width: 100%;
              }
              
              .header {
                padding: ${headerPrintPadding};
              }
              
              .section {
                page-break-inside: avoid;
                margin-bottom: ${sectionMarginBottom};
              }
              
              .info-item,
              .description-box,
              .evidence-item,
              .witness-item {
                page-break-inside: avoid;
              }
              
              img {
                max-width: 100%;
                page-break-inside: avoid;
              }
              
              .footer {
                page-break-before: avoid;
                margin-top: ${footerMarginTop};
              }
            }
          </style>
        </head>
        <body>
          <div class="document-wrapper">
          <!-- Header -->
          <div class="header">
            <div class="seal">🛡️</div>
            <h1>WILDWATCH</h1>
            <p class="subtitle">WildWatch Incident Reporting System</p>
            <div class="divider"></div>
            <p class="doc-title">OFFICIAL INCIDENT REPORT</p>
            <p class="doc-subtitle">Resolved Case Documentation</p>
          </div>
          
          <!-- Document Title -->
          <div class="document-title">
            <div class="status-badge">✓ CASE RESOLVED</div>
            <p style="margin-top: 20px; font-size: 11px; color: #6B7280; letter-spacing: 0.5px;">DOCUMENT REFERENCE</p>
            <h2 style="margin-top: 5px;">${
              incident.trackingNumber || "N/A"
            }</h2>
          </div>
          
          <!-- Case Information -->
          <div class="section">
            <div class="section-title">Case Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Tracking Number</div>
                <div class="info-value">${
                  incident.trackingNumber || "N/A"
                }</div>
              </div>
              <div class="info-item">
                <div class="info-label">Incident Title</div>
                <div class="info-value">${incident.incidentType || "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date and Time of Incident</div>
                <div class="info-value">${formatDateWithTime(
                  incident.dateOfIncident,
                  incident.timeOfIncident
                )}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date Submitted</div>
                <div class="info-value">${formatDate(
                  incident.submittedAt
                )}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Estimated Date to Resolve</div>
                <div class="info-value">${
                  formatDate(incident.estimatedResolutionDate) || "Not set"
                }</div>
              </div>
             
              <div class="info-item">
                <div class="info-label">Resolution Time</div>
                <div class="info-value">${calculateResolutionTime(
                  incident.submittedAt,
                  incident.finishedDate
                )}</div>
              </div>
            </div>
          </div>
          
          <!-- Reporter Information -->
          <div class="section">
            <div class="section-title">Reporter Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Reporter Name</div>
                <div class="info-value">${
                  getReporterDisplayName(incident)
                }</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email Address</div>
                <div class="info-value">${
                  getReporterDisplayEmail(incident)
                }</div>
              </div>
              ${
                getReporterDisplayPhone(incident) !== "Not provided"
                  ? `
              <div class="info-item">
                <div class="info-label">Phone Number</div>
                <div class="info-value">${getReporterDisplayPhone(incident)}</div>
              </div>
              `
                  : ""
              }
              ${
                incident.submittedByIdNumber
                  ? `
              <div class="info-item">
                <div class="info-label">ID Number</div>
                <div class="info-value">${incident.submittedByIdNumber}</div>
              </div>
              `
                  : ""
              }
            </div>
          </div>
          
          <!-- Location Information -->
          <div class="section">
            <div class="section-title">Location</div>
            <div class="info-item">
              <div class="info-label">Incident Location</div>
              <div class="info-value">${
                getDisplayLocation(incident.location)
              }</div>
            </div>
          </div>
          
          <!-- Incident Description -->
          <div class="section">
            <div class="section-title">Incident Description</div>
            <div class="description-box">
              <p>${incident.description || "No description provided."}</p>
            </div>
          </div>
          
          <!-- Resolution Data -->
          <div class="section">
            <div class="section-title">Incident Resolution Data</div>
            <div class="info-grid">
              <div class="info-item resolution-status">
                <div class="info-label">Resolution Status</div>
                <div class="info-value">✓ RESOLVED</div>
              </div>
             
              <div class="info-item">
                <div class="info-label">Total Resolution Time</div>
                <div class="info-value">${calculateResolutionTime(
                  incident.submittedAt,
                  incident.finishedDate
                )}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Handled By</div>
                <div class="info-value">${
                  incident.assignedOffice || "Not assigned"
                }</div>
              </div>
            </div>
            ${
              incident.resolutionNotes
                ? `
            <div style="margin-top: 16px;">
              <div style="font-size: 11px; color: #6B7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                RESOLUTION NOTES
              </div>
              <div class="description-box">
                <p>${incident.resolutionNotes}</p>
              </div>
            </div>
            `
                : ""
            }
          </div>
          
          <!-- Evidence -->
          ${
            incident.evidence && incident.evidence.length > 0
              ? `
          <div class="section">
            <div class="section-title">Evidence Attachments</div>
            <p style="font-size: 12px; color: #6B7280; margin-bottom: 12px;">
              ${incident.evidence.length} file(s) attached to this report
            </p>
            ${incident.evidence
              .map(
                (evidence: any, index: number) => `
              <div class="evidence-item">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 20px; margin-right: 10px;">📎</span>
                  <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 3px;">
                      Evidence #${index + 1}
                    </div>
                    <div class="file-meta">
                      ${evidence.fileName || "Attachment"}
                    </div>
                  </div>
                </div>
                ${
                  evidence.fileType?.startsWith("image/")
                    ? `
                <div style="margin-top: 12px;">
                  <img src="${evidence.fileUrl}" 
                       alt="${evidence.fileName}" />
                </div>
                `
                    : ""
                }
                <div class="file-url">
                  File URL: ${evidence.fileUrl}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }
          
          <!-- Witnesses -->
          ${
            incident.witnesses && incident.witnesses.length > 0
              ? `
          <div class="section">
            <div class="section-title">Witnesses</div>
            <p style="font-size: 12px; color: #6B7280; margin-bottom: 12px;">
              ${incident.witnesses.length} witness(es) reported
            </p>
            ${incident.witnesses
              .map(
                (witness: any, index: number) => `
              <div class="witness-item">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 20px; margin-right: 10px;">👤</span>
                  <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 3px;">
                      ${witness.name || "Witness #" + (index + 1)}
                    </div>
                    ${
                      witness.contactInformation
                        ? `
                    <div class="contact-info">
                      Contact: ${witness.contactInformation}
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>
                ${
                  witness.additionalNotes
                    ? `
                <div class="witness-notes">
                  ${witness.additionalNotes}
                </div>
                `
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }
  
          
          <!-- Footer -->
          <div class="footer">
            <div class="stamp">
              <span class="stamp-icon">🛡️</span>
              <strong>OFFICIAL DOCUMENT</strong>
            </div>
            <p>WildWatch Incident Reporting System</p>
            <p>Generated: ${formatDateTime(new Date().toISOString())}</p>
            <p class="disclaimer">
              This is an official report document. For verification, please reference tracking number #${
                incident.trackingNumber
              }
            </p>
          </div>
          </div>
        </body>
      </html>
    `;
  };

  const calculateResolutionTime = (
    submittedAt?: string | null,
    resolvedAt?: string | null
  ): string => {
    if (!submittedAt || !resolvedAt) return "N/A";
    try {
      const submitted = new Date(submittedAt);
      const resolved = new Date(resolvedAt);
      const diffMs = resolved.getTime() - submitted.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""}, ${diffHours} hour${
          diffHours !== 1 ? "s" : ""
        }`;
      }
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
    } catch {
      return "N/A";
    }
  };

  const handleDownloadPDF = async () => {
    if (!incident) return;

    try {
      setIsGeneratingPDF(true);

      const htmlContent = generateHTMLContent();
      const fileName = `WildWatch_Report_${
        incident.trackingNumber
      }_${Date.now()}.pdf`;

      // Generate PDF with optimized settings for color rendering
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612, // 8.5 inches at 72 DPI
        height: 792, // 11 inches at 72 DPI
        ...(Platform.OS === "ios" && {
          margins: {
            left: 72, // 1 inch
            top: 72,
            right: 72,
            bottom: 72,
          },
        }),
      });

      Toast.show({
        type: "success",
        text1: "PDF Generated Successfully",
        text2: "Saving to your device...",
        position: "bottom",
        visibilityTime: 2000,
      });

      // Share the PDF (allows user to save to Files app on iOS, Downloads on Android)
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Save Report - ${incident.trackingNumber}`,
          UTI: "com.adobe.pdf",
        });

        Toast.show({
          type: "success",
          text1: "PDF Ready",
          text2: "Choose where to save your report",
          position: "bottom",
          visibilityTime: 2500,
        });
      } else {
        Toast.show({
          type: "info",
          text1: "PDF Generated",
          text2: `Saved to: ${uri}`,
          position: "bottom",
          visibilityTime: 3500,
        });
      }
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to generate PDF",
        text2: error.message || "Please try again",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!incident) return;

    try {
      const htmlContent = generateHTMLContent();

      await Print.printAsync({
        html: htmlContent,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to print",
        text2: error.message || "Please try again",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-gray-50"
        style={{
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
        }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#8B0000"
          translucent={false}
        />
        <CircularLoader subtitle="Loading report document..." />
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View
        className="flex-1 bg-gray-50"
        style={{
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
        }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#8B0000"
          translucent={false}
        />
        <Stack.Screen
          options={{
            title: "Report Document",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#8B0000",
            },
            headerTintColor: "#D4AF37",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 18,
            },
          }}
        />
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-red-600 text-lg font-semibold mt-4 text-center">
            {error || "Failed to load report"}
          </Text>
          <TouchableOpacity
            className="bg-[#8B0000] rounded-lg px-6 py-3 mt-4"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-gray-50"
      style={{
        paddingTop:
          Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
      }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#8B0000"
        translucent={false}
      />
      <Stack.Screen
        options={{
          title: "Report Document",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#8B0000",
          },
          headerTintColor: "#D4AF37",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
        }}
      />

      <ScrollView
        className="flex-1"
        style={{
          paddingHorizontal: isCompact ? 12 : 40,
          paddingTop: isCompact ? 12 : 20,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Container - Print-like Paper */}
        <View
          className="bg-white mb-6"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isCompact ? 0.15 : 0.2,
            shadowRadius: isCompact ? 12 : 16,
            elevation: isCompact ? 8 : 12,
            borderRadius: isCompact ? 0 : 12,
            borderWidth: isCompact ? 1 : 0,
            borderColor: "#E5E7EB",
            marginHorizontal: isCompact ? 0 : 0,
          }}
        >
          {/* Document Header - Letterhead Style */}
          <View
            style={{
              backgroundColor: "#8B0000",
              paddingHorizontal: isCompact ? 20 : 40,
              paddingTop: isCompact ? 24 : 32,
              paddingBottom: isCompact ? 20 : 28,
              borderTopLeftRadius: isCompact ? 0 : 12,
              borderTopRightRadius: isCompact ? 0 : 12,
            }}
          >
            <View className="items-center">
              {/* Official Seal/Badge */}
              <View
                className="mb-3"
                style={{
                  width: isCompact ? 60 : 80,
                  height: isCompact ? 60 : 80,
                  borderRadius: isCompact ? 30 : 40,
                  backgroundColor: "rgba(212, 175, 55, 0.2)",
                  borderWidth: 3,
                  borderColor: "#D4AF37",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={isCompact ? 32 : 44}
                  color="#D4AF37"
                />
              </View>

              <Text
                className="font-extrabold text-center"
                style={{
                  color: "#D4AF37",
                  fontSize: isCompact ? 20 : 26,
                  letterSpacing: 1.5,
                }}
              >
                WILDWATCH
              </Text>
              <Text
                className="text-center mt-1"
                style={{
                  color: "#FDE68A",
                  fontSize: isCompact ? 11 : 13,
                  letterSpacing: 0.5,
                }}
              >
                WildWatch Incident Reporting System
              </Text>

              {/* Divider Line */}
              <View
                style={{
                  width: isCompact ? 120 : 200,
                  height: 2,
                  backgroundColor: "#D4AF37",
                  marginTop: 12,
                  marginBottom: 12,
                  opacity: 0.6,
                }}
              />

              <Text
                className="font-bold text-center"
                style={{
                  color: "#FFFFFF",
                  fontSize: isCompact ? 16 : 20,
                  letterSpacing: 1,
                }}
              >
                OFFICIAL INCIDENT REPORT
              </Text>
              <Text
                className="text-center mt-1 italic"
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: isCompact ? 11 : 13,
                }}
              >
                Resolved Case Documentation
              </Text>
            </View>
          </View>

          {/* Document Body with Paper-like padding */}
          <View
            style={{
              paddingHorizontal: isCompact ? 20 : 40,
              paddingTop: isCompact ? 20 : 32,
              paddingBottom: isCompact ? 24 : 40,
            }}
          >
            {/* Status Badge */}
            <View className="items-center mb-6">
              <View
                style={{
                  backgroundColor: "#16A34A",
                  paddingHorizontal: isCompact ? 16 : 24,
                  paddingVertical: isCompact ? 8 : 10,
                  borderRadius: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#16A34A",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={isCompact ? 18 : 22}
                  color="#FFFFFF"
                />
                <Text
                  className="text-white font-extrabold ml-2"
                  style={{
                    fontSize: isCompact ? 13 : 15,
                    letterSpacing: 0.5,
                  }}
                >
                  CASE RESOLVED
                </Text>
              </View>

              {/* Document Reference Number */}
              <View className="mt-4 items-center">
                <Text
                  className="text-gray-500"
                  style={{ fontSize: isCompact ? 10 : 11, letterSpacing: 0.5 }}
                >
                  DOCUMENT REFERENCE
                </Text>
                <Text
                  className="font-bold text-gray-900 mt-1"
                  style={{ fontSize: isCompact ? 16 : 20, letterSpacing: 1 }}
                >
                  #{incident.trackingNumber || "N/A"}
                </Text>
              </View>
            </View>

            {/* Horizontal Line Separator */}
            <View
              style={{
                height: 2,
                backgroundColor: "#E5E7EB",
                marginBottom: isCompact ? 20 : 28,
              }}
            />

            {/* Case Information */}
            <View style={{ marginBottom: isCompact ? 20 : 24 }}>
              <SectionHeader
                title="CASE INFORMATION"
                icon="information-circle"
                isCompact={isCompact}
              />
              <View className="flex-row flex-wrap -mx-1">
                <InfoItem
                  label="Incident Title"
                  value={incident.incidentType || "N/A"}
                  isCompact={isCompact}
                />
                <InfoItem
                  label="Date and Time of Incident"
                  value={formatDateWithTime(
                    incident.dateOfIncident,
                    incident.timeOfIncident
                  )}
                  isCompact={isCompact}
                />
                <InfoItem
                  label="Date Submitted"
                  value={formatDate(incident.submittedAt)}
                  isCompact={isCompact}
                />
                <InfoItem
                  label="Estimated Date to Resolve"
                  value={
                    formatDate(incident.estimatedResolutionDate) || "Not set"
                  }
                  isCompact={isCompact}
                />
              </View>
            </View>

            {/* Reporter Information */}
            <View style={{ marginBottom: isCompact ? 20 : 24 }}>
              <SectionHeader
                title="REPORTER INFORMATION"
                icon="person"
                isCompact={isCompact}
              />
              <View className="flex-row flex-wrap -mx-1">
                <InfoItem
                  label="Reporter Name"
                  value={getReporterDisplayName(incident)}
                  isCompact={isCompact}
                />
                <InfoItem
                  label="Email Address"
                  value={getReporterDisplayEmail(incident)}
                  isCompact={isCompact}
                />
                {getReporterDisplayPhone(incident) !== "Not provided" && (
                  <InfoItem
                    label="Phone Number"
                    value={getReporterDisplayPhone(incident)}
                    isCompact={isCompact}
                  />
                )}
                {incident.submittedByIdNumber && (
                  <InfoItem
                    label="ID Number"
                    value={incident.submittedByIdNumber}
                    isCompact={isCompact}
                  />
                )}
              </View>
            </View>

            {/* Location */}
            <View style={{ marginBottom: isCompact ? 20 : 24 }}>
              <SectionHeader
                title="INCIDENT LOCATION"
                icon="location"
                isCompact={isCompact}
              />
              <View
                className="rounded-lg p-4"
                style={{
                  backgroundColor: "#F9FAFB",
                  borderLeftWidth: 4,
                  borderLeftColor: "#8B0000",
                }}
              >
                <Text
                  className="text-gray-900"
                  style={{
                    fontSize: isCompact ? 13 : 14,
                    lineHeight: isCompact ? 20 : 22,
                  }}
                >
                  {getDisplayLocation(incident.location)}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={{ marginBottom: isCompact ? 20 : 24 }}>
              <SectionHeader
                title="INCIDENT DESCRIPTION"
                icon="document-text"
                isCompact={isCompact}
              />
              <View
                className="rounded-lg p-4"
                style={{
                  backgroundColor: "#F9FAFB",
                  borderLeftWidth: 4,
                  borderLeftColor: "#8B0000",
                }}
              >
                <Text
                  className="text-gray-900"
                  style={{
                    fontSize: isCompact ? 13 : 14,
                    lineHeight: isCompact ? 20 : 22,
                  }}
                >
                  {incident.description || "No description provided."}
                </Text>
              </View>
            </View>

            {/* Incident Resolution Data */}
            <View style={{ marginBottom: isCompact ? 20 : 24 }}>
              <SectionHeader
                title="INCIDENT RESOLUTION DATA"
                icon="checkmark-done-circle"
                isCompact={isCompact}
              />
              <View className="flex-row flex-wrap -mx-1">
                <InfoItem
                  label="Resolution Status"
                  value="✓ RESOLVED"
                  isCompact={isCompact}
                />
                <InfoItem
                  label="Date Resolved"
                  value={formatDate(incident.finishedDate)}
                  isCompact={isCompact}
                />
                <InfoItem
                  label="Total Resolution Time"
                  value={calculateResolutionTime(
                    incident.submittedAt,
                    incident.finishedDate
                  )}
                  isCompact={isCompact}
                />
                <InfoItem
                  label="Handled By"
                  value={incident.assignedOffice || "Not assigned"}
                  isCompact={isCompact}
                />
              </View>

              {incident.resolutionNotes && (
                <View style={{ marginTop: 16 }}>
                  <Text
                    className="font-bold mb-2"
                    style={{
                      fontSize: isCompact ? 10 : 11,
                      color: "#6B7280",
                      letterSpacing: 0.5,
                    }}
                  >
                    RESOLUTION NOTES
                  </Text>
                  <View
                    className="rounded-lg p-4"
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderLeftWidth: 4,
                      borderLeftColor: "#8B0000",
                    }}
                  >
                    <Text
                      className="text-gray-900"
                      style={{
                        fontSize: isCompact ? 13 : 14,
                        lineHeight: isCompact ? 20 : 22,
                      }}
                    >
                      {incident.resolutionNotes}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Evidence Attachments */}
            {incident.evidence && incident.evidence.length > 0 && (
              <View style={{ marginBottom: isCompact ? 20 : 24 }}>
                <SectionHeader
                  title="EVIDENCE ATTACHMENTS"
                  icon="attach"
                  isCompact={isCompact}
                />
                <Text
                  className="text-gray-600 mb-3"
                  style={{ fontSize: isCompact ? 11 : 12 }}
                >
                  {incident.evidence.length} file(s) attached to this report
                </Text>
                {incident.evidence.map((evidence: any, index: number) => (
                  <View
                    key={evidence.id || index}
                    className="rounded-lg p-3 mb-3"
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <Text style={{ fontSize: 20, marginRight: 10 }}>📎</Text>
                      <View className="flex-1">
                        <Text
                          className="font-semibold text-gray-900"
                          style={{ fontSize: isCompact ? 12 : 13 }}
                        >
                          Evidence #{index + 1}
                        </Text>
                        <Text
                          className="text-gray-600"
                          style={{ fontSize: isCompact ? 10 : 11 }}
                          numberOfLines={1}
                        >
                          {evidence.fileName || "Attachment"}
                        </Text>
                      </View>
                    </View>
                    {evidence.fileType?.startsWith("image/") && (
                      <Image
                        source={{ uri: evidence.fileUrl }}
                        style={{
                          width: "100%",
                          height: isCompact ? 150 : 200,
                          borderRadius: 8,
                          marginTop: 8,
                          backgroundColor: "#E5E7EB",
                        }}
                        resizeMode="contain"
                      />
                    )}
                    <Text
                      className="text-gray-500 mt-2"
                      style={{ fontSize: 9 }}
                      numberOfLines={1}
                    >
                      {evidence.fileUrl}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Witnesses */}
            {incident.witnesses && incident.witnesses.length > 0 && (
              <View style={{ marginBottom: isCompact ? 20 : 24 }}>
                <SectionHeader
                  title="WITNESSES"
                  icon="people-outline"
                  isCompact={isCompact}
                />
                <Text
                  className="text-gray-600 mb-3"
                  style={{ fontSize: isCompact ? 11 : 12 }}
                >
                  {incident.witnesses.length} witness(es) reported
                </Text>
                {incident.witnesses.map((witness: any, index: number) => (
                  <View
                    key={witness.id || index}
                    className="rounded-lg p-3 mb-3"
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <Text style={{ fontSize: 20, marginRight: 10 }}>👤</Text>
                      <View className="flex-1">
                        <Text
                          className="font-semibold text-gray-900"
                          style={{ fontSize: isCompact ? 12 : 13 }}
                        >
                          {witness.name || `Witness #${index + 1}`}
                        </Text>
                        {witness.contactInformation && (
                          <Text
                            className="text-gray-600"
                            style={{ fontSize: isCompact ? 10 : 11 }}
                          >
                            Contact: {witness.contactInformation}
                          </Text>
                        )}
                      </View>
                    </View>
                    {witness.additionalNotes && (
                      <View
                        className="rounded-lg p-2 mt-2"
                        style={{ backgroundColor: "#FFFFFF" }}
                      >
                        <Text
                          className="text-gray-700"
                          style={{
                            fontSize: isCompact ? 11 : 12,
                            lineHeight: isCompact ? 16 : 18,
                          }}
                        >
                          {witness.additionalNotes}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Horizontal Line Separator */}
            <View
              style={{
                height: 2,
                backgroundColor: "#E5E7EB",
                marginTop: isCompact ? 8 : 16,
                marginBottom: isCompact ? 16 : 24,
              }}
            />

            {/* Footer - Official Stamp */}
            <View
              className="items-center"
              style={{ marginTop: isCompact ? 12 : 16 }}
            >
              <View
                style={{
                  paddingHorizontal: isCompact ? 20 : 32,
                  paddingVertical: isCompact ? 16 : 20,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "#E5E7EB",
                  borderStyle: "dashed",
                }}
              >
                <View className="flex-row items-center justify-center mb-2">
                  <Ionicons name="shield-checkmark" size={20} color="#8B0000" />
                  <Text
                    className="font-bold ml-2"
                    style={{
                      color: "#8B0000",
                      fontSize: isCompact ? 12 : 13,
                      letterSpacing: 0.5,
                    }}
                  >
                    OFFICIAL DOCUMENT
                  </Text>
                </View>
                <Text
                  className="text-center text-gray-600"
                  style={{ fontSize: isCompact ? 10 : 11 }}
                >
                  WildWatch Incident Reporting System
                </Text>
                <Text
                  className="text-center text-gray-500 mt-1"
                  style={{ fontSize: isCompact ? 9 : 10 }}
                >
                  Generated: {formatDateTime(new Date().toISOString())}
                </Text>
              </View>

              <Text
                className="text-center text-gray-500 mt-4 italic"
                style={{
                  fontSize: isCompact ? 10 : 11,
                  lineHeight: isCompact ? 16 : 18,
                  paddingHorizontal: isCompact ? 0 : 20,
                }}
              >
                This is an official report document. For verification, please
                reference tracking number #{incident.trackingNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            marginBottom: isCompact ? 20 : 24,
            flexDirection: isCompact ? "column" : "row",
            gap: 12,
            paddingHorizontal: isCompact ? 0 : 0,
          }}
        >
          <TouchableOpacity
            style={{
              flex: isCompact ? 0 : 1,
              backgroundColor: "#8B0000",
              paddingVertical: isCompact ? 14 : 16,
              paddingHorizontal: isCompact ? 20 : 24,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#8B0000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              marginBottom: isCompact ? 12 : 0,
            }}
            onPress={handleDownloadPDF}
            disabled={isGeneratingPDF}
            activeOpacity={0.8}
          >
            {isGeneratingPDF ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="download" size={20} color="#FFF" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-extrabold"
                    style={{
                      fontSize: isCompact ? 14 : 16,
                      letterSpacing: 0.5,
                    }}
                  >
                    Download PDF
                  </Text>
                  <Text
                    className="text-white/80"
                    style={{ fontSize: isCompact ? 11 : 12 }}
                  >
                    Save to device
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={{
                flex: isCompact ? 0 : 1,
                backgroundColor: "#FFFFFF",
                paddingVertical: isCompact ? 14 : 16,
                paddingHorizontal: isCompact ? 20 : 24,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#8B0000",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 3,
              }}
              onPress={handlePrint}
              activeOpacity={0.8}
            >
              <View
                style={{
                  backgroundColor: "rgba(139, 0, 0, 0.1)",
                  padding: 8,
                  borderRadius: 8,
                  marginRight: 12,
                }}
              >
                <Ionicons name="print" size={20} color="#8B0000" />
              </View>
              <View className="flex-1">
                <Text
                  className="font-extrabold"
                  style={{
                    color: "#8B0000",
                    fontSize: isCompact ? 14 : 16,
                    letterSpacing: 0.5,
                  }}
                >
                  Print Document
                </Text>
                <Text
                  className="text-gray-600"
                  style={{ fontSize: isCompact ? 11 : 12 }}
                >
                  Print directly
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isCompact: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  isCompact,
}) => {
  return (
    <View
      className="flex-row items-center mb-3"
      style={{
        paddingBottom: isCompact ? 8 : 10,
        borderBottomWidth: 2,
        borderBottomColor: "#8B0000",
        borderStyle: "solid",
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(139, 0, 0, 0.1)",
          padding: isCompact ? 6 : 8,
          borderRadius: 8,
          marginRight: 10,
        }}
      >
        <Ionicons name={icon} size={isCompact ? 16 : 18} color="#8B0000" />
      </View>
      <Text
        className="font-extrabold flex-1"
        style={{
          color: "#8B0000",
          fontSize: isCompact ? 12 : 14,
          letterSpacing: 0.8,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

// Info Item Component
interface InfoItemProps {
  label: string;
  value: string;
  isCompact: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, isCompact }) => {
  return (
    <View
      className="rounded-lg p-3 m-1"
      style={{
        width: isCompact ? "100%" : "48%",
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text
        className="text-gray-500 font-bold mb-1"
        style={{ fontSize: isCompact ? 9 : 10, letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        className="text-gray-900 font-semibold"
        style={{ fontSize: isCompact ? 13 : 14 }}
      >
        {value}
      </Text>
    </View>
  );
};
