"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "@/utils/api"
import Cookies from "js-cookie"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  incidentId: string
  type: "reporter" | "office"
  onSuccess?: () => void
}

export function RatingModal({ isOpen, onClose, incidentId, type, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredStar, setHoveredStar] = useState<number>(0)
  const [ratingStatus, setRatingStatus] = useState<{
    reporterRating?: number;
    officeRating?: number;
    pointsAwarded: boolean;
  } | null>(null)
  const router = useRouter();

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
    }
  }, [isOpen, incidentId])

  const handleSubmit = async () => {
    if (rating === 0) return

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
            rating,
            feedback,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to submit rating")
      }

      // Fetch latest incident rating
      const ratingRes = await fetch(`${API_BASE_URL}/api/ratings/incidents/${incidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const ratingData = ratingRes.ok ? await ratingRes.json() : null
      if (ratingData?.pointsAwarded) {
        // Fetch updated user profile for new points
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const profileData = profileRes.ok ? await profileRes.json() : null
        toast.success(
          `Points have been awarded! You now have ${profileData?.points ?? "?"} points.`,
          { duration: 5000 }
        )
        // Redirect to tracking page after short delay
        setTimeout(() => {
          router.push(`/incidents/tracking/${incidentId}`)
        }, 1500)
      } else {
        toast.success("Thank you for your rating!")
      }
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast.error("Failed to submit rating")
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "office" ? "Rate the reporter" : "Rate the office"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {getRatingStatusMessage() && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{getRatingStatusMessage()}</p>
            </div>
          )}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredStar || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Add your feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="bg-[#800000] hover:bg-[#6B0000]"
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 