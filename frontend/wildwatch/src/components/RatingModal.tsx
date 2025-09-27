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
import { RatingModal4D } from "./RatingModal4D"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  incidentId: string
  type: "reporter" | "office"
  onSuccess?: () => void
}

export function RatingModal({ isOpen, onClose, incidentId, type, onSuccess }: RatingModalProps) {
  // Use the new 4D rating modal
  return (
    <RatingModal4D
      isOpen={isOpen}
      onClose={onClose}
      incidentId={incidentId}
      type={type}
      onSuccess={onSuccess}
    />
  )
} 