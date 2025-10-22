"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UpvoteModal } from "@/components/ui/upvote-modal"
import { CustomLoader } from "@/components/ui/custom-loader"
import {
  MapPin,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Search,
  FileText,
  ThumbsUp,
  Eye,
  Calendar,
  User,
  TrendingUp,
  Sparkles,
  Shield,
} from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import { formatLocationDisplay } from "@/utils/locationFormatter"
import { filterIncidentsByPrivacy, getReporterDisplayName } from "@/utils/anonymization"
import { Inter } from "next/font/google"
import { Client } from "@stomp/stompjs"
// @ts-ignore
import SockJS from "sockjs-client"
import { Navbar } from "@/components/Navbar"
import { useSidebar } from "@/contexts/SidebarContext"
import { useUser } from "@/contexts/UserContext"

interface Incident {
  id: string
  trackingNumber: string
  incidentType: string
  location: string
  dateOfIncident: string
  timeOfIncident: string
  status: string
  description: string
  submittedAt: string
  isAnonymous?: boolean
  isPrivate?: boolean
  preferAnonymous?: boolean
  submittedBy: string
  submittedByFullName?: string
  submittedByIdNumber?: string
  submittedByEmail?: string
  submittedByPhone?: string
  upvoteCount: number
}

const inter = Inter({ subsets: ["latin"] })

