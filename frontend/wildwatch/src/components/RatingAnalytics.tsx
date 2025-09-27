"use client"

import { TrendingUp, Star, BarChart3 } from "lucide-react"
import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface RatingAnalyticsProps {
  rating?: {
    honesty: number
    credibility: number
    responsiveness: number
    helpfulness: number
    totalPoints: number
    averageRating: number
  }
  title: string
  showBreakdown?: boolean
}

export const RatingAnalytics = memo(function RatingAnalytics({ rating, title, showBreakdown = true }: RatingAnalyticsProps) {
  if (!rating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            No rating available yet
          </div>
        </CardContent>
      </Card>
    )
  }

  const dimensions = [
    { name: "Honesty", value: rating.honesty, color: "bg-blue-500" },
    { name: "Credibility", value: rating.credibility, color: "bg-green-500" },
    { name: "Responsiveness", value: rating.responsiveness, color: "bg-yellow-500" },
    { name: "Helpfulness", value: rating.helpfulness, color: "bg-purple-500" }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-2xl font-bold">{rating.averageRating.toFixed(1)}</span>
            <span className="text-gray-500">/ 5.0</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-lg font-semibold text-green-600">{rating.totalPoints}/20</span>
            <span className="text-sm text-gray-500">points</span>
          </div>
        </div>

        {showBreakdown && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Dimension Breakdown</h4>
            {dimensions.map((dimension) => (
              <div key={dimension.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{dimension.name}</span>
                  <span className="font-medium">{dimension.value}/5</span>
                </div>
                <Progress 
                  value={(dimension.value / 5) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

