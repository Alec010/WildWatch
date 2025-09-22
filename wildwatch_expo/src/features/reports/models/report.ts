export interface OfficeInfo {
  code: string;
  fullName: string;
  description: string;
}

export interface WitnessInfo {
  userId?: number; // ID of registered user for @mention functionality
  name: string; // Manual name entry or display name
  contact: string; // Manual contact info or user email
  additionalNotes: string; // Additional notes about witness (renamed from statement)
  isRegisteredUser?: boolean; // Helper flag to track if this is a registered user
}

export interface EvidenceFileInfo {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface ReportForm {
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  assignedOffice: string | null;
  preferAnonymous: boolean;
  tags: string[];
}

