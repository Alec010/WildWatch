"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  MapPin,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  FileText,
  ArrowUp,
  Frown,
  TrendingUp,
  Activity,
  Shield,
  ChevronRight,
  BarChart2,
  RefreshCw,
} from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import { Inter } from "next/font/google"
import { API_BASE_URL } from "@/utils/api"
import { UpvoteModal } from "@/components/ui/upvote-modal"
import { useSidebar } from "@/contexts/SidebarContext"
import { Navbar } from "@/components/Navbar"
import { motion, AnimatePresence } from "framer-motion"

const inter = Inter({ subsets: ["latin"] })

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
  isAnonymous: boolean
  submittedBy: string
  upvoteCount?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  })
  const [allIncidents, setAllIncidents] = useState<Incident[]>([])
  const [myIncidents, setMyIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredAllIncidents, setFilteredAllIncidents] = useState<Incident[]>([])
  const [filteredMyIncidents, setFilteredMyIncidents] = useState<Incident[]>([])
  const [upvotedIncidents, setUpvotedIncidents] = useState<Set<string>>(new Set())
  const [upvoteModalOpen, setUpvoteModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isUpvotedModal, setIsUpvotedModal] = useState(false)
  const [pendingUpvote, setPendingUpvote] = useState<{ [id: string]: boolean | undefined }>({})

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch all incidents
        const allResponse = await fetch(`${API_BASE_URL}/api/incidents/public`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!allResponse.ok) {
          throw new Error(`HTTP error! status: ${allResponse.status}`)
        }

        const allIncidentsData = await allResponse.json()
        // Filter out anonymous incidents
        const filteredAllIncidents = allIncidentsData.filter((inc: Incident) => !inc.isAnonymous)
        setAllIncidents(filteredAllIncidents)

        // Fetch upvote status for each incident
        const upvotePromises = filteredAllIncidents.map((incident: Incident) =>
          fetch(`${API_BASE_URL}/api/incidents/${incident.id}/upvote-status`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }).then((res) => res.json()),
        )

        const upvoteResults = await Promise.all(upvotePromises)
        const upvoted = new Set<string>()
        filteredAllIncidents.forEach((incident: Incident, index: number) => {
          if (upvoteResults[index] === true) {
            upvoted.add(incident.id)
          }
        })
        setUpvotedIncidents(upvoted)

        // Fetch user's incidents
        const myResponse = await fetch(`${API_BASE_URL}/api/incidents/my-incidents`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!myResponse.ok) {
          throw new Error(`HTTP error! status: ${myResponse.status}`)
        }

        const myIncidentsData = await myResponse.json()
        setMyIncidents(myIncidentsData)

        // Calculate statistics from user's incidents
        const stats = {
          total: myIncidentsData.length,
          pending: myIncidentsData.filter((inc: Incident) => inc.status === "Pending").length,
          inProgress: myIncidentsData.filter((inc: Incident) => inc.status === "In Progress").length,
          resolved: myIncidentsData.filter((inc: Incident) => inc.status === "Resolved").length,
        }

        setStats(stats)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError(error instanceof Error ? error.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    // Filter incidents based on search query
    const filteredAll = allIncidents.filter((incident) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        incident.incidentType.toLowerCase().includes(searchLower) ||
        incident.trackingNumber.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      )
    })
    setFilteredAllIncidents(filteredAll)

    const filteredMy = myIncidents.filter((incident) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        incident.incidentType.toLowerCase().includes(searchLower) ||
        incident.trackingNumber.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      )
    })
    setFilteredMyIncidents(filteredMy)
  }, [searchQuery, allIncidents, myIncidents])

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

  const handleUpvote = async (incidentId: string, wasUpvoted?: boolean) => {
    try {
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

      // Always fetch the updated incident from the backend and update the local state
      const incidentRes = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (incidentRes.ok) {
        const updatedIncident = await incidentRes.json()
        setAllIncidents((prevIncidents) =>
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
      // Update upvotedIncidents set based on backend response
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
      // Revert optimistic update if backend fails
      if (selectedIncident && wasUpvoted !== undefined) {
        setAllIncidents((prevIncidents) =>
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
      // Optimistically update UI
      setAllIncidents((prevIncidents) =>
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
      // Set pending state for this incident to the new upvote state
      setPendingUpvote((prev) => ({ ...prev, [selectedIncident.id]: !isCurrentlyUpvoted }))
      await handleUpvote(selectedIncident.id, isCurrentlyUpvoted)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-400",
          icon: <AlertTriangle className="h-4 w-4" />,
        }
      case "In Progress":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-400",
          icon: <Activity className="h-4 w-4" />,
        }
      case "Resolved":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-400",
          icon: <CheckCircle className="h-4 w-4" />,
        }
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-400",
          icon: <AlertCircle className="h-4 w-4" />,
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-[#8B0000] mb-4">Dashboard</h1>
            <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
                  <p>{error}</p>
                  <Button
                    className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}>
      <Sidebar />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        {/* Navbar */}
        <Navbar title="Incident Dashboard" subtitle="View and manage reported incidents" onSearch={setSearchQuery} />

        {/* Content */}
        <div className="pt-24 px-6 pb-10">
          {/* Welcome Banner */}
          <div className="mb-8 bg-gradient-to-r from-[#800000] via-[#9a0000] to-[#800000] rounded-xl shadow-lg overflow-hidden">
            <div className="relative p-6 md:p-8">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEMUFGMzciIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome to WildWatch Dashboard</h1>
                    <p className="text-white/80 max-w-2xl">
                      Track and manage campus incidents in real-time. Your contribution helps keep our campus safe.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/incidents/submit")}
                    className="bg-white hover:bg-gray-100 text-[#800000] font-medium rounded-full px-6 py-2 shadow-md transition-all duration-200 flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Report New Incident
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#800000] mb-4 flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" />
              Incident Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#800000]/10 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-[#800000]" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      All Time
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Reports</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-[#800000]">{stats.total}</p>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Active
                    </div>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-[#800000] to-[#D4AF37]"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-yellow-50 text-yellow-600 text-xs font-bold">
                      {Math.round((stats.pending / (stats.total || 1)) * 100)}%
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500">awaiting review</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-yellow-300"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 text-xs font-bold">
                      {Math.round((stats.inProgress / (stats.total || 1)) * 100)}%
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">In Progress</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                    <p className="text-xs text-gray-500">being addressed</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-300"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-50 text-green-600 text-xs font-bold">
                      {Math.round((stats.resolved / (stats.total || 1)) * 100)}%
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Resolved</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                    <p className="text-xs text-gray-500">completed</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-300"></div>
              </motion.div>
            </div>
          </div>

          {/* All Incidents Section */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[#800000]" />
              <h2 className="text-xl font-bold text-[#800000]">All Incidents</h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(searchQuery ? filteredAllIncidents : allIncidents).length > 0 ? (
                  (searchQuery ? filteredAllIncidents : allIncidents).slice(0, 3).map((incident, index) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 h-[220px]">
                        <div className="p-5 h-full flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(incident.status).bg} ${getStatusColor(incident.status).text}`}
                              >
                                {getStatusColor(incident.status).icon}
                                {incident.status}
                              </div>
                              <button
                                onClick={() => handleUpvoteClick(incident)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  pendingUpvote[incident.id] !== undefined
                                    ? pendingUpvote[incident.id]
                                      ? "bg-[#800000]/10 text-[#800000]"
                                      : "bg-gray-100 text-gray-500"
                                    : upvotedIncidents.has(incident.id)
                                      ? "bg-[#800000]/10 text-[#800000]"
                                      : "bg-gray-100 text-gray-500 hover:bg-[#800000]/10 hover:text-[#800000]"
                                }`}
                              >
                                <ArrowUp
                                  className={`h-3.5 w-3.5 ${
                                    pendingUpvote[incident.id] !== undefined
                                      ? pendingUpvote[incident.id]
                                        ? "fill-[#800000]"
                                        : "fill-none"
                                      : upvotedIncidents.has(incident.id)
                                        ? "fill-[#800000]"
                                        : "fill-none"
                                  }`}
                                  strokeWidth={1.5}
                                />
                                <span>{typeof incident.upvoteCount === "number" ? incident.upvoteCount : 0}</span>
                              </button>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {formatDate(incident.submittedAt)}
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                            {incident.incidentType}
                          </h3>

                          <div className="flex items-start mb-3">
                            <MapPin className="h-4 w-4 text-[#800000] mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-1">{incident.location}</p>
                          </div>

                          <div className="mb-4 flex-grow">
                            <p className="text-sm text-gray-700 line-clamp-1">{incident.description}</p>
                          </div>

                          <div className="flex justify-end mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-[#800000] text-[#800000] hover:bg-[#800000]/5 rounded-full px-4 flex items-center gap-1.5"
                              onClick={() => router.push(`/incidents/tracking/${incident.trackingNumber}`)}
                            >
                              View Details
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className={`h-1 w-full ${getStatusColor(incident.status).border}`}></div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Frown className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No incidents found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="link"
                  className="text-[#800000] font-medium hover:text-[#600000] flex items-center gap-1"
                  onClick={() => router.push("/incidents/public")}
                >
                  View All Incidents
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* My Incidents Section */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[#800000]" />
              <h2 className="text-xl font-bold text-[#800000]">My Incidents</h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(searchQuery ? filteredMyIncidents : myIncidents).length > 0 ? (
                  (searchQuery ? filteredMyIncidents : myIncidents).slice(0, 3).map((incident, index) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 h-[220px]">
                        <div className="p-5 h-full flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <div
                              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(incident.status).bg} ${getStatusColor(incident.status).text}`}
                            >
                              {getStatusColor(incident.status).icon}
                              {incident.status}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {formatDate(incident.submittedAt)}
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                            {incident.incidentType}
                          </h3>

                          <div className="flex items-start mb-3">
                            <MapPin className="h-4 w-4 text-[#800000] mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-1">{incident.location}</p>
                          </div>

                          <div className="mb-4 flex-grow">
                            <p className="text-sm text-gray-700 line-clamp-1">{incident.description}</p>
                          </div>

                          <div className="flex justify-between items-center mt-auto">
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              #{incident.trackingNumber}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-[#800000] text-[#800000] hover:bg-[#800000]/5 rounded-full px-4 flex items-center gap-1.5"
                              onClick={() => router.push(`/incidents/tracking/${incident.trackingNumber}`)}
                            >
                              View Details
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className={`h-1 w-full ${getStatusColor(incident.status).border}`}></div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Frown className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No incidents found</p>
                      <p className="text-gray-400 text-sm">You haven't reported any incidents yet</p>
                      <Button
                        className="mt-2 bg-[#800000] hover:bg-[#600000] text-white"
                        size="sm"
                        onClick={() => router.push("/incidents/submit")}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Report an Incident
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="link"
                  className="text-[#800000] font-medium hover:text-[#600000] flex items-center gap-1"
                  onClick={() => router.push("/incidents/tracking")}
                >
                  View All My Incidents
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-[#800000] mb-4 flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => router.push("/incidents/submit")}
                className="bg-white hover:bg-gray-50 text-[#800000] border border-gray-200 shadow-sm h-auto py-6 rounded-xl flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-[#800000]/10 rounded-full">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Report Incident</p>
                  <p className="text-xs text-gray-500 mt-1">Submit a new report</p>
                </div>
              </Button>

              <Button
                onClick={() => router.push("/incidents/tracking")}
                className="bg-white hover:bg-gray-50 text-[#800000] border border-gray-200 shadow-sm h-auto py-6 rounded-xl flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-[#800000]/10 rounded-full">
                  <Search className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Track Incidents</p>
                  <p className="text-xs text-gray-500 mt-1">View your reports</p>
                </div>
              </Button>

              <Button
                onClick={() => router.push("/incidents/history")}
                className="bg-white hover:bg-gray-50 text-[#800000] border border-gray-200 shadow-sm h-auto py-6 rounded-xl flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-[#800000]/10 rounded-full">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Incident History</p>
                  <p className="text-xs text-gray-500 mt-1">View past incidents</p>
                </div>
              </Button>

              <Button
                onClick={() => router.push("/leaderboard")}
                className="bg-white hover:bg-gray-50 text-[#800000] border border-gray-200 shadow-sm h-auto py-6 rounded-xl flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-[#800000]/10 rounded-full">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Leaderboard</p>
                  <p className="text-xs text-gray-500 mt-1">View top contributors</p>
                </div>
              </Button>
            </div>
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
    </div>
  )
}
