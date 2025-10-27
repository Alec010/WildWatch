"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ClientOnlyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

// This component ensures the Dialog is only rendered on the client side
export function ClientOnlyDialog({ open, onOpenChange, children, className }: ClientOnlyDialogProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export { DialogHeader, DialogTitle, DialogDescription }
