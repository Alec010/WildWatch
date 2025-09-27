"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Star, TrendingUp } from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { RatingDimension } from "./RatingDimension"

interface RatingModal4DProps {
  isOpen: boolean
  onClose: () => void
  incidentId: string
  type: "reporter" | "office"
  onSuccess?: () => void
}

interface RatingData {
  honesty: number | null
  credibility: number | null
  responsiveness: number | null
  helpfulness: number | null
  feedback: string
}

interface RatingStatus {
  reporterRating?: {
    honesty: number
    credibility: number
    responsiveness: number
    helpfulness: number
    feedback: string
    totalPoints: number
    averageRating: number
  }
  officeRating?: {
    honesty: number
    credibility: number
    responsiveness: number
    helpfulness: number
    feedback: string
    totalPoints: number
    averageRating: number
  }
  pointsAwarded: boolean
  totalReporterPoints: number
  totalOfficePoints: number
}

const RATING_DIMENSIONS = {
  reporter: {
    honesty: {
      label: "Honesty",
      description: "How truthful and transparent was the reporter in describing the incident?"
    },
    credibility: {
      label: "Credibility", 
      description: "How reliable and trustworthy was the reporter's account?"
    },
    responsiveness: {
      label: "Responsiveness",
      description: "How quickly and effectively did the reporter respond to requests?"
    },
    helpfulness: {
      label: "Helpfulness",
      description: "How cooperative and helpful was the reporter throughout the process?"
    }
  },
  office: {
    honesty: {
      label: "Honesty",
      description: "How truthful and transparent was the office in handling your incident?"
    },
    credibility: {
      label: "Credibility",
      description: "How reliable and trustworthy was the office's response?"
    },
    responsiveness: {
      label: "Responsiveness", 
      description: "How quickly did the office respond to your incident?"
    },
    helpfulness: {
      label: "Helpfulness",
      description: "How helpful and supportive was the office staff?"
    }
  }
}

