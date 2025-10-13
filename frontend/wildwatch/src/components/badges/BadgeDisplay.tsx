"use client"

import { BadgeProgress, BadgeType, BADGE_COLORS, BADGE_ICONS } from '@/types/badge'
import { badgeService } from '@/utils/badgeService'
import { motion } from 'framer-motion'
import { Award, Check, Star } from 'lucide-react'

interface BadgeDisplayProps {
  badge: BadgeProgress
  size?: 'sm' | 'md' | 'lg'
  showLevel?: boolean
  showName?: boolean
  className?: string
}

export function BadgeDisplay({
  badge,
  size = 'md',
  showLevel = true,
  showName = false,
  className = '',
}: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  }

  const getBadgeIcon = () => {
    // If we have an actual icon URL, use it
    if (badge.iconUrl) {
      return (
        <img
          src={badgeService.getBadgeIconUrl(badge)}
          alt={badge.name}
          className="w-1/2 h-1/2 object-contain"
        />
      )
    }

    // Otherwise use emoji or icon
    switch (badge.badgeType) {
      // Regular user badges
      case 'FIRST_RESPONDER':
        return <Award className="w-1/2 h-1/2 text-white" />
      case 'COMMUNITY_HELPER':
        return <Star className="w-1/2 h-1/2 text-white" />
      case 'CAMPUS_LEGEND':
        return <Award className="w-1/2 h-1/2 text-white" />
      // Office admin badges
      case 'FIRST_RESPONSE':
        return <Check className="w-1/2 h-1/2 text-white" />
      case 'RATING_CHAMPION':
        return <Star className="w-1/2 h-1/2 text-white" />
      case 'OFFICE_LEGEND':
        return <Award className="w-1/2 h-1/2 text-white" />
      default:
        return <span className="text-lg">{BADGE_ICONS[badge.badgeType] || '🏅'}</span>
    }
  }

  const colors = BADGE_COLORS[badge.badgeType]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center`}
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 4px 6px -1px ${colors.primary}30`,
          border: `2px solid ${colors.border}`,
        }}
      >
        {getBadgeIcon()}

        {/* Badge level indicator */}
        {showLevel && badge.currentLevel > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full flex items-center justify-center shadow-md border-2"
            style={{ borderColor: colors.primary, width: '40%', height: '40%' }}>
            <span className="text-[8px] font-bold" style={{ color: colors.primary }}>
              {badge.currentLevel}★
            </span>
          </div>
        )}

        {/* Locked overlay for unearned badges */}
        {badge.currentLevel === 0 && (
          <div className="absolute inset-0 bg-gray-500/50 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">🔒</span>
          </div>
        )}
      </motion.div>

      {/* Badge name */}
      {showName && (
        <div className="flex flex-col">
          <span className="font-medium" style={{ color: badge.currentLevel > 0 ? colors.primary : 'gray' }}>
            {badge.name}
          </span>
          {badge.currentLevel > 0 && (
            <span className="text-xs text-gray-500">Level {badge.currentLevel}</span>
          )}
        </div>
      )}
    </div>
  )
}




