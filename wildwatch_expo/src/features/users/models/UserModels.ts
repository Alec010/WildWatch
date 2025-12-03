export interface UserSearchResponse {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  schoolIdNumber: string;
}

export interface UserSearchRequest {
  query: string;
  page?: number;
  size?: number;
}