"use client"

import { RankProgress as RankProgressType, RANK_COLORS, RANK_NAMES, RANK_THRESHOLDS } from '@/types/rank'
import { RankBadge } from './RankBadge'
import { motion } from 'framer-motion'
import { TrendingUp, Target } from 'lucide-react'

interface RankProgressProps {
  rankProgress: RankProgressType
  showDetails?: boolean
  className?: string
}

export function RankProgress({ rankProgress, showDetails = true, className = '' }: RankProgressProps) {
  const { currentRank, currentPoints, nextRank, pointsToNextRank, progressPercentage, goldRanking } = rankProgress

  const isMaxRank = currentRank === 'GOLD'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Rank Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RankBadge rank={currentRank} goldRanking={goldRanking} size="lg" showLabel={false} />
          <div>
            <h3 className="text-lg font-bold" style={{ color: RANK_COLORS[currentRank] }}>
              {goldRanking && currentRank === 'GOLD' ? `Gold #${goldRanking}` : RANK_NAMES[currentRank]}
            </h3>
            <p className="text-sm text-gray-600">{currentPoints.toFixed(0)} points</p>
          </div>
        </div>

        {!isMaxRank && nextRank && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Next Rank</p>
            <div className="flex items-center gap-2">
              <RankBadge rank={nextRank} size="sm" showLabel={false} animate={false} />
              <span className="text-sm font-semibold" style={{ color: RANK_COLORS[nextRank] }}>
                {RANK_NAMES[nextRank]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!isMaxRank && nextRank && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{RANK_NAMES[currentRank]}</span>
            <span className="flex items-center gap-1">
              <Target size={12} />
              {pointsToNextRank.toFixed(0)} to {RANK_NAMES[nextRank]}
            </span>
            <span>{RANK_NAMES[nextRank]}</span>
          </div>

          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${RANK_COLORS[nextRank]}`}
              style={{
                background: `linear-gradient(to right, ${RANK_COLORS[currentRank]}, ${RANK_COLORS[nextRank]})`,
                opacity: 0.2,
              }}
            />

            {/* Progress fill */}
            <motion.div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r rounded-full`}
              style={{
                background: `linear-gradient(to right, ${RANK_COLORS[currentRank]}, ${RANK_COLORS[nextRank]})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            </motion.div>

            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-700 drop-shadow">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-gray-600">
            {pointsToNextRank.toFixed(0)} more points to reach {RANK_NAMES[nextRank]}
          </p>
        </div>
      )}

      {/* Max Rank Message */}
      {isMaxRank && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-yellow-800">
            <TrendingUp size={20} />
            <div>
              <p className="font-semibold">Maximum Rank Achieved!</p>
              <p className="text-xs">
                {goldRanking && goldRanking <= 10
                  ? `You're in the Gold Elite Top 10! Keep earning points to maintain your position.`
                  : 'Keep earning points to enter the Gold Elite Top 10!'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rank Milestones */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(RANK_THRESHOLDS).map(([rankName, threshold]) => {
            const achieved = currentPoints >= threshold
            const rankKey = rankName as keyof typeof RANK_THRESHOLDS
            const displayRank = rankKey as keyof typeof RANK_NAMES

            return (
              <div
                key={rankName}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all
                  ${
                    achieved
                      ? 'bg-white border-gray-300 shadow-sm'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }
                `}
              >
                <RankBadge rank={displayRank} size="sm" showLabel={false} animate={false} />
                <p
                  className={`text-xs font-semibold mt-1 ${achieved ? '' : 'text-gray-400'}`}
                  style={{ color: achieved ? RANK_COLORS[displayRank] : undefined }}
                >
                  {RANK_NAMES[displayRank]}
                </p>
                <p className="text-[10px] text-gray-500">{threshold} pts</p>
                {achieved && <p className="text-[10px] text-green-600 font-semibold">✓ Achieved</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}