export default function PublicIncidentsPage() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [upvotedIncidents, setUpvotedIncidents] = useState<Set<string>>(new Set())
  const [upvoteModalOpen, setUpvoteModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isUpvotedModal, setIsUpvotedModal] = useState(false)
  const [lastUpvoteAction, setLastUpvoteAction] = useState<number>(0)
  const [pendingUpvote, setPendingUpvote] = useState<{ [id: string]: boolean | undefined }>({})

  const { collapsed } = useSidebar()
  const { userRole } = useUser()

  const getContentMargin = () => {
    if (userRole === "OFFICE_ADMIN") {
      return collapsed ? "ml-20" : "ml-72"
    }
    return collapsed ? "ml-18" : "ml-64"
  }

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/public`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        // Filter incidents based on privacy settings (public view)
        const filteredData = filterIncidentsByPrivacy(data, false, false)
        setIncidents(filteredData)

        // Fetch upvote status for each incident
        const upvotePromises = filteredData.map((incident: Incident) =>
          fetch(`${API_BASE_URL}/api/incidents/${incident.id}/upvote-status`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }).then((res) => res.json()),
        )

        const upvoteResults = await Promise.all(upvotePromises)
        const upvoted = new Set<string>()
        filteredData.forEach((incident: Incident, index: number) => {
          if (upvoteResults[index] === true) {
            upvoted.add(incident.id)
          }
        })
        setUpvotedIncidents(upvoted)
      } catch (error) {
        console.error("Error fetching incidents:", error)
        setError(error instanceof Error ? error.message : "Failed to load incidents")
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()
  }, [])

  useEffect(() => {
    const filtered = incidents.filter((incident) => {
      const matchesSearch =
        searchQuery === "" ||
        incident.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "All" || incident.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })

    setFilteredIncidents(filtered)
  }, [searchQuery, statusFilter, incidents])

  useEffect(() => {
    const socket = new SockJS(`${API_BASE_URL.replace("/api", "")}/ws`)
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        incidents.forEach((incident) => {
          stompClient.subscribe(`/topic/upvotes/${incident.id}`, (message) => {
            const newCount = Number.parseInt(message.body, 10)
            setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, upvoteCount: newCount } : i)))
            setPendingUpvote((prev) => {
              const copy = { ...prev }
              delete copy[incident.id]
              return copy
            })
          })
        })
      },
    })
    stompClient.activate()
    return () => {
      stompClient.deactivate()
    }
  }, [incidents])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "in progress":
        return <AlertCircle className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "from-amber-500 to-orange-500"
      case "in progress":
        return "from-blue-500 to-indigo-500"
      case "resolved":
        return "from-green-500 to-emerald-500"
      default:
        return "from-gray-500 to-slate-500"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleUpvote = async (incidentId: string, wasUpvoted?: boolean) => {
    try {
      setLastUpvoteAction(Date.now())
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/upvote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const isUpvoted = await response.json()

      const incidentRes = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (incidentRes.ok) {
        const updatedIncident = await incidentRes.json()
        setIncidents((prevIncidents) =>
          prevIncidents.map((incident) =>
            incident.id === incidentId
              ? {
                  ...incident,
                  upvoteCount: typeof updatedIncident.upvoteCount === "number" ? updatedIncident.upvoteCount : 0,
                }
              : incident,
          ),
        )
      }
      setUpvotedIncidents((prev) => {
        const newSet = new Set(prev)
        if (isUpvoted) {
          newSet.add(incidentId)
        } else {
          newSet.delete(incidentId)
        }
        return newSet
      })
    } catch (error) {
      if (selectedIncident && wasUpvoted !== undefined) {
        setIncidents((prevIncidents) =>
          prevIncidents.map((incident) => {
            if (incident.id === incidentId) {
              const safeCount = typeof incident.upvoteCount === "number" ? incident.upvoteCount : 0
              return {
                ...incident,
                upvoteCount: wasUpvoted ? safeCount + 1 : safeCount - 1,
              }
            }
            return incident
          }),
        )
        setUpvotedIncidents((prev) => {
          const newSet = new Set(prev)
          if (wasUpvoted) {
            newSet.add(incidentId)
          } else {
            newSet.delete(incidentId)
          }
          return newSet
        })
      }
      console.error("Error toggling upvote:", error)
    }
  }

  const handleUpvoteClick = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsUpvotedModal(upvotedIncidents.has(incident.id))
    setUpvoteModalOpen(true)
  }

  const handleUpvoteConfirm = async () => {
    if (selectedIncident) {
      const isCurrentlyUpvoted = upvotedIncidents.has(selectedIncident.id)
      setIncidents((prevIncidents) =>
        prevIncidents.map((incident) => {
          if (incident.id === selectedIncident.id) {
            const safeCount = typeof incident.upvoteCount === "number" ? incident.upvoteCount : 0
            return {
              ...incident,
              upvoteCount: isCurrentlyUpvoted ? safeCount - 1 : safeCount + 1,
            }
          }
          return incident
        }),
      )
      setUpvotedIncidents((prev) => {
        const newSet = new Set(prev)
        if (isCurrentlyUpvoted) {
          newSet.delete(selectedIncident.id)
        } else {
          newSet.add(selectedIncident.id)
        }
        return newSet
      })
      setPendingUpvote((prev) => ({ ...prev, [selectedIncident.id]: !isCurrentlyUpvoted }))
      await handleUpvote(selectedIncident.id, isCurrentlyUpvoted)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      if (!token) throw new Error("No authentication token found")
      const response = await fetch(`${API_BASE_URL}/api/incidents/public`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      // Filter incidents based on privacy settings (public view)
      const filteredData = filterIncidentsByPrivacy(data, false, false)
      filteredData.sort((a: Incident, b: Incident) => (b.upvoteCount || 0) - (a.upvoteCount || 0))
      setIncidents(filteredData)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to refresh incidents")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Sidebar />
        <div className={`flex-1 relative transition-all duration-300 ${getContentMargin()}`}>
          <Navbar title="Public Incidents" subtitle="Loading incidents..." showSearch={false} showNewIncident={false} />
          <div className="pt-24">
            <CustomLoader 
              title="Loading community incidents..."
              subtitle="Fetching the latest safety reports"
              contentOnly
            />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Sidebar />
        <Navbar
          title="Public Incidents"
          subtitle="Error loading incidents"
          showSearch={false}
          showNewIncident={false}
        />
        <div className={`flex-1 p-8 transition-all duration-300 ${getContentMargin()} pt-20`}>
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-red-500 rounded-full shadow-lg">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-red-800 font-bold text-xl mb-2">Unable to Load Incidents</h3>
                  <p className="text-red-700 text-lg">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-[#fafafa] via-white to-[#f8f9fa] ${inter.className}`}>
      <Sidebar />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        {/* Navbar */}
        <Navbar title="Community Incidents" subtitle="View all public incident reports" onSearch={setSearchQuery} />

        <div className="pt-24 px-6 pb-10">
          {/* Enhanced Welcome Banner */}
          <div className="mb-10 bg-gradient-to-r from-[#800000] via-[#9a0000] to-[#800000] rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
              <div
                className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{ animationDelay: "2s" }}
              ></div>
            </div>

            {/* Decorative Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEMUFGMzciIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                      <Sparkles className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#D4AF37] to-white bg-clip-text text-transparent">
                      Community Incidents
                    </h1>
                  </div>
                  <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl">
                    Stay informed about campus safety and security reports. Your community's transparency hub for
                    incident awareness and collective safety.
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Live Updates</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Verified Reports</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <button
                    onClick={handleRefresh}
                    className="flex-1 lg:flex-none px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-all duration-300 font-medium flex items-center justify-center gap-3 group"
                    title="Refresh and sort by upvotes"
                  >
                    <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Refresh & Sort</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search incidents, locations, or tracking numbers..."
                    className="pl-12 pr-4 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-base transition-all duration-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 pl-4 pr-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-base min-w-[180px] transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="All" className="text-gray-900 bg-white">
                      All Status
                    </option>
                    <option value="In Progress" className="text-gray-900 bg-white">
                      In Progress
                    </option>
                    <option value="Resolved" className="text-gray-900 bg-white">
                      Resolved
                    </option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Incidents Grid */}
          <div className="max-w-[85vw] mx-auto">
            {filteredIncidents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
                {filteredIncidents.map((incident, index) => {
                  const isOptimisticallyUpvoted =
                    pendingUpvote[incident.id] !== undefined
                      ? pendingUpvote[incident.id]
                      : upvotedIncidents.has(incident.id)

                  return (
                    <article
                      key={incident.id}
                      className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200/50 hover:border-[#D4AF37]/40 transform hover:-translate-y-2 flex flex-col"
                      style={{
                        animationName: "fadeInUp",
                        animationDuration: "0.8s",
                        animationTimingFunction: "ease-out",
                        animationFillMode: "forwards",
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {/* Enhanced Status Banner */}
                      <div
                        className={`h-3 bg-gradient-to-r ${getStatusColor(incident.status)} relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>

                      {/* Card Content */}
                      <div className="flex flex-col flex-1 p-6">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`p-2 rounded-xl bg-gradient-to-r ${getStatusColor(incident.status)} text-white shadow-lg`}
                              >
                                {getStatusIcon(incident.status)}
                              </div>
                              <span
                                className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusBadgeColor(incident.status)} shadow-sm`}
                              >
                                {incident.status}
                              </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 group-hover:text-[#800000] transition-colors duration-300 line-clamp-2 leading-tight">
                              {incident.incidentType}
                            </h2>
                          </div>

                          {/* Enhanced Upvote Button */}
                          <button
                            onClick={() => handleUpvoteClick(incident)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                              isOptimisticallyUpvoted
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/25"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#800000] shadow-md"
                            }`}
                          >
                            <img
                              src="/upvote.svg"
                              alt="Upvote"
                              className={`h-5 w-5 transition-all duration-300 ${
                                isOptimisticallyUpvoted 
                                  ? "scale-110 drop-shadow-sm [filter:brightness(0)_invert(1)" 
                                  : "group-hover:scale-110"
                              }`}
                              style={{
                                filter: isOptimisticallyUpvoted ? "brightness(0) invert(1)" : "none"
                              }}
                            />
                            <span className="text-sm font-bold">
                              {typeof incident.upvoteCount === "number" ? incident.upvoteCount : 0}
                            </span>
                          </button>
                        </div>

                        {/* Enhanced Location and Time */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                            <MapPin className="h-4 w-4 text-[#800000]" />
                            <span className="font-medium">{formatLocationDisplay(incident)}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                            <Calendar className="h-4 w-4 text-[#800000]" />
                            <span>{formatDate(incident.submittedAt)}</span>
                          </div>
                        </div>

                        {/* Enhanced Description */}
                        <p className="text-slate-700 leading-relaxed line-clamp-3 mb-4 text-sm flex-1">
                          {incident.description}
                        </p>

                        {/* Enhanced Metadata */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mb-6">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <User className="h-3 w-3" />
                            <span className="font-medium">
                              {getReporterDisplayName(incident, false, false)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                            <FileText className="h-3 w-3" />
                            <span className="font-mono">#{incident.trackingNumber.slice(-6)}</span>
                          </div>
                        </div>

                        {/* View Full Details Button */}
                        <Button
                          variant="outline"
                          className="w-full border-2 border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white transition-all duration-300 rounded-2xl font-semibold py-3 group mt-auto"
                          onClick={() => router.push(`/incidents/tracking/${incident.trackingNumber}`)}
                        >
                          <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          View Full Details
                        </Button>
                      </div>

                      {/* Enhanced Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#800000]/5 via-transparent to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-lg mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Search className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-4">No Incidents Found</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    We couldn't find any incidents matching your search criteria.
                    <br />
                    Try adjusting your filters or check back later for new reports.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("All")
                    }}
                    className="mt-6 px-6 py-3 bg-[#800000] text-white rounded-2xl hover:bg-[#700000] transition-colors font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpvoteModal
        isOpen={upvoteModalOpen}
        onClose={() => setUpvoteModalOpen(false)}
        onConfirm={handleUpvoteConfirm}
        incidentType={selectedIncident?.incidentType || ""}
        isUpvoted={isUpvotedModal}
      />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
