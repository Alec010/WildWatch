"use client"

import { BadgeProgress, BadgeType, BADGE_COLORS, UserBadgeSummary } from '@/types/badge'
import { BadgeCard } from './BadgeCard'
import { BadgeDisplay } from './BadgeDisplay'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Award, Filter, Search, Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface BadgesModalProps {
  isOpen: boolean
  onClose: () => void
  badgeSummary: UserBadgeSummary | null
  isLoading: boolean
  onClaimBadge?: (badgeId: number) => Promise<void>
}

export function BadgesModal({ isOpen, onClose, badgeSummary, isLoading, onClaimBadge }: BadgesModalProps) {
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'unearned'>('all')
  const [selectedTab, setSelectedTab] = useState<string>('all')

  // Group badges by type
  const badgesByType = useMemo(() => {
    if (!badgeSummary) return {}
    
    return badgeSummary.badges.reduce<Record<string, BadgeProgress[]>>((acc, badge) => {
      const type = badge.badgeType
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(badge)
      return acc
    }, { 'all': badgeSummary.badges })
  }, [badgeSummary])

  // Filter badges based on search and filter
  const filteredBadges = useMemo(() => {
    if (!badgeSummary) return []
    
    const badgesToFilter = badgesByType[selectedTab] || []
    
    return badgesToFilter.filter(badge => {
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Apply earned/unearned filter
      const matchesEarnedFilter = 
        filterType === 'all' ||
        (filterType === 'earned' && badge.currentLevel > 0) ||
        (filterType === 'unearned' && badge.currentLevel === 0)
        
      return matchesSearch && matchesEarnedFilter
    })
  }, [badgeSummary, selectedTab, searchTerm, filterType, badgesByType])

  // Get the selected badge
  const selectedBadge = useMemo(() => {
    if (!badgeSummary || selectedBadgeId === null) return null
    return badgeSummary.badges.find(badge => badge.badgeId === selectedBadgeId) || null
  }, [badgeSummary, selectedBadgeId])

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading badges...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // No badges state
  if (!badgeSummary) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Badges</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No badges available</h3>
            <p className="text-gray-500 text-sm mt-1">
              There was an error loading your badges. Please try again later.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            <span>Your Badges</span>
          </DialogTitle>
        </DialogHeader>

        {/* Badge Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-600 font-medium">Badges Earned</p>
            <p className="text-xl font-bold text-blue-700">
              {badgeSummary.totalBadgesEarned}/{badgeSummary.totalBadgesAvailable}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-sm text-green-600 font-medium">Points Earned</p>
            <p className="text-xl font-bold text-green-700">
              +{badgeSummary.totalPointsEarned}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-sm text-amber-600 font-medium">Completion</p>
            <p className="text-xl font-bold text-amber-700">
              {Math.round((badgeSummary.totalBadgesEarned / badgeSummary.totalBadgesAvailable) * 100)}%
            </p>
          </div>
        </div>

        {/* Badge Filter Controls */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
            <Input
              placeholder="Search badges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium ${filterType === 'all' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('earned')}
              className={`px-3 py-1.5 text-xs font-medium ${filterType === 'earned' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500'}`}
            >
              Earned
            </button>
            <button
              onClick={() => setFilterType('unearned')}
              className={`px-3 py-1.5 text-xs font-medium ${filterType === 'unearned' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500'}`}
            >
              Unearned
            </button>
          </div>
        </div>

        {/* Badge Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Badges</TabsTrigger>
            {Object.keys(badgesByType).filter(type => type !== 'all').map((type) => (
              <TabsTrigger key={type} value={type}>
                {type === 'FIRST_RESPONDER' ? 'First Responder' : 
                 type === 'COMMUNITY_HELPER' ? 'Community Helper' : 
                 type === 'CAMPUS_LEGEND' ? 'Campus Legend' :
                 type === 'FIRST_RESPONSE' ? 'First Response' :
                 type === 'RATING_CHAMPION' ? 'Rating Champion' :
                 type === 'OFFICE_LEGEND' ? 'Office Legend' : type}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTab} className="mt-0">
            {filteredBadges.length === 0 ? (
              <div className="text-center py-8">
                <Filter size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No badges match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {filteredBadges.map((badge) => (
                    <BadgeCard
                      key={badge.badgeId}
                      badge={badge}
                      expanded={selectedBadgeId === badge.badgeId}
                      onClick={() => setSelectedBadgeId(
                        selectedBadgeId === badge.badgeId ? null : badge.badgeId
                      )}
                      onClaim={onClaimBadge}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
