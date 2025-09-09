export interface IncidentEvidenceDto {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface IncidentWitnessDto {
  id: string;
  name: string;
  contact: string;
  statement: string;
}

export interface IncidentDetailsDto {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  status: string;
  priorityLevel: string;
  submittedAt: string;
  finishedDate?: string;
  assignedOffice?: string;
  officeAdminName?: string;
  preferAnonymous: boolean;
  tags: string[];
  evidence?: IncidentEvidenceDto[];
  witnesses?: IncidentWitnessDto[];
  submittedByEmail: string;
  submittedByFullName?: string;
  submittedByPhone?: string;
  upvoteCount: number;
}


