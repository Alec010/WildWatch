"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ChevronRight,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  ChevronLeft,
  AlertCircle,
  ArrowRightLeft,
  Info,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { API_BASE_URL } from "@/utils/api"
import { RatingModal } from "@/components/RatingModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface IncidentUpdate {
  id: number
  message: string
  status: string
  updatedByFullName: string
  updatedByName?: string
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

interface TransferRequest {
  newOffice: string
  transferNotes: string
}

export default function UpdateApprovedCasePage() {
  const params = useParams()
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
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferNotes, setTransferNotes] = useState("")
  const [selectedOffice, setSelectedOffice] = useState("")
  const [isTransferring, setIsTransferring] = useState(false)
  const [offices, setOffices] = useState<{ code: string; fullName: string; description: string }[]>([])
  const [officesLoading, setOfficesLoading] = useState(false)
  const [officesError, setOfficesError] = useState<string | null>(null)
  const [officeName, setOfficeName] = useState<string>("")
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const prevStatusRef = useRef<string>("")

  // Fetch user's office name when component mounts
  useEffect(() => {
    const fetchOfficeName = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const profile = await response.json()
        if (profile.officeCode) {
          // Fetch office details to get the full name
          const officeResponse = await fetch(`${API_BASE_URL}/api/offices`)
          if (officeResponse.ok) {
            const offices = await officeResponse.json()
            const office = offices.find((o: any) => o.code === profile.officeCode)
            if (office) {
              setOfficeName(office.fullName)
              setUpdatedBy(office.fullName) // Set the initial value
            }
          }
        }
      } catch (error) {
        console.error("Error fetching office name:", error)
      }
    }

    fetchOfficeName()
  }, [])

  const fetchUpdates = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}/updates`, {
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
          visibleToReporter: Boolean(update.visibleToReporter),
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
        const incidentResponse = await fetch(`${API_BASE_URL}/api/incidents/${params.id}`, {
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
  }, [params.id])

  useEffect(() => {
    if (incident) {
      setStatus(incident.status)
      setPriorityLevel(incident.priorityLevel)
      prevStatusRef.current = incident.status
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
        priorityLevel,
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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
        priorityLevel,
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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
      setShowRatingModal(true)
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
        priorityLevel,
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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

  const handleTransfer = async () => {
    if (!selectedOffice) {
      toast.error("Please select an office to transfer to")
      return
    }

    try {
      setIsTransferring(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const transferRequest: TransferRequest = {
        newOffice: selectedOffice,
        transferNotes: transferNotes
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}/transfer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success("Case transferred successfully", {
        description: "The incident has been transferred to the selected office.",
        duration: 5000,
      })

      // Refresh the incident data
      await fetchUpdates()
      setShowTransferModal(false)
    } catch (error) {
      console.error("Error transferring case:", error)
      toast.error("Failed to transfer case", {
        description: "There was an error transferring the case. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsTransferring(false)
    }
  }

  // Fetch offices when transfer modal is opened
  useEffect(() => {
    if (showTransferModal) {
      setOfficesLoading(true);
      fetch(`${API_BASE_URL}/api/offices`)
        .then(res => res.json())
        .then(data => {
          setOffices(data);
          setOfficesLoading(false);
        })
        .catch(err => {
          setOfficesError('Failed to load offices');
          setOfficesLoading(false);
        });
    }
  }, [showTransferModal]);

  const handleRatingSuccess = () => {
    setShowRatingModal(false);
    setShowSuccessDialog(true);
  }

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    router.push('/office-admin/dashboard');
  }

  // Efficiently handle status change
  const handleStatusChange = async (newStatus: string) => {
    // Only trigger if status is changed to Resolved from a different status
    if (newStatus === "Resolved" && prevStatusRef.current !== "Resolved") {
      // Call the resolve logic (reuse handleResolveCase logic, but without double modal)
      await handleResolveCase()
    } else {
      setStatus(newStatus)
    }
    prevStatusRef.current = newStatus
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading case details...</p>
          </div>
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
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 flex flex-col items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Case</h3>
              <p className="text-center text-muted-foreground">{error || "Incident not found"}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/office-admin/approved-cases")}>
                Return to Case List
              </Button>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "Dismissed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200"
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb and Header */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <Link href="/office-admin/approved-cases" className="hover:text-primary transition-colors">
                    Approved Case Tracker
                  </Link>
                  <ChevronRight className="h-4 w-4 mx-2" />
                  <span>Update Incident</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900">Case #{incident.trackingNumber}</h1>
                      <Badge className={`${getStatusColor(incident.status)} border`}>{incident.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-gray-50">
                        {incident.incidentType}
                      </Badge>
                      <Badge className={`${getPriorityColor(incident.priorityLevel)} border`}>
                        {incident.priorityLevel} Priority
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                      onClick={() => setShowTransferModal(true)}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Transfer Case
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setIsResolveDialogOpen(true)}
                            disabled={status === "Resolved" || status === "Dismissed" || isSending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Mark as Resolved</span>
                            <span className="sm:hidden">Resolve</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark this case as resolved</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setIsCloseDialogOpen(true)}
                            disabled={status === "Dismissed" || isSending}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Close Case</span>
                            <span className="sm:hidden">Close</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Close and dismiss this case</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Incident Summary */}
                  <Card>
                    <CardHeader className="bg-gray-50 border-b pb-3">
                      <CardTitle className="text-base font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        Incident Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              Date & Time
                            </h3>
                            <p className="text-sm font-medium">
                              {formatDate(incident.dateOfIncident)} at {incident.timeOfIncident}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              Location
                            </h3>
                            <p className="text-sm font-medium">{incident.location}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                          <div className="bg-gray-50 p-3 rounded-md border text-sm whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                            {incident.description}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Send Update to Reporter */}
                  <Card>
                    <CardHeader className="bg-gray-50 border-b pb-3">
                      <CardTitle className="text-base font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        Send Update to Reporter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Updated By</label>
                          <Input
                            value={updatedBy}
                            disabled
                            className="bg-gray-100"
                            placeholder="Office name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <Select value={status} onValueChange={handleStatusChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Dismissed">Dismissed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Priority</label>
                          <Select
                            value={priorityLevel}
                            onValueChange={(value) => setPriorityLevel(value as "HIGH" | "MEDIUM" | "LOW")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HIGH" className="text-red-600 font-medium">
                                High Priority
                              </SelectItem>
                              <SelectItem value="MEDIUM" className="text-amber-600 font-medium">
                                Medium Priority
                              </SelectItem>
                              <SelectItem value="LOW" className="text-green-600 font-medium">
                                Low Priority
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsVisibleToReporter(!isVisibleToReporter)}
                            className={`w-full justify-start ${
                              isVisibleToReporter
                                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {isVisibleToReporter ? (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Visible to reporter
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Not visible to reporter
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Update Message</label>
                        <Textarea
                          value={updateMessage}
                          onChange={(e) => setUpdateMessage(e.target.value)}
                          placeholder="Provide an update on the incident investigation..."
                          className="min-h-[120px] resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
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
                          Reset
                        </Button>
                        <Button
                          onClick={handleSendUpdate}
                          disabled={!updateMessage.trim() || !updatedBy.trim() || !status || isSending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Reporter Information */}
                  <Card>
                    <CardHeader className="bg-gray-50 border-b pb-3">
                      <CardTitle className="text-base font-medium flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        Reporter Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        <div className="px-6 py-3 flex items-center">
                          <User className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm font-medium">{incident.submittedByFullName}</p>
                          </div>
                        </div>
                        <div className="px-6 py-3 flex items-center">
                          <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{incident.submittedByEmail}</p>
                          </div>
                        </div>
                        <div className="px-6 py-3 flex items-center">
                          <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium">{incident.submittedByPhone || "Not provided"}</p>
                          </div>
                        </div>
                        <div className="px-6 py-3 flex items-center">
                          <Briefcase className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            <p className="text-sm font-medium">{incident.submittedByRole || "Student"}</p>
                          </div>
                        </div>
                        <div className="px-6 py-3 flex items-center">
                          <FileText className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">ID Number</p>
                            <p className="text-sm font-medium">{incident.submittedByIdNumber || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Update History */}
                  <Card>
                    <CardHeader className="bg-gray-50 border-b pb-3">
                      <CardTitle className="text-base font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        Update History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                      {updates.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-sm text-muted-foreground">No updates yet</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {updates.map((update) => (
                            <div key={update.id} className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                    <p className="text-sm font-medium">
                                      {update.updatedByName || update.updatedByFullName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{formatDateTime(update.updatedAt)}</p>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border">
                                    {update.message}
                                  </div>
                                  <div className="mt-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        update.visibleToReporter
                                          ? "bg-green-50 text-green-600"
                                          : "bg-red-50 text-red-600"
                                      }`}
                                    >
                                      {update.visibleToReporter ? (
                                        <>
                                          <Eye className="inline-block h-3 w-3 mr-1" />
                                          Visible to reporter
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="inline-block h-3 w-3 mr-1" />
                                          Not visible to reporter
                                        </>
                                      )}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Resolved</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this case as resolved? This will update the case status and notify the
              reporter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveCase}
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Resolution"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close and dismiss this case? This action will mark the case as dismissed and
              notify the reporter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseCase}
              disabled={isSending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Close Case"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Modal */}
      <AlertDialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Case</AlertDialogTitle>
            <AlertDialogDescription>
              Transfer this case to another office. This will notify both the new office and the case reporter.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Transfer To</label>
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger>
                  <SelectValue placeholder={officesLoading ? 'Loading offices...' : 'Select office'} />
                </SelectTrigger>
                <SelectContent>
                  {officesLoading ? (
                    <div className="px-4 py-2 text-gray-500">Loading...</div>
                  ) : officesError ? (
                    <div className="px-4 py-2 text-red-500">{officesError}</div>
                  ) : (
                    offices.map((office) => (
                      <SelectItem key={office.code} value={office.code} className="flex items-center justify-between gap-2">
                        <span>{office.fullName}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 cursor-pointer">
                                <Info className="h-4 w-4 text-gray-400 hover:text-primary" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="font-semibold">{office.fullName}</div>
                              <div className="text-xs text-gray-500 max-w-xs whitespace-pre-line">{office.description}</div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Transfer Notes</label>
              <Textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Provide a reason for transferring this case..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTransferring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={isTransferring}
              className="bg-[#8B0000] hover:bg-[#700000] text-white"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Transfer Case"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        incidentId={params.id as string}
        type="office"
        onSuccess={handleRatingSuccess}
      />
    </>
  )
}
