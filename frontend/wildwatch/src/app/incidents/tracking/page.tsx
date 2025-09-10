"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Sidebar } from "@/components/Sidebar"
import { Navbar } from "@/components/Navbar"
import { useSidebar } from "@/contexts/SidebarContext"
import {
  Eye,
  Clock,
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Layers,
  ArrowUpRight,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Inter } from "next/font/google"
import { API_BASE_URL } from "@/utils/api"
import { motion } from "framer-motion"

const inter = Inter({ subsets: ["latin"] })

interface Incident {
  id: string // UUID from backend
  trackingNumber?: string // Add this field for backend tracking number
  caseNumber?: string // Case number like INC-2025-0001
  incidentType: string
  location: string
  dateOfIncident: string
  status: string
  priorityLevel?: "HIGH" | "MEDIUM" | "LOW" | null
}

export default function CaseTrackingPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [selectedPriority, setSelectedPriority] = useState<string>("All")
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // ✅ Proper formatter for missing case numbers
  const formatCaseNumber = (index: number): string => {
    const year = new Date().getFullYear()
    const number = String(index + 1).padStart(4, "0")
    return `INC-${year}-${number}`
  }

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("token")
      if (!token) {
        setError("No authentication token found.")
        setLoading(false)
        router.push("/login")
        return
      }

      try {
        // Fetch incidents
        const incidentsResponse = await fetch(`${API_BASE_URL}/api/incidents/my-incidents`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!incidentsResponse.ok) throw new Error(`HTTP error! status: ${incidentsResponse.status}`)

        const incidentsData = await incidentsResponse.json()
        // Only show PENDING and IN PROGRESS status (case-insensitive, with space)
        setIncidents(incidentsData.filter((i: Incident) => ["pending", "in progress"].includes(i.status.toLowerCase())))
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "Failed to load data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Helper function to format dates for activities
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    } else {
      return `${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "NEW_REPORT":
        return <AlertTriangle size={18} />
      case "STATUS_CHANGE":
        return <Clock size={18} />
      case "UPDATE":
        return <RefreshCw size={18} />
      case "CASE_RESOLVED":
        return <CheckCircle size={18} />
      default:
        return <FileText size={18} />
    }
  }

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "NEW_REPORT":
        return "bg-gradient-to-br from-red-500 to-red-600"
      case "STATUS_CHANGE":
        return "bg-gradient-to-br from-blue-500 to-blue-600"
      case "UPDATE":
        return "bg-gradient-to-br from-amber-500 to-amber-600"
      case "CASE_RESOLVED":
        return "bg-gradient-to-br from-green-500 to-green-600"
      default:
        return "bg-gradient-to-br from-gray-500 to-gray-600"
    }
  }

  // Only show incidents matching selected status and priority, and filter by search
  const filteredCases = incidents.filter(
    (item) =>
      (selectedStatus === "All" || item.status === selectedStatus) &&
      (selectedPriority === "All" ||
        (item.priorityLevel && item.priorityLevel.toLowerCase() === selectedPriority.toLowerCase())) &&
      ((item.trackingNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.caseNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        item.incidentType.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.status.toLowerCase().includes(search.toLowerCase())),
  )

  // Get counts for dashboard stats
  const pendingCount = incidents.filter((item) => item.status === "Pending").length
  const inProgressCount = incidents.filter((item) => item.status === "In Progress").length
  const highPriorityCount = incidents.filter((item) => item.priorityLevel === "HIGH").length

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? "ml-20" : "ml-64"}`}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
              </div>
              <p className="mt-6 text-gray-600 font-medium">Loading your cases...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? "ml-20" : "ml-64"}`}>
          <div className="p-8">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-2xl font-bold text-[#8B0000] mb-4">Case Tracking</h1>
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Error Loading Cases</h3>
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
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}>
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <Navbar title="Case Tracking" subtitle="Track and manage your security incident reports" onSearch={setSearch} />
          <div className="pt-32 px-6 pb-10">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-white to-[#fff9f9] p-6 rounded-xl shadow-md border border-[#f0e0e0] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#8B0000]/5 to-[#8B0000]/10 rounded-bl-full"></div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-3 rounded-lg shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Cases</p>
                    <h3 className="text-3xl font-bold text-[#8B0000]">{pendingCount}</h3>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedStatus("Pending")}
                    className="text-[#8B0000] text-sm font-medium flex items-center hover:underline"
                  >
                    View Pending Cases <ArrowUpRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-gradient-to-br from-white to-[#fff9f9] p-6 rounded-xl shadow-md border border-[#f0e0e0] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#DAA520]/5 to-[#DAA520]/10 rounded-bl-full"></div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#DAA520] to-[#B8860B] p-3 rounded-lg shadow-md">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">In Progress</p>
                    <h3 className="text-3xl font-bold text-[#DAA520]">{inProgressCount}</h3>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedStatus("In Progress")}
                    className="text-[#DAA520] text-sm font-medium flex items-center hover:underline"
                  >
                    View Active Cases <ArrowUpRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-gradient-to-br from-white to-[#fff9f9] p-6 rounded-xl shadow-md border border-[#f0e0e0] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/5 to-red-500/10 rounded-bl-full"></div>
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-lg shadow-md">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">High Priority</p>
                    <h3 className="text-3xl font-bold text-red-500">{highPriorityCount}</h3>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedPriority("HIGH")}
                    className="text-red-500 text-sm font-medium flex items-center hover:underline"
                  >
                    View High Priority <ArrowUpRight className="ml-1 h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-[#8B0000]" />
                <h3 className="font-medium text-gray-800">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Pending", "In Progress"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedStatus === status
                            ? "bg-[#8B0000] text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Priority</h4>
                  <div className="flex flex-wrap gap-2">
                    {["All", "HIGH", "MEDIUM", "LOW"].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setSelectedPriority(priority)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedPriority === priority
                            ? priority === "HIGH"
                              ? "bg-red-500 text-white shadow-md"
                              : priority === "MEDIUM"
                                ? "bg-orange-500 text-white shadow-md"
                                : priority === "LOW"
                                  ? "bg-green-500 text-white shadow-md"
                                  : "bg-[#8B0000] text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {priority === "All" ? priority : priority.charAt(0) + priority.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Cards */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#8B0000] flex items-center">
                  <Layers className="mr-2 h-5 w-5" />
                  Your Cases
                  <span className="ml-2 text-sm bg-[#8B0000]/10 text-[#8B0000] px-2 py-0.5 rounded-full">
                    {filteredCases.length}
                  </span>
                </h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredCases.length} of {incidents.length} cases
                </div>
              </div>

              {filteredCases.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No cases found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    We couldn't find any cases matching your current filters. Try adjusting your search or filters.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSelectedStatus("All")
                      setSelectedPriority("All")
                      setSearch("")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredCases.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden group"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div
                          className={`w-full md:w-2 ${
                            item.status === "Pending"
                              ? "bg-yellow-500"
                              : item.status === "In Progress"
                                ? "bg-blue-500"
                                : "bg-green-500"
                          }`}
                        ></div>
                        <div className="p-5 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[#8B0000]">
                                  {item.trackingNumber
                                    ? item.trackingNumber
                                    : item.caseNumber
                                      ? item.caseNumber
                                      : formatCaseNumber(index)}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    item.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : item.status === "In Progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                                {item.priorityLevel && (
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                      item.priorityLevel === "HIGH"
                                        ? "bg-red-100 text-red-800"
                                        : item.priorityLevel === "MEDIUM"
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {item.priorityLevel.charAt(0) + item.priorityLevel.slice(1).toLowerCase()}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-gray-800 font-medium mt-1">{item.incidentType}</h4>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{item.dateOfIncident}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{item.location}</span>
                              </div>
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/incidents/tracking/${item.trackingNumber ? item.trackingNumber : item.id}`,
                                  )
                                }
                                className="bg-[#8B0000] hover:bg-[#6B0000] text-white shadow-sm"
                                size="sm"
                              >
                                <Eye size={14} className="mr-1" /> View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
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
