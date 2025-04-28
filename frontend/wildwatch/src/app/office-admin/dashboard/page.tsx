"use client"

import { useEffect, useState } from "react"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, AlertTriangle, Search, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
        const response = await fetch("http://localhost:8080/api/incidents/office", {
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
      <div className="flex h-screen bg-gray-100">
        <OfficeAdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <OfficeAdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <OfficeAdminSidebar />

      <main className="flex-1 overflow-auto bg-[#f5f5f5]">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Incident Dashboard</h1>
              <p className="text-sm text-gray-500">View and manage your reported incidents</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex flex-col">
                <Search className="absolute left-3 top-[13px] text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by type or tracking number..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000] mb-6"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                className="bg-[#8B0000] hover:bg-[#700000] text-white flex items-center gap-2"
                onClick={() => router.push("/office-admin/incidents/new")}
              >
                <Plus className="h-4 w-4" />
                Report New Incident
              </Button>
            </div>
          </div>

          {/* Overview Section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Overview</h2>
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="p-4 flex items-start">
                  <div className="mr-4 bg-red-50 p-2 rounded-md">
                    <AlertCircle className="h-5 w-5 text-[#8B0000]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Reports</p>
                    <p className="text-2xl font-semibold">{stats.totalAssigned}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="p-4 flex items-start">
                  <div className="mr-4 bg-yellow-50 p-2 rounded-md">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pending Review</p>
                    <p className="text-2xl font-semibold">{stats.pending}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="p-4 flex items-start">
                  <div className="mr-4 bg-green-50 p-2 rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Resolved</p>
                    <p className="text-2xl font-semibold">{stats.resolved}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="p-4 flex items-start">
                  <div className="mr-4 bg-blue-50 p-2 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">In Progress</p>
                    <p className="text-2xl font-semibold">{stats.inProgress}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">Recent Incidents</h2>
              <Link href="/office-admin/incidents" className="text-sm text-[#8B0000] hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <Card key={incident.id} className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <div className="p-4 border-l-4 border-l-[#8B0000]">
                      <div className="mb-3">
                        <h3 className="font-medium text-gray-900 mb-1">{incident.incidentType}</h3>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-1">
                            <AlertTriangle className="h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(incident.submittedAt)}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-start mb-1">
                          <div className="flex-shrink-0 mr-1">
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-700">{incident.location}</p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{incident.description}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium
                          ${
                            incident.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : incident.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : incident.status === "Resolved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {incident.status}
                        </span>
                        <Link href={`/office-admin/incidents/${incident.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 p-8 text-center text-gray-500 bg-white rounded-md border border-gray-200">
                  No incidents found
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
