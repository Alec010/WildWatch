"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  AlertTriangle,
  HelpCircle,
  X,
  Clock,
  MapPin,
  FileText,
  Tag,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  AlertCircle,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/Sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { API_BASE_URL } from "@/utils/api"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useSidebar } from "@/contexts/SidebarContext"
import { Navbar } from "@/components/Navbar"
import { toast } from "sonner"
import { Toaster } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function IncidentSubmissionPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [formData, setFormData] = useState({
    incidentType: "",
    dateOfIncident: "",
    timeOfIncident: "",
    location: "",
    description: "",
    tags: [] as string[],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagsError, setTagsError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSelectError, setTagSelectError] = useState<string | null>(null)
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("details")
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [showTips, setShowTips] = useState(true)
  const [showResetDialog, setShowResetDialog] = useState(false)

  useEffect(() => {
    const storedData = sessionStorage.getItem("incidentSubmissionData")
    if (storedData) {
      const parsedData = JSON.parse(storedData)
      setFormData(parsedData)
      if (parsedData.tags) {
        setSelectedTags(parsedData.tags)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (formData.incidentType || formData.location || formData.description) {
      sessionStorage.setItem("incidentSubmissionData", JSON.stringify({ ...formData, tags: selectedTags }))
    }
  }, [formData, selectedTags])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Clear any previous error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    
    // Add validation for date of incident
    if (name === "dateOfIncident") {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // Set to end of today
      
      if (selectedDate > today) {
        setFormErrors((prev) => ({
          ...prev,
          dateOfIncident: "Please select a date that is not in the future",
        }))
        return
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.incidentType.trim()) {
      errors.incidentType = "Incident type is required"
    }

    if (!formData.dateOfIncident) {
      errors.dateOfIncident = "Date of incident is required"
    }

    if (!formData.timeOfIncident) {
      errors.timeOfIncident = "Time of incident is required"
    }

    if (!formData.location.trim()) {
      errors.location = "Location is required"
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required"
    } else if (formData.description.length > 1000) {
      errors.description = "Description must be less than 1000 characters"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(formErrors)[0]
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        element.focus()
      }
      toast.error("Please fix the errors in the form", {
        description: "Please check the highlighted fields and try again.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        className: "bg-white border-red-100 text-red-800",
        duration: 5000,
      })
      return
    }

    sessionStorage.setItem("incidentSubmissionData", JSON.stringify({ ...formData, tags: selectedTags }))
    router.push("/incidents/submit/evidence")
  }

  const handleReset = () => {
    setShowResetDialog(true)
  }

  const handleConfirmReset = () => {
    setFormData({
      incidentType: "",
      dateOfIncident: "",
      timeOfIncident: "",
      location: "",
      description: "",
      tags: [],
    })
    setSelectedTags([])
    setTags([])
    setFormErrors({})
    sessionStorage.removeItem("incidentSubmissionData")
    setShowResetDialog(false)
    toast.success("Form has been reset", {
      description: "All form fields have been cleared.",
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      className: "bg-white border-green-100 text-green-800",
      duration: 3000,
    })
  }

  const handleGenerateTags = async () => {
    setTagsError(null)
    setTagsLoading(true)
    setIsGeneratingTags(true)
    setTags([])

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${API_BASE_URL}/api/tags/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: formData.description,
          location: formData.location,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate tags")
      }

      const data = await response.json()
      setTags(data.tags || [])
      toast.success("Tags generated successfully", {
        description: "AI has analyzed your description and suggested relevant tags.",
        icon: <Sparkles className="h-5 w-5 text-green-500" />,
        className: "bg-white border-green-100 text-green-800",
        duration: 3000,
      })
    } catch (err: any) {
      setTagsError(err.message || "Failed to generate tags")
      toast.error("Failed to generate tags", {
        description: err.message || "There was an error generating tags. Please try again.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        className: "bg-white border-red-100 text-red-800",
        duration: 5000,
      })
    } finally {
      setTagsLoading(false)
      // Keep isGeneratingTags true for a moment to show the animation
      setTimeout(() => {
        setIsGeneratingTags(false)
      }, 500)
    }
  }

  const handleTagClick = (tag: string) => {
    setTagSelectError(null)
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      if (selectedTags.length >= 5) {
        setTagSelectError("You can select up to 5 tags only.")
        return
      }
      setSelectedTags([...selectedTags, tag])
    }
  }

  const getCompletionPercentage = () => {
    let completed = 0
    const totalFields = 5 // incidentType, dateOfIncident, timeOfIncident, location, description

    if (formData.incidentType) completed++
    if (formData.dateOfIncident) completed++
    if (formData.timeOfIncident) completed++
    if (formData.location) completed++
    if (formData.description) completed++

    return Math.round((completed / totalFields) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f8f8f8]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#800000] to-[#D4AF37] opacity-30 blur-lg animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading form...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#f8f8f8]">
      <Sidebar />
      <Toaster 
        position="top-right" 
        richColors 
        className="!top-24" 
        toastOptions={{
          classNames: {
            toast: 'bg-white',
            success: 'bg-[#dcfce7] border-[#86efac] text-[#166534]',
            error: 'bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]',
            warning: 'bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]',
            info: 'bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]',
          },
        }}
        theme="light"
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        {/* Navbar */}
        <Navbar
          title="Report an Incident"
          subtitle="Submit details about a security incident or concern"
          showSearch={false}
        /> 

        {/* Content */}
        <div className="pt-24 px-6 pb-10">
          {/* Progress Indicator */}
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#800000]/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-[#800000]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#800000] mb-1">Report an Incident</h1>
                <p className="text-gray-600">
                  Complete the form below to report a security incident. Your report helps keep our campus safe.
                </p>
              </div>
              <div className="md:ml-auto flex-shrink-0 bg-[#800000]/5 rounded-full px-4 py-2 flex items-center">
                <div className="mr-2 text-sm font-medium text-[#800000]">Completion:</div>
                <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#800000] rounded-full transition-all duration-500"
                    style={{ width: `${getCompletionPercentage()}%` }}
                  ></div>
                </div>
                <div className="ml-2 text-sm font-medium text-[#800000]">{getCompletionPercentage()}%</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full">
                <div className="h-full w-1/3 bg-[#800000] rounded-full"></div>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <div className="bg-[#800000] text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    1
                  </div>
                  <span className="text-sm font-medium text-[#800000]">Incident Details</span>
                </div>

                <div className="flex flex-col items-center opacity-50">
                  <div className="bg-gray-300 text-gray-600 rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    2
                  </div>
                  <span className="text-sm text-gray-600">Evidence & Witnesses</span>
                </div>

                <div className="flex flex-col items-center opacity-50">
                  <div className="bg-gray-300 text-gray-600 rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    3
                  </div>
                  <span className="text-sm text-gray-600">Review & Submit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note Card */}
          <div className="mb-8">
            <Card className="bg-[#FFF8E1] rounded-xl shadow-sm border border-[#D4AF37]/30 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-[#D4AF37]/20 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">Important Note</h3>
                    <p className="text-xs text-gray-600">
                      In case of an emergency or immediate danger, please contact Campus Security directly at{" "}
                      <span className="font-medium text-[#800000]">+1 (555) 123-4567</span> or call{" "}
                      <span className="font-medium text-[#800000]">911</span>.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Form and Help Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            {/* Incident Form */}
            <div className="space-y-6">
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="border-b border-gray-100">
                  <div className="flex items-center gap-2 p-6">
                    <FileText className="text-[#800000] h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-800">Incident Information</h2>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="incidentType" className="text-sm font-medium flex items-center">
                        Incident Type <span className="text-[#800000] ml-1">*</span>
                        <div className="flex items-center ml-1.5">
                          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500 ml-1.5">
                            Specify the type of incident (e.g., theft, vandalism, harassment)
                          </span>
                        </div>
                      </Label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                        <Input
                          id="incidentType"
                          name="incidentType"
                          placeholder="E.g., Theft, Vandalism, Harassment"
                          value={formData.incidentType}
                          onChange={handleInputChange}
                          className={`pl-10 border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg ${formErrors.incidentType ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                        />
                      </div>
                      {formErrors.incidentType && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.incidentType}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfIncident" className="text-sm font-medium flex items-center">
                          Date of Incident <span className="text-[#800000] ml-1">*</span>
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                          <Input
                            id="dateOfIncident"
                            type="date"
                            name="dateOfIncident"
                            value={formData.dateOfIncident}
                            onChange={handleInputChange}
                            max={new Date().toISOString().split("T")[0]}
                            className={`pl-10 border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg ${formErrors.dateOfIncident ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                          />
                        </div>
                        {formErrors.dateOfIncident && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {formErrors.dateOfIncident}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timeOfIncident" className="text-sm font-medium flex items-center">
                          Time of Incident <span className="text-[#800000] ml-1">*</span>
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                          <Input
                            id="timeOfIncident"
                            type="time"
                            name="timeOfIncident"
                            value={formData.timeOfIncident}
                            onChange={handleInputChange}
                            className={`pl-10 border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg ${formErrors.timeOfIncident ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                          />
                        </div>
                        {formErrors.timeOfIncident && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {formErrors.timeOfIncident}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium flex items-center">
                        Location <span className="text-[#800000] ml-1">*</span>
                        <div className="flex items-center ml-1.5">
                          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500 ml-1.5">
                            Be as specific as possible about where the incident occurred (building, room, area)
                          </span>
                        </div>
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#800000]/70" />
                        <Input
                          id="location"
                          name="location"
                          placeholder="Building, room number, or specific area"
                          value={formData.location}
                          onChange={handleInputChange}
                          className={`pl-10 border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg ${formErrors.location ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                        />
                      </div>
                      {formErrors.location && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.location}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </Card>

              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="border-b border-gray-100">
                  <div className="flex items-center gap-2 p-6">
                    <FileText className="text-[#800000] h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-800">Incident Description</h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium flex items-center">
                      Description <span className="text-[#800000] ml-1">*</span>
                      <div className="flex items-center ml-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 ml-1.5">
                          Provide a detailed account of what happened, including any relevant context
                        </span>
                      </div>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe what happened in detail. Include who was involved, what occurred, and any other relevant information."
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`min-h-[150px] border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 rounded-lg resize-none ${formErrors.description ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                    />
                    <div className="flex justify-between items-center">
                      <div
                        className={`text-xs ${formData.description.length > 1000 ? "text-red-500" : "text-gray-500"}`}
                      >
                        {formData.description.length}/1000 characters
                      </div>
                      {formErrors.description && (
                        <p className="text-red-500 text-xs flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <Button
                        type="button"
                        onClick={handleGenerateTags}
                        className={`bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white rounded-full px-4 py-2 h-10 flex items-center gap-2 ${tagsLoading || !formData.description || !formData.location ? "opacity-70 cursor-not-allowed" : ""}`}
                        disabled={tagsLoading || !formData.description || !formData.location}
                      >
                        {tagsLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Generating Tags...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Generate Tags with AI</span>
                          </>
                        )}
                      </Button>

                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Info className="h-4 w-4 text-[#800000]/70" />
                        <span>Select up to 5 tags that apply to this incident</span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isGeneratingTags && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mb-4"
                        >
                          <div className="bg-[#800000]/5 rounded-lg p-4 border border-[#800000]/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-[#800000]" />
                              <p className="text-sm font-medium text-[#800000]">AI is analyzing your description...</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {tagsError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{tagsError}</span>
                      </div>
                    )}

                    {tags.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-4"
                      >
                        <div className="bg-[#800000]/5 rounded-lg p-4 border border-[#800000]/10">
                          <div className="flex items-center gap-2 mb-3">
                            <Tag className="h-4 w-4 text-[#800000]" />
                            <p className="text-sm font-medium text-[#800000]">Suggested Tags</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant={selectedTags.includes(tag) ? "default" : "secondary"}
                                className={`cursor-pointer select-none transition-all duration-200 px-3 py-1 text-sm ${
                                  selectedTags.includes(tag)
                                    ? "bg-[#800000] hover:bg-[#600000] text-white"
                                    : "bg-white hover:bg-[#800000]/10 text-gray-700 border border-gray-200"
                                }`}
                                onClick={() => handleTagClick(tag)}
                              >
                                {selectedTags.includes(tag) && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {tagSelectError && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{tagSelectError}</span>
                      </div>
                    )}

                    {/* Selected Tags Section */}
                    {selectedTags.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mb-4"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-700">Selected Tags</h3>
                            <div className="flex items-center gap-1">
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500">Tags that will be associated with your report</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.length === 0 ? (
                              <p className="text-sm text-gray-500">No tags selected</p>
                            ) : (
                              selectedTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-[#800000]/10 text-[#800000] hover:bg-[#800000]/20"
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleTagClick(tag)}
                                    className="ml-1 hover:text-[#800000]/80"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            )}
                          </div>

                          {selectedTags.length > 0 && (
                            <Card className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="p-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                  <Info className="h-4 w-4 text-[#800000]" />
                                  What happens next?
                                </h3>

                                <ol className="space-y-3 relative border-l border-gray-200 pl-6 ml-2">
                                  {[
                                    { title: "Evidence Collection", desc: "You'll be asked to provide photos or videos" },
                                    { title: "Review & Submit", desc: "Verify all information before final submission" },
                                    { title: "Confirmation", desc: "You'll receive a tracking number for your report" },
                                    { title: "Investigation", desc: "Security team will review and respond to your report" },
                                  ].map((step, index) => (
                                    <li key={index} className="relative">
                                      <div className="absolute -left-[29px] flex items-center justify-center w-6 h-6 rounded-full bg-[#800000] text-white text-xs">
                                        {index + 1}
                                      </div>
                                      <h4 className="text-sm font-medium text-gray-800">{step.title}</h4>
                                      <p className="text-xs text-gray-500">{step.desc}</p>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            </Card>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset Form
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white rounded-full px-6 flex items-center gap-2"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Help Section */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#800000] to-[#9a0000] text-white rounded-xl shadow-md overflow-hidden border-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <HelpCircle size={20} /> Need Help?
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
                      onClick={() => setShowTips(!showTips)}
                    >
                      {showTips ? <X size={16} /> : <Info size={16} />}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showTips && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-white/90 mb-2">Reporting Tips</h3>
                            <ul className="space-y-3">
                              {[
                                { icon: <MapPin size={16} />, text: "Be as specific as possible about the location" },
                                { icon: <Clock size={16} />, text: "Include time details even if approximate" },
                                {
                                  icon: <FileText size={16} />,
                                  text: "Photos and videos help security respond effectively",
                                },
                                {
                                  icon: <AlertTriangle size={16} />,
                                  text: "Mention any witnesses who can provide additional information",
                                },
                              ].map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                                  <div className="mt-0.5 bg-white/10 p-1.5 rounded-full">{tip.icon}</div>
                                  <span>{tip.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the form? All entered data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReset}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              Reset Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
