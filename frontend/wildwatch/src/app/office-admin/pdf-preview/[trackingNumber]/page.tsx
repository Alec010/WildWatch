"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar";
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  ArrowLeft,
  Download,
  Upload,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import { formatDateOnly } from "@/utils/dateUtils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/utils/api";
import { PageLoader } from "@/components/PageLoader";
import { generateTSGPDF } from "@/utils/tsgPdfGenerator";

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

export default function PDFPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const trackingNumber = params.trackingNumber as string;
  const { collapsed } = useSidebar();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [reportedBy, setReportedBy] = useState("");
  const [titleRole, setTitleRole] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [impactOfIncident, setImpactOfIncident] = useState<string>("");
  const [affectedSystemResources, setAffectedSystemResources] =
    useState<string>("");
  const [initialAssessment, setInitialAssessment] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preloadedImages, setPreloadedImages] = useState<
    Map<
      string,
      {
        img: HTMLImageElement;
        base64: string;
        imgWidth: number;
        imgHeight: number;
      }
    >
  >(new Map());
  const [isPreloadingImages, setIsPreloadingImages] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Load data from sessionStorage and fetch incident
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load form data from sessionStorage
        const storedFormData = sessionStorage.getItem(
          `pdf-preview-${trackingNumber}`
        );
        let hasStoredData = false;
        if (storedFormData) {
          const formData = JSON.parse(storedFormData);
          setReportedBy(formData.reportedBy || "");
          setTitleRole(formData.titleRole || "");
          setSignatureImage(formData.signatureImage || null);
          setImpactOfIncident(formData.impactOfIncident || "");
          setAffectedSystemResources(formData.affectedSystemResources || "");
          setInitialAssessment(formData.initialAssessment || "");
          hasStoredData = true;
        }

        // Fetch full incident details
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/incidents/track/${trackingNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch incident: ${response.status} ${response.statusText}`
          );
        }

        const incidentData = await response.json();

        // Fetch case updates in parallel with incident data
        const updatesPromise = incidentData.id
          ? fetch(`${API_BASE_URL}/api/incidents/${incidentData.id}/updates`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })
              .then(async (res) => {
                if (res.ok) {
                  const updatesData = await res.json();
                  // Sort updates by date (newest first, then reverse for chronological display)
                  return updatesData
                    .sort((a: IncidentUpdate, b: IncidentUpdate) => {
                      return (
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime()
                      );
                    })
                    .reverse(); // Reverse to show oldest first
                }
                return [];
              })
              .catch(() => [])
          : Promise.resolve([]);

        // Wait for updates to complete
        incidentData.updates = await updatesPromise;

        setIncident(incidentData);

        // Initialize editable fields with default values if not already set from sessionStorage
        if (!hasStoredData) {
          // Set default values from incident data
          const defaultImpact = incidentData.priorityLevel
            ? `Priority: ${incidentData.priorityLevel}. ${
                incidentData.description || "No additional impact details."
              }`
            : "No impact details available.";
          setImpactOfIncident(defaultImpact);

          const defaultAffected = incidentData.officeAdminName
            ? `Department: ${incidentData.officeAdminName}. ${
                incidentData.location || "Location: " + incidentData.location
              }`
            : "No specific system/resource details available.";
          setAffectedSystemResources(defaultAffected);

          const defaultAssessment = incidentData.status
            ? `Status: ${incidentData.status}. ${
                incidentData.description
                  ? incidentData.description.substring(0, 200)
                  : "No additional assessment details."
              }`
            : "No initial assessment available.";
          setInitialAssessment(defaultAssessment);
        }

        // Preload images
        if (incidentData.evidence && Array.isArray(incidentData.evidence)) {
          preloadImages(incidentData.evidence);
        }
      } catch (error) {
        toast.error("Failed to load data", {
          description:
            "Could not load incident or form data. Please try again.",
        });
        router.push(`/office-admin/history`);
      } finally {
        setLoading(false);
      }
    };

    if (trackingNumber) {
      loadData();
    }
  }, [trackingNumber, router]);

  // Preload images
  const preloadImages = async (evidence: Evidence[]) => {
    setIsPreloadingImages(true);
    const imageFiles = evidence.filter((file: Evidence) =>
      file.fileType?.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setIsPreloadingImages(false);
      return;
    }

    const preloadPromises = imageFiles.map(async (file: Evidence) => {
      try {
        if (!file.fileUrl || !file.fileUrl.trim()) {
          return null;
        }

        // Use cache-first strategy for images
        const imageUrl = file.fileUrl;

        let response: Response;
        try {
          response = await fetch(imageUrl, {
            method: "GET",
            mode: "cors",
            credentials: "omit",
            cache: "force-cache", // Use cache for better performance
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });
        } catch (fetchError: any) {
          // Handle timeout or network errors
          if (
            fetchError.name === "AbortError" ||
            fetchError.name === "TimeoutError"
          ) {
            return null;
          }
          // Retry without CORS mode
          try {
            response = await fetch(imageUrl, {
              method: "GET",
              credentials: "omit",
              cache: "force-cache",
              signal: AbortSignal.timeout(30000), // 30 second timeout
            });
          } catch (retryError: any) {
            if (
              retryError.name === "AbortError" ||
              retryError.name === "TimeoutError"
            ) {
              return null;
            }
            throw retryError;
          }
        }

        if (!response.ok) {
          // Handle 504 Gateway Timeout and other server errors gracefully
          if (response.status === 504 || response.status >= 500) {
            return null;
          }
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

        const targetSize = 76.2; // 3 inches in mm
        let imgWidth = img.width;
        let imgHeight = img.height;
        const widthRatio = targetSize / imgWidth;
        const heightRatio = targetSize / imgHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        imgWidth = imgWidth * ratio;
        imgHeight = imgHeight * ratio;

        return {
          fileId: file.id || file.fileUrl,
          data: {
            img,
            base64,
            imgWidth,
            imgHeight,
          },
        };
      } catch (error) {
        // Silently fail for individual images to not block the entire process
        return null;
      }
    });

    Promise.all(preloadPromises).then((results) => {
      const imageMap = new Map();
      results.forEach((result) => {
        if (result) {
          imageMap.set(result.fileId, result.data);
        }
      });
      setPreloadedImages(imageMap);
      setIsPreloadingImages(false);
    });
  };

  // Generate PDF preview
  const generatePreview = async () => {
    if (!incident || !reportedBy.trim() || !titleRole.trim()) return;

    try {
      const doc = await generateTSGPDF(
        incident,
        reportedBy,
        titleRole,
        signatureImage,
        preloadedImages,
        impactOfIncident || null,
        affectedSystemResources || null,
        initialAssessment || null
      );

      // Generate preview URL
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);

      // Clean up old URL if exists
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }

      setPdfPreviewUrl(url);
    } catch (error) {
      toast.error("Failed to generate preview", {
        description: "There was an error generating the PDF preview.",
      });
    }
  };

  // Generate and download PDF
  const generateAndDownloadPDF = async () => {
    if (!reportedBy.trim()) {
      toast.error("Please enter 'Reported By'");
      return;
    }
    if (!titleRole.trim()) {
      toast.error("Please enter 'Title / Role'");
      return;
    }

    if (!incident) return;

    setIsGenerating(true);
    try {
      const doc = await generateTSGPDF(
        incident,
        reportedBy,
        titleRole,
        signatureImage,
        preloadedImages,
        impactOfIncident || null,
        affectedSystemResources || null,
        initialAssessment || null
      );

      // Save PDF
      doc.save(`CIT-U_IT_Incident_Report_${incident.trackingNumber}.pdf`);

      toast.success("PDF Downloaded Successfully", {
        description: `IT Incident Report for ${incident.trackingNumber} has been downloaded.`,
        duration: 3000,
      });

      // Clean up sessionStorage
      sessionStorage.removeItem(`pdf-preview-${trackingNumber}`);

      // Navigate back
      router.push(`/office-admin/history`);
    } catch (error) {
      toast.error("Failed to Download PDF", {
        description: "There was an error generating the PDF. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
        // Update sessionStorage
        if (trackingNumber) {
          sessionStorage.setItem(
            `pdf-preview-${trackingNumber}`,
            JSON.stringify({
              reportedBy,
              titleRole,
              signatureImage: reader.result as string,
              impactOfIncident,
              affectedSystemResources,
              initialAssessment,
            })
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setSignatureImage(null);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
    // Update sessionStorage
    if (trackingNumber) {
      sessionStorage.setItem(
        `pdf-preview-${trackingNumber}`,
        JSON.stringify({
          reportedBy,
          titleRole,
          signatureImage: null,
          impactOfIncident,
          affectedSystemResources,
          initialAssessment,
        })
      );
    }
  };

  // Update sessionStorage when form fields change
  useEffect(() => {
    if (trackingNumber && incident) {
      sessionStorage.setItem(
        `pdf-preview-${trackingNumber}`,
        JSON.stringify({
          reportedBy,
          titleRole,
          signatureImage,
          impactOfIncident,
          affectedSystemResources,
          initialAssessment,
        })
      );
    }
  }, [
    reportedBy,
    titleRole,
    signatureImage,
    impactOfIncident,
    affectedSystemResources,
    initialAssessment,
    trackingNumber,
    incident,
  ]);

  // Generate preview when data is ready
  useEffect(() => {
    if (
      incident &&
      !isPreloadingImages &&
      reportedBy.trim() &&
      titleRole.trim()
    ) {
      generatePreview();
    }
  }, [
    incident,
    reportedBy,
    titleRole,
    signatureImage,
    impactOfIncident,
    affectedSystemResources,
    initialAssessment,
    isPreloadingImages,
    preloadedImages,
  ]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="PDF Preview"
              subtitle="Preview and edit PDF before downloading"
            />
          </div>
          <PageLoader pageTitle="PDF preview" />
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="sticky top-0 z-30 flex-shrink-0">
            <OfficeAdminNavbar
              title="PDF Preview"
              subtitle="Preview and edit PDF before downloading"
            />
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] pt-16">
            <div className="p-6 text-center">
              <p className="text-red-600">Incident not found</p>
              <Button
                onClick={() => router.push(`/office-admin/history`)}
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] overflow-x-hidden">
      <OfficeAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-30 flex-shrink-0">
          <OfficeAdminNavbar
            title="PDF Preview"
            subtitle="Preview and edit PDF before downloading"
          />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] pt-16">
          <div
            className={`px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 ${
              collapsed
                ? "max-w-[calc(100vw-5rem-2rem)]"
                : "max-w-[calc(100vw-16rem-2rem)]"
            } mx-auto w-full`}
          >
            <div className="w-full max-w-full">
              {/* Header Actions */}
              <div className="mb-6 flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/office-admin/history`)}
                  className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={generateAndDownloadPDF}
                  disabled={
                    isGenerating || !reportedBy.trim() || !titleRole.trim()
                  }
                  className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Editable Fields */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-[#8B0000] mb-4">
                    Edit Form Fields
                  </h2>

                  <div className="space-y-6">
                    {/* Reported By and Title / Role - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reported By */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="reportedBy"
                          className="text-sm font-medium"
                        >
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
                        <Label
                          htmlFor="titleRole"
                          className="text-sm font-medium"
                        >
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
                    </div>

                    {/* Date of Report */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Date of Report
                      </Label>
                      <Input
                        value={formatDateOnly(new Date().toISOString())}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        Automatically set to today's date
                      </p>
                    </div>

                    {/* Informative Statement */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        Fields below are prefilled with details from the
                        submitted report, but fields can be altered to update
                        the PDF.
                      </p>
                    </div>

                    {/* Impact of Incident */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="impactOfIncident"
                          className="text-sm font-medium"
                        >
                          Impact of Incident
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setImpactOfIncident("")}
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                          disabled={isGenerating || !impactOfIncident.trim()}
                        >
                          Clear
                        </Button>
                      </div>
                      <Textarea
                        id="impactOfIncident"
                        value={impactOfIncident}
                        onChange={(e) => setImpactOfIncident(e.target.value)}
                        placeholder="Enter impact details..."
                        disabled={isGenerating}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Affected System/Resources */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="affectedSystemResources"
                          className="text-sm font-medium"
                        >
                          Affected System/Resources
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAffectedSystemResources("")}
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                          disabled={
                            isGenerating || !affectedSystemResources.trim()
                          }
                        >
                          Clear
                        </Button>
                      </div>
                      <Textarea
                        id="affectedSystemResources"
                        value={affectedSystemResources}
                        onChange={(e) =>
                          setAffectedSystemResources(e.target.value)
                        }
                        placeholder="Enter affected system/resources..."
                        disabled={isGenerating}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Initial Assessment */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="initialAssessment"
                          className="text-sm font-medium"
                        >
                          Initial Assessment
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setInitialAssessment("")}
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                          disabled={isGenerating || !initialAssessment.trim()}
                        >
                          Clear
                        </Button>
                      </div>
                      <Textarea
                        id="initialAssessment"
                        value={initialAssessment}
                        onChange={(e) => setInitialAssessment(e.target.value)}
                        placeholder="Enter initial assessment..."
                        disabled={isGenerating}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {isPreloadingImages && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Preloading images...</span>
                      </div>
                    )}

                    {/* Signature Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Signature</Label>
                      {/* Informative Statement */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                          Upload a signature image to be displayed on the PDF.
                          Preferably with no background. PNG (max 5MB)
                        </p>
                      </div>

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
                  </div>
                </div>

                {/* Right Column: PDF Preview */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-[#8B0000] mb-4">
                    PDF Preview
                  </h2>

                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    {pdfPreviewUrl ? (
                      <iframe
                        src={pdfPreviewUrl}
                        className="w-full h-[600px] border-0"
                        title="PDF Preview"
                      />
                    ) : !reportedBy.trim() || !titleRole.trim() ? (
                      <div className="h-[600px] flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium mb-2">
                            Fill in Fields to generate preview
                          </p>
                          <p className="text-sm text-gray-500">
                            Please complete "Reported By" and "Title / Role"
                            fields
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[600px] flex items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                          <p className="text-gray-500">Generating preview...</p>
                        </div>
                      </div>
                    )}
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
