"use client"

import { GoldEliteEntry } from '@/types/rank'
import { Crown, Star, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface GoldEliteCardProps {
  entries: GoldEliteEntry[]
  userType: 'users' | 'offices'
  currentUserId?: number
}

export function GoldEliteCard({ entries, userType, currentUserId }: GoldEliteCardProps) {
  if (entries.length === 0) {
    return null
  }

  const isUserInList = currentUserId && entries.some((entry) => entry.id === currentUserId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-50 rounded-xl p-6 border-2 border-yellow-300 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-full shadow-lg">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-yellow-900">Gold Elite Top 10</h3>
          <p className="text-sm text-yellow-700">
            The highest-ranking {userType === 'users' ? 'students' : 'offices'} with 300+ points
          </p>
        </div>
      </div>

      {/* Current User Status */}
      {isUserInList && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-4 border border-yellow-400"
        >
          <p className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
            <TrendingUp size={16} />
            You're in the Gold Elite Top 10! 🎉
          </p>
        </motion.div>
      )}

      {/* Top 10 List */}
      <div className="space-y-2">
        {entries.slice(0, 10).map((entry, index) => {
          const isCurrentUser = entry.id === currentUserId
          const isTopThree = index < 3

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-all
                ${isCurrentUser ? 'bg-yellow-200 border-2 border-yellow-400 shadow-md' : 'bg-white/40 border border-yellow-200'}
                ${isTopThree && !isCurrentUser ? 'bg-white/60' : ''}
                hover:shadow-md hover:scale-[1.02]
              `}
            >
              {/* Ranking Number */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg'
                      : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md'
                        : index === 2
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md'
                          : 'bg-yellow-100 text-yellow-900'
                  }
                `}
              >
                {isTopThree ? <Crown size={16} /> : `#${entry.goldRanking}`}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isCurrentUser ? 'text-yellow-900' : 'text-gray-800'}`}>
                  {entry.name}
                  {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    {entry.averageRating.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span>{entry.totalIncidents} reports</span>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="font-bold text-lg text-yellow-900">{entry.points.toFixed(0)}</p>
                <p className="text-xs text-yellow-700">points</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer Message */}
      {!isUserInList && (
        <div className="mt-4 p-3 bg-white/40 rounded-lg border border-yellow-200">
          <p className="text-xs text-center text-yellow-800">
            Reach 300+ points and be among the top 10 to join the Gold Elite! 🏆
          </p>
        </div>
      )}
    </motion.div>
  )
}





