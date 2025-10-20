import { api } from '../../lib/api';
import { config } from '../../lib/config';
import { storage } from '../../lib/storage';

export interface WidgetData {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  recentIncidents: Array<{
    id: string;
    title: string;
    status: string;
    location: string;
    submittedAt: string;
  }>;
}

export interface CachedWidgetData {
  data: WidgetData;
  timestamp: number;
  expiresIn: number; // milliseconds
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_KEY = 'wildwatch_widget_data';

class WidgetDataService {
  private cache: CachedWidgetData | null = null;

  async getWidgetData(): Promise<WidgetData> {
    // Check if we have valid cached data
    if (this.cache && this.isCacheValid()) {
      return this.cache.data;
    }

    try {
      // Check if user is authenticated
      const token = await storage.getToken();
      if (!token) {
        return this.getDefaultData();
      }

      // Fetch data from API
      const [myIncidentsResponse, publicIncidentsResponse] = await Promise.all([
        api.get(`${config.API.BASE_URL}/incidents/my`, {
          params: { page: 0, size: 50 }
        }),
        api.get(`${config.API.BASE_URL}/incidents/public`, {
          params: { page: 0, size: 10 }
        })
      ]);

      const myIncidents = myIncidentsResponse.data?.content || [];
      const publicIncidents = publicIncidentsResponse.data?.content || [];

      // Process the data
      const widgetData: WidgetData = {
        totalReports: myIncidents.length,
        pendingReports: myIncidents.filter((incident: any) => 
          (incident.status || '').toLowerCase() === 'pending'
        ).length,
        inProgressReports: myIncidents.filter((incident: any) => 
          (incident.status || '').toLowerCase().includes('in progress')
        ).length,
        resolvedReports: myIncidents.filter((incident: any) => 
          (incident.status || '').toLowerCase().includes('resolved')
        ).length,
        recentIncidents: [...myIncidents, ...publicIncidents]
          .sort((a: any, b: any) => 
            new Date(b.submittedAt || b.createdAt).getTime() - 
            new Date(a.submittedAt || a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((incident: any) => ({
            id: incident.id,
            title: incident.incidentType || 'Incident Report',
            status: incident.status || 'Pending',
            location: incident.location || 'Unknown Location',
            submittedAt: incident.submittedAt || incident.createdAt
          }))
      };

      // Cache the data
      this.cache = {
        data: widgetData,
        timestamp: Date.now(),
        expiresIn: CACHE_DURATION
      };

      // Store in persistent storage
      try {
        await storage.setItem(CACHE_KEY, JSON.stringify(this.cache));
      } catch (error) {
        console.warn('Failed to cache widget data:', error);
      }

      return widgetData;
    } catch (error) {
      console.error('Failed to fetch widget data:', error);
      
      // Try to return cached data even if expired
      if (this.cache) {
        return this.cache.data;
      }
      
      return this.getDefaultData();
    }
  }

  async loadCachedData(): Promise<WidgetData | null> {
    try {
      const cached = await storage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedWidgetData = JSON.parse(cached);
        this.cache = parsedCache;
        
        if (this.isCacheValid()) {
          return parsedCache.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached widget data:', error);
    }
    
    return null;
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.cache.expiresIn;
  }

  private getDefaultData(): WidgetData {
    return {
      totalReports: 0,
      pendingReports: 0,
      inProgressReports: 0,
      resolvedReports: 0,
      recentIncidents: []
    };
  }

  clearCache(): void {
    this.cache = null;
    storage.removeItem(CACHE_KEY).catch(console.warn);
  }
}

export const widgetDataService = new WidgetDataService();
