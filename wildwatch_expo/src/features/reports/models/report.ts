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
  formattedAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  building?: string;
  buildingName?: string;
  buildingCode?: string;
  room?: string; // Optional specific room/location within the building
  withinCampus?: boolean;
  distanceFromCampusCenter?: number;
  description: string;
  assignedOffice: string | null;
  preferAnonymous: boolean;
  tags: string[]; // Selected display tags (3-5 tags)
  allTags?: string[]; // All 20 generated tags for backend submission
}

