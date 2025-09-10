export interface OfficeInfo {
  code: string;
  fullName: string;
  description: string;
}

export interface WitnessInfo {
  name: string;
  contact: string;
  statement: string;
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

