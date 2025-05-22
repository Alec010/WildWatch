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
} from "lucide-react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { API_BASE_URL } from "@/utils/api"
import { motion } from "framer-motion"

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
  const [selected, setSelected] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [priorityFilter, setPriorityFilter] = useState<string>("All")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const incidentsPerPage = 5
  const router = useRouter()

  const fetchIncidents = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/api/incidents/my-incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      // Only show Resolved or Dismissed (case-insensitive)
      setIncidents(data.filter((i: Incident) => ["resolved", "dismissed"].includes(i.status.toLowerCase())))
    } catch (e) {
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

  const handleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleExport = () => {
    // Simple CSV export
    const csv = [
      [
        "Case ID",
        "Date Reported",
        "Incident Type",
        "Location",
        "Reporter",
        "Priority",
        "Status",
        "Department",
        "Finished Date",
      ].join(","),
      ...filteredIncidents.map((i) =>
        [
          i.trackingNumber,
          i.dateOfIncident,
          i.incidentType,
          i.location,
          i.submittedByFullName,
          i.priorityLevel,
          i.status,
          i.officeAdminName || "-",
          i.finishedDate ? new Date(i.finishedDate).toLocaleDateString() : "-",
        ].join(","),
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "incident_history.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Helper function to load image from URL
  const loadImageFromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Function to download incident details as PDF (all fields, styled)
  const handleDownloadPDF = async (incident: any) => {
    setIsDownloading(true)
    try {
      // Create a new PDF document with better margins
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Manually track page numbers
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

      // Helper function to add a section title with modern styling
      const addSectionTitle = (title: string) => {
        // Add a gradient-like header
        doc.setFillColor(128, 0, 0) // Maroon background
        doc.rect(margin - 2, y - 2, contentWidth + 4, 10, "F")

        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.setTextColor(255, 255, 255) // White text
        doc.text(title, margin + 2, y + 5)
        y += 14

        // Reset text color and font
        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
      }

      // Helper function to add text with proper wrapping
      const addWrappedText = (text: string, indent = 0, isBold = false) => {
        if (isBold) {
          doc.setFont("helvetica", "bold")
        }
        const lines = doc.splitTextToSize(text, contentWidth - indent)
        doc.text(lines, margin + indent, y)
        y += lines.length * lineHeight
        if (isBold) {
          doc.setFont("helvetica", "normal")
        }
      }

      // Helper function to add a field with label and value in a two-column layout
      const addField = (label: string, value: string, isLeft = true) => {
        doc.setFont("helvetica", "bold")
        doc.text(label + ":", isLeft ? margin : margin + 85, y)
        doc.setFont("helvetica", "normal")

        // Calculate available width for value
        const valueWidth = isLeft ? 75 : 85
        const valueX = isLeft ? margin + 30 : margin + 85 + 30

        const lines = doc.splitTextToSize(value, valueWidth)
        doc.text(lines, valueX, y)

        return lines.length * lineHeight
      }

      // Helper function to add a row with two fields
      const addFieldRow = (leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) => {
        const leftHeight = addField(leftLabel, leftValue, true)
        const rightHeight = addField(rightLabel, rightValue, false)
        y += Math.max(leftHeight, rightHeight)
      }

      // Helper function to add a horizontal line
      const addHorizontalLine = () => {
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, y, margin + contentWidth, y)
        y += 5
      }

      // Helper function to add footer to current page
      const addFooter = (pageNum: number, totalPages: number) => {
        // Footer background
        doc.setFillColor(245, 245, 245)
        doc.rect(0, 280, 210, 17, "F")

        // Add horizontal line
        doc.setDrawColor(128, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(margin, 280, margin + contentWidth, 280)

        // Add page number
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Page ${pageNum} of ${totalPages}`, margin, 287)

        // Add generation date
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          margin + contentWidth,
          287,
          { align: "right" },
        )

        // Add case ID reference
        doc.setTextColor(128, 0, 0)
        doc.text(`Case ID: ${incident.trackingNumber}`, 105, 287, { align: "center" })
      }

      // Helper function to check and add new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight) {
          // Add footer to current page before adding a new one
          addFooter(currentPage, pageCount)

          // Add new page
          doc.addPage()
          currentPage++
          pageCount = Math.max(pageCount, currentPage)
          y = 20
          return true
        }
        return false
      }

      // Add a professional header with logo placeholder
      // Header background
      doc.setFillColor(245, 245, 245)
      doc.rect(0, 0, 210, 40, "F")

      // Logo placeholder (could be replaced with actual logo)
      // doc.setFillColor(128, 0, 0)
      // doc.circle(30, 20, 10, "F")

      // Add the WildWatch logo
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = "anonymous"
        logoImg.src = "/logo2.png"

        // Wait for the image to load
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
        })

        // Calculate logo dimensions (maintain aspect ratio, height of ~25mm)
        const logoHeight = 25
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight

        // Position the logo on the left side of the header
        doc.addImage(logoImg, "PNG", 20, 8, logoWidth, logoHeight)
      } catch (error) {
        console.error("Error loading logo:", error)
        // Fallback to a colored circle if logo fails to load
        doc.setFillColor(128, 0, 0)
        doc.circle(30, 20, 10, "F")
      }

      // Title with better typography
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(128, 0, 0) // Maroon color
      doc.text("WildWatch", 105, 20, { align: "center" })

      doc.setFontSize(16)
      doc.setTextColor(80, 80, 80) // Dark gray
      doc.text("Incident Report", 105, 30, { align: "center" })

      y = 50 // Start content after header

      // Reset text color and font
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")

      // Add a visual separator
      doc.setDrawColor(128, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(margin, 45, margin + contentWidth, 45)

      // Case Information Section with two-column layout
      addSectionTitle("Case Information")

      // Add case ID and status in first row
      addFieldRow("Case ID", incident.trackingNumber, "Status", incident.status)

      // Add priority and department in second row
      addFieldRow("Priority", incident.priorityLevel || "-", "Department", incident.officeAdminName || "-")

      // Add dates in third row
      addFieldRow(
        "Submitted",
        new Date(incident.submittedAt).toLocaleDateString(),
        "Finished Date",
        incident.finishedDate ? new Date(incident.finishedDate).toLocaleDateString() : "-",
      )

      y += sectionSpacing

      // Incident Details Section
      addSectionTitle("Incident Details")

      // Add incident type and location in first row
      addFieldRow("Incident Type", incident.incidentType, "Location", incident.location)

      // Add date reported in second row
      addFieldRow("Date Reported", new Date(incident.dateOfIncident).toLocaleDateString(), "", "")

      // Add description with full width
      doc.setFont("helvetica", "bold")
      doc.text("Description:", margin, y)
      doc.setFont("helvetica", "normal")
      y += lineHeight

      // Add description text in a box with light background
      const descriptionText = incident.description || "-"
      const descLines = doc.splitTextToSize(descriptionText, contentWidth - 4)

      // Add light gray background for description
      doc.setFillColor(248, 248, 248)
      doc.roundedRect(margin, y - 4, contentWidth, descLines.length * lineHeight + 8, 2, 2, "F")

      doc.text(descLines, margin + 2, y + 2)
      y += descLines.length * lineHeight + 10

      // Reporter Information Section
      addSectionTitle("Reporter Information")

      // Add reporter name and email in first row
      addFieldRow("Reporter", incident.submittedByFullName, "Email", incident.submittedByEmail || "-")

      // Add phone in second row if available
      if (incident.submittedByPhone) {
        addFieldRow("Phone", incident.submittedByPhone, "", "")
      }

      y += sectionSpacing

      // Evidence Section with improved layout
      if (incident.evidence && Array.isArray(incident.evidence) && incident.evidence.length > 0) {
        checkNewPage(40) // Check if we need a new page
        addSectionTitle("Evidence")

        // Process images in parallel
        const imagePromises = incident.evidence
          .filter((file: EvidenceFile) => file.fileType.startsWith("image/"))
          .map(async (file: EvidenceFile) => {
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
              }
            } catch (error) {
              console.error("Error loading image:", error)
              return null
            }
          })

        const loadedImages = await Promise.all(imagePromises)

        // Add non-image files first
        const nonImageFiles = incident.evidence.filter((file: EvidenceFile) => !file.fileType.startsWith("image/"))

        if (nonImageFiles.length > 0) {
          addWrappedText("Documents:", 0, true)
          y += 5

          // Create a manual table header
          doc.setFillColor(240, 240, 240)
          doc.rect(margin, y, contentWidth, 10, "F")
          doc.setFont("helvetica", "bold")
          doc.text("File Name", margin + 5, y + 7)
          doc.text("Type", margin + 85, y + 7)
          doc.text("Size", margin + 140, y + 7)
          doc.setFont("helvetica", "normal")
          y += 15

          // Add table rows manually
          nonImageFiles.forEach((file: EvidenceFile) => {
            const fileName = file.fileName
            const fileType = file.fileType
            const fileSize = `${(file.fileSize / 1024).toFixed(1)} KB`

            // Truncate filename if too long
            const truncatedName = fileName.length > 40 ? fileName.substring(0, 37) + "..." : fileName

            doc.text(truncatedName, margin + 5, y)
            doc.text(fileType, margin + 85, y)
            doc.text(fileSize, margin + 140, y)

            // Add a light separator line
            doc.setDrawColor(230, 230, 230)
            doc.line(margin, y + 5, margin + contentWidth, y + 5)

            y += 10
          })

          y += 10
        }

        // Add loaded images in a grid layout
        if (loadedImages.some((img) => img !== null)) {
          addWrappedText("Images:", 0, true)
          y += 5

          // Calculate optimal image display size and layout
          const imageGap = 15 // Gap between images
          const imageContainerPadding = 10 // Padding inside each image container
          const captionHeight = 15 // Height for the caption

          // Calculate available width for the grid
          const availableWidth = contentWidth

          // Determine optimal image size
          const optimalImageWidth = (availableWidth - imageGap) / 2 - imageContainerPadding * 2
          const maxImageHeight = 100 // Maximum height for any image

          // Process images in rows of 2
          let currentRow = []

          // Group images into rows of 2
          for (let i = 0; i < loadedImages.length; i++) {
            if (!loadedImages[i]) continue

            currentRow.push(loadedImages[i])

            // Process row when we have 2 images or it's the last image
            if (currentRow.length === 2 || i === loadedImages.length - 1) {
              // Calculate row height based on the tallest image in the row
              let rowImageHeight = 0

              // First pass: determine scaled heights
              currentRow.forEach((imageData) => {
                // Calculate scaled height while maintaining aspect ratio
                let scaledHeight = (imageData.imgHeight / imageData.imgWidth) * optimalImageWidth

                // Cap height if needed
                if (scaledHeight > maxImageHeight) {
                  scaledHeight = maxImageHeight
                }

                rowImageHeight = Math.max(rowImageHeight, scaledHeight)
              })

              // Calculate total row height including container and caption
              const totalRowHeight = rowImageHeight + imageContainerPadding * 2 + captionHeight + 10

              // Check if we need a new page
              if (y + totalRowHeight > pageHeight - 20) {
                // Add footer to current page
                addFooter(currentPage, pageCount)

                // Add new page
                doc.addPage()
                currentPage++
                pageCount = Math.max(pageCount, currentPage)
                y = 20

                // Add section header on new page
                addWrappedText("Images (continued):", 0, true)
                y += 5
              }

              // Second pass: render the images in the row
              let xPosition = margin

              currentRow.forEach((imageData) => {
                // Calculate scaled dimensions while maintaining aspect ratio
                let scaledWidth = optimalImageWidth
                let scaledHeight = (imageData.imgHeight / imageData.imgWidth) * optimalImageWidth

                // Cap height if needed
                if (scaledHeight > maxImageHeight) {
                  scaledHeight = maxImageHeight
                  scaledWidth = (imageData.imgWidth / imageData.imgHeight) * maxImageHeight
                }

                // Center the image horizontally within its container
                const xOffset = (optimalImageWidth - scaledWidth) / 2

                // Add shadow effect (light gray rectangle offset slightly)
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

                // Image container
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

                // Add the image centered in the container
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

                // Add filename below image
                doc.setFontSize(8)
                const filenameLines = doc.splitTextToSize(imageData.fileName, optimalImageWidth)
                doc.text(
                  filenameLines,
                  xPosition + imageContainerPadding,
                  y + imageContainerPadding + rowImageHeight + 10,
                )
                doc.setFontSize(11)

                // Move to next position
                xPosition += optimalImageWidth + imageContainerPadding * 2 + imageGap
              })

              // Move to next row
              y += rowImageHeight + imageContainerPadding * 2 + captionHeight + 15

              // Clear current row
              currentRow = []
            }
          }

          // Add some space after the images
          y += 5
        }
      }

      // Witnesses Section with table layout
      if (incident.witnesses && Array.isArray(incident.witnesses) && incident.witnesses.length > 0) {
        checkNewPage(40)
        addSectionTitle("Witnesses")

        // Create a manual table header
        doc.setFillColor(128, 0, 0)
        doc.rect(margin, y, contentWidth, 10, "F")
        doc.setFont("helvetica", "bold")
        doc.setTextColor(255, 255, 255)
        doc.text("#", margin + 5, y + 7)
        doc.text("Name", margin + 20, y + 7)
        doc.text("Notes", margin + 85, y + 7)
        doc.setTextColor(0, 0, 0)
        doc.setFont("helvetica", "normal")
        y += 15

        // Add table rows manually
        incident.witnesses.forEach((witness: any, idx: number) => {
          const witnessNum = (idx + 1).toString()
          const witnessName = witness.name || "(witness)"
          const witnessNotes = witness.additionalNotes || "-"

          // Alternate row background for better readability
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248)
            doc.rect(margin, y - 5, contentWidth, 12, "F")
          }

          doc.text(witnessNum, margin + 5, y)
          doc.text(witnessName, margin + 20, y)

          // Handle notes that might be long
          const noteLines = doc.splitTextToSize(witnessNotes, 85)
          doc.text(noteLines, margin + 85, y)

          // Adjust y position based on number of lines in notes
          const lineHeight = Math.max(noteLines.length * 7, 12)
          y += lineHeight + 5
        })

        y += 10
      }

      // Updates Section with timeline style
      if (incident.updates && Array.isArray(incident.updates) && incident.updates.length > 0) {
        checkNewPage(40)
        addSectionTitle("Case Updates")

        // Create a timeline-style layout for updates
        incident.updates.forEach((update: any, idx: number) => {
          // Check if we need a new page
          if (checkNewPage(30)) {
            addSectionTitle("Case Updates (continued)")
          }

          // Timeline dot
          doc.setFillColor(128, 0, 0)
          doc.circle(margin + 4, y + 4, 3, "F")

          // Timeline line
          if (idx < incident.updates.length - 1) {
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.5)
            doc.line(margin + 4, y + 8, margin + 4, y + 30)
          }

          // Update content box
          doc.setFillColor(248, 248, 248)
          doc.roundedRect(margin + 10, y - 2, contentWidth - 10, 24, 2, 2, "F")

          // Update title
          doc.setFont("helvetica", "bold")
          doc.text(update.title || update.status || `Update ${idx + 1}`, margin + 15, y + 5)

          // Update date and author
          doc.setFont("helvetica", "normal")
          doc.setFontSize(9)
          const updateDate = update.updatedAt ? new Date(update.updatedAt).toLocaleDateString() : "-"
          const updateAuthor = update.updatedByName || update.updatedByFullName || update.author || "-"
          doc.text(`${updateDate} by ${updateAuthor}`, margin + 15, y + 13)

          // Update message
          if (update.message || update.description) {
            const updateMsg = update.message || update.description
            const msgLines = doc.splitTextToSize(updateMsg, contentWidth - 20)
            doc.text(msgLines, margin + 15, y + 20)
          }

          // Move to next update
          y += 30
          doc.setFontSize(11)
        })
      }

      // Add footer to the last page
      addFooter(currentPage, pageCount)

      // Go back to each page and add the footer with the correct total page count
      for (let i = 1; i < currentPage; i++) {
        doc.setPage(i)
        addFooter(i, pageCount)
      }

      // Save the document
      doc.save(`Incident_Report_${incident.trackingNumber}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
      <Sidebar />
      <div className="flex-1 p-8 max-w-[1700px] mx-auto ml-64">
        {/* Loading Modal */}
        {isDownloading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000]"></div>
              <p className="text-gray-700 font-medium">Generating PDF...</p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="relative mb-8">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#8B0000] to-[#DAA520]"></div>
          <div className="pl-6">
            <h1 className="text-2xl font-bold text-[#8B0000] mb-1 flex items-center gap-2">
              <History className="h-7 w-7 mr-2 text-[#8B0000]" /> Incident History
            </h1>
            <p className="text-gray-600">View and access your past incident reports</p>
          </div>
        </div>

        {/* Search and Export */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-[#DAA520] focus:border-[#8B0000] focus:ring-[#8B0000]/20"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button
            onClick={handleExport}
            className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] hover:from-[#7B0000] hover:to-[#5B0000] text-white transition-all duration-300"
          >
            <Download className="h-5 w-5 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-white p-6 rounded-lg shadow-sm border-l-4 transition-all duration-200 ${
              statusFilter === "All" ? "border-[#8B0000]" : "border-transparent"
            }`}
            onClick={() => setStatusFilter("All")}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#8B0000]">{incidents.length}</div>
                <div className="text-gray-600 font-medium">All Cases</div>
              </div>
              <div className="bg-[#8B0000]/10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-[#8B0000]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`bg-white p-6 rounded-lg shadow-sm border-l-4 transition-all duration-200 ${
              statusFilter === "Resolved" ? "border-[#DAA520]" : "border-transparent"
            }`}
            onClick={() => setStatusFilter("Resolved")}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#DAA520]">
                  {incidents.filter((i) => i.status === "Resolved").length}
                </div>
                <div className="text-gray-600 font-medium">Resolved</div>
              </div>
              <div className="bg-[#DAA520]/10 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-[#DAA520]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`bg-white p-6 rounded-lg shadow-sm border-l-4 transition-all duration-200 ${
              statusFilter === "Dismissed" ? "border-gray-500" : "border-transparent"
            }`}
            onClick={() => setStatusFilter("Dismissed")}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-500">
                  {incidents.filter((i) => i.status === "Dismissed").length}
                </div>
                <div className="text-gray-600 font-medium">Dismissed</div>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Priority Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-[#8B0000]" />
            <h3 className="font-medium text-gray-800">Priority Filter</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "HIGH", "MEDIUM", "LOW"].map((priority) => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  priorityFilter === priority
                    ? priority === "HIGH"
                      ? "bg-red-500 text-white shadow-sm"
                      : priority === "MEDIUM"
                        ? "bg-orange-500 text-white shadow-sm"
                        : priority === "LOW"
                          ? "bg-green-500 text-white shadow-sm"
                          : "bg-[#8B0000] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {priority === "All" ? priority : priority.charAt(0) + priority.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#8B0000] flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Incident Records
            </h2>
            <Button
              variant="outline"
              size="icon"
              className={`border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000]/10 transition-all duration-200 ${isRefreshing ? "opacity-50" : ""}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#8B0000]/5 to-[#DAA520]/5 text-left">
                  <th className="p-4 font-semibold text-gray-700">Case ID</th>
                  <th className="p-4 font-semibold text-gray-700">Date</th>
                  <th className="p-4 font-semibold text-gray-700">Type</th>
                  <th className="p-4 font-semibold text-gray-700">Location</th>
                  <th className="p-4 font-semibold text-gray-700">Reporter</th>
                  <th className="p-4 font-semibold text-gray-700">Priority</th>
                  <th className="p-4 font-semibold text-gray-700">Status</th>
                  <th className="p-4 font-semibold text-gray-700">Department</th>
                  <th className="p-4 font-semibold text-gray-700">Finished</th>
                  <th className="p-4 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
                          <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin animation-delay-150"></div>
                        </div>
                        <p className="text-gray-500 font-medium">Loading incident history...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No incidents found</h3>
                        <p className="text-gray-500 max-w-md">
                          We couldn't find any incidents matching your current filters. Try adjusting your search or
                          filters.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setStatusFilter("All")
                            setPriorityFilter("All")
                            setSearch("")
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((incident, index) => (
                    <motion.tr
                      key={incident.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-[#f8f5f5] transition-colors"
                    >
                      <td className="p-4 font-mono text-[#8B0000] font-medium">{incident.trackingNumber}</td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(incident.submittedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={
                            incident.incidentType === "Suspicious Activity"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : incident.incidentType === "Theft"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : incident.incidentType === "Vandalism"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : incident.incidentType === "Harassment"
                                    ? "bg-pink-100 text-pink-700 border-pink-200"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {incident.incidentType}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {incident.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {incident.submittedByFullName}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={
                            incident.priorityLevel === "HIGH"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : incident.priorityLevel === "MEDIUM"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : incident.priorityLevel === "LOW"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {incident.priorityLevel}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={
                            incident.status.toLowerCase() === "resolved"
                              ? "bg-[#DAA520]/20 text-[#8B4513] border-[#DAA520]/30"
                              : incident.status.toLowerCase() === "dismissed"
                                ? "bg-gray-100 text-gray-700 border-gray-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {incident.status.toLowerCase() === "dismissed" ? "Dismissed" : incident.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-700">{incident.officeAdminName || "-"}</td>
                      <td className="p-4 text-gray-700">
                        {incident.finishedDate ? new Date(incident.finishedDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000]/10 hover:text-[#8B0000]"
                            onClick={() => router.push(`/incidents/tracking/${incident.trackingNumber}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-[#DAA520] text-[#DAA520] hover:bg-[#DAA520]/10 hover:text-[#DAA520]"
                            onClick={() => handleDownloadPDF(incident)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && paginatedIncidents.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100">
              <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                Showing {(page - 1) * incidentsPerPage + 1}-
                {Math.min(page * incidentsPerPage, filteredIncidents.length)} of {filteredIncidents.length} incidents
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  &lt;
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show first page, last page, current page, and pages around current
                  let pageToShow = i + 1
                  if (totalPages > 5) {
                    if (page <= 3) {
                      pageToShow = i + 1
                    } else if (page >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i
                    } else {
                      pageToShow = page - 2 + i
                    }
                  }

                  return (
                    <Button
                      key={pageToShow}
                      variant={page === pageToShow ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageToShow)}
                      className={
                        page === pageToShow
                          ? "bg-[#8B0000] hover:bg-[#6B0000] text-white"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }
                    >
                      {pageToShow}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  &gt;
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add custom styles for animation delays */}
      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}
