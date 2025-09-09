export interface NotificationIncidentRefDto {
  id: string;
  trackingNumber: string;
}

export interface NotificationItemDto {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  incident?: NotificationIncidentRefDto;
}

export interface NotificationResponseDto {
  content: NotificationItemDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}


