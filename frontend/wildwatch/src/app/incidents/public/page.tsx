'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UpvoteModal } from '@/components/ui/upvote-modal';
import {
  MapPin,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Search,
  FileText,
  ThumbsUp,
  Frown,
} from 'lucide-react';
import { API_BASE_URL } from "@/utils/api";
import { Client } from '@stomp/stompjs';
// @ts-ignore
import SockJS from 'sockjs-client';

interface Incident {
  id: string;
  trackingNumber: string;
  incidentType: string;
  location: string;
  dateOfIncident: string;
  timeOfIncident: string;
  status: string;
  description: string;
  submittedAt: string;
  isAnonymous: boolean;
  submittedBy: string;
  upvoteCount: number;
}

export default function PublicIncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [upvotedIncidents, setUpvotedIncidents] = useState<Set<string>>(new Set());
  const [upvoteModalOpen, setUpvoteModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isUpvotedModal, setIsUpvotedModal] = useState(false);
  const [lastUpvoteAction, setLastUpvoteAction] = useState<number>(0);
  const [pendingUpvote, setPendingUpvote] = useState<{ [id: string]: boolean | undefined }>({});

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/public`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setIncidents(data);

        // Fetch upvote status for each incident
        const upvotePromises = data.map((incident: Incident) =>
          fetch(`${API_BASE_URL}/api/incidents/${incident.id}/upvote-status`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }).then(res => res.json())
        );

        const upvoteResults = await Promise.all(upvotePromises);
        const upvoted = new Set<string>();
        data.forEach((incident: Incident, index: number) => {
          if (upvoteResults[index] === true) {  // Explicitly check for true
            upvoted.add(incident.id);
          }
        });
        setUpvotedIncidents(upvoted);
      } catch (error) {
        console.error("Error fetching incidents:", error);
        setError(error instanceof Error ? error.message : "Failed to load incidents");
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  useEffect(() => {
    const filtered = incidents.filter((incident) => {
      // Only show if not pending, or if isAnonymous is explicitly false
      const notPendingOrExplicitlyPublic = incident.status.toLowerCase() !== 'pending' || incident.isAnonymous === false;
      if (!notPendingOrExplicitlyPublic) return false;

      const matchesSearch = searchQuery === "" || 
        incident.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || 
        incident.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    setFilteredIncidents(filtered);
  }, [searchQuery, statusFilter, incidents]);

  useEffect(() => {
    const socket = new SockJS(`${API_BASE_URL.replace('/api', '')}/ws`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        incidents.forEach((incident) => {
          stompClient.subscribe(`/topic/upvotes/${incident.id}`, (message) => {
            const newCount = parseInt(message.body, 10);
            setIncidents((prev) =>
              prev.map((i) =>
                i.id === incident.id ? { ...i, upvoteCount: newCount } : i
              )
            );
            // Clear pending state for this incident
            setPendingUpvote((prev) => {
              const copy = { ...prev };
              delete copy[incident.id];
              return copy;
            });
          });
        });
      },
    });
    stompClient.activate();
    return () => {
      stompClient.deactivate();
    };
  }, [incidents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const handleUpvote = async (incidentId: string, wasUpvoted?: boolean) => {
    try {
      setLastUpvoteAction(Date.now());
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/upvote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const isUpvoted = await response.json();

      // Always fetch the updated incident from the backend and update the local state
      const incidentRes = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (incidentRes.ok) {
        const updatedIncident = await incidentRes.json();
        setIncidents(prevIncidents =>
          prevIncidents.map(incident =>
            incident.id === incidentId
              ? { ...incident, upvoteCount: typeof updatedIncident.upvoteCount === 'number' ? updatedIncident.upvoteCount : 0 }
              : incident
          )
        );
      }
      // Update upvotedIncidents set based on backend response
      setUpvotedIncidents(prev => {
        const newSet = new Set(prev);
        if (isUpvoted) {
          newSet.add(incidentId);
        } else {
          newSet.delete(incidentId);
        }
        return newSet;
      });
    } catch (error) {
      // Revert optimistic update if backend fails
      if (selectedIncident && wasUpvoted !== undefined) {
        setIncidents(prevIncidents =>
          prevIncidents.map(incident => {
            if (incident.id === incidentId) {
              const safeCount = typeof incident.upvoteCount === 'number' ? incident.upvoteCount : 0;
              return {
                ...incident,
                upvoteCount: wasUpvoted ? safeCount + 1 : safeCount - 1
              };
            }
            return incident;
          })
        );
        setUpvotedIncidents(prev => {
          const newSet = new Set(prev);
          if (wasUpvoted) {
            newSet.add(incidentId);
          } else {
            newSet.delete(incidentId);
          }
          return newSet;
        });
      }
      console.error("Error toggling upvote:", error);
    }
  };

  const handleUpvoteClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsUpvotedModal(upvotedIncidents.has(incident.id));
    setUpvoteModalOpen(true);
  };

  const handleUpvoteConfirm = async () => {
    if (selectedIncident) {
      const isCurrentlyUpvoted = upvotedIncidents.has(selectedIncident.id);
      // Optimistically update UI
      setIncidents(prevIncidents =>
        prevIncidents.map(incident => {
          if (incident.id === selectedIncident.id) {
            const safeCount = typeof incident.upvoteCount === 'number' ? incident.upvoteCount : 0;
            return {
              ...incident,
              upvoteCount: isCurrentlyUpvoted ? safeCount - 1 : safeCount + 1
            };
          }
          return incident;
        })
      );
      setUpvotedIncidents(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyUpvoted) {
          newSet.delete(selectedIncident.id);
        } else {
          newSet.add(selectedIncident.id);
        }
        return newSet;
      });
      // Set pending state for this incident to the new upvote state
      setPendingUpvote(prev => ({ ...prev, [selectedIncident.id]: !isCurrentlyUpvoted }));
      await handleUpvote(selectedIncident.id, isCurrentlyUpvoted);
    }
  };

  // Add a refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${API_BASE_URL}/api/incidents/public`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // Sort by upvoteCount descending
      data.sort((a: Incident, b: Incident) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
      setIncidents(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh incidents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <Sidebar />
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
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#800000]">Public Incidents</h1>
              <p className="text-sm text-gray-600">View all public incident reports</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="px-3 py-2 border border-[#800000] text-[#800000] rounded-lg hover:bg-[#f5eaea] transition-colors text-sm font-medium"
                title="Refresh and sort by upvotes"
              >
                Refresh & Sort
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search incidents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000]"
              >
                <option value="All">All Status</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => {
                const isOptimisticallyUpvoted =
                  pendingUpvote[incident.id] !== undefined
                    ? pendingUpvote[incident.id]
                    : upvotedIncidents.has(incident.id);
                return (
                  <Card
                    key={incident.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`p-4 border-l-4 ${
                        incident.status === "Pending"
                          ? "border-l-yellow-400"
                          : incident.status === "In Progress"
                          ? "border-l-blue-400"
                          : "border-l-green-400"
                      }`}
                    >
                      <div className="mb-3">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {incident.incidentType}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <p className="text-xs text-gray-500">
                              {formatDate(incident.submittedAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUpvoteClick(incident)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              isOptimisticallyUpvoted
                                ? "text-[#800000]"
                                : "text-gray-400 hover:text-[#800000]"
                            }`}
                          >
                            <ThumbsUp
                              className={`h-5 w-5 ${
                                isOptimisticallyUpvoted ? "fill-[#800000]" : "fill-none"
                              }`}
                              strokeWidth={1.5}
                            />
                            <span className={`text-xs font-medium ${
                              isOptimisticallyUpvoted ? "text-[#800000]" : "text-gray-500"
                            }`}>{typeof incident.upvoteCount === 'number' ? incident.upvoteCount : 0}</span>
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-start mb-1">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5" />
                          <p className="text-xs text-gray-700">
                            {incident.location}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {incident.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium
                          ${
                            incident.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : incident.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {incident.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#800000] text-[#800000] hover:bg-[#fff9f9]"
                          onClick={() =>
                            router.push(`/incidents/tracking/${incident.trackingNumber}`)
                          }
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                No incidents found
              </div>
            )}
          </div>
        </div>
      </div>

      <UpvoteModal
        isOpen={upvoteModalOpen}
        onClose={() => setUpvoteModalOpen(false)}
        onConfirm={handleUpvoteConfirm}
        incidentType={selectedIncident?.incidentType || ""}
        isUpvoted={isUpvotedModal}
      />
    </div>
  );
} 