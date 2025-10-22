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
  userId?: number; // ID of registered user for @mention functionality
  name?: string; // Manual name entry (ignored if userId is provided)
  contactInformation?: string; // Manual contact info (ignored if userId is provided)
  additionalNotes?: string; // Notes about witness account (applies to both types)
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
  estimatedResolutionDate?: string | null;
  verified?: boolean | null;
  transferredFrom?: string | null;
  lastTransferredTo?: string | null;
  lastTransferNotes?: string | null;
  resolutionNotes?: string | null;
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
  userId?: number; // ID of registered user if this witness is a registered user
  name?: string; // Display name (from user record or manual entry)
  contactInformation?: string; // Contact info (from user record or manual entry)
  additionalNotes?: string; // Additional notes about the witness
}


