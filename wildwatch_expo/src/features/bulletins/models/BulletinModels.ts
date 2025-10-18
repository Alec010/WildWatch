export interface BulletinMediaDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface IncidentSummaryDto {
  id: string;
  trackingNumber: string;
  title: string;
  status: string;
}

export interface OfficeBulletinDto {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  upvoteCount: number;
  userHasUpvoted?: boolean;
  mediaAttachments: BulletinMediaDto[];
  relatedIncidents: IncidentSummaryDto[];
}

