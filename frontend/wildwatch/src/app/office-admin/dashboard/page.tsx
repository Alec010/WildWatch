"use client"

import { useEffect, useState } from "react"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, AlertTriangle, Search, Plus, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import NotificationDropdown from "@/components/ui/notificationdropdown"
import { Inter } from "next/font/google"
import { API_BASE_URL } from "@/utils/api"

const inter = Inter({ subsets: ["latin"] })

interface Incident {
  id: string
  trackingNumber: string
  incidentType: string
  location: string
  dateOfIncident: string
  timeOfIncident: string
  status: string
  description: string
  submittedAt: string
  verified: boolean
}

export default function OfficeAdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  })
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch incidents
        const response = await fetch(`${API_BASE_URL}/api/incidents/office`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const incidents = await response.json()

        // Calculate statistics
        const stats = {
          totalAssigned: incidents.length,
          pending: incidents.filter((inc: Incident) => inc.status === "Pending").length,
          inProgress: incidents.filter((inc: Incident) => inc.status === "In Progress").length,
          resolved: incidents.filter((inc: Incident) => inc.status === "Resolved").length,
        }

        setStats(stats)
        // Sort incidents by submission date and get the 5 most recent
        const sortedIncidents = incidents
          .sort((a: Incident, b: Incident) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5)
        setRecentIncidents(sortedIncidents)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError(error instanceof Error ? error.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    // Filter incidents based on search query
    const filtered = recentIncidents.filter((incident) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        incident.incidentType.toLowerCase().includes(searchLower) ||
        incident.trackingNumber.toLowerCase().includes(searchLower)
      )
    })
    setFilteredIncidents(filtered)
  }, [searchQuery, recentIncidents])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <OfficeAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <OfficeAdminSidebar />
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
    )
  }

  return (
    <div className={`min-h-screen flex bg-[#f5f5f5] ${inter.className}`}>
      <OfficeAdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#800000]">
                Incident Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                View and manage reported incidents
              </p>
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
              {/* Removed Report New Incident button for office admins */}
              {/* Using the NotificationDropdown component */}
              <NotificationDropdown />
            </div>
          </div>

          {/* Overview Section with Tab-like Underline */}
          <div className="mb-8">
            <div className="border-b border-gray-200 mb-4">
              <h2 className="text-lg font-medium text-[#800000] pb-2 border-b-2 border-[#800000] inline-block">
                Overview
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 flex items-center">
                  <div className="mr-4 bg-red-50 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-[#800000]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Reports</p>
                    <p className="text-2xl font-bold">{stats.totalAssigned}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 flex items-center">
                  <div className="mr-4 bg-yellow-50 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-500" />
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
          </div>

          {/* Recent Incidents */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-[#800000]">
                Recent Incidents
              </h2>
              <Button
                variant="link"
                className="text-[#800000] p-0 h-auto text-sm hover:underline"
                onClick={() => router.push("/office-admin/approved-cases")}
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(searchQuery ? filteredIncidents : recentIncidents).length > 0 ? (
                (searchQuery ? filteredIncidents : recentIncidents).slice(0, 3).map((incident) => (
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
                          <AlertCircle className="h-4 w-4 text-gray-400 mr-1 mt-0.5" />
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
                          onClick={() => {
                            console.log("Verified:", incident.verified);
                            incident.verified
                              ? router.push(`/office-admin/approved-cases/${incident.id}/update`)
                              : router.push(`/office-admin/incidents/${incident.id}`);
                          }}
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
    </div>
  )
}