"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ClientOnlyDialog, DialogHeader, DialogTitle } from "@/components/ClientOnlyDialog"
import { X, Plus, Loader2, FileText, Upload } from "lucide-react"
import { toast } from "sonner"
import { FileUpload } from "@/components/FileUpload"
import { api } from "@/utils/apiClient"

interface ResolvedIncident {
  id: string
  trackingNumber: string
  description: string
  status: string
  submittedAt: string
  location: string
  incidentType: string
}

interface CreateBulletinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateBulletinModal({ isOpen, onClose, onSuccess }: CreateBulletinModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    selectedIncidents: [] as string[],
    mediaFiles: [] as File[]
  })
  const [resolvedIncidents, setResolvedIncidents] = useState<ResolvedIncident[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingIncidents, setLoadingIncidents] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchResolvedIncidents()
      // Reset form when modal opens
      setForm({
        title: "",
        description: "",
        selectedIncidents: [],
        mediaFiles: []
      })
    }
  }, [isOpen])

  const fetchResolvedIncidents = async () => {
    setLoadingIncidents(true)
    try {
      const incidents = await api.getResolvedIncidents()
      setResolvedIncidents(incidents)
    } catch (error) {
      console.error("Failed to fetch resolved incidents:", error)
      toast.error("Failed to load resolved incidents")
    } finally {
      setLoadingIncidents(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('description', form.description.trim())
      
      // Add selected incidents
      if (form.selectedIncidents.length > 0) {
        form.selectedIncidents.forEach(incidentId => {
          formData.append('selectedIncidents', incidentId)
        })
      }
      
      // Add media files
      form.mediaFiles.forEach(file => {
        formData.append('mediaFiles', file)
      })
      
      await api.createBulletin(formData)
      
      toast.success("Bulletin created successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Failed to create bulletin:", error)
      toast.error(error.message || "Failed to create bulletin. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIncidentToggle = (incidentId: string, checked: boolean) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        selectedIncidents: [...prev.selectedIncidents, incidentId]
      }))
    } else {
      setForm(prev => ({
        ...prev,
        selectedIncidents: prev.selectedIncidents.filter(id => id !== incidentId)
      }))
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <ClientOnlyDialog open={isOpen} onOpenChange={handleClose} className="w-[98vw] sm:w-[95vw] md:w-[85vw] lg:w-[75vw] xl:w-[65vw] max-h-[90vh] bg-white p-0 rounded-lg shadow-xl flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-[#8B0000] flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Office Bulletin
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Share important announcements with the community
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="What's the announcement about?"
                  required
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Share the details of your announcement..."
                  rows={4}
                  required
                  className="w-full resize-none"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Media Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Media Attachments
                </Label>
                <FileUpload
                  files={form.mediaFiles}
                  onFilesChange={(files) => setForm({...form, mediaFiles: files})}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  maxFiles={5}
                  maxSize={10}
                  className="w-full max-w-full"
                />
              </div>
              
              {/* Resolved Incidents Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Related Resolved Incidents
                </Label>
                <p className="text-sm text-gray-500">Link resolved incidents to this bulletin (optional)</p>
                
                {loadingIncidents ? (
                  <div className="flex items-center gap-2 text-gray-500 p-4 border border-gray-200 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading resolved incidents...</span>
                  </div>
                ) : resolvedIncidents.length === 0 ? (
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-500 italic">No resolved incidents available</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-3">
                      {resolvedIncidents.map((incident) => (
                        <div key={incident.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={incident.id}
                            checked={form.selectedIncidents.includes(incident.id)}
                            onCheckedChange={(checked) => handleIncidentToggle(incident.id, checked as boolean)}
                            disabled={isSubmitting}
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={incident.id} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              #{incident.trackingNumber}
                            </Label>
                            <p className="text-sm text-gray-600 truncate" title={incident.description}>
                              {incident.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {form.selectedIncidents.length > 0 && (
                  <p className="text-sm text-blue-600">
                    {form.selectedIncidents.length} incident(s) selected
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="p-4 sm:p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !form.title.trim() || !form.description.trim()}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bulletin
                </>
              )}
            </Button>
          </div>
        </div>
      </ClientOnlyDialog>
  )
}
