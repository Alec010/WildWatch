<<<<<<< HEAD
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
=======
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
>>>>>>> Frontend-UI-draft
}

export default function CaseTrackingPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
<<<<<<< HEAD
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
=======
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
>>>>>>> Frontend-UI-draft
            },
          }
        );

<<<<<<< HEAD
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
=======
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
>>>>>>> Frontend-UI-draft
      } finally {
        setLoading(false);
      }
    };

<<<<<<< HEAD
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

=======
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

>>>>>>> Frontend-UI-draft
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto"></div>
<<<<<<< HEAD
          <p className="mt-4 text-gray-600">Loading...</p>
=======
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
>>>>>>> Frontend-UI-draft
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
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
=======
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
>>>>>>> Frontend-UI-draft
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
} 
=======
}
>>>>>>> Frontend-UI-draft
