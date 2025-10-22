export interface IncidentEvidenceDto {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface IncidentWitnessDto {
  id: string;
  name: string;
  contactInformation: string;
  additionalNotes: string;
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
  estimatedResolutionDate?: string;
  assignedOffice?: string;
  officeAdminName?: string;
  preferAnonymous: boolean;
  tags: string[];
  evidence?: IncidentEvidenceDto[];
  witnesses?: IncidentWitnessDto[];
  submittedByEmail: string;
  submittedByFullName?: string;
  submittedByPhone?: string;
  resolutionNotes?: string;
  upvoteCount: number;
}


