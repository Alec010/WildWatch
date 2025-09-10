"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  History,
  Download,
  Eye,
  Filter,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { API_BASE_URL } from "@/utils/api"
import { motion } from "framer-motion"
import { useSidebar } from "@/contexts/SidebarContext"
import { Toaster, toast } from "sonner"
import { Navbar } from "@/components/Navbar"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

interface Incident {
  id: string
  trackingNumber: string
  dateOfIncident: string
  submittedAt: string
  incidentType: string
  location: string
  submittedByFullName: string
  priorityLevel: "HIGH" | "MEDIUM" | "LOW" | null
  status: string
  officeAdminName?: string
  finishedDate?: string
  description?: string
  submittedByEmail?: string
  submittedByPhone?: string
  evidence?: any[]
  witnesses?: any[]
  updates?: any[]
}

interface EvidenceFile {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
}

export default function IncidentHistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [priorityFilter, setPriorityFilter] = useState<string>("All")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { collapsed } = useSidebar()

  const incidentsPerPage = 5
  const router = useRouter()

  useEffect(() => {
    // Get status from URL query parameter
    const searchParams = new URLSearchParams(window.location.search)
    const statusFromUrl = searchParams.get("status")
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl)
    }
  }, [])

  const fetchIncidents = async () => {
    try {
      setError(null)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      if (!token) {
        throw new Error("No authentication token found")
      }
      const res = await fetch(`${API_BASE_URL}/api/incidents/my-incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      // Only show Resolved or Dismissed (case-insensitive)
      setIncidents(data.filter((i: Incident) => ["resolved", "dismissed"].includes(i.status.toLowerCase())))
    } catch (e) {
      console.error("Error fetching incidents:", e)
      setError(e instanceof Error ? e.message : "Failed to load incidents")
      setIncidents([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchIncidents()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchIncidents()
  }

  const filteredIncidents = incidents.filter(
    (i) =>
      (statusFilter === "All" || i.status === statusFilter) &&
      (priorityFilter === "All" ||
        (i.priorityLevel && i.priorityLevel.toLowerCase() === priorityFilter.toLowerCase())) &&
      (i.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.incidentType.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase()) ||
        i.status.toLowerCase().includes(search.toLowerCase())),
  )

  const paginatedIncidents = filteredIncidents.slice((page - 1) * incidentsPerPage, page * incidentsPerPage)

  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage)

  // Calculate statistics
  const resolvedCount = incidents.filter((i) => i.status.toLowerCase() === "resolved").length
  const dismissedCount = incidents.filter((i) => i.status.toLowerCase() === "dismissed").length
  const highPriorityCount = incidents.filter((i) => i.priorityLevel === "HIGH").length
  const mediumPriorityCount = incidents.filter((i) => i.priorityLevel === "MEDIUM").length
  const lowPriorityCount = incidents.filter((i) => i.priorityLevel === "LOW").length

  // Function to download incident details as PDF
  const handleDownloadPDF = async (incident: any) => {
    setIsDownloading(true)
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      let currentPage = 1
      let pageCount = 1
      let y = 20
      const margin = 20
      const contentWidth = 170
      const lineHeight = 7
      const sectionSpacing = 8
      const pageHeight = 270

      // Set default font
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)

      // Header with gradient
      const createGradient = (x: number, y: number, width: number, height: number) => {
        const steps = 100
        const stepWidth = width / steps
        const colorStops = [
          { r: 139, g: 0, b: 0 },
          { r: 160, g: 40, b: 0 },
          { r: 180, g: 80, b: 0 },
          { r: 200, g: 120, b: 0 },
          { r: 218, g: 165, b: 32 }
        ]
        
        for (let i = 0; i < steps; i++) {
          const ratio = i / (steps - 1)
          const easedRatio = ratio < 0.5
            ? 8 * ratio * ratio * ratio * ratio
            : 1 - Math.pow(-2 * ratio + 2, 4) / 2
          
          const colorIndex = Math.floor(easedRatio * (colorStops.length - 1))
          const nextColorIndex = Math.min(colorIndex + 1, colorStops.length - 1)
          const localRatio = (easedRatio * (colorStops.length - 1)) - colorIndex
          
          const startColor = colorStops[colorIndex]
          const endColor = colorStops[nextColorIndex]
          
          const r = Math.round(startColor.r + (endColor.r - startColor.r) * localRatio)
          const g = Math.round(startColor.g + (endColor.g - startColor.g) * localRatio)
          const b = Math.round(startColor.b + (endColor.b - startColor.b) * localRatio)
          
          doc.setFillColor(r, g, b)
          doc.rect(x + (i * stepWidth), y, stepWidth, height, "F")
        }
      }

      createGradient(0, 0, 210, 40)

      // Add logos
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = "anonymous"
        logoImg.src = "/logo2.png"
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
        })
        const logoHeight = 25
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight
        doc.addImage(logoImg, "PNG", 20, 8, logoWidth, logoHeight)
      } catch (error) {
        doc.setFillColor(255, 255, 255)
        doc.circle(30, 20, 10, "F")
      }

      try {
        const citLogoImg = new Image()
        citLogoImg.crossOrigin = "anonymous"
        citLogoImg.src = "/citlogo.png"
        await new Promise((resolve, reject) => {
          citLogoImg.onload = resolve
          citLogoImg.onerror = reject
        })
        const citLogoHeight = 25
        const citLogoWidth = (citLogoImg.width / citLogoImg.height) * citLogoHeight
        doc.addImage(citLogoImg, "PNG", 210 - 20 - citLogoWidth, 8, citLogoWidth, citLogoHeight)
      } catch (error) {}

      doc.setFontSize(30)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text("WildWatch", 105, 20, { align: "center" })
      doc.setFontSize(20)
      doc.text("Incident Report", 105, 30, { align: "center" })
      y = 50
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setDrawColor(139, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(margin, 45, margin + contentWidth, 45)

      const addSectionTitle = (title: string) => {
        doc.setFillColor(139, 0, 0)
        doc.roundedRect(margin - 2, y - 2, contentWidth + 4, 10, 3, 3, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.setTextColor(255, 255, 255)
        doc.text(title, margin + 2, y + 5)
        y += 14
        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
      }

      const addWrappedText = (text: string, indent = 0, isBold = false) => {
        if (isBold) doc.setFont("helvetica", "bold")
        const lines = doc.splitTextToSize(text, contentWidth - indent)
        doc.text(lines, margin + indent, y)
        y += lines.length * lineHeight
        if (isBold) doc.setFont("helvetica", "normal")
      }

      const addField = (label: string, value: string, isLeft = true) => {
        doc.setFont("helvetica", "bold")
        doc.text(label + ":", isLeft ? margin : margin + 85, y)
        doc.setFont("helvetica", "normal")
        const valueWidth = isLeft ? 75 : 85
        const valueX = isLeft ? margin + 30 : margin + 85 + 30
        const lines = doc.splitTextToSize(value, valueWidth)
        doc.text(lines, valueX, y)
        return lines.length * lineHeight
      }

      const addFieldRow = (leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) => {
        const leftHeight = addField(leftLabel, leftValue, true)
        const rightHeight = addField(rightLabel, rightValue, false)
        y += Math.max(leftHeight, rightHeight)
      }

      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(139, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(margin, 280, margin + contentWidth, 280)
        doc.setFontSize(9)
        doc.setTextColor(139, 0, 0)
        doc.text(`Page ${pageNum} of ${totalPages}`, margin, 287)
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          margin + contentWidth,
          287,
          { align: "right" },
        )
        doc.text(`Case ID: ${incident.trackingNumber}`, 105, 287, { align: "center" })
      }

      const checkNewPage = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight) {
          addFooter(currentPage, pageCount)
          doc.addPage()
          currentPage++
          pageCount = Math.max(pageCount, currentPage)
          y = 20
          return true
        }
        return false
      }

      // Case Information Section
      addSectionTitle("Case Information")
      addFieldRow("Case ID", incident.trackingNumber, "Status", incident.status)
      addFieldRow("Priority", incident.priorityLevel || "-", "Department", incident.officeAdminName || "-")
      addFieldRow(
        "Submitted",
        new Date(incident.submittedAt).toLocaleDateString(),
        "Finished Date",
        incident.finishedDate ? new Date(incident.finishedDate).toLocaleDateString() : "-",
      )
      y += sectionSpacing

      // Incident Details Section
      addSectionTitle("Incident Details")
      addFieldRow("Incident Type", incident.incidentType, "Location", incident.location)
      addFieldRow("Date Reported", new Date(incident.dateOfIncident).toLocaleDateString(), "", "")
      doc.setFont("helvetica", "bold")
      doc.text("Description:", margin, y)
      doc.setFont("helvetica", "normal")
      y += lineHeight
      const descriptionText = incident.description || "-"
      const descLines = doc.splitTextToSize(descriptionText, contentWidth - 4)
      doc.setFillColor(248, 248, 248)
      doc.roundedRect(margin, y - 4, contentWidth, descLines.length * lineHeight + 8, 2, 2, "F")
      doc.text(descLines, margin + 2, y + 2)
      y += descLines.length * lineHeight + 10

      // Reporter Information Section
      addSectionTitle("Reporter Information")
      addFieldRow("Reporter", incident.submittedByFullName, "Email", incident.submittedByEmail || "-")
      if (incident.submittedByPhone) {
        addFieldRow("Phone", incident.submittedByPhone, "", "")
      }
      y += sectionSpacing

      // Evidence Section
      if (incident.evidence && Array.isArray(incident.evidence) && incident.evidence.length > 0) {
        checkNewPage(40)
        addSectionTitle("Evidence")
        const imagePromises = incident.evidence
          .filter((file: any) => file.fileType?.startsWith("image/"))
          .map(async (file: any, index: number) => {
            try {
              const img = new Image()
              img.crossOrigin = "anonymous"
              await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = `${file.fileUrl}?t=${new Date().getTime()}`
              })
              const maxWidth = 75
              const maxHeight = 75
              let imgWidth = img.width
              let imgHeight = img.height
              if (imgWidth > maxWidth) {
                const ratio = maxWidth / imgWidth
                imgWidth = maxWidth
                imgHeight *= ratio
              }
              if (imgHeight > maxHeight) {
                const ratio = maxHeight / imgHeight
                imgWidth *= ratio
                imgHeight = maxHeight
              }
              return {
                img,
                imgWidth,
                imgHeight,
                fileName: file.fileName,
                index: index + 1
              }
            } catch (error) {
              console.error("Error loading image:", error)
              return null
            }
          })
        const loadedImages = await Promise.all(imagePromises)
        if (loadedImages.some((img) => img !== null)) {
          addWrappedText("Images:", 0, true)
          y += 5
          const imageGap = 15
          const imageContainerPadding = 10
          const captionHeight = 15
          const availableWidth = contentWidth
          const optimalImageWidth = (availableWidth - imageGap) / 2 - imageContainerPadding * 2
          const maxImageHeight = 100
          let currentRow = []
          for (let i = 0; i < loadedImages.length; i++) {
            if (!loadedImages[i]) continue
            currentRow.push(loadedImages[i])
            if (currentRow.length === 2 || i === loadedImages.length - 1) {
              let rowImageHeight = 0
              currentRow.forEach((imageData) => {
                let scaledHeight = (imageData.imgHeight / imageData.imgWidth) * optimalImageWidth
                if (scaledHeight > maxImageHeight) {
                  scaledHeight = maxImageHeight
                }
                rowImageHeight = Math.max(rowImageHeight, scaledHeight)
              })
              const totalRowHeight = rowImageHeight + imageContainerPadding * 2 + captionHeight + 10
              if (y + totalRowHeight > pageHeight - 20) {
                addFooter(currentPage, pageCount)
                doc.addPage()
                currentPage++
                pageCount = Math.max(pageCount, currentPage)
                y = 20
                addWrappedText("Images (continued):", 0, true)
                y += 5
              }
              let xPosition = margin
              currentRow.forEach((imageData) => {
                let scaledWidth = optimalImageWidth
                let scaledHeight = (imageData.imgHeight / imageData.imgWidth) * optimalImageWidth
                if (scaledHeight > maxImageHeight) {
                  scaledHeight = maxImageHeight
                  scaledWidth = (imageData.imgWidth / imageData.imgHeight) * maxImageHeight
                }
                const xOffset = (optimalImageWidth - scaledWidth) / 2
                doc.setFillColor(220, 220, 220)
                doc.roundedRect(
                  xPosition + 2,
                  y + 2,
                  optimalImageWidth + imageContainerPadding * 2,
                  rowImageHeight + imageContainerPadding * 2 + captionHeight,
                  3,
                  3,
                  "F",
                )
                doc.setFillColor(255, 255, 255)
                doc.setDrawColor(200, 200, 200)
                doc.roundedRect(
                  xPosition,
                  y,
                  optimalImageWidth + imageContainerPadding * 2,
                  rowImageHeight + imageContainerPadding * 2 + captionHeight,
                  3,
                  3,
                  "FD",
                )
                doc.addImage(
                  imageData.img,
                  "JPEG",
                  xPosition + imageContainerPadding + xOffset,
                  y + imageContainerPadding,
                  scaledWidth,
                  scaledHeight,
                  undefined,
                  "FAST",
                )
                doc.setFontSize(8)
                const filenameLines = doc.splitTextToSize(`Image ${imageData.index}: ${imageData.fileName}`, optimalImageWidth)
                doc.text(
                  filenameLines,
                  xPosition + imageContainerPadding,
                  y + imageContainerPadding + rowImageHeight + 10,
                )
                doc.setFontSize(11)
                xPosition += optimalImageWidth + imageContainerPadding * 2 + imageGap
              })
              y += rowImageHeight + imageContainerPadding * 2 + captionHeight + 15
              currentRow = []
            }
          }
          y += 5
        }
      }

      // Witnesses Section
      if (incident.witnesses && Array.isArray(incident.witnesses) && incident.witnesses.length > 0) {
        checkNewPage(40)
        addSectionTitle("Witnesses")
        doc.setFont("helvetica", "bold")
        doc.text("#", margin + 5, y + 7)
        doc.text("Name", margin + 20, y + 7)
        doc.text("Notes", margin + 85, y + 7)
        doc.setFont("helvetica", "normal")
        y += 15
        incident.witnesses.forEach((witness: any, idx: number) => {
          const witnessNum = (idx + 1).toString()
          const witnessName = witness.name || "(witness)"
          const witnessNotes = witness.additionalNotes || "-"
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248)
            doc.rect(margin, y - 5, contentWidth, 12, "F")
          }
          doc.text(witnessNum, margin + 5, y)
          doc.text(witnessName, margin + 20, y)
          const noteLines = doc.splitTextToSize(witnessNotes, 85)
          doc.text(noteLines, margin + 85, y)
          const lineHeight = Math.max(noteLines.length * 7, 12)
          y += lineHeight + 5
        })
        y += 10
      }

      // Updates Section
      if (incident.updates && Array.isArray(incident.updates) && incident.updates.length > 0) {
        checkNewPage(40)
        addSectionTitle("Case Updates")
        incident.updates.forEach((update: any, idx: number) => {
          if (checkNewPage(30)) addSectionTitle("Case Updates (continued)")
          doc.setFillColor(128, 0, 0)
          doc.circle(margin + 4, y + 4, 3, "F")
          if (idx < incident.updates.length - 1) {
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.5)
            doc.line(margin + 4, y + 8, margin + 4, y + 30)
          }
          doc.setFillColor(248, 248, 248)
          doc.roundedRect(margin + 10, y - 2, contentWidth - 10, 24, 2, 2, "F")
          doc.setFont("helvetica", "bold")
          doc.text(update.title || update.status || `Update ${idx + 1}`, margin + 15, y + 5)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(9)
          const updateDate = update.updatedAt ? new Date(update.updatedAt).toLocaleDateString() : "-"
          const updateAuthor = update.updatedByName || update.updatedByFullName || update.author || "-"
          doc.text(`${updateDate} by ${updateAuthor}`, margin + 15, y + 13)
          if (update.message || update.description) {
            const updateMsg = update.message || update.description
            const msgLines = doc.splitTextToSize(updateMsg, contentWidth - 20)
            doc.text(msgLines, margin + 15, y + 20)
          }
          y += 30
          doc.setFontSize(11)
        })
      }

      addFooter(currentPage, pageCount)
      for (let i = 1; i < currentPage; i++) {
        doc.setPage(i)
        addFooter(i, pageCount)
      }
      doc.save(`Incident_Report_${incident.trackingNumber}.pdf`)
      toast.success("PDF Downloaded Successfully", {
        description: `Incident report for ${incident.trackingNumber} has been downloaded.`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to Download PDF", {
        description: "There was an error generating the PDF. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
        <Sidebar />
        <div
          className={`flex-1 flex items-center justify-center transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"}`}
        >
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading incident history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9] ${inter.className}`}>
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
      <Navbar
        title="Incident History"
        subtitle="View and access past incident reports"
        showSearch={true}
        searchPlaceholder="Search incidents..."
        onSearch={setSearch}
      />

      {/* Loading Modal */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin animation-delay-300"></div>
            </div>
            <p className="text-gray-700 font-medium">Generating PDF...</p>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-hidden transition-all duration-300 ${collapsed ? "ml-[5rem]" : "ml-64"} pt-24`}>
        <div className={`p-6 -mt-3 mx-8 ${collapsed ? "max-w-[95vw]" : "max-w-[calc(100vw-8rem)]"}`}>
          {/* Status Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-xl shadow-md border overflow-hidden relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                statusFilter === "All" ? "border-[#8B0000] bg-[#fff9f9]" : "border-gray-100"
              }`}
              onClick={() => setStatusFilter("All")}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg shadow-md ${
                      statusFilter === "All"
                        ? "bg-gradient-to-br from-[#8B0000] to-[#6B0000]"
                        : "bg-gradient-to-br from-gray-500 to-gray-600"
                    }`}
                  >
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">All Cases</p>
                    <h3 className="text-3xl font-bold text-[#8B0000]">{incidents.length}</h3>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`bg-white rounded-xl shadow-md border overflow-hidden relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                statusFilter === "Resolved" ? "border-[#8B0000] bg-[#fff9f9]" : "border-gray-100"
              }`}
              onClick={() => setStatusFilter("Resolved")}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg shadow-md ${
                      statusFilter === "Resolved"
                        ? "bg-gradient-to-br from-[#8B0000] to-[#6B0000]"
                        : "bg-gradient-to-br from-green-500 to-green-600"
                    }`}
                  >
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Resolved</p>
                    <h3 className="text-3xl font-bold text-green-500">{resolvedCount}</h3>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className={`bg-white rounded-xl shadow-md border overflow-hidden relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                statusFilter === "Dismissed" ? "border-[#8B0000] bg-[#fff9f9]" : "border-gray-100"
              }`}
              onClick={() => setStatusFilter("Dismissed")}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg shadow-md ${
                      statusFilter === "Dismissed"
                        ? "bg-gradient-to-br from-[#8B0000] to-[#6B0000]"
                        : "bg-gradient-to-br from-gray-500 to-gray-600"
                    }`}
                  >
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Dismissed</p>
                    <h3 className="text-3xl font-bold text-gray-500">{dismissedCount}</h3>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex flex-col gap-4 mb-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                  <Filter className="h-5 w-5 text-[#8B0000]" />
                </div>
                <h3 className="text-lg font-semibold text-[#8B0000]">Priority Filters</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={priorityFilter === "All" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriorityFilter("All")}
                  className={
                    priorityFilter === "All"
                      ? "bg-[#8B0000] hover:bg-[#6B0000]"
                      : "border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                  }
                >
                  All Priorities
                </Button>
                <Button
                  variant={priorityFilter === "HIGH" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriorityFilter("HIGH")}
                  className={
                    priorityFilter === "HIGH"
                      ? "bg-red-600 hover:bg-red-700"
                      : "border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                  }
                >
                  High
                </Button>
                <Button
                  variant={priorityFilter === "MEDIUM" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriorityFilter("MEDIUM")}
                  className={
                    priorityFilter === "MEDIUM"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-orange-200 text-orange-500 hover:bg-orange-500 hover:text-white"
                  }
                >
                  Medium
                </Button>
                <Button
                  variant={priorityFilter === "LOW" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriorityFilter("LOW")}
                  className={
                    priorityFilter === "LOW"
                      ? "bg-green-600 hover:bg-green-700"
                      : "border-green-200 text-green-600 hover:bg-green-600 hover:text-white"
                  }
                >
                  Low
                </Button>
              </div>

              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
          >
            <div className="p-4 border-b border-[#DAA520]/20">
              <div className="flex items-center gap-2">
                <div className="bg-[#8B0000]/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-[#8B0000]" />
                </div>
                <h2 className="text-lg font-semibold text-[#8B0000]">
                  Incident History
                  <span className="ml-2 text-sm bg-[#8B0000]/10 text-[#8B0000] px-2 py-0.5 rounded-full">
                    {filteredIncidents.length}
                  </span>
                </h2>
              </div>
            </div>

            {error ? (
              <div className="p-6 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm inline-flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Incidents</h3>
                    <p className="text-red-700">{error}</p>
                    <Button className="mt-4 bg-[#8B0000] hover:bg-[#6B0000] text-white" onClick={handleRefresh}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#DAA520]/20">
                  <thead className="bg-[#8B0000]/5">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Case ID
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Date Reported
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Incident Type
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Finished Date
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-[#8B0000] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#DAA520]/20">
                    {paginatedIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-6 text-center">
                          <div className="w-16 h-16 bg-[#8B0000]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="h-8 w-8 text-[#8B0000]" />
                          </div>
                          <p className="text-lg font-medium text-gray-800 mb-2">No incidents found</p>
                          <p className="text-gray-500 max-w-md mx-auto">
                            {search || statusFilter !== "All" || priorityFilter !== "All"
                              ? "No incidents match your search criteria. Try adjusting your filters."
                              : "There are no historical incidents to display at this time."}
                          </p>
                          {(search || statusFilter !== "All" || priorityFilter !== "All") && (
                            <Button
                              variant="outline"
                              className="mt-4 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                              onClick={() => {
                                setSearch("")
                                setStatusFilter("All")
                                setPriorityFilter("All")
                              }}
                            >
                              Clear Filters
                            </Button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedIncidents.map((incident, index) => (
                        <motion.tr
                          key={incident.id}
                          className="hover:bg-[#8B0000]/5 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`flex-shrink-0 h-8 w-1 rounded-full mr-3 ${
                                  incident.priorityLevel === "HIGH"
                                    ? "bg-red-400"
                                    : incident.priorityLevel === "MEDIUM"
                                      ? "bg-orange-400"
                                      : "bg-green-400"
                                }`}
                              ></div>
                              <div className="text-sm font-medium text-[#8B0000]">{incident.trackingNumber}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {new Date(incident.submittedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge variant="outline" className={`bg-[#8B0000]/5 text-[#8B0000] border-[#DAA520]/30`}>
                              {incident.incidentType}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.location}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              {incident.submittedByFullName}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge
                              className={
                                incident.priorityLevel === "HIGH"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : incident.priorityLevel === "MEDIUM"
                                    ? "bg-orange-100 text-orange-800 border-orange-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                              }
                            >
                              {incident.priorityLevel || "N/A"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge
                              className={
                                incident.status.toLowerCase() === "resolved"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }
                            >
                              {incident.status.toLowerCase() === "dismissed" ? "Dismissed" : incident.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            {incident.officeAdminName || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                            {incident.finishedDate ? new Date(incident.finishedDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="mr-2 border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                              onClick={() => router.push(`/incidents/tracking/${incident.trackingNumber}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-[#DAA520]/30 text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                              onClick={() => handleDownloadPDF(incident)}
                              disabled={isDownloading}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#DAA520]/20 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {paginatedIncidents.length === 0 ? 0 : (page - 1) * incidentsPerPage + 1}-
                  {(page - 1) * incidentsPerPage + paginatedIncidents.length} of {filteredIncidents.length} incidents
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-[#DAA520]/30"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1
                    return (
                      <Button
                        key={i}
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          page === pageNumber ? "bg-[#8B0000] text-white hover:bg-[#8B0000]/90" : "border-[#DAA520]/30"
                        }`}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}

                  {totalPages > 5 && <span className="px-2 text-gray-500">...</span>}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-[#DAA520]/30"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add custom styles for animation delays */}
      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}