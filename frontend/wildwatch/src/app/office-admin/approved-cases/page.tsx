"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  FileEdit,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  Clock,
  MapPin,
  User,
  FileText,
  Shield,
  Activity,
} from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import { motion } from "framer-motion"
import { useSidebar } from "@/contexts/SidebarContext"
import { Inter } from "next/font/google"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/utils/apiClient"
import { formatDateWithYear, parseUTCDate } from "@/utils/dateUtils"

const inter = Inter({ subsets: ["latin"] })

interface Incident {
  id: string
  trackingNumber: string
  dateOfIncident: string
  location: string
  incidentType: string
  submittedByFullName: string
  status: string
  priorityLevel: "HIGH" | "MEDIUM" | "LOW"
}

export default function VerifiedCaseTracker() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  })

  // Bulk actions state
  const [bulkMode, setBulkMode] = useState<"none" | "resolve" | "dismiss">("none")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"resolve" | "dismiss" | null>(null)
  const [confirmNotes, setConfirmNotes] = useState("")
  const [resultOpen, setResultOpen] = useState(false)
  const [resultItems, setResultItems] = useState<Array<{ id: string; trackingNumber?: string; status: string }>>([])

  const itemsPerPage = 10

  const fetchVerifiedCases = async () => {
    try {
      setIsRefreshing(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        toast.error("Authentication Error", {
          description: "No authentication token found. Please log in again.",
          id: "auth-error",
        })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/in-progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setIncidents(data)

      // Calculate priority stats
      const stats = {
        total: data.length,
        highPriority: data.filter((inc: Incident) => inc.priorityLevel === "HIGH").length,
        mediumPriority: data.filter((inc: Incident) => inc.priorityLevel === "MEDIUM").length,
        lowPriority: data.filter((inc: Incident) => inc.priorityLevel === "LOW").length,
      }
      setStats(stats)
    } catch (e: any) {
      setError(e.message || "Failed to load verified cases")
      toast.error("Failed to Load Cases", {
        description: e.message || "There was an error loading the verified cases. Please try again.",
        id: "cases-load-error",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchVerifiedCases()
  }, [])

  const exitBulkMode = () => {
    setBulkMode("none")
    setSelectedIds(new Set())
  }

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const performBulk = async (action: "resolve" | "dismiss") => {
    if (selectedIds.size === 0) {
      toast.info("Select cases first", { description: "Please choose at least one case." })
      return
    }
    setConfirmAction(action)
    setConfirmNotes("")
    setConfirmOpen(true)
  }

  const submitBulk = async () => {
    if (!confirmAction) return
    try {
      setIsBulkLoading(true)
      const body = {
        incidentIds: Array.from(selectedIds),
        visibleToReporter: true,
        updateMessage: confirmNotes.trim(),
      }
      const endpoint = confirmAction === "resolve" ? "/api/incidents/bulk/resolve" : "/api/incidents/bulk/dismiss"
      const res = await api.post(endpoint, body)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const result = await res.json()
      const updated = (result?.updatedIds?.length ?? 0)
      const failed = (result?.failed?.length ?? 0)
      const updatedItems: Array<{ id: string; trackingNumber?: string; status: string }> = result?.updated || []
      setResultItems(updatedItems)

      toast.success(`Bulk ${confirmAction} completed`, {
        description: `${updated} updated${failed ? `, ${failed} failed` : ""}.`,
        action: {
          label: "View details",
          onClick: () => setResultOpen(true)
        },
        id: `bulk-${confirmAction}-completed-${Date.now()}`,
      })
      exitBulkMode()
      fetchVerifiedCases()
    } catch (e: any) {
      toast.error(`Bulk ${confirmAction} failed`, { 
        description: e?.message || "Please try again.",
        id: `bulk-${confirmAction}-failed-error`,
      })
    } finally {
      setIsBulkLoading(false)
      setConfirmOpen(false)
      setConfirmAction(null)
    }
  }

  // Filter incidents based on search query
  const filteredIncidents = incidents.filter((incident) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      incident.trackingNumber.toLowerCase().includes(searchLower) ||
      incident.incidentType.toLowerCase().includes(searchLower) ||
      incident.location.toLowerCase().includes(searchLower) ||
      incident.submittedByFullName.toLowerCase().includes(searchLower)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentIncidents = filteredIncidents.slice(startIndex, endIndex)

  const formatDate = (dateString: string) => {
    return formatDateWithYear(dateString)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
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
            <p className="mt-6 text-gray-600 font-medium">Loading verified cases...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className={`flex-1 p-8 transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"}`}>
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Cases</h3>
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

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}>
      <OfficeAdminSidebar />
      <OfficeAdminNavbar
        title="Verified Case Tracker"
        subtitle="View and manage verified incident reports"
        showSearch={true}
        searchPlaceholder="Search cases..."
        onSearch={setSearchQuery}
        showQuickActions={true}
      />
      <div className={`flex-1 overflow-auto transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"} pt-24`}>
        <div className={`p-6 -mt-3 mx-8 ${collapsed ? "max-w-[95vw]" : "max-w-[calc(100vw-8rem)]"}`}>
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVerifiedCases}
                disabled={isRefreshing}
                className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              {/* Bulk controls */}
              <div className="ml-2 flex items-center gap-2">
                {bulkMode === "dismiss" ? (
                  <Button variant="outline" size="sm" onClick={exitBulkMode} disabled={isBulkLoading}>
                    Cancel
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isBulkLoading}
                    className={`${bulkMode === "resolve" ? "bg-green-600 hover:bg-green-700" : "bg-[#8B0000] hover:bg-[#6B0000]"} text-white`}
                    onClick={() => {
                      if (bulkMode === "resolve") performBulk("resolve")
                      else setBulkMode("resolve")
                    }}
                  >
                    {bulkMode === "resolve" ? `Confirm Resolve (${selectedIds.size})` : "Bulk Resolve"}
                  </Button>
                )}
                {bulkMode === "resolve" ? (
                  <Button variant="outline" size="sm" onClick={exitBulkMode} disabled={isBulkLoading}>
                    Cancel
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isBulkLoading}
                    className={`${bulkMode === "dismiss" ? "bg-gray-700 hover:bg-gray-800" : "bg-gray-600 hover:bg-gray-700"} text-white`}
                    onClick={() => {
                      if (bulkMode === "dismiss") performBulk("dismiss")
                      else setBulkMode("dismiss")
                    }}
                  >
                    {bulkMode === "dismiss" ? `Confirm Dismiss (${selectedIds.size})` : "Bulk Dismiss"}
                  </Button>
                )}
              </div>
              {bulkMode !== "none" && (
                <div className="text-xs text-gray-600 ml-2">Bulk mode: {bulkMode} • Selected: {selectedIds.size}</div>
              )}
            </div>
            <div className="text-sm text-gray-500">Showing {filteredIncidents.length} verified cases</div>
          </div>

          {/* Summary Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-xl shadow-md p-6 text-white mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Case Distribution</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-white/80 text-sm">Total Cases</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.highPriority}</div>
                <div className="text-white/80 text-sm">High Priority</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.mediumPriority}</div>
                <div className="text-white/80 text-sm">Medium Priority</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.lowPriority}</div>
                <div className="text-white/80 text-sm">Low Priority</div>
              </div>
            </div>
          </motion.div>

          {/* Cases Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#8B0000]" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Verified Cases
                  <span className="ml-2 text-sm bg-[#8B0000]/10 text-[#8B0000] px-2 py-0.5 rounded-full">
                    {filteredIncidents.length}
                  </span>
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              {currentIncidents.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {bulkMode !== "none" && (<th className="px-4 py-3"></th>)}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
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
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentIncidents.map((incident, index) => (
                      <motion.tr
                        key={incident.id}
                        className="hover:bg-[#fff9f9] transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        {bulkMode !== "none" && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Checkbox
                              checked={selectedIds.has(incident.id)}
                              onCheckedChange={() => toggleRowSelection(incident.id)}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`flex-shrink-0 h-8 w-1 rounded-full mr-3 ${
                                incident.priorityLevel === "HIGH"
                                  ? "bg-red-400"
                                  : incident.priorityLevel === "MEDIUM"
                                    ? "bg-orange-400"
                                    : "bg-green-400"
                              }`}
                            ></div>
                            <div className="text-sm font-medium text-[#8B0000]">{incident.trackingNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDate(incident.dateOfIncident)}
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
                            {incident.submittedByFullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              incident.priorityLevel === "HIGH"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : incident.priorityLevel === "MEDIUM"
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {incident.priorityLevel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/office-admin/approved-cases/${incident.id}/update`)}
                            className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white transition-colors"
                          >
                            <FileEdit className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#8B0000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-[#8B0000]" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No verified cases found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchQuery
                      ? "No cases match your search criteria. Try adjusting your search terms."
                      : "There are no verified cases to display at this time."}
                  </p>
                  {searchQuery && (
                    <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredIncidents.length)} of{" "}
                  {filteredIncidents.length} results
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-[#DAA520]/30"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1
                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          currentPage === pageNumber
                            ? "bg-[#8B0000] text-white hover:bg-[#8B0000]/90"
                            : "border-[#DAA520]/30"
                        }`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}

                  {totalPages > 5 && <span className="px-2 text-gray-500">...</span>}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-[#DAA520]/30"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Confirm bulk modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#8B0000]">
              {confirmAction === "resolve" ? "Confirm Bulk Resolve" : "Confirm Bulk Dismiss"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">{selectedIds.size} selected item(s).</div>
            <Textarea
              placeholder={confirmAction === "resolve" ? "Resolution notes (required)" : "Dismissal notes (required)"}
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              className="min-h-[120px] border-[#DAA520]/30 focus:ring-[#8B0000]/20 focus:border-[#8B0000]"
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isBulkLoading}>Cancel</Button>
            <Button onClick={submitBulk} disabled={isBulkLoading || !confirmNotes.trim()} className="bg-[#8B0000] hover:bg-[#6B0000] text-white">
              {isBulkLoading ? "Processing..." : confirmAction === "resolve" ? "Resolve Selected" : "Dismiss Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result modal */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#8B0000]">Updated Incidents ({resultItems.length})</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-auto divide-y">
            {resultItems.length === 0 ? (
              <div className="text-sm text-gray-600">No items.</div>
            ) : (
              resultItems.map((it) => (
                <div key={it.id} className="flex items-center justify-between py-2">
                  <div className="text-sm">
                    <span className="text-gray-700">{it.trackingNumber || it.id}</span>
                    <span className="ml-2 text-xs text-gray-500">{it.status}</span>
                  </div>
                  <a
                    href={`/incidents/tracking/${it.trackingNumber || it.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B0000] hover:underline text-sm"
                  >
                    Open
                  </a>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setResultOpen(false)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
