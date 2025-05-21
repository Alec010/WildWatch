"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { CheckCircle, Clock, ChevronLeft, FileText, AlertCircle, Loader2, ArrowRightLeft, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { API_BASE_URL } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { RatingModal } from '@/components/RatingModal'
import { toast } from "sonner"
import { Toaster } from "sonner"

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

function getEstimatedResolution(submittedAt: string, priority: string) {
  const base = new Date(submittedAt)
  let days = 2
  if (priority === "MEDIUM") days = 3
  if (priority === "HIGH") days = 5
  base.setDate(base.getDate() + days)
  return base
}

// Sidebar skeleton to prevent flicker
function SidebarSkeleton() {
  return (
    <div className="w-64 min-h-screen bg-[#800000] animate-pulse" />
  );
}

export default function CaseDetailsPage() {
  const { id } = useParams() // id is trackingNumber
  const router = useRouter()
  // Initialize userRole from sessionStorage for instant sidebar rendering
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('userRole');
    }
    return null;
  });
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

  const isOfficeAdmin = userRole === 'OFFICE_ADMIN'

  // Fetch user profile (role and email) on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];
      if (!token) return;
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserRole(profileData.role);
          sessionStorage.setItem('userRole', profileData.role);
          setUserEmail(profileData.email);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch incident details (as before)
  useEffect(() => {
    const fetchIncidentDetails = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];
        if (!token) {
          router.push('/login');
          return;
        }
        // Fetch incident details
        const response = await fetch(`${API_BASE_URL}/api/incidents/track/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setIncident(data);
        // Fetch updates for last updated
        if (data.id) {
          const updatesRes = await fetch(`${API_BASE_URL}/api/incidents/${data.id}/updates`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (updatesRes.ok) {
            const updatesData = await updatesRes.json();
            setUpdates(updatesData);
            if (updatesData.length > 0) {
              setLastUpdated(updatesData[0].updatedAt);
            }
          }
          // Fetch incident rating
          const ratingRes = await fetch(`${API_BASE_URL}/api/ratings/incidents/${data.trackingNumber}`, {
            credentials: 'include',
          });
          if (ratingRes.ok) {
            const ratingData = await ratingRes.json();
            setIncidentRating(ratingData);
          } else {
            setIncidentRating(null);
          }
        }
        // Fetch office admin info
        if (data.assignedOffice) {
          const officeAdminRes = await fetch(`${API_BASE_URL}/api/setup/by-office/${data.assignedOffice}`);
          if (officeAdminRes.ok) {
            const admin: OfficeAdminUser = await officeAdminRes.json();
            setOfficeAdmin(admin);
          }
        }
      } catch (error: any) {
        setError(error.message || 'Failed to load case details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchIncidentDetails();
  }, [id, router]);

  // Show rating modal for regular user if eligible (run after both user info and incident are loaded)
  useEffect(() => {
    const checkRatingEligibility = async () => {
      console.log('DEBUG: incident', incident);
      console.log('DEBUG: userRole', userRole);
      console.log('DEBUG: userEmail', userEmail);
      if (!incident || !userRole || !userEmail) return;
      console.log('DEBUG: incident.status', incident.status);
      if (incident.status?.toLowerCase() === 'resolved') {
        try {
          console.log('DEBUG: status is resolved, about to fetch rating');
          const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('token='))
            ?.split('=')[1];
          if (!token) return;
          const response = await fetch(
            `${API_BASE_URL}/api/ratings/incidents/${incident.trackingNumber}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('DEBUG: rating API response.status', response.status, 'ok:', response.ok);
          if (response.ok) {
            const data = await response.json();
            console.log('DEBUG: rating API data', data);
            // Show for office admin if not yet rated
            if (userRole === 'OFFICE_ADMIN' && !data.officeRating) {
              setShowRatingModal(true);
            }
            // Show for reporter (regular user) if not yet rated and is the reporter
            else if (
              (userRole === 'USER' || userRole === 'REGULAR_USER' || userRole?.toUpperCase() === 'REGULAR_USER') &&
              incident.submittedByEmail === userEmail &&
              !data.reporterRating
            ) {
              setShowRatingModal(true);
            }
          }
        } catch (error) {
          console.error("Error fetching rating status:", error);
        }
      } else {
        console.log('DEBUG: incident.status is not resolved:', incident.status);
      }
    };
    checkRatingEligibility();
  }, [incident, userRole, userEmail]);

  const handleApprove = async () => {
    try {
      if (!incident) throw new Error('No incident data found');
      
      setIsApproving(true)
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/api/incidents/${incident.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Pending' }),
      });
      
      if (!response.ok) throw new Error('Failed to approve case');
      
      setShowApproveModal(false)
      setShowSuccessModal(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/office-admin/incidents');
      }, 2000);
    } catch (err) {
      alert('Failed to approve case.');
    } finally {
      setIsApproving(false)
    }
  }

  const handleRatingSuccess = async () => {
    try {
      if (incident?.id) {
        const ratingRes = await fetch(`${API_BASE_URL}/api/ratings/incidents/${incident.id}`, {
          credentials: 'include',
        })
        if (ratingRes.ok) {
          const ratingData = await ratingRes.json()
          setIncidentRating(ratingData)
          setShowRatingSuccessModal(true)
        } else {
          throw new Error('Failed to fetch updated rating')
        }
      }
    } catch (error) {
      console.error('Error updating rating:', error)
      toast.error('Failed to update rating')
    }
  }

  if (userRole === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#8B0000] animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex">
        {userRole === 'OFFICE_ADMIN' ? <OfficeAdminSidebar /> : <Sidebar />}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-[#8B0000] animate-spin" />
            <p className="text-gray-600 font-medium">Loading case details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen flex">
        {userRole === 'OFFICE_ADMIN' ? <OfficeAdminSidebar /> : <Sidebar />}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 flex flex-col items-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Case</h2>
            <p className="text-red-600 font-medium mb-6">{error || "Case not found"}</p>
            <button
              onClick={() => router.push("/incidents/tracking")}
              className="px-4 py-2 bg-[#8B0000] text-white rounded-md hover:bg-[#700000] transition-colors"
            >
              Return to Case List
            </button>
          </div>
        </div>
      </div>
    )
  }

  const estimatedResolution = getEstimatedResolution(
    incident.submittedAt || incident.dateOfIncident,
    incident.priorityLevel,
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen flex">
      {userRole === null
        ? <SidebarSkeleton />
        : userRole === 'OFFICE_ADMIN'
          ? <OfficeAdminSidebar />
          : <Sidebar />
      }
      <div className="flex-1 bg-[#f5f5f5] ml-64">
        {(userRole === null || loading) ? (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-10 w-10 text-[#8B0000] animate-spin" />
          </div>
        ) : (
          <div className="p-6 max-w-[1200px] mx-auto">
            {/* Header Section */}
            <div className="mb-6">
              {/* Back to Cases */}
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Link href="/incidents/tracking" className="hover:text-[#8B0000] transition-colors">
                  <span className="flex items-center">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Cases
                  </span>
                </Link>
              </div>

              {/* Points Awarded Notification */}
              {incidentRating?.pointsAwarded && (
                (userRole === 'OFFICE_ADMIN' && incident?.assignedOffice) || 
                (userRole === 'USER' && incident?.submittedByEmail === userEmail) ||
                (userRole === 'REGULAR_USER' && incident?.submittedByEmail === userEmail)
              ) && (
                <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Points Awarded:</span>
                  <span className="font-bold">
                    {incidentRating?.pointsAwarded ? (
                      userRole === 'OFFICE_ADMIN' 
                        ? (incidentRating?.reporterRating || 0) * 10 
                        : (incidentRating?.officeRating || 0) * 10
                    ) : 0} pts
                  </span>
                  <span className="ml-2 text-xs text-yellow-700">(for this report)</span>
                </div>
              )}

              {/* Case Tracking Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Case Tracking</h1>
                  <div className="flex items-center mt-1">
                    <h2 className="text-lg font-semibold">Case: {incident.trackingNumber}</h2>
                    <span
                      className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-sm
                      ${
                        incident.priorityLevel === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : incident.priorityLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {incident.priorityLevel}
                    </span>
                    {isDismissed && (
                      <span className="ml-3 px-2 py-0.5 text-xs font-bold rounded bg-gray-200 text-gray-700 border border-gray-400">Dismissed</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-6 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Submitted</div>
                    <div className="font-medium">{incident.submittedAt ? formatDate(incident.submittedAt) : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Last Updated</div>
                    <div className="font-medium">{lastUpdated ? formatDate(lastUpdated) : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Estimated Resolution</div>
                    <div className="font-medium">
                      {estimatedResolution ? formatDate(estimatedResolution.toISOString()) : "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="bg-white rounded-md shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                  {statusSteps.map((step, idx) => {
                    // For dismissed, only Submitted is completed, Dismissed is current, others are pending
                    let isCompleted = false;
                    let isCurrent = false;
                    let isPending = false;
                    const isDismissedStep = step.key === "Dismissed" && isDismissed;
                    if (isDismissed) {
                      isCompleted = step.key === "Submitted";
                      isCurrent = isDismissedStep;
                      isPending = !isCompleted && !isCurrent;
                    } else {
                      isCompleted = idx < currentStep;
                      isCurrent = idx === currentStep;
                      isPending = idx > currentStep;
                    }
                    return (
                      <div key={step.key} className="flex-1 flex flex-col items-center relative">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 z-10
                          ${
                            isDismissedStep
                              ? "border-gray-500 bg-gray-200 text-gray-700"
                              : isCompleted || (isCurrent && step.key === "Resolved")
                              ? "border-green-500 bg-green-50 text-green-600"
                              : isCurrent
                                ? "border-[#8B0000] bg-red-50 text-[#8B0000]"
                                : "border-gray-200 bg-gray-50 text-gray-400"
                          }`}
                        >
                          {isDismissedStep ? (
                            <AlertCircle className="w-5 h-5" />
                          ) : isCompleted || (isCurrent && step.key === "Resolved") ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isCurrent ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-200" />
                          )}
                        </div>
                        <span
                          className={`mt-2 text-xs font-medium
                          ${isDismissedStep ? "text-gray-700" : isCompleted ? "text-green-600" : isCurrent ? "text-[#8B0000]" : "text-gray-400"}`}
                        >
                          {step.label}
                        </span>

                        {/* Connector line */}
                        {idx < statusSteps.length - 1 && (
                          <div
                            className={`absolute top-5 left-1/2 h-[2px]
                              ${isCompleted ? "bg-green-500" : isDismissedStep ? "bg-gray-400" : "bg-gray-200"}`}
                            style={{ width: "100%", zIndex: 0 }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {isOfficeAdmin && normalizedStatus !== "pending" && normalizedStatus !== "resolved" && normalizedStatus !== "dismissed" && (
                <div className="flex gap-4 mb-6">
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setShowApproveModal(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                    onClick={() => setShowTransferModal(true)}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer to another office
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Incident Details */}
              <div className="lg:col-span-2">
                {/* Incident Details */}
                <div className="bg-white rounded-md shadow-sm p-6 mb-6">
                  <h2 className="text-base font-semibold mb-4 text-gray-800">Incident Details</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Incident Type</div>
                      <p className="text-sm">{incident.incidentType || "-"}</p>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">Location</div>
                      <p className="text-sm">{incident.location || "-"}</p>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">Date & Time of Incident</div>
                      <p className="text-sm">
                        {formatDate(incident.dateOfIncident)}
                        {incident.timeOfIncident ? `, ${incident.timeOfIncident}` : ""}
                      </p>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">Description</div>
                      <div className="text-sm whitespace-pre-line">{incident.description || "-"}</div>
                    </div>
                  </div>
                </div>

                {/* Submitted Evidence */}
                <div className="bg-white rounded-md shadow-sm p-6 mb-6">
                  <h2 className="text-base font-semibold mb-4 text-gray-800">Submitted Evidence</h2>
                  {Array.isArray((incident as any).evidence) && (incident as any).evidence.length > 0 ? (
                    <div className="space-y-3">
                      {(incident as any).evidence.map((file: Evidence) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (file.fileType.startsWith("image/")) {
                              setSelectedImage({ fileUrl: file.fileUrl, fileName: file.fileName });
                            }
                          }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                            {file.fileType.startsWith("image/") ? (
                              <Image
                                src={file.fileUrl || "/placeholder.svg"}
                                alt={file.fileName}
                                width={32}
                                height={32}
                                className="object-cover w-8 h-8"
                              />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{file.fileName}</div>
                            <div className="text-xs text-gray-500">Image • Uploaded {formatDate(file.uploadedAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No evidence submitted for this case.</div>
                  )}
                </div>

                {/* Witnesses */}
                {Array.isArray((incident as any).witnesses) && (incident as any).witnesses.length > 0 && (
                  <div className="bg-white rounded-md shadow-sm p-6 mb-6">
                    <h2 className="text-base font-semibold mb-4 text-gray-800">Witnesses</h2>
                    <div className="space-y-4">
                      {(incident as any).witnesses.map((witness: any) => (
                        <div key={witness.id} className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-[#8B0000]">
                            {witness.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">{witness.name}</div>
                            <div className="text-sm text-gray-700 border-l-2 border-[#8B0000] pl-3 py-1">
                              {witness.additionalNotes || (
                                <span className="italic text-gray-400">No additional notes provided.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case Updates */}
                {updates.length > 0 && (
                  <div className="bg-white rounded-md shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold text-gray-800">Case Updates</h2>
                      <span className="text-xs text-gray-500">
                        {updates.length} update{updates.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-6">
                      {updates.map((update, idx) => {
                        let iconColor = "text-blue-500"
                        let iconBg = "bg-blue-50"
                        let Icon = Clock

                        const message = update.message?.toLowerCase() || ""
                        const status = update.status?.toLowerCase() || ""

                        // Check for verification updates
                        if (message.includes("verified") || message.includes("verification")) {
                          iconColor = "text-green-500"
                          iconBg = "bg-green-50"
                          Icon = CheckCircle
                        }
                        // Check for transfer updates
                        else if (message.includes("transferred") || message.includes("transfer")) {
                          iconColor = "text-purple-500"
                          iconBg = "bg-purple-50"
                          Icon = ArrowRightLeft
                        }
                        // Check for status changes
                        else if (status.includes("resolved") || status.includes("closed")) {
                          iconColor = "text-green-500"
                          iconBg = "bg-green-50"
                          Icon = CheckCircle
                        }
                        // Check for priority changes
                        else if (message.includes("priority") || message.includes("changed")) {
                          iconColor = "text-blue-500"
                          iconBg = "bg-blue-50"
                          Icon = AlertCircle
                        }

                        return (
                          <div key={update.id || idx} className="flex gap-3 items-start">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                <span className="font-medium text-sm">
                                  {message.includes("verified") ? "Verification" :
                                   message.includes("transferred") ? "Case Transfer" :
                                   update.title || update.status || "Update"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {update.updatedAt ? formatDate(update.updatedAt) : ""} •{" "}
                                  {update.updatedAt
                                    ? new Date(update.updatedAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>
                              </div>
                              <div className="text-sm mb-1">{update.message || update.description || "-"}</div>
                              <div className="text-xs text-gray-500">
                                {update.updatedByName || update.updatedByFullName || update.author || "System"}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Case Information */}
              <div>
                {/* Case Information */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Case Information</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Assigned To</div>
                      <p className="text-sm">{officeAdmin ? `${officeAdmin.firstName} ${officeAdmin.lastName}` : "-"}</p>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">Technical Services Office</div>
                      <p className="text-sm">{officeAdmin ? officeAdmin.email : "-"}</p>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">Contact number</div>
                      <p className="text-sm">{officeAdmin ? officeAdmin.contactNumber : "-"}</p>
                    </div>

                    {/* Office Rating */}
                    {incidentRating?.officeRating && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Office Rating</div>
                        <div className="flex items-center gap-1 mt-1">
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
                          {incidentRating.officeFeedback && (
                            <span className="text-xs text-gray-500 ml-2">
                              "{incidentRating.officeFeedback}"
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reporter Information */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Reporter Information</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Name</div>
                      <p className="text-sm font-medium">
                        {incident.submittedByFullName ? incident.submittedByFullName : <span className="italic text-gray-400">Anonymous</span>}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <p className="text-sm font-medium">
                        {incident.submittedByEmail ? incident.submittedByEmail : <span className="italic text-gray-400">Not provided</span>}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Phone</div>
                      <p className="text-sm font-medium">
                        {incident.submittedByPhone ? incident.submittedByPhone : <span className="italic text-gray-400">Not provided</span>}
                      </p>
                    </div>

                    {/* Student Rating */}
                    {incidentRating?.reporterRating && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Student Rating</div>
                        <div className="flex items-center gap-1 mt-1">
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
                          {incidentRating.reporterFeedback && (
                            <span className="text-xs text-gray-500 ml-2">
                              "{incidentRating.reporterFeedback}"
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-white rounded-md shadow-sm p-6">
                  <h2 className="text-base font-semibold mb-4 text-gray-800">Next Steps</h2>
                  {isDismissed ? (
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-gray-500" />
                      <span className="text-gray-700 font-medium">This case has been dismissed. No further action will be taken.</span>
                    </div>
                  ) : (
                    (() => {
                      const steps = [
                        { label: "Initial Review", desc: "Case reviewed by security team" },
                        { label: "Incident Updates", desc: "Gathering security footage and witness statements" },
                        { label: "In Progress", desc: "Implementing security measures based on findings" },
                        { label: "Case Resolution", desc: "Final report and case closure" },
                      ];
                      // Map status to step index
                      const statusMap: Record<string, number> = {
                        pending: 0,
                        "initial review": 0,
                        "incident updates": 1,
                        "in progress": 2,
                        resolved: 3,
                        "case resolution": 3,
                      };
                      const currentStepIdx = statusMap[normalizedStatus] ?? 0;
                      return (
                        <ul className="space-y-4">
                          {steps.map((step, idx) => (
                            <li key={step.label} className="flex items-start gap-3">
                              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${idx <= currentStepIdx ? "bg-green-100" : "bg-gray-100"}`}>
                                {idx <= currentStepIdx ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                                )}
                              </div>
                              <div>
                                <span className="font-medium text-sm">{step.label}</span>
                                <div className="text-xs text-gray-500">{step.desc}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modal for full-size image preview */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl p-0 bg-transparent shadow-none border-none flex flex-col items-center justify-center">
          {selectedImage && (
            <>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
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
                src={selectedImage.fileUrl}
                alt={selectedImage.fileName}
                width={600}
                height={600}
                className="object-contain max-h-[80vh] max-w-full rounded-lg"
              />
              <div className="mt-2 text-center text-sm text-gray-700">{selectedImage.fileName}</div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Case Approval</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this case? This will move it back to the pending list for further review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
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
                  Confirm Approval
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
              Case Approved Successfully
            </DialogTitle>
            <DialogDescription>
              The case has been approved and moved to the pending list. You will be redirected to the incidents page.
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
            <DialogDescription>
              Thank you for your feedback! Your rating has been recorded.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Rating Modal for regular user or office admin */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        incidentId={incident?.trackingNumber || ''}
        type={userRole === 'OFFICE_ADMIN' ? 'office' : 'reporter'}
        onSuccess={handleRatingSuccess}
      />

      {/* Add Toaster for notifications */}
      <Toaster position="top-right" />
    </div>
  )
}