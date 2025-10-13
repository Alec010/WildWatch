"use client"

import { BadgeProgress, BADGE_COLORS } from '@/types/badge'
import { badgeService } from '@/utils/badgeService'
import { BadgeDisplay } from './BadgeDisplay'
import { BadgeCelebration } from './BadgeCelebration'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Gift, Star, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface BadgeCardProps {
  badge: BadgeProgress
  expanded?: boolean
  onClick?: () => void
  onClaim?: (badgeId: number) => void
}

export function BadgeCard({ badge, expanded = false, onClick, onClaim }: BadgeCardProps) {
  const colors = BADGE_COLORS[badge.badgeType]
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  
  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      if (onClaim) {
        await onClaim(badge.badgeId)
      } else {
        // Fallback to direct API call
        const { badgeService } = await import('@/utils/badgeService')
        await badgeService.claimBadge(badge.badgeId)
      }
      setIsClaimed(true)
      setShowCelebration(true)
    } catch (error) {
      console.error('Error claiming badge:', error)
      // You might want to show a toast notification here
    } finally {
      setIsClaiming(false)
    }
  }
  
  // Badge is completed when all 3 stars are earned
  const isCompleted = badge.currentLevel >= 3
  const pointsAwarded = badge.pointsAwarded || false
  const canClaim = isCompleted && !pointsAwarded && !isClaimed
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`bg-white rounded-lg border overflow-hidden shadow-sm transition-all
        ${expanded ? 'p-5' : 'p-4'}
        ${isCompleted ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
      `}
      style={{ borderColor: colors.border }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <BadgeDisplay badge={badge} size="md" showLevel={true} />
        <div className="flex-1">
          <h4 className="font-semibold" style={{ color: badge.currentLevel > 0 ? colors.primary : 'gray' }}>
            {badge.name}
          </h4>
          <p className="text-xs text-gray-500">{badge.description}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
          isCompleted && pointsAwarded ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <Gift size={14} className={isCompleted && pointsAwarded ? 'text-green-600' : 'text-gray-500'} />
          <span className={`text-xs font-semibold ${
            isCompleted && pointsAwarded ? 'text-green-700' : 'text-gray-700'
          }`}>
            {isCompleted && pointsAwarded ? `+${badge.pointReward} pts ✓` : `+${badge.pointReward} pts`}
          </span>
        </div>
      </div>

      {/* Star System */}
      <div className="mt-3">
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3].map((star) => (
            <motion.div
              key={star}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: star * 0.1 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                badge.currentLevel >= star ? 'bg-yellow-100' : 'bg-gray-100'
              }`}
            >
              <Star 
                size={14} 
                className={badge.currentLevel >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} 
              />
            </motion.div>
          ))}
        </div>
        
        {/* Progress to next star */}
        {badge.currentLevel < 3 && (
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>Progress to next star: {badge.currentProgress} / {badge.nextLevelRequirement || '—'}</span>
            <span>{badge.progressPercentage.toFixed(0)}%</span>
          </div>
        )}
        
        {badge.currentLevel < 3 && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${badge.progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
            />
          </div>
        )}
      </div>

      {/* Claim Button - Only show when all stars are completed and not yet claimed */}
      {canClaim && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold"
          >
            {isClaiming ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Claiming...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trophy size={16} />
                Claim Badge (+{badge.pointReward} pts)
              </div>
            )}
          </Button>
        </motion.div>
      )}

      {/* Claimed Status */}
      {(isClaimed || pointsAwarded) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300"
        >
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="font-semibold">Badge Claimed! +{badge.pointReward} points awarded! 🎉</span>
          </div>
        </motion.div>
      )}

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <h5 className="text-sm font-medium mb-2">How to Earn Stars</h5>
          <div className="space-y-3">
            {badge.levels.map((level) => (
              <div key={level.level} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${level.achieved ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {level.achieved ? (
                    <CheckCircle2 size={14} className="text-green-600" />
                  ) : (
                    <Clock size={14} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className={`text-sm ${level.achieved ? 'text-gray-900' : 'text-gray-500'}`}>
                      ⭐ {level.description}
                    </span>
                    {level.achieved && level.awardedDate && (
                      <span className="text-xs text-gray-500">
                        {badgeService.formatAwardedDate(level.awardedDate)}
                      </span>
                    )}
                  </div>
                  {level.level === badge.currentLevel + 1 && !level.achieved && (
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${badge.progressPercentage}%`,
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Celebration Animation */}
      <BadgeCelebration
        isVisible={showCelebration}
        badgeName={badge.name}
        onComplete={() => setShowCelebration(false)}
      />
    </motion.div>
  )
}
