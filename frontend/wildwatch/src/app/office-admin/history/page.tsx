"use client"

import { useEffect, useState } from "react"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { History, Download, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { API_BASE_URL } from "@/utils/api"

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

export default function OfficeAdminIncidentHistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
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
      const res = await fetch(`${API_BASE_URL}/api/incidents/office`, {
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
        doc.setFillColor(128, 0, 0) // Maroon background
        doc.rect(margin - 2, y - 2, contentWidth + 4, 10, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.setTextColor(255, 255, 255) // White text
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
        doc.setFillColor(245, 245, 245)
        doc.rect(0, 280, 210, 17, "F")
        doc.setDrawColor(128, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(margin, 280, margin + contentWidth, 280)
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Page ${pageNum} of ${totalPages}`, margin, 287)
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          margin + contentWidth,
          287,
          { align: "right" },
        )
        doc.setTextColor(128, 0, 0)
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

      // Header background
      doc.setFillColor(245, 245, 245)
      doc.rect(0, 0, 210, 40, "F")
      // Logo placeholder (replace with actual logo if available)
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
        doc.setFillColor(128, 0, 0)
        doc.circle(30, 20, 10, "F")
      }
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(128, 0, 0)
      doc.text("WildWatch", 105, 20, { align: "center" })
      doc.setFontSize(16)
      doc.setTextColor(80, 80, 80)
      doc.text("Incident Report", 105, 30, { align: "center" })
      y = 50
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setDrawColor(128, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(margin, 45, margin + contentWidth, 45)

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
        // Process images in parallel (user-side logic)
        const imagePromises = incident.evidence
          .filter((file: any) => file.fileType?.startsWith("image/"))
          .map(async (file: any) => {
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
        // Add loaded images in a grid layout (2 per row)
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
                const filenameLines = doc.splitTextToSize(imageData.fileName, optimalImageWidth)
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
      doc.save(`Office_Incident_Report_${incident.trackingNumber}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <OfficeAdminSidebar />
      <div className="flex-1 ml-64 p-8 max-w-[1700px] mx-auto">
        {/* Loading Modal */}
        {isDownloading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
              <p className="text-gray-700 font-medium">Generating PDF...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#800000] mb-1 flex items-center gap-2">
              <History className="h-7 w-7 mr-2 text-[#800000]" /> Office Incident History
            </h1>
            <p className="text-gray-600">View and access past incident reports for your office</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-4">
          {/* Priority Filter Buttons */}
          <div className="flex gap-2 mb-6">
            {["All", "HIGH", "MEDIUM", "LOW"].map((priority) => (
              <Button
                key={priority}
                variant={priorityFilter === priority ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter(priority)}
              >
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Filter Buttons (large) */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {["All", "Resolved", "Dismissed"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`bg-white p-4 rounded-lg shadow-md text-center transition-all duration-200 hover:bg-gray-50 ${
                statusFilter === status ? "border-l-4 border-[#800000] bg-[#fff9f9]" : ""
              }`}
            >
              <div className="text-2xl font-bold text-[#800000]">
                {status === "All" ? incidents.length : incidents.filter((i) => i.status === status).length}
              </div>
              <div className="text-gray-600 font-medium">{status === "All" ? "All Cases" : status}</div>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className={`bg-[#800000] text-white transition-all duration-200 ${isRefreshing ? 'opacity-50' : 'hover:opacity-80'}`} 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <History className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-semibold">Case ID</th>
                  <th className="p-3 text-left font-semibold">Date Reported</th>
                  <th className="p-3 text-left font-semibold">Incident Type</th>
                  <th className="p-3 text-left font-semibold">Location</th>
                  <th className="p-3 text-left font-semibold">Reporter</th>
                  <th className="p-3 text-left font-semibold">Priority</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Department</th>
                  <th className="p-3 text-left font-semibold">Finished Date</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : paginatedIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-500">
                      No incidents found.
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((incident) => (
                    <tr key={incident.id} className="border-t hover:bg-[#fff9f9] transition-colors">
                      <td className="p-3 font-mono">
                        {incident.trackingNumber}
                      </td>
                      <td className="p-3">{new Date(incident.submittedAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Badge
                          className={
                            incident.incidentType === "Suspicious Activity"
                              ? "bg-red-100 text-red-700"
                              : incident.incidentType === "Theft"
                                ? "bg-yellow-100 text-yellow-700"
                                : incident.incidentType === "Vandalism"
                                  ? "bg-green-100 text-green-700"
                                  : incident.incidentType === "Harassment"
                                    ? "bg-pink-100 text-pink-700"
                                    : "bg-gray-100 text-gray-700"
                          }
                        >
                          {incident.incidentType}
                        </Badge>
                      </td>
                      <td className="p-3">{incident.location}</td>
                      <td className="p-3">{incident.submittedByFullName}</td>
                      <td className="p-3">
                        <Badge
                          className={
                            incident.priorityLevel === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : incident.priorityLevel === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700"
                                : incident.priorityLevel === "LOW"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                          }
                        >
                          {incident.priorityLevel}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            incident.status.toLowerCase() === "resolved"
                              ? "bg-green-100 text-green-700"
                              : incident.status.toLowerCase() === "dismissed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-gray-100 text-gray-700"
                          }
                        >
                          {incident.status.toLowerCase() === "dismissed" ? "Dismissed" : incident.status}
                        </Badge>
                      </td>
                      <td className="p-3">{incident.officeAdminName || "-"}</td>
                      <td className="p-3">
                        {incident.finishedDate ? new Date(incident.finishedDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="mr-2"
                          onClick={() => router.push(`/incidents/tracking/${incident.trackingNumber}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="mr-2"
                          onClick={() => handleDownloadPDF(incident)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Showing {paginatedIncidents.length === 0 ? 0 : (page - 1) * incidentsPerPage + 1}-
              {(page - 1) * incidentsPerPage + paginatedIncidents.length} of {filteredIncidents.length} incidents
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &lt;
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 