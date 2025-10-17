"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Sidebar } from "@/components/Sidebar"
import { useSidebar } from "@/contexts/SidebarContext"
import { Navbar } from "@/components/Navbar"
import Image from "next/image"
import {
  CheckCircle2,
  ArrowLeft, 
  Info,
  Edit2,
  Loader2,
  FileText,
  MapPin,
  Calendar,
  Building,
  Tag,
  User,
  Phone,
  MessageSquare,
  Camera,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Toaster, toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { api } from "@/utils/apiClient"
import { formatLocationDisplay } from "@/utils/locationFormatter"

// Minimal local types to satisfy TS for witnesses processing
type TaggedUser = { id: string }
type EvidenceWitnessInput = {
  users?: TaggedUser[]
  name?: string
  contactInformation?: string
  additionalNotes?: string
}
type ProcessedWitness =
  | { userId: string; additionalNotes?: string }
  | { name?: string; contactInformation?: string; additionalNotes?: string }

export default function ReviewSubmissionPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [incidentData, setIncidentData] = useState<any>(null)
  const [evidenceData, setEvidenceData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAssigningOffice, setIsAssigningOffice] = useState(false)
  const [assignedOffice, setAssignedOffice] = useState<string | null>(null)
  const [confirmations, setConfirmations] = useState({
    accurateInfo: false,
    contactConsent: false,
  })
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [preferAnonymous, setPreferAnonymous] = useState<boolean>(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)
  const [showBlockedDialog, setShowBlockedDialog] = useState(false)
  const [blockedReasons, setBlockedReasons] = useState<string[]>([])
  const [showSimilarDialog, setShowSimilarDialog] = useState(false)
  const [similarIncidents, setSimilarIncidents] = useState<any[]>([])
  const [analysisSuggestion, setAnalysisSuggestion] = useState<{ suggestedOffice?: string } | null>(null)
  const [analysisWhy, setAnalysisWhy] = useState<{ tags: string[]; location?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>("incident")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    const storedIncidentData = sessionStorage.getItem("incidentSubmissionData")
    const storedEvidenceData = sessionStorage.getItem("evidenceSubmissionData")

    if (!storedIncidentData || !storedEvidenceData) {
      router.push("/incidents/submit")
      return
    }

    const parsedIncidentData = JSON.parse(storedIncidentData)
    setIncidentData(parsedIncidentData)
    setEvidenceData(JSON.parse(storedEvidenceData))
    setLoading(false)
  }, [router])

  const handleSubmit = () => {
    if (!confirmations.accurateInfo || !confirmations.contactConsent) {
      toast.error("Please confirm all required checkboxes", {
        description: "You must agree to both statements before submitting your report.",
      })
      return
    }

    setShowConfirmDialog(true)
  };

  const processSubmission = async () => {
    setShowConfirmDialog(false)
    setIsSubmitting(true)
    setIsAssigningOffice(true)
    setShowLoadingDialog(true)

    try {
      // Analyze first (no persistence)
      const analyzeRes = await api.post("/api/incidents/analyze", {
        incidentType: incidentData.incidentType,
        description: incidentData.description,
        location: incidentData.location,
        formattedAddress: incidentData.formattedAddress,
        buildingName: incidentData.buildingName,
        buildingCode: incidentData.buildingCode,
        latitude: incidentData.latitude,
        longitude: incidentData.longitude,
      })

      if (!analyzeRes.ok) {
        throw new Error("Failed to analyze report. Please try again.")
      }
      const analysis = await analyzeRes.json()
      if (analysis.decision === "BLOCK") {
        setIsSubmitting(false)
        setIsAssigningOffice(false)
        setShowLoadingDialog(false)
        setBlockedReasons(Array.isArray(analysis.reasons) ? analysis.reasons : [])
        setShowBlockedDialog(true)
        return
      }

      // Do not pre-set assigned office; only show after final submission

      // Store context for "Why this suggestion?"
      setAnalysisWhy({
        tags: Array.isArray(analysis.suggestedTags) ? analysis.suggestedTags.slice(0, 8) : (incidentData.tags || []).slice(0, 8),
        location: analysis.normalizedLocation || formatLocationDisplay(incidentData),
      })

      // If similar incidents exist (>= threshold), show modal and pause submission
      if (Array.isArray(analysis.similarIncidents) && analysis.similarIncidents.length > 0) {
        setSimilarIncidents(analysis.similarIncidents)
        setAnalysisSuggestion({ suggestedOffice: analysis.suggestedOffice })
        setIsSubmitting(false)
        setIsAssigningOffice(false)
        setShowLoadingDialog(false)
        setShowSimilarDialog(true)
        return
      }

      // If no similar suggestions, proceed to submit
      await doSubmit()
    } catch (error) {
      console.error("Analysis or submission error:", error);
      toast.error("Submission failed", {
        description: "Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsSubmitting(false)
      setIsAssigningOffice(false)
      setShowLoadingDialog(false)
    }
  }

  const doSubmit = async () => {
    // Token will be handled by the API client automatically
    const formData = new FormData()
    // Process witnesses to match the backend DTO format
    let processedWitnesses: ProcessedWitness[] = []

    evidenceData.witnesses.forEach((witness: EvidenceWitnessInput) => {
      if (witness.users && witness.users.length > 0) {
        witness.users.forEach((user: TaggedUser) => {
          processedWitnesses.push({
            userId: user.id,
            additionalNotes: witness.additionalNotes,
          })
        })
      } else {
        processedWitnesses.push({
          name: witness.name,
          contactInformation: witness.contactInformation,
          additionalNotes: witness.additionalNotes,
        })
      }
    })

    formData.append(
      "incidentData",
      JSON.stringify({
        ...incidentData,
        witnesses: processedWitnesses,
        preferAnonymous: !!preferAnonymous,
        tags: incidentData.tags || [],
      }),
    )

    const loadingToast = toast.loading("Processing files...", {
      description: "Uploading evidence files to secure storage.",
    })

    for (const fileInfo of evidenceData.fileInfos) {
      const response = await fetch(fileInfo.data)
      const blob = await response.blob()
      formData.append("files", blob, fileInfo.name)
    }

    toast.dismiss(loadingToast)

    const submissionToast = toast.loading("Submitting report...", {
      description: "Your report is being securely transmitted.",
    })

    const response = await api.post("/api/incidents", formData, {
      headers: {},
    })

    toast.dismiss(submissionToast)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const responseData = await response.json()
    setTrackingNumber(responseData.trackingNumber)
    setAssignedOffice(responseData.assignedOffice)
    setShowSuccessDialog(true)

    sessionStorage.removeItem("incidentSubmissionData")
    sessionStorage.removeItem("evidenceSubmissionData")

    toast.success("Report submitted successfully!", {
      description: `Your tracking number is ${responseData.trackingNumber}`,
    })
  }

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    console.log("Redirecting to dashboard");
    router.push("/dashboard");
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Camera className="h-5 w-5 text-blue-500" />
    } else if (fileType.startsWith("video/")) {
      return <Camera className="h-5 w-5 text-purple-500" />
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(2) + " MB"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f8f8f8]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#800000] to-[#D4AF37] opacity-30 blur-lg animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading your report...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#f8f8f8]">
      <Sidebar />
      <Toaster
        position="top-right"
        richColors
        className="!top-24"
        toastOptions={{
          classNames: {
            toast: "bg-white",
            success: "bg-[#dcfce7] border-[#86efac] text-[#166534]",
            error: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
            warning: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
            info: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
          },
        }}
        theme="light"
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        {/* Navbar */}
        <Navbar title="Report an Incident" subtitle="Review and submit your report" showSearch={false} />

        {/* Content */}
        <div className="pt-24 px-6 pb-10">
          {/* Progress Indicator */}
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#800000]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#800000]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#800000] mb-1">Review & Submit</h1>
                <p className="text-gray-600">Please review all information before submitting your incident report</p>
              </div>
              <div className="md:ml-auto flex-shrink-0 bg-[#800000]/5 rounded-full px-4 py-2 flex items-center">
                <div className="mr-2 text-sm font-medium text-[#800000]">Step 3 of 3</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full">
                <div className="h-full w-full bg-[#800000] rounded-full"></div>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-green-600">Incident Details</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-green-600">Evidence & Witnesses</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="bg-[#800000] text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    3
                  </div>
                  <span className="text-sm font-medium text-[#800000]">Review & Submit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            {/* Left Column - Review Sections */}
            <div className="space-y-6">
              {/* Incident Details Section */}
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div
                  className={`border-b border-gray-100 p-6 flex items-center justify-between cursor-pointer ${expandedSection === "incident" ? "bg-[#800000]/5" : ""}`}
                  onClick={() => toggleSection("incident")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${expandedSection === "incident" ? "bg-[#800000]/20" : "bg-gray-100"}`}
                    >
                      <FileText
                        className={`h-5 w-5 ${expandedSection === "incident" ? "text-[#800000]" : "text-gray-500"}`}
                      />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Incident Details</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push("/incidents/submit")
                      }}
                      className="h-8 text-xs border-gray-200 text-gray-600 hover:text-[#800000] hover:border-[#800000]/20 rounded-full"
                    >
                      <Edit2 size={14} className="mr-1.5" /> Edit
                    </Button>
                    {expandedSection === "incident" ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSection === "incident" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-4 w-4 text-[#800000]" />
                              <h3 className="text-sm font-medium text-gray-700">Incident Type</h3>
                            </div>
                            <p className="text-base font-semibold text-gray-900">{incidentData.incidentType}</p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="h-4 w-4 text-[#800000]" />
                              <h3 className="text-sm font-medium text-gray-700">Location</h3>
                            </div>
                            <p className="text-base font-semibold text-gray-900">{formatLocationDisplay(incidentData)}</p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="h-4 w-4 text-[#800000]" />
                              <h3 className="text-sm font-medium text-gray-700">Date & Time</h3>
                            </div>
                            <p className="text-base font-semibold text-gray-900">
                              {`${new Date(incidentData.dateOfIncident).toLocaleDateString('en-US', { weekday: 'long' })} ${new Date(incidentData.dateOfIncident).toLocaleDateString()} at ${new Date(`2000-01-01T${incidentData.timeOfIncident}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <Building className="h-4 w-4 text-[#800000]" />
                              <h3 className="text-sm font-medium text-gray-700">Assigned Office</h3>
                            </div>
                            <p className="text-base font-semibold text-gray-900">
                              {isAssigningOffice ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-[#800000]" />
                                  AI is assigning to appropriate office...
                                </span>
                              ) : (
                                assignedOffice || "Will be assigned automatically"
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="h-4 w-4 text-[#800000]" />
                            <h3 className="text-sm font-medium text-gray-700">Description</h3>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{incidentData.description}</p>
                        </div>

                        {incidentData.tags && incidentData.tags.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Tag className="h-4 w-4 text-[#800000]" />
                              <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {incidentData.tags.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-[#800000] to-[#9a0000] text-white rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Evidence & Witnesses Section */}
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div
                  className={`border-b border-gray-100 p-6 flex items-center justify-between cursor-pointer ${expandedSection === "evidence" ? "bg-[#800000]/5" : ""}`}
                  onClick={() => toggleSection("evidence")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${expandedSection === "evidence" ? "bg-[#800000]/20" : "bg-gray-100"}`}
                    >
                      <Camera
                        className={`h-5 w-5 ${expandedSection === "evidence" ? "text-[#800000]" : "text-gray-500"}`}
                      />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Evidence & Witnesses</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push("/incidents/submit/evidence")
                      }}
                      className="h-8 text-xs border-gray-200 text-gray-600 hover:text-[#800000] hover:border-[#800000]/20 rounded-full"
                    >
                      <Edit2 size={14} className="mr-1.5" /> Edit
                    </Button>
                    {expandedSection === "evidence" ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSection === "evidence" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6 space-y-6">
                        {/* Evidence Files */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Camera className="h-4 w-4 text-[#800000]" />
                            <h3 className="text-sm font-medium text-gray-700">
                              Evidence Files ({evidenceData.fileInfos.length})
                            </h3>
                          </div>

                          {evidenceData.fileInfos && evidenceData.fileInfos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {evidenceData.fileInfos.map((file: any, index: number) => (
                                <div
                                  key={index}
                                  className="group relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  {file.type.startsWith("image/") ? (
                                    <div className="relative aspect-square">
                                      <Image
                                        src={file.data || "/placeholder.svg"}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-white rounded-full p-2">
                                          <Camera className="h-5 w-5 text-[#800000]" />
                                        </div>
                                      </div>
                                    </div>
                                  ) : file.type.startsWith("video/") ? (
                                    <div className="relative aspect-video bg-black">
                                      <video src={file.data} controls className="w-full h-full" />
                                    </div>
                                  ) : (
                                    <div className="aspect-square flex items-center justify-center bg-gray-100">
                                      <FileText className="h-16 w-16 text-gray-400" />
                                    </div>
                                  )}

                                  <div className="p-2 border-t border-gray-100">
                                    <div className="flex items-start gap-2">
                                      {getFileIcon(file.type)}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-700 truncate" title={file.name}>
                                          {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                              <p className="text-sm text-gray-600">No evidence files provided</p>
                            </div>
                          )}
                        </div>

                        {/* Witnesses */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <User className="h-4 w-4 text-[#800000]" />
                            <h3 className="text-sm font-medium text-gray-700">
                              Witnesses ({evidenceData.witnesses.length})
                            </h3>
                          </div>

                          {evidenceData.witnesses && evidenceData.witnesses.length > 0 ? (
                            <div className="space-y-4">
                              <Accordion type="single" collapsible className="w-full">
                                {evidenceData.witnesses.map((witness: any, index: number) => (
                                  <AccordionItem
                                    key={index}
                                    value={`witness-${index}`}
                                    className="border border-gray-200 rounded-lg mb-3 overflow-hidden"
                                  >
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                                        <div className="flex items-center gap-3 text-left">
                                        <div className="bg-[#800000]/10 p-2 rounded-full">
                                          <User className="h-4 w-4 text-[#800000]" />
                                        </div>
                                        <div>
                                          <>
                                            <p className="font-medium text-gray-900">
                                              {witness.name || `Witness #${index + 1}`}
                                            </p>
                                            {witness.contactInformation && (
                                              <p className="text-xs text-gray-500">{witness.contactInformation}</p>
                                            )}
                                          </>
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-2">
                                      <div className="space-y-3">
                                          <>
                                            <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                <User className="h-3.5 w-3.5 text-[#800000]/70" />
                                                <p className="text-xs text-gray-500">Full Name</p>
                                              </div>
                                              <p className="font-medium text-gray-900 pl-5">
                                                {witness.name || "Not provided"}
                                              </p>
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                <Phone className="h-3.5 w-3.5 text-[#800000]/70" />
                                                <p className="text-xs text-gray-500">Contact Information</p>
                                              </div>
                                              <p className="text-sm text-gray-700 pl-5">
                                                {witness.contactInformation || "Not provided"}
                                              </p>
                                            </div>
                                          </>
                                        {witness.additionalNotes && (
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <MessageSquare className="h-3.5 w-3.5 text-[#800000]/70" />
                                              <p className="text-xs text-gray-500">Additional Notes</p>
                                            </div>
                                            <p className="text-sm text-gray-700 pl-5 whitespace-pre-line">
                                              {witness.additionalNotes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                              <p className="text-sm text-gray-600">No witnesses provided</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Submission Options */}
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b pb-5 mb-2">
                    <div className="bg-[#800000]/10 p-2 rounded-full">
                      <Shield className="h-5 w-5 text-[#800000]" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Submission Options</h2>
                  </div>

                  {/* Anonymous Option */}
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="pt-0.5">
                      <Switch
                        id="preferAnonymous"
                        checked={preferAnonymous}
                        onCheckedChange={setPreferAnonymous}
                        className="data-[state=checked]:bg-[#800000]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="preferAnonymous"
                        className="text-sm font-medium text-gray-800 flex items-center gap-2"
                      >
                        {preferAnonymous ? (
                          <EyeOff className="h-4 w-4 text-[#800000]" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span>Prefer to remain anonymous</span>
                      </label>
                      <p className="text-xs text-gray-500">
                        If enabled, your identity and incident will be hidden to the public. This is just a preference and may be
                        reviewed by the admin.
                      </p>
                    </div>
                  </div>

                  {/* Confirmations */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <Checkbox
                        id="accurateInfo"
                        checked={confirmations.accurateInfo}
                        onCheckedChange={(checked: boolean) =>
                          setConfirmations((prev) => ({
                            ...prev,
                            accurateInfo: checked,
                          }))
                        }
                        className="mt-1 data-[state=checked]:bg-[#800000] data-[state=checked]:border-[#800000]"
                      />
                      <div>
                        <label htmlFor="accurateInfo" className="text-sm font-medium text-gray-800">
                          Information Accuracy
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          I confirm that all information provided is accurate to the best of my knowledge.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <Checkbox
                        id="contactConsent"
                        checked={confirmations.contactConsent}
                        onCheckedChange={(checked: boolean) =>
                          setConfirmations((prev) => ({
                            ...prev,
                            contactConsent: checked,
                          }))
                        }
                        className="mt-1 data-[state=checked]:bg-[#800000] data-[state=checked]:border-[#800000]"
                      />
                      <div>
                        <label htmlFor="contactConsent" className="text-sm font-medium text-gray-800">
                          Contact Permission
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          I understand that campus security may contact me for additional information regarding this
                          incident.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Information Notice */}
                  <div className="bg-[#FFF8E1] border border-[#D4AF37]/30 rounded-xl p-4 flex items-start space-x-3">
                    <Info className="h-5 w-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-1">What happens next?</h3>
                      <p className="text-xs text-gray-700">
                        Your report will be reviewed by campus office personnel. You will receive a confirmation email
                        with a tracking number once your report is submitted. This tracking number can be used to check
                        the status of your report.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/incidents/submit/evidence")}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Evidence
                    </Button>

                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white rounded-full px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          Submit Report <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Report Summary Card */}
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
                    <FileText className="h-4 w-4 text-[#800000]" />
                    Report Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Incident Type</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{incidentData.incidentType}</span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Date</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {`${new Date(incidentData.dateOfIncident).toLocaleDateString('en-US', { weekday: 'long' })} ${new Date(incidentData.dateOfIncident).toLocaleDateString()}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <Camera className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Evidence Files</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{evidenceData.fileInfos.length}</span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <User className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Witnesses</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{evidenceData.witnesses.length}</span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <Eye className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Anonymity</span>
                      </div>
                      <span
                        className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                          preferAnonymous ? "bg-[#800000]/10 text-[#800000]" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {preferAnonymous ? "Anonymous" : "Public"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <span
                        className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                          confirmations.accurateInfo && confirmations.contactConsent
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {confirmations.accurateInfo && confirmations.contactConsent
                          ? "Ready to Submit"
                          : "Confirmation Required"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Help Card */}
              <Card className="bg-gradient-to-br from-[#800000] to-[#9a0000] text-white rounded-xl shadow-md overflow-hidden border-0">
                <div className="p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 pb-3 border-b border-white/20">
                    <Info size={18} /> Need Help?
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-white/90 mb-2">Submission Tips</h4>
                      <ul className="space-y-3">
                        {[
                          {
                            icon: <CheckCircle2 size={16} />,
                            text: "Review all information for accuracy before submitting",
                          },
                          {
                            icon: <Shield size={16} />,
                            text: "Your report will be handled confidentially",
                          },
                          {
                            icon: <FileText size={16} />,
                            text: "Save your tracking number for future reference",
                          },
                        ].map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                            <div className="mt-0.5 bg-white/10 p-1.5 rounded-full">{tip.icon}</div>
                            <span>{tip.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-white/20">
                      <h4 className="text-sm font-medium text-white/90 mb-2">Contact Support</h4>
                      <p className="text-sm text-white/80">
                        If you need assistance with your report, please contact campus security at{" "}
                        <span className="font-medium text-white">security@campus.edu</span> or call{" "}
                        <span className="font-medium text-white">(555) 123-4567</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Dialog */}
      <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#800000] to-[#D4AF37] opacity-30 blur-lg animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent"></div>
            </div>
            <div className="text-center">
              <DialogTitle className="text-xl font-bold text-[#800000] mb-2">Processing Your Report</DialogTitle>
              <DialogDescription className="text-gray-600">
                Our AI system is analyzing your report and assigning it to the most appropriate office for review. This
                may take a moment...
              </DialogDescription>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-[#800000] h-2.5 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Similar Incidents Dialog */}
      <Dialog open={showSimilarDialog} onOpenChange={setShowSimilarDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#800000]">We found similar cases</DialogTitle>
            <DialogDescription>
              Review similar cases. For resolved cases we show resolution notes; for in-progress cases we show the latest update.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {similarIncidents.slice(0, 1).map((s, idx) => (
              <div key={s.id || idx} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Similarity</div>
                  <div className="text-sm font-semibold text-[#800000]">{Math.round((s.similarityScore || 0) * 100)}%</div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Resolved By Office</div>
                    <div className="text-sm font-medium text-gray-800">{s.assignedOffice || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Reported At</div>
                    <div className="text-sm font-medium text-gray-800">{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Resolved At</div>
                    <div className="text-sm font-medium text-gray-800">{s.finishedDate ? new Date(s.finishedDate).toLocaleString() : "N/A"}</div>
                  </div>
                </div>
                {s.resolutionNotes ? (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Resolution Notes</div>
                    <div className="text-sm text-gray-800 whitespace-pre-line bg-white border rounded p-3">
                      {s.resolutionNotes}
                    </div>
                  </div>
                ) : s.latestUpdateMessage ? (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Latest Update</div>
                    <div className="text-sm text-gray-800 whitespace-pre-line bg-white border rounded p-3">
                      {s.latestUpdateMessage}
                    </div>
                    {s.latestUpdateAt && (
                      <div className="text-xs text-gray-500 mt-1">Last Updated: {new Date(s.latestUpdateAt).toLocaleString()}</div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Why this suggestion */}
          {analysisWhy && (
            <div className="mt-4 border rounded-lg p-4 bg-white">
              <div className="text-sm font-semibold text-gray-800 mb-2">Why this suggestion?</div>
              {analysisWhy.location && (
                <div className="mb-2 text-xs text-gray-600">
                  Location context: <span className="font-medium text-gray-800">{analysisWhy.location}</span>
                </div>
              )}
              {Array.isArray(analysisWhy.tags) && analysisWhy.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analysisWhy.tags.map((t, i) => (
                    <span key={`${t}-${i}`} className="px-2 py-1 text-xs rounded-full border border-gray-200 bg-gray-50 text-gray-800">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowSimilarDialog(false)
                toast.success("Report canceled", { description: "You chose to cancel based on similar resolutions." })
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel Report
            </Button>
            <Button
              onClick={async () => {
                setShowSimilarDialog(false)
                setIsSubmitting(true)
                setIsAssigningOffice(true)
                setShowLoadingDialog(true)
                try {
                  await doSubmit()
                } catch (e) {
                  console.error(e)
                  toast.error("Submission failed", { description: "Please try again." })
                } finally {
                  setIsSubmitting(false)
                  setIsAssigningOffice(false)
                  setShowLoadingDialog(false)
                }
              }}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              Proceed with Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#800000]">Confirm Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this incident report? Once submitted, you cannot edit the information.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#FFF8E1] border border-[#D4AF37]/30 rounded-lg p-4 my-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#D4AF37] mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  Your report will be reviewed by campus security personnel. You will receive a confirmation email with
                  a tracking number for future reference.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button onClick={processSubmission} className="bg-[#800000] hover:bg-[#600000] text-white">
              Confirm Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blocked Dialog */}
      <Dialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#800000]">Cannot Submit Report</DialogTitle>
            <DialogDescription>
              Your report contains content that violates our community guidelines. Please revise the report and try again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {blockedReasons && blockedReasons.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {blockedReasons.slice(0, 5).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-700">Offensive or disparaging content detected.</p>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowBlockedDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowBlockedDialog(false)
                router.push("/incidents/submit")
              }}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              Edit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-green-600 mb-2">Report Submitted Successfully</DialogTitle>
            <DialogDescription>
              Your incident has been reported and will be reviewed by security personnel.
            </DialogDescription>
          </div>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-[#800000]" />
                <p className="text-sm text-gray-500">Tracking Number</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-[#800000]">{trackingNumber}</p>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingNumber);
                    toast.success("Tracking number copied to clipboard");
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1 px-2 rounded"
                >
                  Copy
                </button>
              </div>
            </div>

            {assignedOffice && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="h-4 w-4 text-[#800000]" />
                  <p className="text-sm text-gray-500">Assigned Office</p>
                </div>
                <p className="text-lg font-semibold text-[#800000]">{assignedOffice}</p>
              </div>
            )}

            <div className="bg-[#FFF8E1] border border-[#D4AF37]/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                <p className="text-sm text-gray-700">
                  Please save this tracking number for your records. You can use it to check the status of your report
                  in the dashboard.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseDialog}
              className="bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white w-full sm:w-auto"
            >
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
