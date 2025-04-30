"use client"

import React, { useState, useEffect, use, JSX } from "react"
import { useRouter } from "next/navigation"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Tag,
  CheckCircle,
  XCircleIcon,
} from "lucide-react"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Witness {
  id: string
  name: string
  contactInformation: string
  additionalNotes: string
}

interface Evidence {
  id: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
}

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
  witnesses: Witness[]
  evidence: Evidence[]
  administrativeNotes: string
  verified: boolean
  verificationNotes: string
  verifiedAt: string | null
  verifiedBy: string | null
  submittedByFullName: string
  submittedByIdNumber: string
  submittedByEmail: string
  submittedByPhone: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function IncidentDetailsPage({ params }: PageProps) {
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [administrativeNotes, setAdministrativeNotes] = useState("")
  const [verificationNotes, setVerificationNotes] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [status, setStatus] = useState("")
  const [priorityLevel, setPriorityLevel] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{
    title: string
    message: string
    icon: JSX.Element
    color: string
  } | null>(null)
  const { id } = use(params)

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`http://localhost:8080/api/incidents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setIncident(data)
        setAdministrativeNotes(data.administrativeNotes || "")
        setVerificationNotes(data.verificationNotes || "")
        setIsVerified(data.verified)
        setStatus(data.status)
        setPriorityLevel(data.priorityLevel)
      } catch (error) {
        console.error("Error fetching incident:", error)
        setError(error instanceof Error ? error.message : "Failed to load incident")
      } finally {
        setLoading(false)
      }
    }

    fetchIncident()
  }, [id])

  const handleApproveIncident = async () => {
    setIsProcessing(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`http://localhost:8080/api/incidents/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          administrativeNotes,
          verified: true,
          verificationNotes,
          status: "In Progress",
          priorityLevel,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedIncident = await response.json()
      setIncident(updatedIncident)
      
      // Show success modal
      setModalContent({
        title: "Incident Approved",
        message: "The incident has been successfully approved and is now being processed.",
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        color: "bg-green-50 border-green-200",
      })
      setShowModal(true)

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/office-admin/dashboard")
      }, 3000)
    } catch (error) {
      console.error("Error approving incident:", error)
      setModalContent({
        title: "Error",
        message: "Failed to approve incident. Please try again.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      })
      setShowModal(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismissIncident = async () => {
    setIsProcessing(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`http://localhost:8080/api/incidents/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          administrativeNotes,
          verified: false,
          verificationNotes,
          status: "Dismissed",
          priorityLevel: null,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedIncident = await response.json()
      setIncident(updatedIncident)
      
      // Show success modal
      setModalContent({
        title: "Incident Dismissed",
        message: "The incident has been successfully dismissed.",
        icon: <XCircleIcon className="h-12 w-12 text-gray-500" />,
        color: "bg-gray-50 border-gray-200",
      })
      setShowModal(true)

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/office-admin/dashboard")
      }, 3000)
    } catch (error) {
      console.error("Error dismissing incident:", error)
      setModalContent({
        title: "Error",
        message: "Failed to dismiss incident. Please try again.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      })
      setShowModal(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStatusUpdate = async () => {
    setIsProcessing(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`http://localhost:8080/api/incidents/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          administrativeNotes,
          verified: isVerified,
          verificationNotes,
          status,
          priorityLevel,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedIncident = await response.json()
      setIncident(updatedIncident)
      
      // Show success modal
      setModalContent({
        title: "Status Updated",
        message: `The incident status has been successfully updated to ${status}.`,
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        color: "bg-green-50 border-green-200",
      })
      setShowModal(true)

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/office-admin/dashboard")
      }, 3000)
    } catch (error) {
      console.error("Error updating incident status:", error)
      setModalContent({
        title: "Error",
        message: "Failed to update incident status. Please try again.",
        icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        color: "bg-red-50 border-red-200",
      })
      setShowModal(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "In Progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            In Progress
          </Badge>
        )
      case "Resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Resolved
          </Badge>
        )
      case "Dismissed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Dismissed
          </Badge>
        )
      case "Closed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Closed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null

    switch (priority) {
      case "LOW":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Low Priority
          </Badge>
        )
      case "MEDIUM":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Medium Priority
          </Badge>
        )
      case "HIGH":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High Priority
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <OfficeAdminSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading incident details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <OfficeAdminSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-[1200px] mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <p className="text-red-700 font-medium">Error: {error || "Incident not found"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <OfficeAdminSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Review Incident</h1>
                {getStatusBadge(incident.status)}
                {getPriorityBadge(incident.priorityLevel)}
              </div>
              <p className="text-gray-500 mt-1">
                Case #{incident.trackingNumber} • {incident.incidentType}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2 self-start">
              <ArrowLeft className="h-4 w-4" />
              Back to Incidents
            </Button>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main content - takes up 2/3 of the space */}
            <div className="md:col-span-2 space-y-6">
              {/* Incident Summary Card */}
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#8B0000]/90 to-[#8B0000] text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white/80 text-sm mb-1">Incident Report</p>
                      <h2 className="text-xl font-semibold">{incident.incidentType}</h2>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-white/80 text-sm">Reported</p>
                      <p className="font-medium">{new Date(incident.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Date of Incident</p>
                        <p className="font-medium">{new Date(incident.dateOfIncident).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Time of Incident</p>
                        <p className="font-medium">{incident.timeOfIncident}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{incident.location}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">{incident.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence & Witnesses */}
              <Tabs defaultValue="evidence" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="evidence" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Evidence
                  </TabsTrigger>
                  <TabsTrigger value="witnesses" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Witnesses
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="evidence" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      {incident.evidence && incident.evidence.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {incident.evidence.map((file) => (
                            <div key={file.id} className="group relative">
                              {file.fileType.startsWith("image/") ? (
                                <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
                                  <Image
                                    src={file.fileUrl}
                                    alt={file.fileName}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    unoptimized
                                    className="transition-transform group-hover:scale-105"
                                  />
                                </div>
                              ) : file.fileType.startsWith("video/") ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
                                  <video
                                    src={file.fileUrl}
                                    controls
                                    className="w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow bg-gray-50 flex items-center justify-center">
                                  <FileText className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 truncate">{file.fileName}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                                  {new Date(file.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No evidence files have been uploaded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="witnesses" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      {incident.witnesses && incident.witnesses.length > 0 ? (
                        <div className="space-y-4">
                          {incident.witnesses.map((witness) => (
                            <Card key={witness.id} className="overflow-hidden">
                              <div className="bg-gray-50 p-4 border-b">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{witness.name}</p>
                                    <p className="text-sm text-gray-500">{witness.contactInformation}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="text-gray-700 whitespace-pre-line">{witness.additionalNotes}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No witness information available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right sidebar - takes up 1/3 of the space */}
            <div className="space-y-6">
              {/* Administrative Actions */}
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-gray-50 p-4 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#8B0000]" />
                    Administrative Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Status */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Status</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  {/* Priority Level */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Set Priority</Label>
                    <select
                      value={priorityLevel || ""}
                      onChange={(e) => setPriorityLevel(e.target.value || null)}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                    >
                      <option value="">Select Priority</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  {/* Administrative Notes */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Administrative Notes</Label>
                    <Textarea
                      value={administrativeNotes}
                      onChange={(e) => setAdministrativeNotes(e.target.value)}
                      placeholder="Add your notes about this incident..."
                      className="mt-1 min-h-[100px] focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                    />
                  </div>

                  {/* Update Button */}
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isProcessing}
                    className="w-full bg-[#8B0000] hover:bg-[#700000] text-white"
                  >
                    {isProcessing ? "Updating..." : "Update Status"}
                  </Button>
                </CardContent>
              </Card>

              {/* Reporter Information */}
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-gray-50 p-4 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-[#8B0000]" />
                    Reporter Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{incident.submittedByFullName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">ID Number</p>
                        <p className="font-medium">{incident.submittedByIdNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{incident.submittedByEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{incident.submittedByPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Submission Date</p>
                        <p className="font-medium">{new Date(incident.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification */}
              <Card className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-gray-50 p-4 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#8B0000]" />
                    Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-md border">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#8B0000] focus:ring-[#8B0000]"
                    />
                    <Label htmlFor="verified" className="text-sm font-medium cursor-pointer">
                      I confirm this incident has been verified
                    </Label>
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm font-medium">Verification Notes</Label>
                    <Textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add verification notes here..."
                      className="mt-1 min-h-[100px] focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                    />
                  </div>

                  {incident.verifiedBy && (
                    <div className="text-sm bg-green-50 text-green-700 p-3 rounded-md border border-green-200 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5" />
                      <span>
                        Verified by {incident.verifiedBy} on {new Date(incident.verifiedAt!).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white flex items-center gap-2"
                  onClick={handleApproveIncident}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Approve"}
                </Button>
                <Button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
                  onClick={handleDismissIncident}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <XCircle className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Dismiss"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && modalContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${modalContent.color}`}>
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  {modalContent.icon}
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">
                    {modalContent.title}
                  </h3>
                  <p className="mt-2 text-gray-600">
                    {modalContent.message}
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    Redirecting to dashboard in 3 seconds...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
