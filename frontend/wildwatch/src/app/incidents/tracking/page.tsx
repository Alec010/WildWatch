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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/ui/notificationdropdown";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface Incident {
  id: string; // UUID from backend
  caseNumber?: string; // Case number like INC-2025-0001
  incidentType: string;
  location: string;
  dateOfIncident: string;
  status: string;
}

interface Activity {
  type: string;
  message: string;
  time: string;
  color: "blue" | "red" | "green";
}

export default function CaseTrackingPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [showAllActivities, setShowAllActivities] = useState(false);

  // ✅ Proper formatter for missing case numbers
  const formatCaseNumber = (index: number): string => {
    const year = new Date().getFullYear();
    const number = String(index + 1).padStart(4, "0");
    return `INC-${year}-${number}`;
  };

  useEffect(() => {
    const fetchCases = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:8080/api/incidents/my-incidents",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = (await response.json()) as Incident[];
        setIncidents(data);

        // Generate recent activities based on incident data
        const recentActivities: Activity[] = [];

        // Only show new submissions that are pending approval
        const pendingIncidents = data.filter((inc) => inc.status === "Pending");
        pendingIncidents.forEach((inc) => {
          recentActivities.push({
            type: "New Report Created",
            message: `You submitted a new incident report for ${inc.incidentType}`,
            time: formatDate(inc.dateOfIncident),
            color: "red",
          });
        });

        // Only show status updates for incidents in progress
        const inProgressIncidents = data.filter(
          (inc) => inc.status === "In Progress"
        );
        inProgressIncidents.forEach((inc) => {
          recentActivities.push({
            type: "Status Update",
            message: `Case ${
              inc.caseNumber || formatCaseNumber(data.indexOf(inc))
            } status changed from "Pending" to "In Progress"`,
            time: formatDate(inc.dateOfIncident),
            color: "blue",
          });
        });

        // Only show resolved incidents
        const resolvedIncidents = data.filter(
          (inc) => inc.status === "Resolved"
        );
        resolvedIncidents.forEach((inc) => {
          recentActivities.push({
            type: "Case Resolved",
            message: `Case ${
              inc.caseNumber || formatCaseNumber(data.indexOf(inc))
            } (${inc.incidentType}) has been resolved`,
            time: formatDate(inc.dateOfIncident),
            color: "green",
          });
        });

        setActivities(recentActivities);
      } catch (error: any) {
        console.error("Error fetching incidents:", error);
        setError(error.message || "Failed to load cases.");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [router]);

  // Helper function to format dates for activities
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  };

  const filteredCases =
    selectedStatus === "All"
      ? incidents
      : incidents.filter((item) => item.status === selectedStatus);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <Sidebar />
        <div className="flex-1 p-8">
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
      <div className="flex-1 p-8">
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

        {/* Filter Buttons */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {["Pending", "In Progress", "All"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`bg-white p-4 rounded-lg shadow-md text-center transition-all duration-200 hover:bg-gray-50 ${
                selectedStatus === status
                  ? "border-l-4 border-[#800000] bg-[#fff9f9]"
                  : ""
              }`}
            >
              <div className="text-2xl font-bold text-[#800000]">
                {status === "All"
                  ? incidents.length
                  : incidents.filter((item) => item.status === status).length}
              </div>
              <div className="text-gray-600 font-medium">
                {status === "All" ? "All Cases" : status}
              </div>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            className="border-[#800000] text-[#800000] hover:bg-[#fff9f9] hover:text-[#800000]"
          >
            All Cases
          </Button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search incidents..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-72 focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000] shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
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
                <th className="p-4 text-center font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#374151]">
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
                      {item.caseNumber
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
                      <button
                        onClick={() =>
                          router.push(`/incidents/tracking/${item.id}`)
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
              {/* Show only first 3 activities or all if showAllActivities is true */}
              {(showAllActivities ? activities : activities.slice(0, 3)).map(
                (activity, index) => (
                  <div key={index} className="flex items-start mb-5 last:mb-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white mr-4 ${
                        activity.color === "blue"
                          ? "bg-blue-500"
                          : activity.color === "red"
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {activity.color === "blue" ? (
                        <Clock size={18} />
                      ) : activity.color === "red" ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {activity.type}
                      </div>
                      <div className="text-gray-600">{activity.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                )
              )}
              <div className="text-right mt-4">
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
