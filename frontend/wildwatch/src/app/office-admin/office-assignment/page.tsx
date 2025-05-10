"use client"

import { useState, useEffect } from "react"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle, Calendar, MapPin, User, Clock, Inbox } from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Incident {
  id: string
  trackingNumber: string
  incidentType: string
  dateOfIncident: string
  timeOfIncident: string
  location: string
  description: string
  submittedByFullName: string
  submittedAt: string
  status: string
}

const OfficeAssignment = () => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    const fetchUnassignedIncidents = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/unassigned`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch unassigned incidents")
        }

        const data = await response.json()
        setIncidents(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchUnassignedIncidents()
  }, [])

  const filteredIncidents = incidents.filter((incident) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      incident.trackingNumber.toLowerCase().includes(searchLower) ||
      incident.incidentType.toLowerCase().includes(searchLower) ||
      incident.location.toLowerCase().includes(searchLower) ||
      incident.submittedByFullName.toLowerCase().includes(searchLower)

    if (filterType === "all") return matchesSearch
    return matchesSearch && incident.incidentType.toLowerCase() === filterType.toLowerCase()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    // timeString is in format HH:mm:ss or HH:mm
    const [hour, minute, second] = timeString.split(":");
    const date = new Date();
    date.setHours(Number(hour));
    date.setMinutes(Number(minute));
    date.setSeconds(second ? Number(second) : 0);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila"
    });
  };

  const getIncidentTypes = () => {
    const types = new Set(incidents.map((incident) => incident.incidentType))
    return Array.from(types)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <OfficeAdminSidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                      <Skeleton className="h-16 w-full mt-2" />
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end">
                    <Skeleton className="h-9 w-32" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <OfficeAdminSidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Incidents</h3>
                  <p className="text-red-700">{error}</p>
                </div>
                <Button
                  variant="outline"
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <OfficeAdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#800000] mb-2">Office Assignment</h1>
              <p className="text-gray-600 text-lg">Assign incidents to appropriate offices</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search incidents..."
                  className="pl-10 pr-4 py-2 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getIncidentTypes().map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredIncidents.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">
                  Showing <span className="font-medium">{filteredIncidents.length}</span> unassigned incidents
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIncidents.map((incident) => (
                  <Card
                    key={incident.id}
                    className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardHeader className="p-5 pb-3 bg-gradient-to-r from-[#800000]/5 to-transparent">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="mb-2 bg-[#800000]">{incident.incidentType}</Badge>
                          <h3 className="font-semibold text-gray-800">Case #{incident.trackingNumber}</h3>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-2">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-3 text-[#800000]" />
                          <span>{formatDate(incident.dateOfIncident)}</span>
                          {incident.timeOfIncident && (
                            <>
                              <span className="mx-2">•</span>
                              <Clock className="h-4 w-4 mr-1 text-[#800000]" />
                              <span>{formatTime(incident.timeOfIncident)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-3 text-[#800000]" />
                          <span>{incident.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-3 text-[#800000]" />
                          <span>{incident.submittedByFullName}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700 line-clamp-3">{incident.description}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-5 pt-0 flex justify-end">
                      <Button
                        variant="default"
                        className="bg-[#800000] hover:bg-[#6B0000] transition-colors"
                        onClick={() => router.push(`/office-admin/incidents/${incident.id}/assign`)}
                      >
                        Assign Office
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="flex flex-col items-center max-w-md mx-auto">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Inbox className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No unassigned incidents found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? `No incidents match your search "${searchQuery}"`
                    : "All incidents have been assigned to appropriate offices"}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")} className="border-gray-300">
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfficeAssignment
