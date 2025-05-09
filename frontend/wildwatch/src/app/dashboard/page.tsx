"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  FileText,
  ThumbsUp,
  Frown,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import NotificationDropdown from "@/components/ui/notificationdropdown";
import { Inter } from "next/font/google";
import { API_BASE_URL } from "@/utils/api";
import { Input } from '@/components/ui/input';
import { UpvoteModal } from '@/components/ui/upvote-modal';

const inter = Inter({ subsets: ["latin"] });

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
  upvoteCount?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAllIncidents, setFilteredAllIncidents] = useState<Incident[]>([]);
  const [filteredMyIncidents, setFilteredMyIncidents] = useState<Incident[]>([]);
  const [upvotedIncidents, setUpvotedIncidents] = useState<Set<string>>(new Set());
  const [upvoteModalOpen, setUpvoteModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isUpvotedModal, setIsUpvotedModal] = useState(false);
  const [pendingUpvote, setPendingUpvote] = useState<{ [id: string]: boolean | undefined }>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          throw new Error("No authentication token found");
        }

        // Fetch all incidents
        const allResponse = await fetch(`${API_BASE_URL}/api/incidents/public`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!allResponse.ok) {
          throw new Error(`HTTP error! status: ${allResponse.status}`);
        }

        const allIncidentsData = await allResponse.json();
        // Filter out anonymous incidents
        const filteredAllIncidents = allIncidentsData.filter((inc: Incident) => !inc.isAnonymous);
        setAllIncidents(filteredAllIncidents);

        // Fetch upvote status for each incident
        const upvotePromises = filteredAllIncidents.map((incident: Incident) =>
          fetch(`${API_BASE_URL}/api/incidents/${incident.id}/upvote-status`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }).then(res => res.json())
        );

        const upvoteResults = await Promise.all(upvotePromises);
        const upvoted = new Set<string>();
        filteredAllIncidents.forEach((incident: Incident, index: number) => {
          if (upvoteResults[index] === true) {
            upvoted.add(incident.id);
          }
        });
        setUpvotedIncidents(upvoted);

        // Fetch user's incidents
        const myResponse = await fetch(`${API_BASE_URL}/api/incidents/my-incidents`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!myResponse.ok) {
          throw new Error(`HTTP error! status: ${myResponse.status}`);
        }

        const myIncidentsData = await myResponse.json();
        setMyIncidents(myIncidentsData);

        // Calculate statistics from user's incidents
        const stats = {
          total: myIncidentsData.length,
          pending: myIncidentsData.filter((inc: Incident) => inc.status === "Pending").length,
          inProgress: myIncidentsData.filter((inc: Incident) => inc.status === "In Progress").length,
          resolved: myIncidentsData.filter((inc: Incident) => inc.status === "Resolved").length,
        };

        setStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error instanceof Error ? error.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Filter incidents based on search query
    const filteredAll = allIncidents.filter((incident) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        incident.incidentType.toLowerCase().includes(searchLower) ||
        incident.trackingNumber.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      );
    });
    setFilteredAllIncidents(filteredAll);

    const filteredMy = myIncidents.filter((incident) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        incident.incidentType.toLowerCase().includes(searchLower) ||
        incident.trackingNumber.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      );
    });
    setFilteredMyIncidents(filteredMy);
  }, [searchQuery, allIncidents, myIncidents]);

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
        setAllIncidents(prevIncidents =>
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
        setAllIncidents(prevIncidents =>
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
      setAllIncidents(prevIncidents =>
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

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
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
    <div className={`min-h-screen flex bg-[#f5f5f5] ${inter.className}`}>
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto ml-64">
        {/* Header */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#800000]">Incident Dashboard</h1>
              <p className="text-sm text-gray-600">View and manage reported incidents</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="default"
                className="bg-[#800000] hover:bg-[#600000] text-white"
                onClick={() => router.push("/incidents/submit")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Report New Incident
              </Button>
              <NotificationDropdown />
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-[#800000] p-3 rounded-full">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-yellow-50 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-gray-50 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex items-center">
                <div className="mr-4 bg-green-50 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Resolved</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* My Incidents Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-[#800000]">My Incidents</h2>
              <Button
                variant="link"
                className="text-[#800000] p-0 h-auto text-sm hover:underline"
                onClick={() => router.push("/incidents/tracking")}
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(searchQuery ? filteredMyIncidents : myIncidents).length > 0 ? (
                (searchQuery ? filteredMyIncidents : myIncidents).slice(0, 3).map((incident) => (
                  <Card
                    key={incident.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
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
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500">
                            {formatDate(incident.submittedAt)}
                          </p>
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
                ))
              ) : (
                <div className="col-span-3 p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                  No incidents found
                </div>
              )}
            </div>
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
