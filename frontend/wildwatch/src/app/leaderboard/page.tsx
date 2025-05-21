"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Star, Users, Building2, Loader2, TrophyIcon } from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import { motion } from "framer-motion"
import { RecognitionInfoModal } from "@/components/RecognitionInfoModal"
import { PulsingInfoIcon } from "@/components/PulsingInfoIcon"
import { useUser } from "@/contexts/UserContext"

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
  const { isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<"students" | "offices">("students")
  const [topStudents, setTopStudents] = useState<LeaderboardEntry[]>([])
  const [topOffices, setTopOffices] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showInfoModal, setShowInfoModal] = useState(false)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true)
      try {
        const [studentsRes, officesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/ratings/leaderboard/reporters/top`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_BASE_URL}/api/ratings/leaderboard/offices/top`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        ])

        if (studentsRes.ok && officesRes.ok) {
          const [studentsData, officesData] = await Promise.all([
            studentsRes.json(),
            officesRes.json()
          ])
          setTopStudents(studentsData)
          setTopOffices(officesData)
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [])

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
        return <Trophy className="w-6 h-6" />
      case 1:
        return <Medal className="w-6 h-6" />
      case 2:
        return <Medal className="w-6 h-6" />
      default:
        return <Star className="w-6 h-6" />
    }
  }

  const LeaderboardCard = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
    // Clamp averageRating to 5.0 max, 0.0 min
    const safeAvg = Math.max(0, Math.min(5, entry.averageRating));
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <div className={`${getMedalColor(index)} flex items-center gap-1`}>
            {getMedalIcon(index)}
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{entry.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{entry.totalRatings} {activeTab === 'students' ? 'reports' : 'ratings'}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>Rating:</span>
              <div className="flex items-center ml-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(safeAvg)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold">{safeAvg.toFixed(1)}/5</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-[#800000] text-white px-3 py-1 rounded-full text-sm font-medium">
            {entry.points} pts
          </div>
        </div>
      </motion.div>
    );
  }

  // Helper to fill up to 10 slots with placeholders
  const getLeaderboardDisplay = (entries: LeaderboardEntry[]) => {
    const filled = [...entries]
    while (filled.length < 10) {
      filled.push(null)
    }
    return filled
  }

  const PlaceholderCard = ({ index }: { index: number }) => (
    <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg shadow-md p-4 flex items-center gap-4 opacity-90 relative overflow-hidden shimmer">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        <TrophyIcon className="w-6 h-6 text-yellow-300 opacity-70" />
        <span className="text-gray-400 font-bold text-lg ml-2">{index + 1}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-500">
          {activeTab === 'students' ? 'Your name could be here!' : 'Your office could be here!'}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Compete to claim this spot</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-sm font-medium">?</div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex-1 p-8 ml-64">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#800000] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-[#800000]" />
            <h1 className="text-2xl font-bold text-[#800000]">Leaderboard</h1>
          </div>
          <button
            onClick={() => setShowInfoModal(true)}
            className="relative group"
            aria-label="Show recognition info"
          >
            <PulsingInfoIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "students"
                ? "bg-[#800000] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="w-5 h-5" />
            Top Students
          </button>
          <button
            onClick={() => setActiveTab("offices")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "offices"
                ? "bg-[#800000] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Building2 className="w-5 h-5" />
            Top Offices
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#800000] animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "students" ? (
                <>
                  <div className="text-sm text-gray-500 mb-2">Showing top 10 students</div>
                  {getLeaderboardDisplay(topStudents).map((student, index) =>
                    student ? (
                      <LeaderboardCard key={student.id} entry={student} index={index} />
                    ) : (
                      <PlaceholderCard key={`placeholder-student-${index}`} index={index} />
                    )
                  )}
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500 mb-2">Showing top 10 offices</div>
                  {getLeaderboardDisplay(topOffices).map((office, index) =>
                    office ? (
                      <LeaderboardCard key={office.id} entry={office} index={index} />
                    ) : (
                      <PlaceholderCard key={`placeholder-office-${index}`} index={index} />
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <RecognitionInfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
} 