"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { Sidebar } from "@/components/Sidebar"
import { useSidebar } from "@/contexts/SidebarContext"
import { Navbar } from "@/components/Navbar"
import { Toaster } from "sonner"
import { toast } from "sonner"
import {
  AlertTriangle,
  Upload,
  ArrowLeft, 
  Camera,
  X,
  HelpCircle,
  FileText,
  User,
  Phone,
  PenLine,
  ArrowRight,
  Info,
  CheckCircle2,
  Trash2,
  Plus,
  ImageIcon,
  Video,
  File,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface WitnessInfo {
  name: string
  contactInformation: string
  additionalNotes: string
}

interface FileInfo {
  name: string
  size: number
  type: string
  data: string
}

export default function EvidenceSubmissionPage() {
  const router = useRouter()
  const { collapsed } = useSidebar()
  const [formData, setFormData] = useState({
    witnesses: [] as WitnessInfo[],
    fileInfos: [] as FileInfo[],
  })
  const [incidentData, setIncidentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showTips, setShowTips] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const [witnessToDelete, setWitnessToDelete] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [expandedWitness, setExpandedWitness] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedData = sessionStorage.getItem("incidentSubmissionData")
    if (!storedData) {
      router.push("/incidents/submit")
      return
    }
    setIncidentData(JSON.parse(storedData))

    const storedEvidenceData = sessionStorage.getItem("evidenceSubmissionData")
    if (storedEvidenceData) {
      setFormData(JSON.parse(storedEvidenceData))
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (formData.witnesses.length > 0 || formData.fileInfos.length > 0) {
      sessionStorage.setItem("evidenceSubmissionData", JSON.stringify(formData))
    }
  }, [formData])

  const handleAddWitness = () => {
    setFormData((prev) => ({
      ...prev,
      witnesses: [...prev.witnesses, { name: "", contactInformation: "", additionalNotes: "" }],
    }))

    // Expand the newly added witness
    setTimeout(() => {
      setExpandedWitness(formData.witnesses.length)
      // Scroll to the new witness
      const element = document.getElementById(`witness-${formData.witnesses.length}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 100)
  }

  const handleWitnessChange = (index: number, field: keyof WitnessInfo, value: string) => {
    const updatedWitnesses = [...formData.witnesses]
    updatedWitnesses[index] = { ...updatedWitnesses[index], [field]: value }
    setFormData((prev) => ({ ...prev, witnesses: updatedWitnesses }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files))
    }
  }

  const processFiles = async (files: File[]) => {
    // Check file size limit (10MB)
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024)
    const invalidFiles = files.filter((file) => file.size > 10 * 1024 * 1024)

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) exceeded the 10MB limit`, {
        description: "Please upload smaller files.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      })
    }

    if (validFiles.length === 0) return

    // Show loading toast
    const loadingToast = toast.loading(`Processing ${validFiles.length} file(s)...`, {
      description: "Please wait while we process your files.",
    })

    try {
      const fileInfoPromises = validFiles.map(async (file) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
        }
      })

      const newFileInfos = await Promise.all(fileInfoPromises)
      setFormData((prev) => ({
        ...prev,
        fileInfos: [...prev.fileInfos, ...newFileInfos],
      }))

      // Success toast
      toast.success(`${validFiles.length} file(s) uploaded successfully`, {
        description: "Your evidence has been added to the report.",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      })
    } catch (error) {
      toast.error("Error processing files", {
        description: "Please try again or use different files.",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      })
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setFileToDelete(indexToRemove)
    setShowDeleteDialog(true)
  }

  const confirmDeleteFile = () => {
    if (fileToDelete !== null) {
      setFormData((prev) => ({
        ...prev,
        fileInfos: prev.fileInfos.filter((_, index) => index !== fileToDelete),
      }))
      setFileToDelete(null)
      setShowDeleteDialog(false)

      toast.success("File removed", {
        description: "The file has been removed from your evidence.",
      })
    }
  }

  const handleRemoveWitness = (indexToRemove: number) => {
    setWitnessToDelete(indexToRemove)
    setShowDeleteDialog(true)
  }

  const confirmDeleteWitness = () => {
    if (witnessToDelete !== null) {
      setFormData((prev) => ({
        ...prev,
        witnesses: prev.witnesses.filter((_, index) => index !== witnessToDelete),
      }))
      setWitnessToDelete(null)
      setShowDeleteDialog(false)

      toast.success("Witness removed", {
        description: "The witness information has been removed from your report.",
      })
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if there is any evidence (files or witnesses)
    if (formData.fileInfos.length === 0 && formData.witnesses.length === 0) {
      toast.error("Evidence required", {
        description: "Please provide at least one piece of evidence (files or witness information) before proceeding.",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        duration: 5000,
      })
      return
    }

    // Save the current evidence data before navigating
    sessionStorage.setItem("evidenceSubmissionData", JSON.stringify(formData))
    router.push("/incidents/submit/review")
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />
    } else if (fileType.startsWith("video/")) {
      return <Video className="h-6 w-6 text-purple-500" />
    } else {
      return <File className="h-6 w-6 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(2) + " MB"
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
            toast: "bg-white",
            success: "bg-[#dcfce7] border-[#86efac] text-[#166534]",
            error: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
            warning: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
            info: "bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]",
          },
        }}
        theme="light"
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        {/* Navbar */}
        <Navbar title="Report an Incident" subtitle="Submit evidence and witness information" showSearch={false} />

        {/* Content */}
        <div className="pt-24 px-6 pb-10">
          {/* Progress Indicator */}
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#800000]/10 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-[#800000]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#800000] mb-1">Evidence & Witnesses</h1>
                <p className="text-gray-600">
                  Upload photos, videos, or documents and provide information about any witnesses.
                </p>
              </div>
              <div className="md:ml-auto flex-shrink-0 bg-[#800000]/5 rounded-full px-4 py-2 flex items-center">
                <div className="mr-2 text-sm font-medium text-[#800000]">Step 2 of 3</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full">
                <div className="h-full w-2/3 bg-[#800000] rounded-full"></div>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-green-600">Incident Details</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="bg-[#800000] text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium mb-2">
                    2
                  </div>
                  <span className="text-sm font-medium text-[#800000]">Evidence & Witnesses</span>
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
                    <Info className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">Evidence Guidelines</h3>
                    <p className="text-xs text-gray-600">
                      Please provide any evidence that can help in the investigation. This can include photos, videos,
                      or documents. You can also add information about witnesses who saw the incident. At least one
                      piece of evidence (files or witness information) is required.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Form and Help Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            {/* Main Form */}
            <div className="space-y-6">
              {/* Evidence Upload Section */}
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="border-b border-gray-100">
                  <div className="flex items-center gap-2 p-6">
                    <Camera className="text-[#800000] h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-800">Evidence Upload</h2>
                  </div>
                </div>

                <div className="p-6">
                  <div
                    className={`border-2 ${isDragging ? "border-[#800000]" : "border-dashed border-gray-300"} rounded-xl p-8 text-center transition-all duration-200 ${isDragging ? "bg-[#800000]/5" : "bg-gray-50"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      ref={fileInputRef}
                      accept="image/*,video/*"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <div className="mb-4 p-4 bg-[#800000]/10 rounded-full">
                        <Upload className="h-8 w-8 text-[#800000]" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Drag & Drop Files Here</h3>
                      <p className="text-gray-500 mb-4">or</p>
                      <Button
                        type="button"
                        className="bg-[#800000] hover:bg-[#800000]/90 text-white rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Browse Files
                      </Button>
                      <p className="text-xs text-gray-500 mt-4">Supports JPG, PNG, MP4 (Max 10MB each)</p>
                    </Label>
                  </div>

                  {/* Uploaded Files */}
                  <AnimatePresence>
                    {formData.fileInfos.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-8"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-medium text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#800000]" />
                            Uploaded Evidence ({formData.fileInfos.length})
                          </h3>
                          {formData.fileInfos.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 border-gray-200 text-gray-600 hover:text-[#800000] hover:border-[#800000]/20"
                              onClick={() => {
                                fileInputRef.current?.click()
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add More
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {formData.fileInfos.map((file, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="relative group rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="absolute top-2 right-2 z-10">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => handleRemoveFile(index)}
                                  className="h-7 w-7 rounded-full bg-[#800000]/80 hover:bg-[#800000] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {file.type.startsWith("image/") ? (
                                <div className="relative aspect-square">
                                  <Image
                                    src={file.data || "/placeholder.svg"}
                                    alt={file.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : file.type.startsWith("video/") ? (
                                <div className="relative aspect-video bg-black">
                                  <video src={file.data} controls className="w-full h-full" />
                                </div>
                              ) : (
                                <div className="aspect-square flex items-center justify-center bg-gray-100">
                                  <FileText className="h-16 w-16 text-gray-400" />
                                </div>
                              )}

                              <div className="p-3 border-t border-gray-100">
                                <div className="flex items-start gap-2">
                                  {getFileIcon(file.type)}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-700 truncate" title={file.name}>
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>

              {/* Witness Section */}
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="border-b border-gray-100">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-2">
                      <User className="text-[#800000] h-5 w-5" />
                      <h2 className="text-lg font-semibold text-gray-800">Witness Information</h2>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddWitness}
                      className="bg-[#800000] hover:bg-[#800000]/90 text-white rounded-full px-4 h-9 flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Add Witness
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <AnimatePresence>
                    {formData.witnesses.length > 0 ? (
                      <div className="space-y-4">
                        {formData.witnesses.map((witness, index) => (
                          <motion.div
                            key={index}
                            id={`witness-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                            transition={{ duration: 0.3 }}
                            className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                          >
                            <div
                              className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
                              onClick={() => setExpandedWitness(expandedWitness === index ? null : index)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-[#800000]/10 p-2 rounded-full">
                                  <User className="h-5 w-5 text-[#800000]" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-800">
                                    {witness.name ? witness.name : `Witness #${index + 1}`}
                                  </h3>
                                  {witness.contactInformation && (
                                    <p className="text-xs text-gray-500">{witness.contactInformation}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveWitness(index)
                                  }}
                                  className="h-8 w-8 p-0 text-gray-500 hover:text-[#800000] hover:bg-[#800000]/10 rounded-full"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {expandedWitness === index ? (
                                  <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedWitness === index && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                          <User className="h-3.5 w-3.5 text-[#800000]/70" />
                                          Name
                                        </Label>
                                        <Input
                                          value={witness.name}
                                          onChange={(e) => handleWitnessChange(index, "name", e.target.value)}
                                          placeholder="Witness full name"
                                          className="border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                          <Phone className="h-3.5 w-3.5 text-[#800000]/70" />
                                          Contact Information
                                        </Label>
                                        <Input
                                          value={witness.contactInformation}
                                          onChange={(e) =>
                                            handleWitnessChange(index, "contactInformation", e.target.value)
                                          }
                                          placeholder="Email or phone number"
                                          className="border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium flex items-center gap-1.5">
                                        <PenLine className="h-3.5 w-3.5 text-[#800000]/70" />
                                        Additional Notes
                                      </Label>
                                      <Textarea
                                        value={witness.additionalNotes}
                                        onChange={(e) => handleWitnessChange(index, "additionalNotes", e.target.value)}
                                        placeholder="Describe what the witness observed"
                                        className="min-h-[100px] border-gray-200 focus:border-[#800000] focus:ring-[#800000]/20 resize-none"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <div className="mb-3 bg-[#800000]/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                          <User className="h-8 w-8 text-[#800000]" />
                        </div>
                        <h3 className="text-base font-medium text-gray-700 mb-2">No Witnesses Added</h3>
                        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                          If anyone witnessed the incident, add their information to help with the investigation.
                        </p>
                        <Button
                          type="button"
                          onClick={handleAddWitness}
                          className="bg-[#800000] hover:bg-[#800000]/90 text-white rounded-full px-4"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add a Witness
                        </Button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/incidents/submit")}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Incident Details
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-[#800000] to-[#9a0000] hover:from-[#700000] hover:to-[#800000] text-white rounded-full px-6 flex items-center gap-2"
                >
                  Continue to Review
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
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
                            <h3 className="text-sm font-medium text-white/90 mb-2">Evidence Tips</h3>
                            <ul className="space-y-3">
                              {[
                                {
                                  icon: <Camera size={16} />,
                                  text: "Clear photos help identify details and individuals involved",
                                },
                                {
                                  icon: <Video size={16} />,
                                  text: "Videos can capture the sequence of events more effectively",
                                },
                                {
                                  icon: <User size={16} />,
                                  text: "Include contact information for witnesses when possible",
                                },
                                {
                                  icon: <AlertTriangle size={16} />,
                                  text: "At least one piece of evidence (file or witness) is required",
                                },
                              ].map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                                  <div className="mt-0.5 bg-white/10 p-1.5 rounded-full">{tip.icon}</div>
                                  <span>{tip.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-4 border-t border-white/20">
                            <h3 className="text-sm font-medium text-white/90 mb-2">What Happens Next?</h3>
                            <p className="text-sm text-white/80 mb-2">
                              After submitting evidence, you'll review all information before final submission. Your
                              report will be assigned a tracking number for follow-up.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>

              {/* Evidence Summary Card */}
              <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#800000]" />
                    Evidence Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <Camera className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Files</span>
                      </div>
                      <span className="text-lg font-bold text-[#800000]">{formData.fileInfos.length}</span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <User className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Witnesses</span>
                      </div>
                      <span className="text-lg font-bold text-[#800000]">{formData.witnesses.length}</span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#800000]/10 p-2 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-[#800000]" />
                        </div>
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <span
                        className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                          formData.fileInfos.length > 0 || formData.witnesses.length > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {formData.fileInfos.length > 0 || formData.witnesses.length > 0
                          ? "Ready to Continue"
                          : "Evidence Required"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{fileToDelete !== null ? "Remove File" : "Remove Witness"}</DialogTitle>
            <DialogDescription>
              {fileToDelete !== null
                ? "Are you sure you want to remove this file? This action cannot be undone."
                : "Are you sure you want to remove this witness? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setFileToDelete(null)
                setWitnessToDelete(null)
                setShowDeleteDialog(false)
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (fileToDelete !== null) {
                  confirmDeleteFile()
                } else if (witnessToDelete !== null) {
                  confirmDeleteWitness()
                }
              }}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
