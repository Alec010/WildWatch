"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Sidebar } from "@/components/Sidebar";
import {
  Eye,
  Clock,
  Search,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/ui/notificationdropdown";
import { Inter } from "next/font/google";
import { API_BASE_URL } from "@/utils/api";

const inter = Inter({ subsets: ["latin"] });

interface Incident {
  id: string; // UUID from backend
  trackingNumber?: string; // Add this field for backend tracking number
  caseNumber?: string; // Case number like INC-2025-0001
  incidentType: string;
  location: string;
  dateOfIncident: string;
  status: string;
  priorityLevel?: "HIGH" | "MEDIUM" | "LOW" | null;
}

interface Activity {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
  incident: {
    id: string;
    trackingNumber: string;
  } | null;
}

export default function CaseTrackingPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [search, setSearch] = useState("");

  // ✅ Proper formatter for missing case numbers
  const formatCaseNumber = (index: number): string => {
    const year = new Date().getFullYear();
    const number = String(index + 1).padStart(4, "0");
    return `INC-${year}-${number}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        // Fetch incidents
        const incidentsResponse = await fetch(`${API_BASE_URL}/api/incidents/my-incidents`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!incidentsResponse.ok)
          throw new Error(`HTTP error! status: ${incidentsResponse.status}`);

        const incidentsData = await incidentsResponse.json();
        // Only show PENDING and IN PROGRESS status (case-insensitive, with space)
        setIncidents(incidentsData.filter((i: Incident) => 
          i.status && ["pending", "in progress"].includes(i.status.toLowerCase())
        ));

        // Fetch activity logs
        const activitiesResponse = await fetch(`${API_BASE_URL}/api/activity-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!activitiesResponse.ok)
          throw new Error(`HTTP error! status: ${activitiesResponse.status}`);

        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.content);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Helper function to format dates for activities
  const formatDate = (dateString: string): string => {
    const datePH = new Date(new Date(dateString).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const nowPH = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const yesterdayPH = new Date(new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    if (datePH.toDateString() === nowPH.toDateString()) {
      return `Today, ${datePH.toLocaleTimeString('en-US', {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: 'Asia/Manila'
      })}`;
    } else if (datePH.toDateString() === yesterdayPH.toDateString()) {
      return `Yesterday, ${datePH.toLocaleTimeString('en-US', {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: 'Asia/Manila'
      })}`;
    } else {
      return datePH.toLocaleString('en-US', {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: 'Asia/Manila'
      });
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "NEW_REPORT":
        return <AlertTriangle size={18} />;
      case "STATUS_CHANGE":
        return <Clock size={18} />;
      case "UPDATE":
        return <RefreshCw size={18} />;
      case "CASE_RESOLVED":
        return <CheckCircle size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "NEW_REPORT":
        return "bg-red-500";
      case "STATUS_CHANGE":
        return "bg-blue-500";
      case "UPDATE":
        return "bg-yellow-500";
      case "CASE_RESOLVED":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Only show incidents matching selected status and priority, and filter by search
  const filteredCases = incidents.filter(
    (item) =>
      (selectedStatus === "All" || item.status === selectedStatus) &&
      (selectedPriority === "All" || (item.priorityLevel && item.priorityLevel.toLowerCase() === selectedPriority.toLowerCase())) &&
      (
        (item.trackingNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.caseNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        item.incidentType.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.status.toLowerCase().includes(search.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
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
        <div className="flex-1 ml-64 p-8">
          <h1 className="text-2xl font-bold text-[#800000] mb-4">
            Case Tracking
          </h1>
          <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-[#f8f5f5] ${inter.className}`}>
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Header with notification icon on the right */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#800000] mb-1">
              Case Tracking
            </h1>
            <p className="text-gray-600">
              Track the status of your incident reports.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search incidents..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000] shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <Button
              className="bg-[#800000] hover:bg-[#600000] text-white flex items-center gap-2"
              onClick={() => router.push("/incidents/submit")}
            >
              <Plus className="h-4 w-4" />
              Report New Incident
            </Button>
            <NotificationDropdown />
          </div>
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {['All', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
            <Button
              key={priority}
              variant={selectedPriority === priority ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority(priority)}
            >
              {priority.charAt(0) + priority.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
        {/* Filter Buttons */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: 'Pending', label: 'Pending Cases' },
            { key: 'In Progress', label: 'In Progress Cases' },
            { key: 'All', label: 'All Pending and In Progress Cases' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`bg-white p-4 rounded-lg shadow-md text-center transition-all duration-200 hover:bg-gray-50 ${
                selectedStatus === key
                  ? 'border-l-4 border-[#800000] bg-[#fff9f9]'
                  : ''
              }`}
            >
              <div className="text-2xl font-bold text-[#800000]">
                {key === 'All'
                  ? incidents.length
                  : incidents.filter((item) => item.status === key).length}
              </div>
              <div className="text-gray-600 font-medium">
                {label}
              </div>
            </button>
          ))}
        </div>

        {/* Incident Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#eeeeee] text-[#800000] text-sm uppercase">
              <tr>
                <th className="p-4 text-center font-semibold">CASE ID</th>
                <th className="p-4 text-center font-semibold">INCIDENT TYPE</th>
                <th className="p-4 text-center font-semibold">LOCATION</th>
                <th className="p-4 text-center font-semibold">REPORTED DATE</th>
                <th className="p-4 text-center font-semibold">STATUS</th>
                <th className="p-4 text-center font-semibold">PRIORITY</th>
                <th className="p-4 text-center font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#374151]">
                    No reports found for "{selectedStatus}".
                  </td>
                </tr>
              ) : (
                filteredCases.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-[#fff9f9] transition-colors duration-150"
                  >
                    <td className="p-3 text-[#800000] font-medium text-center">
                      {item.trackingNumber
                        ? item.trackingNumber
                        : item.caseNumber
                        ? item.caseNumber
                        : formatCaseNumber(index)}
                    </td>
                    <td className="p-3 text-[#374151] text-center font-medium">
                      {item.incidentType}
                    </td>
                    <td className="p-3 text-[#374151] text-center font-medium">
                      {item.location}
                    </td>
                    <td className="p-3 text-[#374151] text-center font-medium">
                      {item.dateOfIncident}
                    </td>
                    <td className="p-3 text-[#374151] text-center font-medium">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          item.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : item.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-medium">
                      {item.priorityLevel ? (
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            item.priorityLevel === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : item.priorityLevel === "MEDIUM"
                              ? "bg-orange-100 text-orange-800"
                              : item.priorityLevel === "LOW"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.priorityLevel.charAt(0) + item.priorityLevel.slice(1).toLowerCase()}
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">To be assigned</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium">
                      <button
                        onClick={() =>
                          router.push(`/incidents/tracking/${item.trackingNumber ? item.trackingNumber : item.id}`)
                        }
                        className="text-[#800000] hover:text-[#5B0000]"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <h2 className="text-xl font-semibold mb-4 text-[#800000] mt-10">
          Recent Activity
        </h2>
        <div className="bg-white rounded-lg shadow-md p-5">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No recent activity to display.
            </div>
          ) : (
            <>
              {(showAllActivities ? activities : activities.slice(0, 3)).map(
                (activity) => (
                  <div key={activity.id} className="flex items-start mb-5 last:mb-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white mr-4 ${getActivityColor(
                        activity.activityType
                      )}`}
                    >
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {activity.activityType.replace(/_/g, " ")}
                      </div>
                      <div className="text-gray-600">{activity.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              )}
              {activities.length > 3 && !showAllActivities ? (
                <button
                  onClick={() => setShowAllActivities(true)}
                  className="text-[#800000] hover:underline text-sm font-medium"
                >
                  View All Activity ({activities.length})
                </button>
              ) : showAllActivities ? (
                <button
                  onClick={() => setShowAllActivities(false)}
                  className="text-[#800000] hover:underline text-sm font-medium"
                >
                  Show Less
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
