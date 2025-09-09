export type OfficeCode = string;

export interface IncidentRequestDto {
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  assignedOffice?: OfficeCode;
  witnesses?: WitnessRequestDto[];
  preferAnonymous?: boolean;
  tags?: string[];
}

export interface WitnessRequestDto {
  name?: string;
  contactInformation?: string;
  additionalNotes?: string;
}

export interface IncidentResponseDto {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  assignedOffice: OfficeCode | null;
  priorityLevel?: string | null;
  status?: string | null;
  submittedBy?: string | null;
  submittedByFullName?: string | null;
  submittedByIdNumber?: string | null;
  submittedByEmail?: string | null;
  submittedByPhone?: string | null;
  submittedAt?: string | null;
  evidence?: EvidenceDto[];
  witnesses?: WitnessResponseDto[];
  officeAdminName?: string | null;
  finishedDate?: string | null;
  verified?: boolean | null;
  transferredFrom?: string | null;
  lastTransferredTo?: string | null;
  lastTransferNotes?: string | null;
  upvoteCount?: number | null;
}

export interface EvidenceDto {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface WitnessResponseDto {
  id: string;
  name?: string;
  contactInformation?: string;
  additionalNotes?: string;
}


