"use client";

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
  // Allow for alternative field names
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

interface TSGPDFProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
}

// Function to prepare data for PDF preview page redirect
// Note: This function only stores data. The actual navigation should be done
// using Next.js router in the calling component to avoid full page reload.
export function preparePDFPreviewData(incident: Incident) {
  if (typeof window === "undefined") return;

  // Store initial form data in sessionStorage for the preview page
  // The preview page will fetch full incident details and initialize defaults
  sessionStorage.setItem(
    `pdf-preview-${incident.trackingNumber}`,
    JSON.stringify({
      reportedBy: "",
      titleRole: "",
      signatureImage: null,
      impactOfIncident: "",
      affectedSystemResources: "",
      initialAssessment: "",
    })
  );
}

// Keep the modal component for backward compatibility, but it just redirects
export function TSGPDFModal({ incident, isOpen, onClose }: TSGPDFProps) {
  // This component is no longer used but kept for backward compatibility
  // The redirect is now handled directly in the calling component
  return null;
}
