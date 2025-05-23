"use client"

import { useState, useEffect } from "react"
import {
  Trophy,
  Medal,
  Star,
  Users,
  Building2,
  Loader2,
  Crown,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import { motion, AnimatePresence } from "framer-motion"
import { RecognitionInfoModal } from "@/components/RecognitionInfoModal"
import { useUser } from "@/contexts/UserContext"
import { Sidebar } from "@/components/Sidebar"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Navbar } from "@/components/Navbar"
import { useSidebar } from "@/contexts/SidebarContext"
import confetti from "canvas-confetti"

interface LeaderboardEntry {
  id: number
  name: string
  totalRatings: number
  averageRating: number
  points: number
  activeIncidents?: number
  resolvedIncidents?: number
}

export default function LeaderboardPage() {
  const { isLoading, userRole } = useUser()
  const { collapsed } = useSidebar()
  const [activeTab, setActiveTab] = useState<"students" | "offices">("students")
  const [topStudents, setTopStudents] = useState<LeaderboardEntry[]>([])
  const [topOffices, setTopOffices] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [expandedSection, setExpandedSection] = useState<"top3" | "others" | null>(null)

  const getContentMargin = () => {
    if (userRole === 'OFFICE_ADMIN') {
      return collapsed ? 'ml-20' : 'ml-72'
    }
    return collapsed ? 'ml-18' : 'ml-64'
  }

  const getContentWidth = () => {
    if (userRole === 'OFFICE_ADMIN') {
      return collapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-18rem)]'
    }
    return collapsed ? 'w-[calc(100%-4.5rem)]' : 'w-[calc(100%-16rem)]'
  }

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true)
      try {
        const [studentsRes, officesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/ratings/leaderboard/reporters/top`, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_BASE_URL}/api/ratings/leaderboard/offices/top`, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }),
        ])

        if (studentsRes.ok && officesRes.ok) {
          const [studentsData, officesData] = await Promise.all([studentsRes.json(), officesRes.json()])
          setTopStudents(studentsData)
          setTopOffices(officesData)

          // Trigger confetti when data loads
          setTimeout(() => {
            triggerConfetti()
          }, 500)
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [])

  const triggerConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Gold and maroon colors
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#DAA520", "#8B0000", "#FFD700"],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#DAA520", "#8B0000", "#FFD700"],
      })
    }, 250)
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500"
      case 1:
        return "text-gray-400"
      case 2:
        return "text-amber-600"
      default:
        return "text-gray-300"
    }
  }

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6" />
      case 1:
        return <Trophy className="w-6 h-6" />
      case 2:
        return <Medal className="w-6 h-6" />
      default:
        return <Star className="w-6 h-6" />
    }
  }

  const getStageHeight = (index: number) => {
    switch (index) {
      case 0:
        return "h-32"
      case 1:
        return "h-24"
      case 2:
        return "h-16"
      default:
        return "h-0"
    }
  }

  const getStageColor = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-400 to-yellow-500"
      case 1:
        return "from-gray-300 to-gray-400"
      case 2:
        return "from-amber-500 to-amber-600"
      default:
        return "from-gray-200 to-gray-300"
    }
  }

  const getStagePosition = (index: number) => {
    switch (index) {
      case 0:
        return "left-1/2 -translate-x-1/2"
      case 1:
        return "left-1/4 -translate-x-1/2"
      case 2:
        return "left-3/4 -translate-x-1/2"
      default:
        return ""
    }
  }

  const getStageWidth = (index: number) => {
    switch (index) {
      case 0:
        return "w-40"
      case 1:
        return "w-36"
      case 2:
        return "w-36"
      default:
        return "w-0"
    }
  }

  const LeaderboardCard = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
    // Clamp averageRating to 5.0 max, 0.0 min
    const safeAvg = Math.max(0, Math.min(5, entry.averageRating))
    const isTop3 = index < 3

    if (isTop3) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.2, type: "spring", stiffness: 100 }}
          className={`absolute ${getStagePosition(index)} bottom-0 flex flex-col items-center`}
        >
          <div className={`relative ${index === 0 ? "z-30" : index === 1 ? "z-20" : "z-10"}`}>
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br from-white to-gray-100 border-4 ${
                  index === 0 ? "border-yellow-400" : index === 1 ? "border-gray-300" : "border-amber-500"
                } shadow-lg flex items-center justify-center overflow-hidden`}
              >
                {entry.name.includes("http") ? (
                  <img
                    src={entry.name || "/placeholder.svg"}
                    alt={`Rank ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl font-bold text-[#8B0000]">
                    {entry.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <div className={`${getMedalColor(index)}`}>{getMedalIcon(index)}</div>
                  <span
                    className={`text-lg font-bold ${
                      index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-500" : "text-amber-600"
                    }`}
                  >
                    #{index + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 text-center max-w-[120px] truncate">{entry.name}</h3>
                <div className="flex items-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(safeAvg) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div
              className={`${getStageWidth(index)} ${getStageHeight(index)} rounded-t-lg bg-gradient-to-b ${getStageColor(index)} shadow-lg flex items-center justify-center relative overflow-hidden`}
            >
              {/* Add overlay text for name and points */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold text-center px-2">
                <div className="text-sm mb-1">{entry.name}</div>
                <div className="text-lg">{entry.points} pts</div>
              </div>
              {index === 0 && (
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('/abstract-sparkles.png')] bg-repeat-space opacity-20"></div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <div className="flex items-center gap-4 p-4 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#8B0000] to-[#DAA520]"></div>
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
            <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{entry.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                {entry.totalRatings} {activeTab === "students" ? "reports" : "ratings"}
              </span>
            <span>•</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(safeAvg) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1 font-medium">{safeAvg.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
            <div className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white px-3 py-1 rounded-full text-sm font-medium shadow">
            {entry.points} pts
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Helper to fill up to 10 slots with placeholders
  const getLeaderboardDisplay = (entries: LeaderboardEntry[]) => {
    const filled = [...entries] as (LeaderboardEntry | null)[]
    while (filled.length < 10) {
      filled.push(null)
    }
    return filled
  }

  const PlaceholderCard = ({ index }: { index: number }) => (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow p-4 flex items-center gap-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-300 to-gray-200"></div>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-400">
          {activeTab === "students" ? "Your name could be here!" : "Your office could be here!"}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Compete to claim this spot</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-sm font-medium">? pts</div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        {userRole === "OFFICE_ADMIN" ? <OfficeAdminSidebar /> : <Sidebar />}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5]">
      {userRole === "OFFICE_ADMIN" ? <OfficeAdminSidebar /> : <Sidebar />}
      <div className={`flex-1 transition-all duration-300 ${getContentMargin()}`}>
        <Navbar title="Recognition Leaderboard" subtitle="Celebrating our top contributors and offices" />
        <main className="p-6 pt-24">
          <div className="max-w-7xl mx-auto">
            {/* Header with animated gradient */}
            <div className="relative mb-12 overflow-hidden rounded-xl bg-gradient-to-r from-[#8B0000] to-[#6B0000] p-8 shadow-lg">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-[#DAA520]/30 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-br from-[#DAA520]/20 to-transparent rounded-full blur-xl"></div>

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
                    Recognition Leaderboard
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-white/80 max-w-xl">
                    Celebrating excellence in our community. Points are awarded based on quality reports and exceptional
                    service.
                  </p>
                </div>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="bg-white/10 hover:bg-white/20 transition-colors p-2 sm:p-3 rounded-full"
                  aria-label="Show recognition info"
                >
                  <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 sm:gap-4 mb-8">
              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                  activeTab === "students"
                    ? "bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white shadow-md transform scale-105"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">Top Students</span>
              </button>
              <button
                onClick={() => setActiveTab("offices")}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                  activeTab === "offices"
                    ? "bg-gradient-to-r from-[#8B0000] to-[#6B0000] text-white shadow-md transform scale-105"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">Top Offices</span>
              </button>
            </div>

            {/* Top 3 Podium Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#8B0000] flex items-center">
                  <Award className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Top 3 Champions
                </h2>
              </div>

              <div className="relative bg-gradient-to-b from-white to-gray-50 rounded-xl p-4 sm:p-6 shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[url('/abstract-geometric-flow.png')] opacity-5"></div>

                {/* Decorative elements */}
                <div className="absolute top-1/2 left-1/4 w-8 sm:w-12 h-8 sm:h-12 rounded-full bg-[#8B0000]/5"></div>
                <div className="absolute top-1/3 right-1/4 w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-[#DAA520]/5"></div>

                <div className="relative h-[140px] sm:h-[160px] md:h-[180px] -mb-4 sm:-mb-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {activeTab === "students"
                        ? topStudents
                            .slice(0, 3)
                            .map((student, index) => (
                              <LeaderboardCard key={student.id} entry={student} index={index} />
                            ))
                        : topOffices
                            .slice(0, 3)
                            .map((office, index) => <LeaderboardCard key={office.id} entry={office} index={index} />)}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#8B0000] flex items-center">
                  <Users className="mr-2 h-6 w-6" />
                  Leaderboard Rankings
                </h2>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md overflow-hidden">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#8B0000] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {activeTab === "students"
                        ? getLeaderboardDisplay(topStudents)
                            .slice(3)
                            .map((student, index) =>
                              student ? (
                                <LeaderboardCard key={student.id} entry={student} index={index + 3} />
                              ) : (
                                <PlaceholderCard key={`placeholder-student-${index}`} index={index + 3} />
                              ),
                            )
                        : getLeaderboardDisplay(topOffices)
                            .slice(3)
                            .map((office, index) =>
                              office ? (
                                <LeaderboardCard key={office.id} entry={office} index={index + 3} />
                              ) : (
                                <PlaceholderCard key={`placeholder-office-${index}`} index={index + 3} />
                              ),
                            )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-[#DAA520]/10 to-[#8B0000]/10 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-[#DAA520] to-[#8B0000] p-3 rounded-full shadow-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#8B0000] mb-2">How to Earn Recognition</h3>
                  <p className="text-gray-700">
                    Points are awarded based on the quality and quantity of your contributions. Submit detailed reports,
                    provide helpful information, and maintain high ratings to climb the leaderboard!
                  </p>
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="mt-3 text-[#8B0000] font-medium flex items-center hover:underline"
                  >
                    Learn more about the recognition system
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <RecognitionInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

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
