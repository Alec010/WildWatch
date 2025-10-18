"use client"

import { UserRank, RANK_COLORS, RANK_GRADIENTS, RANK_NAMES } from '@/types/rank'
import { Medal, Trophy, Crown, Award } from 'lucide-react'
import { motion } from 'framer-motion'

interface RankBadgeProps {
  rank: UserRank
  goldRanking?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  showGoldNumber?: boolean
  animate?: boolean
  className?: string
}

export function RankBadge({
  rank,
  goldRanking,
  size = 'md',
  showLabel = false,
  showGoldNumber = true,
  animate = true,
  className = '',
}: RankBadgeProps) {
  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 22,
    xl: 26,
  }

  const textSizes = {
    xs: 'text-[8px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  }

  const getRankIcon = () => {
    const iconSize = iconSizes[size]
    
    switch (rank) {
      case 'GOLD':
        return <Crown size={iconSize} className="text-white" />
      case 'SILVER':
        return <Trophy size={iconSize} className="text-white" />
      case 'BRONZE':
        return <Medal size={iconSize} className="text-white" />
      default:
        return <Award size={iconSize} className="text-white opacity-50" />
    }
  }

  const rankDisplayName = () => {
    if (rank === 'GOLD' && goldRanking && showGoldNumber) {
      return `Gold #${goldRanking}`
    }
    return RANK_NAMES[rank]
  }

  const BadgeContent = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          bg-gradient-to-br ${RANK_GRADIENTS[rank]}
          flex items-center justify-center
          shadow-lg
          border-2 border-white/20
          relative
          overflow-hidden
        `}
        style={{
          boxShadow: rank === 'GOLD' ? `0 0 20px ${RANK_COLORS[rank]}40` : undefined,
        }}
      >
        {getRankIcon()}
        
        {/* Shine effect for Gold */}
        {rank === 'GOLD' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        )}
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span
            className={`font-semibold ${textSizes[size]}`}
            style={{ color: RANK_COLORS[rank] }}
          >
            {rankDisplayName()}
          </span>
        </div>
      )}
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <BadgeContent />
      </motion.div>
    )
  }

  return <BadgeContent />
}







