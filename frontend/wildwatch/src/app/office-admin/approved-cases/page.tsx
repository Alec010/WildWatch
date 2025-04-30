"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search, FileEdit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/utils/api"

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

export default function ApprovedCaseTracker() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  })

  const itemsPerPage = 10

  useEffect(() => {
    const fetchApprovedCases = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
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
          highPriority: data.filter((inc: Incident) => inc.priorityLevel === "HIGH").length,
          mediumPriority: data.filter((inc: Incident) => inc.priorityLevel === "MEDIUM").length,
          lowPriority: data.filter((inc: Incident) => inc.priorityLevel === "LOW").length,
        }
        setStats(stats)
      } catch (error) {
        console.error("Error fetching approved cases:", error)
        setError(error instanceof Error ? error.message : "Failed to load approved cases")
      } finally {
        setLoading(false)
      }
    }

    fetchApprovedCases()
  }, [])

  // Filter incidents based on search query
  const filteredIncidents = incidents.filter((incident) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      incident.trackingNumber.toLowerCase().includes(searchLower) ||
      incident.incidentType.toLowerCase().includes(searchLower)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentIncidents = filteredIncidents.slice(startIndex, endIndex)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000]"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <OfficeAdminSidebar />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#8B0000]">Approved Case Tracker</h1>
              <p className="text-gray-600 mt-1">View and manage approved incident reports</p>
            </div>

            {/* Priority Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="overflow-hidden border-0 shadow-md">
                <div className="bg-red-600 h-1.5 w-full"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">High Priority</p>
                      <p className="text-3xl font-bold mt-1">{stats.highPriority}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 text-lg">!</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden border-0 shadow-md">
                <div className="bg-amber-500 h-1.5 w-full"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Medium Priority</p>
                      <p className="text-3xl font-bold mt-1">{stats.mediumPriority}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-600 text-lg">!</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden border-0 shadow-md">
                <div className="bg-green-500 h-1.5 w-full"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Low Priority</p>
                      <p className="text-3xl font-bold mt-1">{stats.lowPriority}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-lg">!</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Search and Table */}
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search by case ID or type..."
                      className="pl-10 border-gray-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-600">Case ID</TableHead>
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Location</TableHead>
                      <TableHead className="font-semibold text-gray-600">Incident Type</TableHead>
                      <TableHead className="font-semibold text-gray-600">Reporter</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600">Priority</TableHead>
                      <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentIncidents.map((incident) => (
                      <TableRow key={incident.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-[#8B0000]">{incident.trackingNumber}</TableCell>
                        <TableCell>{formatDate(incident.dateOfIncident)}</TableCell>
                        <TableCell>{incident.location}</TableCell>
                        <TableCell>{incident.incidentType}</TableCell>
                        <TableCell>{incident.submittedByFullName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            In Progress
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              incident.priorityLevel === "HIGH"
                                ? "bg-red-50 text-red-700 hover:bg-red-50"
                                : incident.priorityLevel === "MEDIUM"
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                  : "bg-green-50 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {incident.priorityLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-[#8B0000]"
                            onClick={() => router.push(`/office-admin/approved-cases/${incident.id}/update`)}
                          >
                            <FileEdit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredIncidents.length)} of{" "}
                  {filteredIncidents.length} results
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-gray-200"
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
                            : "border-gray-200"
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
                    className="h-8 w-8 p-0 border-gray-200"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
