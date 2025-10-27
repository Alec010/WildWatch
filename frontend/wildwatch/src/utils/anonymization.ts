/**
 * Utility functions for handling incident anonymity and privacy
 */

export interface AnonymizedIncident {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  formattedAddress?: string;
  description: string;
  status: string;
  submittedBy: string;
  submittedByFullName: string;
  submittedByIdNumber: string;
  submittedByEmail: string;
  submittedByPhone: string;
  submittedAt: string;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW" | null;
  isAnonymous?: boolean;
  isPrivate?: boolean;
  preferAnonymous?: boolean;
  upvoteCount?: number | undefined;
  assignedOffice?: string;
  transferredFrom?: string;
  lastTransferredTo?: string;
  lastTransferNotes?: string;
  [key: string]: any;
}

/**
 * Anonymizes incident data for public display
 * @param incident - The incident data
 * @param isViewerAdmin - Whether the viewer is an office admin
 * @param isViewerSubmitter - Whether the viewer is the incident submitter
 * @returns Anonymized incident data
 */
export function anonymizeIncident(
  incident: AnonymizedIncident,
  isViewerAdmin: boolean = false,
  isViewerSubmitter: boolean = false
): AnonymizedIncident {
  // If viewer is admin or submitter, show full details
  if (isViewerAdmin || isViewerSubmitter) {
    return incident;
  }

  // If incident is anonymous, hide reporter details
  if (incident.isAnonymous || incident.preferAnonymous) {
    return {
      ...incident,
      submittedBy: "Anonymous Reporter",
      submittedByFullName: "Anonymous Reporter",
      submittedByIdNumber: "***",
      submittedByEmail: "***",
      submittedByPhone: "***"
    };
  }

  return incident;
}

/**
 * Checks if an incident should be visible to a viewer
 * @param incident - The incident data
 * @param isViewerAdmin - Whether the viewer is an office admin
 * @param isViewerSubmitter - Whether the viewer is the incident submitter
 * @returns Whether the incident should be visible
 */
export function shouldShowIncident(
  incident: AnonymizedIncident,
  isViewerAdmin: boolean = false,
  isViewerSubmitter: boolean = false
): boolean {
  // If viewer is admin or submitter, show all incidents
  if (isViewerAdmin || isViewerSubmitter) {
    return true;
  }

  // If incident is private, only show to admin and submitter
  if (incident.isPrivate) {
    return false;
  }

  return true;
}

/**
 * Filters incidents based on privacy settings
 * @param incidents - Array of incidents
 * @param isViewerAdmin - Whether the viewer is an office admin
 * @param isViewerSubmitter - Whether the viewer is the incident submitter
 * @returns Filtered array of incidents
 */
export function filterIncidentsByPrivacy(
  incidents: AnonymizedIncident[],
  isViewerAdmin: boolean = false,
  isViewerSubmitter: boolean = false
): AnonymizedIncident[] {
  return incidents
    .filter(incident => shouldShowIncident(incident, isViewerAdmin, isViewerSubmitter))
    .map(incident => anonymizeIncident(incident, isViewerAdmin, isViewerSubmitter));
}

/**
 * Gets the display name for a reporter
 * @param incident - The incident data
 * @param isViewerAdmin - Whether the viewer is an office admin
 * @param isViewerSubmitter - Whether the viewer is the incident submitter
 * @returns The display name for the reporter
 */
export function getReporterDisplayName(
  incident: {
    submittedByFullName?: string;
    submittedBy?: string;
    isAnonymous?: boolean;
    preferAnonymous?: boolean;
  },
  isViewerAdmin: boolean = false,
  isViewerSubmitter: boolean = false
): string {
  // If viewer is admin or submitter, show real name
  if (isViewerAdmin || isViewerSubmitter) {
    return incident.submittedByFullName || incident.submittedBy || "Unknown";
  }

  // If incident is anonymous, show anonymous
  if (incident.isAnonymous || incident.preferAnonymous) {
    return "Anonymous Reporter";
  }

  return incident.submittedByFullName || incident.submittedBy || "Unknown";
}

/**
 * Checks if reporter details should be shown
 * @param incident - The incident data
 * @param isViewerAdmin - Whether the viewer is an office admin
 * @param isViewerSubmitter - Whether the viewer is the incident submitter
 * @returns Whether reporter details should be shown
 */
export function shouldShowReporterDetails(
  incident: {
    isAnonymous?: boolean;
    preferAnonymous?: boolean;
  },
  isViewerAdmin: boolean = false,
  isViewerSubmitter: boolean = false
): boolean {
  // Always show details to admin and submitter
  if (isViewerAdmin || isViewerSubmitter) {
    return true;
  }

  // Don't show details if incident is anonymous
  if (incident.isAnonymous || incident.preferAnonymous) {
    return false;
  }

  return true;
}