export function RatingModal4D({ isOpen, onClose, incidentId, type, onSuccess }: RatingModal4DProps) {
  const [ratingData, setRatingData] = useState<RatingData>({
    honesty: null,
    credibility: null,
    responsiveness: null,
    helpfulness: null,
    feedback: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ratingStatus, setRatingStatus] = useState<RatingStatus | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchRatingStatus = async () => {
      try {
        const token = Cookies.get("token")
        const response = await fetch(
          `${API_BASE_URL}/api/ratings/incidents/${incidentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (response.ok) {
          const data = await response.json()
          setRatingStatus(data)
        }
      } catch (error) {
        console.error("Error fetching rating status:", error)
      }
    }

    if (isOpen) {
      fetchRatingStatus()
      // Reset form when modal opens
      setRatingData({
        honesty: null,
        credibility: null,
        responsiveness: null,
        helpfulness: null,
        feedback: ""
      })
    }
  }, [isOpen, incidentId])

  const handleDimensionChange = useCallback((dimension: keyof Omit<RatingData, 'feedback'>, value: number) => {
    setRatingData(prev => ({
      ...prev,
      [dimension]: value
    }))
  }, [])

  const totalPoints = useMemo(() => {
    return (ratingData.honesty || 0) + 
           (ratingData.credibility || 0) + 
           (ratingData.responsiveness || 0) + 
           (ratingData.helpfulness || 0)
  }, [ratingData.honesty, ratingData.credibility, ratingData.responsiveness, ratingData.helpfulness])

  const isFormValid = useMemo(() => {
    return ratingData.honesty !== null && 
           ratingData.credibility !== null && 
           ratingData.responsiveness !== null && 
           ratingData.helpfulness !== null
  }, [ratingData.honesty, ratingData.credibility, ratingData.responsiveness, ratingData.helpfulness])

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.error("Please rate all dimensions before submitting")
      return
    }

    setIsSubmitting(true)
    try {
      const token = Cookies.get("token")
      const response = await fetch(
        `${API_BASE_URL}/api/ratings/incidents/${incidentId}/${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            honesty: ratingData.honesty,
            credibility: ratingData.credibility,
            responsiveness: ratingData.responsiveness,
            helpfulness: ratingData.helpfulness,
            feedback: ratingData.feedback,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit rating")
      }

      // Fetch latest incident rating
      const ratingRes = await fetch(`${API_BASE_URL}/api/ratings/incidents/${incidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const latestRatingData = ratingRes.ok ? await ratingRes.json() : null
      
      if (latestRatingData?.pointsAwarded) {
        // Fetch updated user profile for new points
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const profileData = profileRes.ok ? await profileRes.json() : null
        
        const pointsAwarded = type === "reporter" ? latestRatingData.totalReporterPoints : latestRatingData.totalOfficePoints
        
        toast.success(
          `Points have been awarded! You received ${pointsAwarded} points and now have ${profileData?.points ?? "?"} total points.`,
          { duration: 5000 }
        )
        // Redirect to tracking page after short delay
        setTimeout(() => {
          router.push(`/incidents/tracking/${incidentId}`)
        }, 1500)
      } else {
        toast.success("Thank you for your rating! Points will be awarded once both parties have rated.")
      }
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error("Error submitting rating:", error)
      toast.error(error.message || "Failed to submit rating")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingStatusMessage = () => {
    if (!ratingStatus) return null

    if (type === "reporter") {
      if (!ratingStatus.officeRating) {
        return "Waiting for the office to rate this incident"
      }
      if (ratingStatus.pointsAwarded) {
        return "Points have been awarded for this incident"
      }
    } else {
      if (!ratingStatus.reporterRating) {
        return "Waiting for the reporter to rate this incident"
      }
      if (ratingStatus.pointsAwarded) {
        return "Points have been awarded for this incident"
      }
    }
    return null
  }

  const dimensions = RATING_DIMENSIONS[type]
  const isAlreadyRated = type === "reporter" ? ratingStatus?.reporterRating : ratingStatus?.officeRating

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {type === "office" ? "Rate the Reporter" : "Rate the Office"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {getRatingStatusMessage() && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{getRatingStatusMessage()}</p>
            </div>
          )}

          {isAlreadyRated ? (
            <div className="text-center py-8">
              <div className="text-lg font-medium text-gray-700 mb-2">
                You have already rated this incident
              </div>
              <div className="text-sm text-gray-500">
                Your rating: {isAlreadyRated.totalPoints}/20 points ({isAlreadyRated.averageRating.toFixed(1)}/5 average)
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <RatingDimension
                  name="honesty"
                  label={dimensions.honesty.label}
                  description={dimensions.honesty.description}
                  value={ratingData.honesty}
                  onChange={(value) => handleDimensionChange('honesty', value)}
                />
                
                <RatingDimension
                  name="credibility"
                  label={dimensions.credibility.label}
                  description={dimensions.credibility.description}
                  value={ratingData.credibility}
                  onChange={(value) => handleDimensionChange('credibility', value)}
                />
                
                <RatingDimension
                  name="responsiveness"
                  label={dimensions.responsiveness.label}
                  description={dimensions.responsiveness.description}
                  value={ratingData.responsiveness}
                  onChange={(value) => handleDimensionChange('responsiveness', value)}
                />
                
                <RatingDimension
                  name="helpfulness"
                  label={dimensions.helpfulness.label}
                  description={dimensions.helpfulness.description}
                  value={ratingData.helpfulness}
                  onChange={(value) => handleDimensionChange('helpfulness', value)}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Points:</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">{totalPoints}/20</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Points are calculated as 1 point per star (1-5 stars per dimension)
                </div>
              </div>

              <Textarea
                placeholder="Add your feedback (optional)"
                value={ratingData.feedback}
                onChange={(e) => setRatingData(prev => ({ ...prev, feedback: e.target.value }))}
                className="min-h-[80px]"
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className="bg-[#800000] hover:bg-[#6B0000]"
                >
                  {isSubmitting ? "Submitting..." : `Submit Rating (${totalPoints} points)`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

