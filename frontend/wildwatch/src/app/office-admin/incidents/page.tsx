'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OfficeAdminSidebar } from '@/components/OfficeAdminSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from "@/utils/api";

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
  transferredFrom?: string;
  updates?: Array<{
    message: string;
    updatedAt: string;
  }>;
  lastTransferredTo?: string;
  lastTransferNotes?: string;
}

export default function IncidentManagementPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [transferredIncidents, setTransferredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOffice, setCurrentOffice] = useState<string | null>(null);

  // Fetch the admin's office code from the profile API
  const fetchAdminOfficeCode = async () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    if (!token) return null;
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return null;
    const profile = await response.json();
    return profile.officeCode || profile.office || profile.assignedOffice || null;
  };

  const formatDate = (dateString: string) => {
    const datePH = new Date(new Date(dateString).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    return datePH.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila'
    });
  };

  const formatTime = (timeString: string) => {
    // timeString is in format HH:mm:ss or HH:mm
    const [hour, minute, second] = timeString.split(":");
    const date = new Date();
    date.setHours(Number(hour));
    date.setMinutes(Number(minute));
    date.setSeconds(second ? Number(second) : 0);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila"
    });
  };

  const fetchIncidents = async (officeCode: string | null) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/office`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Debug: print the entire array of incidents
      console.log("=== RAW INCIDENT DATA ===");
      console.log(JSON.stringify(data, null, 2));
      // Debug log for all pending incidents
      data.forEach((incident: Incident) => {
        if (incident.status.toLowerCase() === "pending") {
          console.log({
            id: incident.id,
            trackingNumber: incident.trackingNumber,
            lastTransferredTo: incident.lastTransferredTo,
            transferredFrom: incident.transferredFrom,
            assignedOffice: incident.assignedOffice,
            status: incident.status,
          });
        }
      });
      // Debug: print the current office code
      console.log("Current office code:", officeCode);
      // Pending cases: status is pending and lastTransferredTo is not set or empty string
      const filteredData = data.filter((incident: Incident) =>
        incident.status && incident.status.toLowerCase() === "pending" &&
        (!incident.lastTransferredTo || incident.lastTransferredTo.trim() === "")
      );
      // Transferred cases: lastTransferredTo matches current office and transferredFrom is set and not equal to current office
      const transferredData = data.filter((incident: Incident) =>
        incident.lastTransferredTo &&
        officeCode &&
        incident.lastTransferredTo.trim().toUpperCase() === officeCode.trim().toUpperCase() &&
        incident.transferredFrom &&
        incident.transferredFrom.trim().toUpperCase() !== officeCode.trim().toUpperCase() &&
        incident.status &&
        ["pending", "in progress"].includes(incident.status.toLowerCase())
      );
      setIncidents(filteredData);
      setTransferredIncidents(transferredData);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the admin's office code first, then fetch incidents
    fetchAdminOfficeCode().then((officeCode) => {
      setCurrentOffice(officeCode);
      fetchIncidents(officeCode);
    });
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/office-admin/approved-cases/${id}/update`);
  };

  const handleApprove = async (id: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the incidents list
      fetchIncidents(currentOffice);
    } catch (error) {
      console.error('Error approving incident:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve incident');
    }
  };

  const handleTransfer = (id: string) => {
    router.push(`/office-admin/approved-cases/${id}/update`);
  };

  const handleEditPending = (id: string) => {
    router.push(`/office-admin/incidents/${id}`);
  };

  const handleEditApproved = (id: string) => {
    router.push(`/office-admin/approved-cases/${id}/update`);
  };

  const handleTracking = (trackingNumber: string) => {
    router.push(`/incidents/tracking/${trackingNumber}`);
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

  if (!currentOffice) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">Error: Office code not set. Please check your profile or authentication.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <OfficeAdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#8B0000]">Incident Management</h1>
            <p className="text-gray-600">Review and manage wildlife incident reports</p>
          </div>

          <Card className="bg-white shadow-lg mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#8B0000] mb-4">Pending Incidents</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incidents.map((incident) => (
                      <tr key={incident.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {incident.trackingNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(incident.dateOfIncident)} {formatTime(incident.timeOfIncident)}
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
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (incident.status.toLowerCase() === 'pending') {
                                  handleEditPending(incident.id);
                                } else {
                                  handleEditApproved(incident.id);
                                }
                              }}
                              className="text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Transferred Cases Section */}
          <Card className="bg-white shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#8B0000] mb-4">Transferred Cases</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transferredIncidents.map((incident) => {
                      const transferUpdate = incident.updates?.find(update => 
                        update.message?.startsWith("Case transferred from")
                      );
                      return (
                        <tr key={incident.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {incident.trackingNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(incident.dateOfIncident)} {formatTime(incident.timeOfIncident)}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {incident.transferredFrom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {incident.lastTransferredTo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {incident.lastTransferNotes || 'No transfer notes'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {incident.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (incident.status.toLowerCase() === 'pending') {
                                    handleEditPending(incident.id);
                                  } else {
                                    handleTracking(incident.trackingNumber || incident.id);
                                  }
                                }}
                                className="text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 