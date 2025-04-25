'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Clock, AlertCircle, CheckCircle2, AlertTriangle, FileText, Eye, ShieldCheck, UserCheck, FileEdit, MessageSquare } from 'lucide-react';

interface Incident {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  status: string;
  submittedAt: string;
}

interface Activity {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
  incident: {
    id: string;
    trackingNumber: string;
  };
}

export default function CaseTrackingPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch incidents
        const incidentsResponse = await fetch('http://localhost:8080/api/incidents/my-incidents', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!incidentsResponse.ok) {
          throw new Error(`HTTP error! status: ${incidentsResponse.status}`);
        }

        const incidentsData = await incidentsResponse.json();
        setIncidents(incidentsData);
        setFilteredIncidents(incidentsData);
        
        // Calculate statistics
        const pending = incidentsData.filter((inc: Incident) => inc.status === 'Pending').length;
        const inProgress = incidentsData.filter((inc: Incident) => inc.status === 'In Progress').length;
        setStats({ pending, inProgress });

        // Fetch activities
        const activitiesResponse = await fetch(
          `http://localhost:8080/api/activities/my-activities?page=${currentPage}&size=10`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!activitiesResponse.ok) {
          throw new Error(`HTTP error! status: ${activitiesResponse.status}`);
        }

        const activitiesData = await activitiesResponse.json();
        console.log('Activities Response:', activitiesData); // Debug log
        console.log('Activities Content:', activitiesData.content); // Debug log
        console.log('Total Activities:', activitiesData.totalElements); // Debug log
        
        setActivities(activitiesData.content);
        setTotalPages(activitiesData.totalPages);
        setTotalActivities(activitiesData.totalElements);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = incidents.filter(incident => 
        incident.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredIncidents(filtered);
    } else {
      setFilteredIncidents(incidents);
    }
  }, [searchQuery, incidents]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getActivityIcon = (activityType: string, description?: string) => {
    // Check if it's a status change to resolved
    if (activityType === 'STATUS_CHANGE' && description?.toLowerCase().includes('resolved')) {
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }

    switch (activityType) {
      case 'STATUS_CHANGE':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'NEW_REPORT':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'CASE_VERIFIED':
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'CASE_REVIEWED':
        return <Eye className="h-5 w-5 text-purple-500" />;
      case 'ASSIGNED_TO_OFFICER':
        return <UserCheck className="h-5 w-5 text-indigo-500" />;
      case 'CASE_UPDATED':
        return <FileEdit className="h-5 w-5 text-orange-500" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="h-5 w-5 text-teal-500" />;
      case 'CASE_RESOLVED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#8B0000]">Case Tracking</h1>
              <p className="text-gray-500 text-sm">Track the status of your incident reports</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by case ID or keywords..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 w-[300px]"
                />
              </div>
              <Button
                onClick={() => router.push('/incidents/submit')}
                className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
              >
                Report New Incident
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <h3 className="text-2xl font-bold text-blue-600">{stats.inProgress}</h3>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <p className="text-sm text-gray-500">
                  Showing {Math.min(10, activities.length)} of {totalActivities} activities
                </p>
              </div>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="mt-1">{getActivityIcon(activity.activityType, activity.description)}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Incidents Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Case ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Incident Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {incident.trackingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.incidentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(incident.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          incident.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : incident.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : incident.status === 'Resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/incidents/${incident.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredIncidents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No incidents found
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 