'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OfficeAdminSidebar } from '@/components/OfficeAdminSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';

interface Incident {
  id: string;
  trackingNumber: string;
  incidentType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  location: string;
  description: string;
  assignedOffice: string;
  status: string;
  priorityLevel: string | null;
  submittedBy: string;
  submittedAt: string;
}

export default function IncidentManagementPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:8080/api/incidents/office', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Filter to only show pending incidents
        const filteredData = data.filter((incident: Incident) => incident.status.toLowerCase() === "pending");
        setIncidents(filteredData);
      } catch (error) {
        console.error('Error fetching incidents:', error);
        setError(error instanceof Error ? error.message : 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/office-admin/incidents/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading incidents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <OfficeAdminSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <OfficeAdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#8B0000]">Incident Management</h1>
            <p className="text-gray-600">Review and manage wildlife incident reports</p>
          </div>

          <Card className="bg-white shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Incident Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {incident.trackingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(incident.dateOfIncident).toLocaleDateString()} {incident.timeOfIncident}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.incidentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.submittedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.priorityLevel ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            incident.priorityLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                            incident.priorityLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {incident.priorityLevel}
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            Set priority
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(incident.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 