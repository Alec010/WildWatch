"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar"
import { Button } from "@/components/ui/button"
import {
  Pencil,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  User,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  Shield,
  RefreshCw,
} from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import { motion } from "framer-motion"
import { useSidebar } from "@/contexts/SidebarContext"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Toaster } from "sonner"

interface Incident {
  id: string
  trackingNumber: string
  incidentType: string
  dateOfIncident: string
  timeOfIncident: string
  location: string
  description: string
  assignedOffice: string
  status: string
  priorityLevel: string | null
  submittedBy: string
  submittedAt: string
  transferredFrom?: string
  updates?: Array<{
    message: string
    updatedAt: string
  }>
  lastTransferredTo?: string
  lastTransferNotes?: string
}

export default function IncidentManagementPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [transferredIncidents, setTransferredIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentOffice, setCurrentOffice] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"pending" | "transferred">("pending")
  const [pendingCount, setPendingCount] = useState(0)
  const [transferredCount, setTransferredCount] = useState(0)

  // Fetch the admin's office code from the profile API
  const fetchAdminOfficeCode = async () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]
    if (!token) return null
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) return null
    const profile = await response.json()
    return profile.officeCode || profile.office || profile.assignedOffice || null
  }

  const fetchIncidents = async (officeCode: string | null) => {
    try {
      setIsRefreshing(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        toast.error("Authentication Error", {
          description: "No authentication token found. Please log in again.",
        })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/office`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Pending cases: status is pending and lastTransferredTo is not set or empty string
      const filteredData = data.filter(
        (incident: Incident) =>
          incident.status &&
          incident.status.toLowerCase() === "pending" &&
          (!incident.lastTransferredTo || incident.lastTransferredTo.trim() === ""),
      )

      // Transferred cases: lastTransferredTo matches current office and transferredFrom is set and not equal to current office
      const transferredData = data.filter(
        (incident: Incident) =>
          incident.lastTransferredTo &&
          officeCode &&
          incident.lastTransferredTo.trim().toUpperCase() === officeCode.trim().toUpperCase() &&
          incident.transferredFrom &&
          incident.transferredFrom.trim().toUpperCase() !== officeCode.trim().toUpperCase() &&
          incident.status &&
          ["pending", "in progress"].includes(incident.status.toLowerCase()),
      )

      setIncidents(filteredData)
      setTransferredIncidents(transferredData)
      setPendingCount(filteredData.length)
      setTransferredCount(transferredData.length)
    } catch (e: any) {
      setError(e.message || "Failed to load incidents")
      toast.error("Failed to Load Incidents", {
        description: e.message || "There was an error loading the incidents. Please try again.",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Fetch the admin's office code first, then fetch incidents
    fetchAdminOfficeCode().then((officeCode) => {
      setCurrentOffice(officeCode)
      fetchIncidents(officeCode)
    })
  }, [])

  const handleRefresh = () => {
    fetchIncidents(currentOffice)
  }

  const handleEdit = (id: string) => {
    router.push(`/office-admin/approved-cases/${id}/update`)
  }

  const handleApprove = async (id: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Refresh the incidents list
      fetchIncidents(currentOffice)
    } catch (error) {
      console.error("Error approving incident:", error)
      setError(error instanceof Error ? error.message : "Failed to approve incident")
    }
  }

  const handleTransfer = (id: string) => {
    router.push(`/office-admin/approved-cases/${id}/update`)
  }

  const handleEditPending = (id: string) => {
    router.push(`/office-admin/incidents/${id}`)
  }

  const handleEditApproved = (id: string) => {
    router.push(`/office-admin/approved-cases/${id}/update`)
  }

  const handleTracking = (trackingNumber: string) => {
    router.push(`/incidents/tracking/${trackingNumber}`)
  }

  const formatDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}${timeString ? ` ${timeString}` : ""}`
  }

  // Filter incidents based on search query
  const filteredPendingIncidents = incidents.filter(
    (incident) =>
      incident.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTransferredIncidents = transferredIncidents.filter(
    (incident) =>
      incident.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.transferredFrom && incident.transferredFrom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (incident.lastTransferredTo && incident.lastTransferredTo.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Toaster richColors position="top-right" className="z-50" style={{ top: '80px' }} />
        <OfficeAdminSidebar />
        <div
          className={`flex-1 flex items-center justify-center transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"}`}
        >
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading incidents...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Toaster richColors position="top-right" className="z-50" style={{ top: '80px' }} />
        <OfficeAdminSidebar />
        <div className={`flex-1 p-8 transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"}`}>
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Incidents</h3>
                  <p className="text-red-700">{error}</p>
                  <Button
                    className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentOffice) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Toaster richColors position="top-right" className="z-50" style={{ top: '80px' }} />
        <OfficeAdminSidebar />
        <div
          className={`flex-1 flex items-center justify-center transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"}`}
        >
          <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 border border-red-200">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-red-800 text-center mb-2">Office Code Not Found</h3>
            <p className="text-gray-600 text-center mb-4">
              Your office code is not set. Please check your profile or authentication settings.
            </p>
            <div className="flex justify-center">
              <Button
                className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
                onClick={() => router.push("/office-admin/profile")}
              >
                Go to Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
      <OfficeAdminSidebar />
      <OfficeAdminNavbar
        title="Incident Management"
        subtitle="Review and manage incident reports"
        showSearch={true}
        searchPlaceholder="Search incidents..."
        onSearch={setSearchQuery}
        showQuickActions={true}
      />
      <Toaster richColors position="top-right" className="z-50" style={{ top: '80px' }} />
      <div className={`flex-1 overflow-auto transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"} pt-24`}>
        <div className={`p-6 -mt-3 mx-8 ${collapsed ? "max-w-[95vw]" : "max-w-[calc(100vw-8rem)]"}`}>
          {/* Dashboard Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 font-medium text-sm transition-colors relative flex items-center ${
                activeTab === "pending" ? "text-[#8B0000]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending Incidents
              <span className="ml-2 bg-[#8B0000]/10 text-[#8B0000] text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
              {activeTab === "pending" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B0000] to-[#DAA520]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("transferred")}
              className={`px-4 py-2 font-medium text-sm transition-colors relative flex items-center ${
                activeTab === "transferred" ? "text-[#8B0000]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Transferred Cases
              <span className="ml-2 bg-[#8B0000]/10 text-[#8B0000] text-xs px-2 py-0.5 rounded-full">
                {transferredCount}
              </span>
              {activeTab === "transferred" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B0000] to-[#DAA520]"
                />
              )}
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {activeTab === "pending" ? (
                <span>Showing {filteredPendingIncidents.length} pending incidents</span>
              ) : (
                <span>Showing {filteredTransferredIncidents.length} transferred cases</span>
              )}
            </div>
          </div>

          {/* Pending Incidents Table */}
          {activeTab === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#8B0000]" />
                  <h2 className="text-lg font-semibold text-gray-800">Pending Incidents</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredPendingIncidents.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reporter
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
                      {filteredPendingIncidents.map((incident, index) => (
                        <motion.tr
                          key={incident.id}
                          className="hover:bg-[#fff9f9] transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-1 bg-yellow-400 rounded-full mr-3"></div>
                              <div className="text-sm font-medium text-[#8B0000]">{incident.trackingNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              {formatDate(incident.dateOfIncident, incident.timeOfIncident)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <FileText className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.incidentType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.submittedBy}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{incident.status}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPending(incident.id)}
                              className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white transition-colors"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No pending incidents</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {searchQuery
                        ? "No incidents match your search criteria."
                        : "There are no pending incidents that require your attention."}
                    </p>
                    {searchQuery && (
                      <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Transferred Cases Table */}
          {activeTab === "transferred" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-[#8B0000]" />
                  <h2 className="text-lg font-semibold text-gray-800">Transferred Cases</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredTransferredIncidents.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reporter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
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
                      {filteredTransferredIncidents.map((incident, index) => (
                        <motion.tr
                          key={incident.id}
                          className="hover:bg-[#fff9f9] transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-1 bg-blue-400 rounded-full mr-3"></div>
                              <div className="text-sm font-medium text-[#8B0000]">{incident.trackingNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              {formatDate(incident.dateOfIncident, incident.timeOfIncident)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <FileText className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.incidentType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.submittedBy}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              {incident.transferredFrom}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {incident.lastTransferredTo}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700 max-w-xs truncate">
                              {incident.lastTransferNotes || "No transfer notes"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              className={
                                incident.status.toLowerCase() === "pending"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                              }
                            >
                              {incident.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (incident.status.toLowerCase() === "pending") {
                                  handleEditPending(incident.id)
                                } else {
                                  handleTracking(incident.trackingNumber || incident.id)
                                }
                              }}
                              className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white transition-colors"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ArrowRightLeft className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No transferred cases</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {searchQuery
                        ? "No cases match your search criteria."
                        : "There are no cases that have been transferred to your office."}
                    </p>
                    {searchQuery && (
                      <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add custom styles for animation delays */}
      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}
