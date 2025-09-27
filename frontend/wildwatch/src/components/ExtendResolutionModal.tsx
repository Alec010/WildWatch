"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ExtendResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onExtend: (newDate: string) => Promise<void>
  currentEstimatedDate?: string
  incidentId: string
}

export default function ExtendResolutionModal({
  isOpen,
  onClose,
  onExtend,
  currentEstimatedDate,
  incidentId
}: ExtendResolutionModalProps) {
  const [newDate, setNewDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newDate) {
      setError("Please select a new estimated resolution date")
      return
    }

    const selectedDate = new Date(newDate)
    const now = new Date()

    if (selectedDate <= now) {
      setError("Estimated resolution date must be in the future")
      return
    }

    if (currentEstimatedDate) {
      const currentDate = new Date(currentEstimatedDate)
      if (selectedDate <= currentDate) {
        setError("New estimated date must be later than the current estimated date")
        return
      }
    }

    setIsLoading(true)
    try {
      await onExtend(newDate)
      toast.success("Resolution date extended successfully", {
        description: `New estimated resolution date: ${selectedDate.toLocaleDateString()}`,
        icon: <Calendar className="h-5 w-5 text-green-500" />,
        className: "bg-white border-green-100 text-green-800",
        duration: 4000,
      })
      onClose()
      setNewDate("")
    } catch (err: any) {
      setError(err.message || "Failed to extend resolution date")
      toast.error("Failed to extend resolution date", {
        description: err.message || "There was an error extending the resolution date. Please try again.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        className: "bg-white border-red-100 text-red-800",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setNewDate("")
      setError("")
      onClose()
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#800000]" />
            Extend Resolution Date
          </DialogTitle>
          <DialogDescription>
            Set a new estimated resolution date for incident #{incidentId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentEstimatedDate && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Current estimated resolution:</span>
              </div>
              <div className="font-medium text-gray-800 mt-1">
                {new Date(currentEstimatedDate).toLocaleDateString()}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newDate" className="text-sm font-medium">
              New Estimated Resolution Date
            </Label>
            <Input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={minDate}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500">
              Select a date in the future for the new estimated resolution
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !newDate}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Extending...
                </>
              ) : (
                "Extend Resolution Date"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
