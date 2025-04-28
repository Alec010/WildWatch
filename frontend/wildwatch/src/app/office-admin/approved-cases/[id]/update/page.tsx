"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Calendar, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { use } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface IncidentUpdate {
  id: number
  message: string
  status: string
  updatedByFullName: string
  updatedAt: string
  visibleToReporter: boolean
}

interface Incident {
  id: string
  trackingNumber: string
  dateOfIncident: string
  timeOfIncident: string
  location: string
  incidentType: string
  description: string
  submittedByFullName: string
  submittedByEmail: string
  submittedByPhone: string
  submittedByRole: string
  submittedByIdNumber: string
  status: string
  priorityLevel: "HIGH" | "MEDIUM" | "LOW"
}

interface UpdateRequest {
  status: string
  updateMessage: string
  updatedBy: string
  visibleToReporter: boolean
  priorityLevel: "HIGH" | "MEDIUM" | "LOW"
}

export default function UpdateApprovedCasePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [updates, setUpdates] = useState<IncidentUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateMessage, setUpdateMessage] = useState("")
  const [updatedBy, setUpdatedBy] = useState("")
  const [isVisibleToReporter, setIsVisibleToReporter] = useState(true)
  const [status, setStatus] = useState("")
  const [priorityLevel, setPriorityLevel] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM")
  const [isSending, setIsSending] = useState(false)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)

  const fetchUpdates = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`http://localhost:8080/api/incidents/${resolvedParams.id}/updates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Raw updates data from API:", data)
      
      // Transform and validate the data
      const transformedData = data.map((update: any) => {
        const transformed = {
          ...update,
          visibleToReporter: Boolean(update.visibleToReporter)
        }
        console.log("Transformed update:", transformed)
        return transformed
      })
      
      console.log("Final transformed updates:", transformedData)
      setUpdates(transformedData)
    } catch (error) {
      console.error("Error fetching updates:", error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch incident details
        const incidentResponse = await fetch(`http://localhost:8080/api/incidents/${resolvedParams.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!incidentResponse.ok) {
          throw new Error(`HTTP error! status: ${incidentResponse.status}`)
        }

        const incidentData = await incidentResponse.json()
        setIncident(incidentData)

        // Fetch updates
        await fetchUpdates()
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  useEffect(() => {
    if (incident) {
      setStatus(incident.status)
      setPriorityLevel(incident.priorityLevel)
    }
  }, [incident])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  const handleSendUpdate = async () => {
    if (!incident || !updateMessage.trim() || !updatedBy.trim() || !status) return

    try {
      setIsSending(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const updateRequest: UpdateRequest = {
        status,
        updateMessage: updateMessage.trim(),
        updatedBy: updatedBy.trim(),
        visibleToReporter: isVisibleToReporter,
        priorityLevel
      }

      const response = await fetch(`http://localhost:8080/api/incidents/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success("Update sent successfully", {
        description: "The incident has been updated and the reporter will be notified.",
        duration: 5000,
      })
      
      setUpdateMessage("")
      setUpdatedBy("")
      setIsVisibleToReporter(true)
      
      // Refresh the updates list
      await fetchUpdates()
    } catch (error) {
      console.error("Error sending update:", error)
      toast.error("Failed to send update", {
        description: "There was an error sending your update. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleResolveCase = async () => {
    try {
      setIsSending(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const updateRequest: UpdateRequest = {
        status: "Resolved",
        updateMessage: "Case marked as resolved.",
        updatedBy: updatedBy || "System",
        visibleToReporter: true,
        priorityLevel
      }

      const response = await fetch(`http://localhost:8080/api/incidents/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success("Case resolved successfully", {
        description: "The incident has been marked as resolved.",
        duration: 5000,
      })
      
      setStatus("Resolved")
      await fetchUpdates()
    } catch (error) {
      console.error("Error resolving case:", error)
      toast.error("Failed to resolve case", {
        description: "There was an error resolving the case. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsSending(false)
      setIsResolveDialogOpen(false)
    }
  }

  const handleCloseCase = async () => {
    try {
      setIsSending(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const updateRequest: UpdateRequest = {
        status: "Dismissed",
        updateMessage: "Case has been closed and dismissed.",
        updatedBy: updatedBy || "System",
        visibleToReporter: true,
        priorityLevel
      }

      const response = await fetch(`http://localhost:8080/api/incidents/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success("Case closed successfully", {
        description: "The incident has been dismissed.",
        duration: 5000,
      })
      
      setStatus("Dismissed")
      await fetchUpdates()
    } catch (error) {
      console.error("Error closing case:", error)
      toast.error("Failed to close case", {
        description: "There was an error closing the case. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsSending(false)
      setIsCloseDialogOpen(false)
    }
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

  if (error || !incident) {
    return (
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error || "Incident not found"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb and Header */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Link href="/office-admin/approved-cases" className="hover:text-[#8B0000]">
                    Approved Case Tracker
                  </Link>
                  <ChevronRight className="h-4 w-4 mx-2" />
                  <span>Update Incident</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Case #: {incident.trackingNumber}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {incident.incidentType}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${
                        incident.priorityLevel === "HIGH"
                          ? "bg-red-50 text-red-700"
                          : incident.priorityLevel === "MEDIUM"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {incident.priorityLevel}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => setIsResolveDialogOpen(true)}
                  disabled={status === "Resolved" || status === "Dismissed" || isSending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Mark as Resolved
                </Button>
                <Button
                  onClick={() => setIsCloseDialogOpen(true)}
                  disabled={status === "Dismissed" || isSending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Close Case
                </Button>
              </div>

              {/* Reporter Information */}
              <Card className="mb-6">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                  <h2 className="text-sm font-semibold text-gray-900">Reporter Information</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="mt-1 text-sm text-gray-900">{incident.submittedByFullName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 text-sm text-gray-900">{incident.submittedByEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1 text-sm text-gray-900">{incident.submittedByPhone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <p className="mt-1 text-sm text-gray-900">{incident.submittedByRole || "Student"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">ID Number</p>
                    <p className="mt-1 text-sm text-gray-900">{incident.submittedByIdNumber || "Not provided"}</p>
                  </div>
                </div>
              </Card>

              {/* Incident Summary */}
              <Card className="mb-6">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                  <h2 className="text-sm font-semibold text-gray-900">Incident Summary</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date & Time</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(incident.dateOfIncident)} {incident.timeOfIncident}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="mt-1 text-sm text-gray-900">{incident.location}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Incident Type</p>
                      <p className="mt-1 text-sm text-gray-900">{incident.incidentType}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{incident.description}</p>
                  </div>
                </div>
              </Card>

              {/* Send Update to Reporter */}
              <Card className="mb-6">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                  <h2 className="text-sm font-semibold text-gray-900">Send Update to Reporter</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Updated By</p>
                    <input
                      type="text"
                      value={updatedBy}
                      onChange={(e) => setUpdatedBy(e.target.value)}
                      placeholder="Position of staff who performed the update"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000]"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Update Message</p>
                    <Textarea
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      placeholder="Provide an update on the incident investigation..."
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000]"
                    >
                      <option value="">Select status</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Dismissed">Dismissed</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Priority</p>
                    <select
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value as "HIGH" | "MEDIUM" | "LOW")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000]"
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsVisibleToReporter(!isVisibleToReporter)}
                      className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                        isVisibleToReporter
                          ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {isVisibleToReporter ? (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Visible to reporter
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                          Not visible to reporter
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUpdateMessage("")
                        setUpdatedBy("")
                        setIsVisibleToReporter(true)
                        if (incident) {
                          setStatus(incident.status)
                          setPriorityLevel(incident.priorityLevel)
                        }
                      }}
                      disabled={isSending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendUpdate}
                      disabled={!updateMessage.trim() || !updatedBy.trim() || !status || isSending}
                      className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
                    >
                      {isSending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Sending...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Update History */}
              <Card className="mb-6">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                  <h2 className="text-sm font-semibold text-gray-900">Update History</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {updates.map((update) => (
                    <div key={update.id} className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
                            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {update.updatedByFullName}
                          </div>
                          <div className="mt-0.5 text-sm text-gray-500">
                            {formatDateTime(update.updatedAt)}
                          </div>
                          <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                            {update.message}
                          </div>
                          <div className="mt-2 flex items-center space-x-2">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                update.visibleToReporter
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-red-50 text-red-600'
                              }`}
                            >
                              {update.visibleToReporter ? (
                                <>
                                  <svg className="inline-block h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Visible to reporter
                                </>
                              ) : (
                                <>
                                  <svg className="inline-block h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                  Not visible to reporter
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {updates.length === 0 && (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No updates yet
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Resolved</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this case as resolved? This will update the case status and notify the reporter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveCase}
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSending ? "Processing..." : "Confirm Resolution"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close and dismiss this case? This action will mark the case as dismissed and notify the reporter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseCase}
              disabled={isSending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSending ? "Processing..." : "Close Case"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 