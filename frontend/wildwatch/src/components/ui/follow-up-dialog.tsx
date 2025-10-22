"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Bell, Loader2 } from "lucide-react"

interface FollowUpDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  trackingNumber: string
}

export function FollowUpDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  trackingNumber,
}: FollowUpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#8B0000]">
            <Bell className="h-5 w-5" />
            Send Follow-up Request
          </DialogTitle>
          <DialogDescription>
            Send a notification to the office handling this case. This lets them know you&apos;re waiting for an update.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            <p className="font-medium mb-1">Please note:</p>
            <p>You can only send one follow-up request every 24 hours for case #{trackingNumber}.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Follow-up"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
