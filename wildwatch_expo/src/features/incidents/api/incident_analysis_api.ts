import { api } from '../../../../lib/api';

export interface AnalyzeRequest {
  incidentType: string;
  description: string;
  location: string;
  formattedAddress?: string;
  buildingName?: string;
  buildingCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface SimilarIncident {
  id: string;
  similarityScore: number;
  assignedOffice?: string;
  submittedAt?: string;
  finishedDate?: string;
  resolutionNotes?: string;
  trackingNumber?: string;
}

export interface AnalyzeResponse {
  decision: 'ALLOW' | 'BLOCK';
  confidence: number;
  reasons: string[];
  suggestedTags?: string[];
  suggestedOffice?: string;
  normalizedLocation?: string;
  similarIncidents?: SimilarIncident[];
}

export const incidentAnalysisAPI = {
  /**
   * Analyze incident content for inappropriate language and content
   * This calls the same backend endpoint as the web version
   */
  analyzeIncident: async (request: AnalyzeRequest): Promise<AnalyzeResponse> => {
    try {
      console.log('Sending AI analysis request:', {
        incidentType: request.incidentType,
        description: request.description?.substring(0, 50) + '...',
        location: request.location,
      });

      const response = await api.post<AnalyzeResponse>('/incidents/analyze', request, {
        timeout: 30000, // 30 second timeout
      });
      
      console.log('AI analysis response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('AI Analysis Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Provide more specific error messages
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('AI analysis timed out. Please try again.');
      } else if (error.response?.status === 404) {
        throw new Error('AI analysis service not available. Please try again later.');
      } else if (error.response?.status === 500) {
        throw new Error('AI analysis service error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(error.response?.data?.error || error.message || 'Failed to analyze incident content');
      }
    }
  },
};
