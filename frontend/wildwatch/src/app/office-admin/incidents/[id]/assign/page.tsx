"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/utils/api"
import { AlertTriangle, Calendar, MapPin, User, FileText, Clock, Info, ArrowLeft, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

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
  submittedByIdNumber: string
  submittedByEmail: string
  submittedByPhone: string
  evidence?: Array<{
    id: string
    fileName: string
    fileType: string
    uploadDate: string
    fileUrl: string
  }>
  witnesses?: Array<{
    id: string
    name: string
    contactInformation: string
    additionalNotes: string
  }>
}

export default function AssignOfficePage() {
  const router = useRouter()
  const params = useParams()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ url: string; fileName: string } | null>(null)
  const [showOfficeModal, setShowOfficeModal] = useState(false)
  const [selectedOffice, setSelectedOffice] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmations, setConfirmations] = useState({
    handleAllMatters: false,
    maintainConfidentiality: false,
    provideUpdates: false,
    coordinateWithOtherOffices: false,
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [officeList, setOfficeList] = useState<{ code: string; fullName: string; description: string }[]>([])

  useEffect(() => {
    const fetchIncidentDetails = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch incident details")
        }

        const data = await response.json()
        setIncident(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchIncidentDetails()
    }
  }, [params.id])

  // Fetch office list from backend
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]
        const response = await fetch(`${API_BASE_URL}/api/offices`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!response.ok) throw new Error("Failed to fetch offices")
        const data = await response.json()
        setOfficeList(data)
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchOffices()
  }, [])

  const handleAssignOffice = async () => {
    if (!selectedOffice) {
      setError("Please select an office")
      return
    }
    setIsProcessing(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      if (!token) {
        throw new Error("No authentication token found")
      }
      const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}/assign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          officeCode: selectedOffice,
          notes: assignmentNotes,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to assign office")
      }
      setShowOfficeModal(false)
      setShowSuccessModal(true)
      setCountdown(3)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTakeCase = async () => {
    setIsProcessing(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      if (!token) {
        throw new Error("No authentication token found")
      }
      const response = await fetch(`${API_BASE_URL}/api/incidents/${params.id}/assign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          officeCode: "SSO",
          notes: "Case taken by SSO office",
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to take case")
      }
      setShowSuccessModal(true)
      setCountdown(3)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  // Countdown effect
  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showSuccessModal && countdown === 0) {
      router.push("/office-admin/office-assignment")
    }
  }, [showSuccessModal, countdown, router])

  const isImageFile = (fileType: string) => {
    return fileType.startsWith("image/")
  }

  const allConfirmed = Object.values(confirmations).every(Boolean)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <OfficeAdminSidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
              <p className="mt-4 text-gray-600">Loading incident details...</p>
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
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <OfficeAdminSidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-500">No incident found</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/office-admin/office-assignment")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Office Assignment
              </Button>
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
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Incident Details, Evidence, Witnesses, Description */}
          <div className="space-y-6">
            {/* Incident Details */}
            <Card className="bg-white p-6">
              <h2 className="text-lg font-semibold text-[#800000] mb-4">Incident Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-medium">{incident.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Incident Type</p>
                  <p className="font-medium">{incident.incidentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Incident</p>
                  <p className="font-medium">{new Date(incident.dateOfIncident).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time of Incident</p>
                  <p className="font-medium">{incident.timeOfIncident}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{incident.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{incident.status}</p>
                </div>
              </div>
            </Card>
            {/* Description */}
            <Card className="bg-white p-6">
              <h2 className="text-lg font-semibold text-[#800000] mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{incident.description}</p>
            </Card>
            {/* Evidence */}
            {incident.evidence && incident.evidence.length > 0 && (
              <Card className="bg-white p-6">
                <h2 className="text-lg font-semibold text-[#800000] mb-4">Evidence</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 overflow-auto max-h-48">
                  {incident.evidence.map((item) => (
                    <div key={item.id} className="flex flex-col items-center cursor-pointer" onClick={() => setSelectedImage({ url: item.fileUrl, fileName: item.fileName })}>
                      {isImageFile(item.fileType) ? (
                        <div className="relative w-16 h-16">
                          <Image
                            src={item.fileUrl}
                            alt={item.fileName}
                            fill
                            className="object-cover rounded border border-gray-200"
                          />
                        </div>
                      ) : (
                        <FileText className="h-8 w-8 text-[#800000] mt-2" />
                      )}
                      <div className="text-xs text-center mt-1 truncate w-16">{item.fileName}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {/* Witnesses */}
            {incident.witnesses && incident.witnesses.length > 0 && (
              <Card className="bg-white p-6">
                <h2 className="text-lg font-semibold text-[#800000] mb-4">Witnesses</h2>
                <div className="space-y-4 overflow-auto max-h-48 pr-2">
                  {incident.witnesses.map((witness) => (
                    <div key={witness.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{witness.name}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            <p>Contact: {witness.contactInformation}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">Statement:</p>
                        <p className="mt-1 text-gray-700">{witness.additionalNotes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
          {/* Right Column: Reporter Info, Assignment Confirmation, Action Buttons */}
          <div className="space-y-6 md:sticky md:top-8 h-fit">
            {/* Reporter Information */}
            <Card className="bg-white p-6">
              <h2 className="text-lg font-semibold text-[#800000] mb-4">Reporter Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{incident.submittedByFullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Number</p>
                  <p className="font-medium">{incident.submittedByIdNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{incident.submittedByEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{incident.submittedByPhone}</p>
                </div>
              </div>
            </Card>
            {/* Office Assignment Confirmation */}
            <Card className="bg-white p-6">
              <h2 className="text-lg font-semibold text-[#800000] mb-4">Office Assignment Confirmation</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="handleAllMatters"
                    checked={confirmations.handleAllMatters}
                    onCheckedChange={(checked: boolean) =>
                      setConfirmations(prev => ({ ...prev, handleAllMatters: checked }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="handleAllMatters" className="text-sm text-gray-600">
                    I confirm that this office will handle all matters related to this incident
                  </label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="maintainConfidentiality"
                    checked={confirmations.maintainConfidentiality}
                    onCheckedChange={(checked: boolean) =>
                      setConfirmations(prev => ({ ...prev, maintainConfidentiality: checked }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="maintainConfidentiality" className="text-sm text-gray-600">
                    I confirm that this office will maintain confidentiality of all information
                  </label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="provideUpdates"
                    checked={confirmations.provideUpdates}
                    onCheckedChange={(checked: boolean) =>
                      setConfirmations(prev => ({ ...prev, provideUpdates: checked }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="provideUpdates" className="text-sm text-gray-600">
                    I confirm that this office will provide regular updates on the case progress
                  </label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="coordinateWithOtherOffices"
                    checked={confirmations.coordinateWithOtherOffices}
                    onCheckedChange={(checked: boolean) =>
                      setConfirmations(prev => ({ ...prev, coordinateWithOtherOffices: checked }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="coordinateWithOtherOffices" className="text-sm text-gray-600">
                    I confirm that this office will coordinate with other offices if necessary
                  </label>
                </div>
              </div>
            </Card>
            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                onClick={() => setShowOfficeModal(true)}
                className="border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white"
                disabled={!allConfirmed || isProcessing}
              >
                Assign Office
              </Button>
              <Button
                onClick={handleTakeCase}
                className="bg-[#800000] hover:bg-[#6B0000] text-white"
                disabled={!allConfirmed || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Take the Case'}
              </Button>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedImage?.fileName}</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="relative w-full h-[70vh]">
                <Image
                  src={selectedImage.url || "/placeholder.svg"}
                  alt={selectedImage.fileName}
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Office Assignment Modal */}
        <Dialog open={showOfficeModal} onOpenChange={setShowOfficeModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign to Office</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Select Office</label>
                <TooltipProvider>
                  <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an office" />
                    </SelectTrigger>
                    <SelectContent>
                      {officeList.map((office) => (
                        <SelectItem key={office.code} value={office.code} className="flex items-center gap-2">
                          <span>{office.fullName}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 cursor-pointer">
                                <Info size={16} className="text-gray-500" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{office.description}</TooltipContent>
                          </Tooltip>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TooltipProvider>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Assignment Notes</label>
                <Textarea
                  placeholder="Enter notes for the office..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOfficeModal(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignOffice}
                className="bg-[#800000] hover:bg-[#6B0000] text-white"
                disabled={isProcessing || !selectedOffice}
              >
                {isProcessing ? "Processing..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal}>
          <DialogContent className="sm:max-w-[400px] text-center">
            <div className="py-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Success!</h2>
              <p className="text-gray-700 mb-4">The case has been assigned successfully.</p>
              <p className="text-gray-600">
                Redirecting to dashboard in <span className="font-bold">{countdown}</span>...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
