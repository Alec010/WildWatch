"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Navbar } from "@/components/Navbar"
import { useSidebar } from "@/contexts/SidebarContext"
import {
  CheckCircle,
  Clock,
  ChevronLeft,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  Star,
  Shield,
  User,
  Calendar,
  MapPin,
  Eye,
  Phone,
  Mail,
  Building,
  Activity,
  FileImage,
  Users,
  MessageSquare,
  XCircle,
  Bell,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { API_BASE_URL } from "@/utils/api"
import { formatLocationDisplay } from "@/utils/locationFormatter"
import { getReporterDisplayName, shouldShowReporterDetails } from "@/utils/anonymization"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RatingModal } from "@/components/RatingModal"
import { Toaster, toast } from "sonner"
import { motion } from "framer-motion"
import { Inter } from "next/font/google"
import { FollowUpDialog } from "@/components/ui/follow-up-dialog"

const inter = Inter({ subsets: ["latin"] })

// Add getContentMargin function
const getContentMargin = (userRole: string | null, collapsed: boolean) => {
  if (userRole === 'OFFICE_ADMIN') {
    return collapsed ? 'ml-20' : 'ml-72'
  }
  return collapsed ? 'ml-18' : 'ml-64'
}

function formatDate(dateString: string) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface IncidentDetails {
  id: string
  trackingNumber: string
  status: string
  priorityLevel: "HIGH" | "MEDIUM" | "LOW" | string
  dateOfIncident: string
  submittedAt?: string
  incidentType?: string
  location?: string
  timeOfIncident?: string
  description?: string
  submittedByFullName?: string
  submittedByEmail?: string
  submittedByPhone?: string
  assignedOffice?: string
  isAnonymous?: boolean
  isPrivate?: boolean
  preferAnonymous?: boolean
}

interface IncidentUpdate {
  id?: number
  title?: string
  status?: string
  message?: string
  description?: string
  updatedAt: string
  updatedByName?: string
  updatedByFullName?: string
  author?: string
}

interface OfficeAdminUser {
  firstName: string
  lastName: string
  email: string
  contactNumber: string
}

interface Evidence {
  id: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
}

function getEstimatedResolution(submittedAt: string, priority: string, extendedDate?: string) {
  // If there's an extended date from the backend, use that
  if (extendedDate) {
    return new Date(extendedDate)
  }
  
  // Otherwise, calculate based on priority
  const base = new Date(submittedAt)
  let days = 2
  if (priority === "MEDIUM") days = 3
  if (priority === "HIGH") days = 5
  base.setDate(base.getDate() + days)
  return base
}

// Sidebar skeleton to prevent flicker
function SidebarSkeleton() {
  return <div className="w-64 min-h-screen bg-gradient-to-b from-[#8B0000] to-[#6B0000] animate-pulse" />
}

