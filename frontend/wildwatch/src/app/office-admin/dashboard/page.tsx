"use client"

import { useEffect, useState } from "react"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { OfficeAdminNavbar } from "@/components/OfficeAdminNavbar"
import { Button } from "@/components/ui/button"
import {
  AlertCircle, 
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  ArrowUpRight,
  Calendar,
  Shield,
  Layers,
  Activity,
  Eye,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { API_BASE_URL } from "@/utils/api"
import { formatLocationCompact } from "@/utils/locationFormatter"
import { api } from "@/utils/apiClient"
import { useSidebar } from "@/contexts/SidebarContext"
import { motion } from "framer-motion"
import { badgeService } from "@/utils/badgeService"
import { BadgeDisplay } from "@/components/badges/BadgeDisplay"
import { Trophy } from "lucide-react"
import type { BadgeProgress, UserBadgeSummary } from "@/types/badge"

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
  verified: boolean
}

export default function OfficeAdminDashboard() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  })
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  
  // Badge state
  const [badgeSummary, setBadgeSummary] = useState<UserBadgeSummary | null>(null)
  const [loadingBadges, setLoadingBadges] = useState(true)
  const [recentBadges, setRecentBadges] = useState<BadgeProgress[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch incidents
        const response = await api.get('/api/incidents/office')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const incidents = await response.json()

        // Calculate statistics
        const stats = {
          totalAssigned: incidents.length,
          pending: incidents.filter((inc: Incident) => inc.status === "Pending").length,
          inProgress: incidents.filter((inc: Incident) => inc.status === "In Progress").length,
          resolved: incidents.filter((inc: Incident) => inc.status === "Resolved").length,
        }

        setStats(stats)
        // Sort incidents by submission date and get the 5 most recent
        const sortedIncidents = incidents
          .sort((a: Incident, b: Incident) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5)
        setRecentIncidents(sortedIncidents)
        
        // Fetch badge data
        try {
          const badgeSummaryData = await badgeService.getUserBadgeSummary()
          setBadgeSummary(badgeSummaryData)
          
          // Get recent/earned badges for display
          const earnedBadges = badgeSummaryData.badges.filter(badge => badge.currentLevel > 0)
          // Sort by highest level first, then by badge type
          earnedBadges.sort((a, b) => {
            if (b.currentLevel !== a.currentLevel) return b.currentLevel - a.currentLevel
            return a.badgeType.localeCompare(b.badgeType)
          })
          
          // Take up to 3 badges for the preview
          setRecentBadges(earnedBadges.slice(0, 3))
        } catch (badgeError) {
          console.error("Error fetching badge data:", badgeError)
        } finally {
          setLoadingBadges(false)
        }
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
    const filtered = recentIncidents.filter((incident) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        incident.incidentType.toLowerCase().includes(searchLower) ||
        incident.trackingNumber.toLowerCase().includes(searchLower)
      )
    })
    setFilteredIncidents(filtered)
  }, [searchQuery, recentIncidents])

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

  const getContentMargin = () => {
    return collapsed ? "ml-18" : "ml-64"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className={`flex-1 flex items-center justify-center transition-all duration-300 ${getContentMargin()}`}>
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <OfficeAdminSidebar />
        <div className={`flex-1 p-8 transition-all duration-300 ${getContentMargin()}`}>
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div> 
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
                  <p className="text-red-700">{error}</p>
                  <Button
                    className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white"
                    onClick={() => window.location.reload()}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" /> Try Again
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
      <OfficeAdminSidebar />


      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"}`}>
        {/* Navbar */}
        <OfficeAdminNavbar title="Office Dashboard" subtitle="View and manage reported incidents" onSearch={setSearchQuery} />

        {/* Content */}
        <div className="pt-24 px-6 pb-10">
          {/* Dashboard Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === "overview" ? "text-[#8B0000]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
              {activeTab === "overview" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B0000] to-[#DAA520]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("incidents")}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === "incidents" ? "text-[#8B0000]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Recent Incidents
              {activeTab === "incidents" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B0000] to-[#DAA520]"
                />
              )}
            </button>
          </div>

          {activeTab === "overview" && (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#8B0000]/5 to-[#8B0000]/10 rounded-bl-full"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-3 rounded-lg shadow-md">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Total Reports</p>
                        <h3 className="text-3xl font-bold text-[#8B0000]">{stats.totalAssigned}</h3>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => router.push("/office-admin/approved-cases")}
                        className="text-[#8B0000] text-sm font-medium flex items-center hover:underline"
                      >
                        View All Reports <ArrowUpRight className="ml-1 h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 rounded-bl-full"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-lg shadow-md">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Pending</p>
                        <h3 className="text-3xl font-bold text-yellow-500">{stats.pending}</h3>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => router.push("/office-admin/incidents")}
                        className="text-yellow-500 text-sm font-medium flex items-center hover:underline"
                      >
                        View Pending <ArrowUpRight className="ml-1 h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-bl-full"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">In Progress</p>
                        <h3 className="text-3xl font-bold text-blue-500">{stats.inProgress}</h3>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => router.push("/office-admin/approved-cases")}
                        className="text-blue-500 text-sm font-medium flex items-center hover:underline"
                      >
                        View In Progress <ArrowUpRight className="ml-1 h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-bl-full"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-md">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Resolved</p>
                        <h3 className="text-3xl font-bold text-green-500">{stats.resolved}</h3>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => router.push("/office-admin/history?status=Resolved")}
                        className="text-green-500 text-sm font-medium flex items-center hover:underline"
                      >
                        View Resolved <ArrowUpRight className="ml-1 h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Summary Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-xl shadow-md p-6 text-white mb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">Performance Summary</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-3xl font-bold">{stats.totalAssigned}</div>
                    <div className="text-white/80 text-sm">Total Cases</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-3xl font-bold">{stats.pending}</div>
                    <div className="text-white/80 text-sm">Pending</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-3xl font-bold">{stats.inProgress}</div>
                    <div className="text-white/80 text-sm">In Progress</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-3xl font-bold">{stats.resolved}</div>
                    <div className="text-white/80 text-sm">Resolved</div>
                  </div>
                </div>
              </motion.div>

              {/* Badge Preview Section */}
              {!loadingBadges && recentBadges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Your Badges</h3>
                        <p className="text-sm text-gray-600">Track your achievements and progress</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/profile")}
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      View All
                    </Button>
                  </div>
                  
                  <div className="flex gap-4">
                    {recentBadges.map(badge => (
                      <BadgeDisplay 
                        key={badge.badgeId}
                        badge={badge}
                        size="md"
                        showName={true}
                      />
                    ))}
                    {recentBadges.length < (badgeSummary?.totalBadgesEarned || 0) && (
                      <div className="flex items-center justify-center min-w-[120px]">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push("/profile")}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          +{(badgeSummary?.totalBadgesEarned || 0) - recentBadges.length} more
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {badgeSummary && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Total Badges Earned: {badgeSummary.totalBadgesEarned}/{badgeSummary.totalBadgesAvailable}</span>
                        <span>Points Earned: +{badgeSummary.totalPointsEarned}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}

          {/* Recent Incidents Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#8B0000]" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Incidents
                  <span className="ml-2 text-sm bg-[#8B0000]/10 text-[#8B0000] px-2 py-0.5 rounded-full">
                    {(searchQuery ? filteredIncidents : recentIncidents).length}
                  </span>
                </h2>
              </div>
              <Button
                variant="outline"
                className="border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000]/5"
                onClick={() => router.push("/office-admin/approved-cases")}
              >
                View All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(searchQuery ? filteredIncidents : recentIncidents).length > 0 ? (
                (searchQuery ? filteredIncidents : recentIncidents).map((incident, index) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden"
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className={`h-1.5 w-full ${
                          incident.status === "Pending"
                            ? "bg-yellow-400"
                            : incident.status === "In Progress"
                              ? "bg-blue-400"
                              : "bg-green-400"
                        }`}
                      ></div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-[#8B0000]">{incident.trackingNumber}</h3>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                incident.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : incident.status === "In Progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {incident.status}
                            </span>
                          </div>
                          <h4 className="text-gray-800 font-medium mt-1">{incident.incidentType}</h4>
                        </div>

                        <div className="mb-3 flex-1">
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatDate(incident.submittedAt)}</span>
                          </div>
                          <div className="flex items-start mb-2">
                            <AlertCircle className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-700">{formatLocationCompact(incident)}</p>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{incident.description}</p>
                        </div>

                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <Button
                            className="w-full bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white hover:opacity-90"
                            onClick={() => {
                              if (incident.status === "Resolved") {
                                router.push(`/incidents/tracking/${incident.trackingNumber}`)
                              } else if (incident.status === "In Progress") {
                                router.push(`/office-admin/approved-cases/${incident.id}/update`)
                              } else {
                                router.push(`/office-admin/incidents/${incident.id}`)
                              }
                            }}
                          >
                            <Eye size={16} className="mr-2" /> View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No incidents found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchQuery
                      ? "No incidents match your search criteria. Try adjusting your search terms."
                      : "There are no recent incidents to display at this time."}
                  </p>
                  {searchQuery && (
                    <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

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
