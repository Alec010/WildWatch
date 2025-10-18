export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  email: string;
  schoolIdNumber: string;
  contactNumber: string;
  role: string;
  points?: number;
  authProvider?: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  contactNumber?: string;
}