export default function CaseDetailsPage() {
  const { id } = useParams() // id is trackingNumber
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [userRole, setUserRole] = useState<string | null>(() =>
    typeof window !== 'undefined' ? (sessionStorage.getItem('userRole') || null) : null
  )
  const [incident, setIncident] = useState<IncidentDetails | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [officeAdmin, setOfficeAdmin] = useState<OfficeAdminUser | null>(null)
  const [evidenceModal, setEvidenceModal] = useState<{ open: boolean; fileUrl: string; fileName: string } | null>(null)
  const [updates, setUpdates] = useState<IncidentUpdate[]>([])
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ fileUrl: string; fileName: string } | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [incidentRating, setIncidentRating] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showRatingSuccessModal, setShowRatingSuccessModal] = useState(false)
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false)
  const [followUpCooldown, setFollowUpCooldown] = useState<Date | null>(null)
  const [keepSidebar, setKeepSidebar] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ww_keep_sidebar') === '1'
    } catch {
      return false
    }
  })

  const statusSteps = [
    { key: "Submitted", label: "Submitted" },
    { key: "Reviewed", label: "Reviewed" },
    { key: "In Progress", label: "In Progress" },
    { key: "Resolved", label: "Resolved" },
    { key: "Dismissed", label: "Dismissed" },
  ]
  const statusOrder = ["Submitted", "Reviewed", "In Progress", "Resolved", "Dismissed"]
  const normalizedStatus = incident?.status?.toLowerCase() || ""
  const isDismissed = normalizedStatus === "dismissed"
  const currentStep = isDismissed
    ? statusOrder.indexOf("Dismissed")
    : normalizedStatus === "pending"
      ? 0
      : statusOrder.findIndex((s) => normalizedStatus.includes(s.toLowerCase()))

  const isOfficeAdmin = userRole === "OFFICE_ADMIN"
  const isSubmitter = incident && userEmail && incident.submittedByEmail === userEmail
  
  // Function to handle sending a follow-up request
  const handleSendFollowUp = async () => {
    if (!incident) return;
    
    setIsFollowUpLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
        
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/incidents/${incident.id}/follow-up`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send follow-up");
      }
      
      // Set cooldown time if provided
      if (data.nextAvailableTime) {
        setFollowUpCooldown(new Date(data.nextAvailableTime));
      }
      
      // Show success message
      toast.success("Follow-up sent successfully", {
        description: "The office admin has been notified about your request.",
      });
      
      setShowFollowUpDialog(false);
    } catch (error) {
      console.error("Error sending follow-up:", error);
      toast.error("Failed to send follow-up", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Fetch user profile (role and email) on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      if (!token) return
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserRole(profileData.role)
          sessionStorage.setItem("userRole", profileData.role)
          setUserEmail(profileData.email)
        }
      } catch (e) {
        // ignore
      }
    }
    fetchUserProfile()
  }, [])

  // Fetch incident details (as before)
  useEffect(() => {
    const fetchIncidentDetails = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]
        if (!token) {
          router.push("/login")
          return
        }
        // Fetch incident details
        const response = await fetch(`${API_BASE_URL}/api/incidents/track/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setIncident(data)
        // Fetch updates for last updated
        if (data.id) {
          const updatesRes = await fetch(`${API_BASE_URL}/api/incidents/${data.id}/updates`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
          if (updatesRes.ok) {
            const updatesData = await updatesRes.json()
            setUpdates(updatesData)
            if (updatesData.length > 0) {
              setLastUpdated(updatesData[0].updatedAt)
            }
          }
          // Fetch incident rating
          const ratingRes = await fetch(`${API_BASE_URL}/api/ratings/incidents/${data.trackingNumber}`, {
            credentials: "include",
          })
          if (ratingRes.ok) {
            const ratingData = await ratingRes.json()
            console.log('Rating data received:', ratingData)
            setIncidentRating(ratingData)
          } else {
            console.log('No rating data found for incident')
            setIncidentRating(null)
          }
        }
        // Fetch office admin info
        if (data.assignedOffice) {
          const officeAdminRes = await fetch(`${API_BASE_URL}/api/setup/by-office/${data.assignedOffice}`)
          if (officeAdminRes.ok) {
            const admin: OfficeAdminUser = await officeAdminRes.json()
            setOfficeAdmin(admin)
          }
        }
      } catch (error: any) {
        setError(error.message || "Failed to load case details.")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchIncidentDetails()
  }, [id, router])

  useEffect(() => {
    if (keepSidebar) {
      try { sessionStorage.removeItem('ww_keep_sidebar') } catch {}
      setKeepSidebar(false)
    }
  }, [keepSidebar])

  const estimatedResolution = incident
    ? getEstimatedResolution(incident.submittedAt || incident.dateOfIncident, incident.priorityLevel, incident.estimatedResolutionDate)
    : null

  // Check privacy access after both incident and user data are loaded
  useEffect(() => {
    if (incident && userEmail && userRole) {
      // Check if incident is private and user is not authorized to view it
      if (incident.isPrivate && userRole !== "OFFICE_ADMIN" && incident.submittedByEmail !== userEmail) {
        setError("This incident is private and you are not authorized to view it.")
        setLoading(false)
        return
      }
    }
  }, [incident, userEmail, userRole])

  // Show rating modal for regular user if eligible (run after both user info and incident are loaded)
  useEffect(() => {
    const checkRatingEligibility = async () => {
      console.log("DEBUG: incident", incident)
      console.log("DEBUG: userRole", userRole)
      console.log("DEBUG: userEmail", userEmail)
      if (!incident || !userRole || !userEmail) return
      console.log("DEBUG: incident.status", incident.status)
      
      // Don't show rating modal for dismissed cases
      if (incident.status?.toLowerCase() === "dismissed") {
        console.log("DEBUG: incident is dismissed, no rating available")
        return
      }
      
      if (incident.status?.toLowerCase() === "resolved") {
        try {
          console.log("DEBUG: status is resolved, about to fetch rating")
          const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1]
          if (!token) return
          const response = await fetch(`${API_BASE_URL}/api/ratings/incidents/${incident.trackingNumber}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          console.log("DEBUG: rating API response.status", response.status, "ok:", response.ok)
          if (response.ok) {
            const data = await response.json()
            console.log("DEBUG: rating API data", data)
            // Show for office admin if not yet rated
            if (userRole === "OFFICE_ADMIN" && !data.officeRating) {
              setShowRatingModal(true)
            }
            // Show for reporter (regular user) if not yet rated and is the reporter
            else if (
              (userRole === "USER" || userRole === "REGULAR_USER" || userRole?.toUpperCase() === "REGULAR_USER") &&
              incident.submittedByEmail === userEmail &&
              !data.reporterRating
            ) {
              setShowRatingModal(true)
            }
          }
        } catch (error) {
          console.error("Error fetching rating status:", error)
        }
      } else {
        console.log("DEBUG: incident.status is not resolved:", incident.status)
      }
    }
    checkRatingEligibility()
  }, [incident, userRole, userEmail])

  const handleApprove = async () => {
    try {
      if (!incident) throw new Error("No incident data found")

      setIsApproving(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      if (!token) throw new Error("No authentication token found")

      const response = await fetch(`${API_BASE_URL}/api/incidents/${incident.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Pending" }),
      })

      if (!response.ok) throw new Error("Failed to verify case")

      setShowApproveModal(false)
      setShowSuccessModal(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/office-admin/incidents")
      }, 2000)
    } catch (err) {
      alert("Failed to verify case.")
    } finally {
      setIsApproving(false)
    }
  }

  const handleRatingSuccess = async () => {
    try {
      if (!incident) return
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      const idOrTracking = incident.trackingNumber || incident.id
      const ratingRes = await fetch(`${API_BASE_URL}/api/ratings/incidents/${idOrTracking}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json()
        setIncidentRating(ratingData)
        setShowRatingSuccessModal(true)
      } else {
        throw new Error("Failed to fetch updated rating")
      }
    } catch (error) {
      console.error("Error updating rating:", error)
      toast.error("Failed to update rating")
    }
  }

  // Always render the layout; default to Sidebar until role is known to avoid flicker
  if (loading && !keepSidebar) {
    return (
      <div className={`min-h-screen flex flex-col bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}>
        <Sidebar />
        <Navbar title="Case Details" subtitle="Loading case information..." />
        <div className="flex flex-1">
          <div className={`flex-1 flex items-center justify-center transition-all duration-300 ease-in-out ${collapsed ? "ml-[5rem]" : "ml-64"}`}>
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
              </div>
              <p className="mt-6 text-gray-600 font-medium">Loading case details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}>
        {userRole === "OFFICE_ADMIN" ? <OfficeAdminSidebar /> : <Sidebar />}
        <Navbar title="Case Details" subtitle="Error loading case information" />
        <div className="flex flex-1">
          <div className={`flex-1 p-8 transition-all duration-300 ease-in-out ${getContentMargin(userRole, collapsed)}`}>
            <div className="pt-24 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Case</h2>
                <p className="text-red-600 font-medium mb-6">{error}</p>
                <Button onClick={() => router.push("/incidents/tracking")} className="bg-[#8B0000] hover:bg-[#6B0000] text-white">Return to Case List</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}>
      {userRole === "OFFICE_ADMIN" ? <OfficeAdminSidebar /> : <Sidebar />}
      <Navbar title="Case Details" subtitle={incident ? `Tracking case ${incident.trackingNumber}` : "Loading case information..."} />
      <div className="flex flex-1">
        <div className={`flex-1 transition-all duration-300 ease-in-out ${getContentMargin(userRole, collapsed)}`}>
          {(loading || !incident) ? (
            <div className="flex items-center justify-center h-screen">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
              </div>
            </div>
          ) : (
            <div className="pt-24 px-6 pb-10">
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                {/* Back to Cases */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Link href="/incidents/tracking" className="hover:text-[#8B0000] transition-colors flex items-center">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Cases
                  </Link>
                </div>

                {/* Points Awarded Notification */}
                {(() => {
                  // Don't show points status for dismissed cases
                  if (isDismissed) {
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-2 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800">
                              Points Status:
                            </span>
                            <span className="font-bold text-gray-900 ml-2">
                              Not Available
                            </span>
                            <span className="ml-2 text-xs text-gray-700">
                              (dismissed cases do not receive points)
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                  
                  // For non-dismissed cases, show the regular points status
                  const shouldShow = incidentRating &&
                    ((userRole === "OFFICE_ADMIN" && incident?.assignedOffice) ||
                      (userRole === "USER" && incident?.submittedByEmail === userEmail) ||
                      (userRole === "REGULAR_USER" && incident?.submittedByEmail === userEmail))
                  
                  if (!shouldShow) return null;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2 rounded-lg">
                          <Star className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-yellow-800">
                            {incidentRating?.pointsAwarded ? "Points Awarded:" : "Points Status:"}
                          </span>
                          <span className="font-bold text-yellow-900 ml-2">
                            {incidentRating?.pointsAwarded
                              ? userRole === "OFFICE_ADMIN"
                                ? incidentRating?.totalReporterPoints || 0
                                : incidentRating?.totalOfficePoints || 0
                              : "Pending"}{" "}
                            {incidentRating?.pointsAwarded ? "pts" : ""}
                          </span>
                          <span className="ml-2 text-xs text-yellow-700">
                            {incidentRating?.pointsAwarded 
                              ? "(for this report)" 
                              : "(waiting for both parties to rate)"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Case Header Card */}
                <div className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md border border-[#f0e0e0] p-6 relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-3 rounded-lg shadow-md">
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-[#8B0000]">Case {incident.trackingNumber}</h1>
                          <p className="text-gray-600">Security Incident Report</p>
                          {(incident.isAnonymous || incident.preferAnonymous) && !isOfficeAdmin && !isSubmitter && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                Anonymous Report
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {/* Priority chip shown only to office admins - hidden for regular users */}
                        {isOfficeAdmin && (
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${
                              incident.priorityLevel === "HIGH"
                                ? "bg-red-100 text-red-800"
                                : incident.priorityLevel === "MEDIUM"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {incident.priorityLevel} Priority
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            incident.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : incident.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : (incident.status === "Resolved")
                                  ? "bg-green-100 text-green-800"
                                  : isDismissed
                                    ? "bg-gray-200 text-gray-700 border border-gray-400 font-bold"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {isDismissed || incident.status === "Closed" ? "Dismissed" : incident.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Submitted</div>
                        <div className="font-semibold text-gray-800">
                          {incident.submittedAt ? formatDate(incident.submittedAt) : "-"}
                        </div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                        <div className="font-semibold text-gray-800">{lastUpdated ? formatDate(lastUpdated) : "-"}</div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Est. Resolution</div>
                        <div className="font-semibold text-gray-800">
                          {estimatedResolution ? formatDate(estimatedResolution.toISOString()) : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Tracker */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 mt-6 border border-[#f0e0e0] relative overflow-hidden"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-[#8B0000]" />
                    Case Progress
                  </h3>
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, idx) => {
                      // For dismissed, only Submitted is completed, Dismissed is current, others are pending
                      let isCompleted = false
                      let isCurrent = false
                      let isPending = false
                      const isDismissedStep = step.key === "Dismissed" && isDismissed
                      if (isDismissed) {
                        isCompleted = step.key === "Submitted"
                        isCurrent = isDismissedStep
                        isPending = !isCompleted && !isCurrent
                      } else {
                        isCompleted = idx < currentStep
                        isCurrent = idx === currentStep
                        isPending = idx > currentStep
                      }
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 z-10 transition-all duration-300 ${
                              isDismissedStep
                                ? "border-gray-500 bg-gray-200 text-gray-700"
                                : isCompleted || (isCurrent && step.key === "Resolved")
                                  ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-600 shadow-md"
                                  : isCurrent
                                    ? "border-[#8B0000] bg-gradient-to-br from-red-50 to-red-100 text-[#8B0000] shadow-md"
                                    : "border-gray-200 bg-gray-50 text-gray-400"
                            }`}
                          >
                            {isDismissedStep ? (
                              <AlertCircle className="w-6 h-6" />
                            ) : isCompleted || (isCurrent && step.key === "Resolved") ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : isCurrent ? (
                              <Clock className="w-6 h-6" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gray-200" />
                            )}
                          </div>
                          <span
                            className={`mt-3 text-sm font-medium text-center ${
                              isDismissedStep
                                ? "text-gray-700"
                                : isCompleted
                                  ? "text-green-600"
                                  : isCurrent
                                    ? "text-[#8B0000]"
                                    : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </span>

                          {/* Connector line */}
                          {idx < statusSteps.length - 1 && (
                            <div
                              className={`absolute top-6 left-1/2 h-[3px] transition-all duration-300 ${
                                isCompleted
                                  ? "bg-gradient-to-r from-green-500 to-green-400"
                                  : isDismissedStep
                                    ? "bg-gray-400"
                                    : "bg-gray-200"
                              }`}
                              style={{ width: "100%", zIndex: 0 }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Action Buttons for Office Admin */}
                {isOfficeAdmin &&
                  normalizedStatus !== "pending" &&
                  normalizedStatus !== "resolved" &&
                  normalizedStatus !== "dismissed" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="flex gap-4 mt-6"
                    >
                      <Button
                        variant="default"
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
                        onClick={() => setShowApproveModal(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Case
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white shadow-md"
                        onClick={() => setShowTransferModal(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transfer Case
                      </Button>
                    </motion.div>
                  )}
              </motion.div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column - Main Content */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Incident Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 border border-[#f0e0e0] relative overflow-hidden"
                  >
                    <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-[#8B0000]" />
                      Incident Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                            <AlertCircle className="mr-1 h-4 w-4" />
                            Incident Type
                          </div>
                          <p className="text-gray-800 font-medium">{incident.incidentType || "-"}</p>
                        </div>
                        <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            Location
                          </div>
                          <p className="text-gray-800 font-medium">{formatLocationDisplay(incident) || "-"}</p>
                        </div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
                        <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          Date & Time of Incident
                        </div>
                        <p className="text-gray-800 font-medium">
                          {formatDate(incident.dateOfIncident)}
                          {incident.timeOfIncident ? `, ${incident.timeOfIncident}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 bg-white/50 rounded-lg p-4 border border-gray-100">
                      <div className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Description
                      </div>
                      <div className="text-gray-800 whitespace-pre-line leading-relaxed">
                        {incident.description || "-"}
                      </div>
                    </div>
                  </motion.div>

                  {/* Evidence Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 border border-[#f0e0e0] relative overflow-hidden"
                  >
                    <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
                      <FileImage className="mr-2 h-5 w-5 text-[#8B0000]" />
                      Submitted Evidence
                    </h2>
                    {Array.isArray((incident as any).evidence) && (incident as any).evidence.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(incident as any).evidence.map((file: Evidence, index: number) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer group"
                            onClick={() => {
                              if (file.fileType.startsWith("image/")) {
                                setSelectedImage({ fileUrl: file.fileUrl, fileName: file.fileName })
                              }
                            }}
                          >
                            <div className="aspect-square relative">
                              {file.fileType.startsWith("image/") ? (
                                <Image
                                  src={file.fileUrl || "/placeholder.svg"}
                                  alt={file.fileName}
                                  fill
                                  className="object-contain max-h-[85vh] max-w-full rounded-xl"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="text-sm font-medium truncate">{file.fileName}</div>
                              <div className="text-xs text-gray-500 mt-1">Uploaded {formatDate(file.uploadedAt)}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileImage className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No evidence submitted for this case.</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Witnesses Section */}
                  {Array.isArray((incident as any).witnesses) && (incident as any).witnesses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 border border-[#f0e0e0] relative overflow-hidden"
                    >
                      <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
                        <Users className="mr-2 h-5 w-5 text-[#8B0000]" />
                        Witnesses
                      </h2>
                      <div className="space-y-4">
                        {(incident as any).witnesses.map((witness: any, index: number) => (
                          <motion.div
                            key={witness.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-white/50 rounded-lg p-4 border border-gray-100"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000] to-[#6B0000] flex items-center justify-center text-white font-bold text-sm">
                                {witness.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 mb-2">{witness.name}</div>
                                <div className="text-gray-700 bg-white rounded-lg p-3 border-l-4 border-[#8B0000]">
                                  {witness.additionalNotes || (
                                    <span className="italic text-gray-400">No additional notes provided.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Case Updates */}
                  {updates.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 border border-[#f0e0e0] relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                          <Activity className="mr-2 h-5 w-5 text-[#8B0000]" />
                          Case Updates
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {updates.length} update{updates.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-6">
                        {updates.map((update, idx) => {
                          let iconColor = "text-blue-500"
                          let iconBg = "bg-gradient-to-br from-blue-500 to-blue-600"
                          let Icon = Clock

                          const message = update.message?.toLowerCase() || ""
                          const status = update.status?.toLowerCase() || ""

                          // Check for verification updates
                          if (message.includes("verified") || message.includes("verification")) {
                            iconColor = "text-green-500"
                            iconBg = "bg-gradient-to-br from-green-500 to-green-600"
                            Icon = CheckCircle
                          }
                          // Check for transfer updates
                          else if (message.includes("transferred") || message.includes("transfer")) {
                            iconColor = "text-purple-500"
                            iconBg = "bg-gradient-to-br from-purple-500 to-purple-600"
                            Icon = ArrowRightLeft
                          }
                          // Check for dismissed status
                          else if (status.includes("dismissed") || message.includes("dismissed") || message.includes("dismiss")) {
                            iconColor = "text-gray-500"
                            iconBg = "bg-gradient-to-br from-gray-500 to-gray-600"
                            Icon = XCircle
                          }
                          // Check for resolved status
                          else if (status.includes("resolved") || status.includes("closed")) {
                            iconColor = "text-green-500"
                            iconBg = "bg-gradient-to-br from-green-500 to-green-600"
                            Icon = CheckCircle
                          }
                          // Check for priority changes
                          else if (message.includes("priority") || message.includes("changed")) {
                            iconColor = "text-blue-500"
                            iconBg = "bg-gradient-to-br from-blue-500 to-blue-600"
                            Icon = AlertCircle
                          }

                          return (
                            <motion.div
                              key={update.id || idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className="flex gap-4 items-start bg-white/50 rounded-lg p-4 border border-gray-100"
                            >
                              <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center text-white shadow-md`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                  <span className="font-semibold text-gray-800">
                                    {message.includes("verified")
                                      ? "Verification"
                                      : message.includes("transferred")
                                        ? "Case Transfer"
                                        : update.title || update.status || "Update"}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {update.updatedAt ? formatDate(update.updatedAt) : ""} •{" "}
                                    {update.updatedAt
                                      ? new Date(update.updatedAt).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </span>
                                </div>
                                <div className="text-gray-700 mb-2">{update.message || update.description || "-"}</div>
                                <div className="text-xs text-gray-500">
                                  By {update.updatedByName || update.updatedByFullName || update.author || "System"}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Column - Information Panels */}
                <div className="space-y-6">
                  {/* Case Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                    className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 border border-[#f0e0e0] relative overflow-hidden"
                  >
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <Building className="mr-2 h-5 w-5 text-[#8B0000]" />
                      Case Information
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <User className="mr-1 h-4 w-4" />
                          Assigned To
                        </div>
                        <p className="text-gray-800 font-medium">
                          {officeAdmin ? `${officeAdmin.firstName} ${officeAdmin.lastName}` : "-"}
                        </p>
                      </div>

                      <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <Mail className="mr-1 h-4 w-4" />
                          Office Email
                        </div>
                        <p className="text-gray-800 font-medium">{officeAdmin ? officeAdmin.email : "-"}</p>
                      </div>

                      <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <Phone className="mr-1 h-4 w-4" />
                          Contact Number
                        </div>
                        <p className="text-gray-800 font-medium">{officeAdmin ? officeAdmin.contactNumber : "-"}</p>
                      </div>

                      {/* Office Rating */}
                      {isDismissed ? (
                        <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">Office Rating</div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">Dismissed cases do not receive ratings</p>
                          </div>
                        </div>
                      ) : incidentRating?.officeRating ? (
                        <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">Office Rating</div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= incidentRating.officeRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {incidentRating.officeFeedback && (
                            <p className="text-xs text-gray-600 mt-2 italic">"{incidentRating.officeFeedback}"</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>

                  {/* Reporter Information */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                    className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 border border-[#f0e0e0] relative overflow-hidden"
                  >
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <User className="mr-2 h-5 w-5 text-[#8B0000]" />
                      Reporter Information
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                        <div className="text-sm font-medium text-gray-500 mb-1">Name</div>
                        <p className="text-gray-800 font-medium">
                          {getReporterDisplayName(incident, isOfficeAdmin, isSubmitter)}
                        </p>
                      </div>
                      {shouldShowReporterDetails(incident, isOfficeAdmin, isSubmitter) ? (
                        <>
                          <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                            <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                            <p className="text-gray-800 font-medium">
                              {incident.submittedByEmail ? (
                                incident.submittedByEmail
                              ) : (
                                <span className="italic text-gray-400">Not provided</span>
                              )}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                            <div className="text-sm font-medium text-gray-500 mb-1">Phone</div>
                            <p className="text-gray-800 font-medium">
                              {incident.submittedByPhone ? (
                                incident.submittedByPhone
                              ) : (
                                <span className="italic text-gray-400">Not provided</span>
                              )}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-1">Contact Information</div>
                          <p className="text-gray-800 font-medium italic text-gray-400">
                            Contact details are not available for anonymous reports
                          </p>
                        </div>
                      )}

                      {/* Student Rating */}
                      {isDismissed ? (
                        <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">Student Rating</div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">No points are awarded for dismissed cases</p>
                          </div>
                        </div>
                      ) : incidentRating?.reporterRating ? (
                        <div className="bg-white/50 rounded-lg p-3 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">Student Rating</div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= incidentRating.reporterRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {incidentRating.reporterFeedback && (
                            <p className="text-xs text-gray-600 mt-2 italic">"{incidentRating.reporterFeedback}"</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>

                  {/* Next Steps */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                    className="bg-gradient-to-br from-white to-[#fff9f9] rounded-xl shadow-md p-6 border border-[#f0e0e0] relative overflow-hidden"
                  >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-[#8B0000]" />
                      Next Steps
                    </h2>
                    {/* Follow-up Button - Only show to the submitter and not for dismissed cases */}
                    {isSubmitter && !isDismissed && (
                      <div className="mb-6">
                        <Button 
                          onClick={() => setShowFollowUpDialog(true)}
                          disabled={!!followUpCooldown && new Date() < followUpCooldown}
                          className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white flex items-center justify-center gap-2 py-3"
                        >
                          <Bell className="h-4 w-4" />
                          {followUpCooldown && new Date() < followUpCooldown ? (
                            <>
                              Follow-up Available {followUpCooldown.toLocaleDateString()} at {followUpCooldown.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </>
                          ) : (
                            "Send Follow-up Request"
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Send a notification to the office handling your case
                        </p>
                      </div>
                    )}
                    
                    {isDismissed ? (
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                        <AlertCircle className="w-6 h-6 text-gray-500" />
                        <span className="text-gray-700 font-medium">
                          This case has been dismissed. No further action will be taken.
                        </span>
                      </div>
                    ) : (
                      (() => {
                        const steps = [
                          { label: "Initial Review", desc: "Case reviewed by security team" },
                          { label: "Incident Updates", desc: "Gathering security footage and witness statements" },
                          { label: "In Progress", desc: "Implementing security measures based on findings" },
                          { label: "Case Resolution", desc: "Final report and case closure" },
                        ]
                        // Map status to step index
                        const statusMap: Record<string, number> = {
                          pending: 0,
                          "initial review": 0,
                          "incident updates": 1,
                          "in progress": 2,
                          resolved: 3,
                          "case resolution": 3,
                        }
                        const currentStepIdx = statusMap[normalizedStatus] ?? 0
                        return (
                          <ul className="space-y-4">
                            {steps.map((step, idx) => (
                              <li key={step.label} className="flex items-start gap-3">
                                <div
                                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                    idx <= currentStepIdx
                                      ? "bg-gradient-to-br from-green-500 to-green-600"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {idx <= currentStepIdx ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800">{step.label}</span>
                                  <div className="text-sm text-gray-500">{step.desc}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )
                      })()
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for full-size image preview */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent shadow-none border-none flex flex-col items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                aria-label="Close preview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <Image
                src={selectedImage.fileUrl || "/placeholder.svg"}
                alt={selectedImage.fileName}
                width={800}
                height={600}
                className="object-contain max-h-[85vh] max-w-full rounded-xl"
              />
              <div className="mt-4 text-center text-white bg-black/50 px-4 py-2 rounded-lg">
                {selectedImage.fileName}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirm Case Verification
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to verify this case? This will move it back to the pending list for further review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={isApproving}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Verification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Case Verified Successfully
            </DialogTitle>
            <DialogDescription>
              The case has been verified and moved to the pending list. You will be redirected to the incidents page.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Rating Success Modal */}
      <Dialog open={showRatingSuccessModal} onOpenChange={setShowRatingSuccessModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Rating Submitted Successfully
            </DialogTitle>
            <DialogDescription>Thank you for your feedback! Your rating has been recorded.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Rating Modal for regular user or office admin */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        incidentId={incident?.trackingNumber || ""}
        type={userRole === "OFFICE_ADMIN" ? "office" : "reporter"}
        onSuccess={handleRatingSuccess}
      />

      {/* Follow-up Dialog */}
      <FollowUpDialog
        isOpen={showFollowUpDialog}
        onClose={() => setShowFollowUpDialog(false)}
        onConfirm={handleSendFollowUp}
        isLoading={isFollowUpLoading}
        trackingNumber={incident?.trackingNumber || ""}
      />

      {/* Add Toaster for notifications */}
      <Toaster position="top-right" />

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
