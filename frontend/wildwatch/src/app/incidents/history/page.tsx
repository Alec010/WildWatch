"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { History, Search, Download, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Incident {
  id: string;
  trackingNumber: string;
  dateOfIncident: string;
  submittedAt: string;
  incidentType: string;
  location: string;
  submittedByFullName: string;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW" | null;
  status: string;
  officeAdminName?: string;
  finishedDate?: string;
  description?: string;
  submittedByEmail?: string;
  submittedByPhone?: string;
  evidence?: any[];
  witnesses?: any[];
  updates?: any[];
}

export default function IncidentHistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  const incidentsPerPage = 5;
  const router = useRouter();

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        if (!token) return;
        const res = await fetch("http://localhost:8080/api/incidents/my-incidents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Only show Resolved or Dismissed (case-insensitive)
        setIncidents(
          data.filter((i: Incident) =>
            ["resolved", "dismissed"].includes(i.status.toLowerCase())
          )
        );
      } catch (e) {
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter(
    (i) =>
      (statusFilter === "All" || i.status === statusFilter) &&
      (priorityFilter === "All" || (i.priorityLevel && i.priorityLevel.toLowerCase() === priorityFilter.toLowerCase())) &&
      (
        i.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.incidentType.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase()) ||
        i.status.toLowerCase().includes(search.toLowerCase())
      )
  );

  const paginatedIncidents = filteredIncidents.slice(
    (page - 1) * incidentsPerPage,
    page * incidentsPerPage
  );

  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incident_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper function to load image from URL
  const loadImageFromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Function to download incident details as PDF (all fields, styled)
  const handleDownloadPDF = async (incident: any) => {
    const doc = new jsPDF();
    let y = 15;
    const margin = 10;
    const contentWidth = 190;

    // Helper function to check and add new page if needed
    const checkAndAddPage = (requiredSpace: number) => {
      if (y + requiredSpace > 280) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Incident Report Details", 105, y, { align: "center" });
    y += 15;

    // Case Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Case Information", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Case ID: ${incident.trackingNumber}`, margin, y); y += 7;
    doc.text(`Priority: ${incident.priorityLevel || '-'}`, margin, y); y += 7;
    doc.text(`Status: ${incident.status}`, margin, y); y += 7;
    doc.text(`Submitted: ${new Date(incident.submittedAt).toLocaleDateString()}`, margin, y); y += 7;
    if (incident.finishedDate) {
      doc.text(`Finished Date: ${new Date(incident.finishedDate).toLocaleDateString()}`, margin, y);
      y += 7;
    }
    doc.text(`Department: ${incident.officeAdminName || '-'}`, margin, y);
    y += 10;

    // Incident Details
    checkAndAddPage(60);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Incident Details", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Incident Type: ${incident.incidentType}`, margin, y); y += 7;
    doc.text(`Location: ${incident.location}`, margin, y); y += 7;
    doc.text(`Date Reported: ${new Date(incident.dateOfIncident).toLocaleDateString()}`, margin, y); y += 7;
    doc.text("Description:", margin, y); y += 7;
    const descriptionLines = doc.splitTextToSize(incident.description || "-", contentWidth - 20);
    doc.text(descriptionLines, margin + 4, y);
    y += descriptionLines.length * 7 + 5;

    // Reporter Information
    checkAndAddPage(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Reporter Information", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Reporter: ${incident.submittedByFullName}`, margin, y); y += 7;
    if (incident.submittedByEmail) {
      doc.text(`Email: ${incident.submittedByEmail}`, margin, y); y += 7;
    }
    if (incident.submittedByPhone) {
      doc.text(`Phone: ${incident.submittedByPhone}`, margin, y); y += 7;
    }
    y += 5;

    // Evidence Section
    if (incident.evidence && Array.isArray(incident.evidence) && incident.evidence.length > 0) {
      checkAndAddPage(40);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Evidence", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      for (const file of incident.evidence) {
        checkAndAddPage(120); // Space for image and details
        if (file.fileType.startsWith("image/")) {
          try {
            // Create an image element
            const img = new Image();
            img.crossOrigin = "anonymous";

            // Wait for the image to load
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = `${file.fileUrl}?t=${new Date().getTime()}`;
            });

            // Calculate dimensions
            const maxWidth = 170;
            const maxHeight = 100;
            let imgWidth = img.width;
            let imgHeight = img.height;

            const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
            imgWidth *= ratio;
            imgHeight *= ratio;

            // Add image to PDF
            doc.addImage(img, 'JPEG', margin + 4, y, imgWidth, imgHeight, undefined, 'FAST');
            y += imgHeight + 5;

            // Add file information
            doc.text(`File: ${file.fileName}`, margin + 4, y);
            y += 10;
          } catch (error) {
            console.error('Error loading image:', error);
            doc.text(`${file.fileName} (Failed to load image)`, margin + 4, y);
            y += 7;
          }
        } else {
          doc.text(`File: ${file.fileName} (${file.fileType})`, margin + 4, y);
          y += 7;
        }
      }
      y += 5;
    }

    // Witnesses Section
    if (incident.witnesses && Array.isArray(incident.witnesses) && incident.witnesses.length > 0) {
      checkAndAddPage(30 + incident.witnesses.length * 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Witnesses", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      incident.witnesses.forEach((witness: any, idx: number) => {
        doc.text(`${idx + 1}. ${witness.name || "(witness)"}`, margin + 4, y);
        y += 7;
        if (witness.additionalNotes) {
          const noteLines = doc.splitTextToSize(`Notes: ${witness.additionalNotes}`, contentWidth - 24);
          doc.text(noteLines, margin + 8, y);
          y += noteLines.length * 7 + 3;
        }
      });
      y += 5;
    }

    // Updates Section
    if (incident.updates && Array.isArray(incident.updates) && incident.updates.length > 0) {
      checkAndAddPage(30 + incident.updates.length * 25);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Case Updates", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      incident.updates.forEach((update: any, idx: number) => {
        doc.text(`${idx + 1}. ${update.title || update.status || "Update"}`, margin + 4, y);
        y += 7;
        if (update.updatedAt) {
          doc.text(`Date: ${new Date(update.updatedAt).toLocaleDateString()}`, margin + 8, y);
          y += 7;
        }
        if (update.message || update.description) {
          const messageLines = doc.splitTextToSize(update.message || update.description, contentWidth - 24);
          doc.text(messageLines, margin + 8, y);
          y += messageLines.length * 7;
        }
        if (update.updatedByName || update.updatedByFullName || update.author) {
          doc.text(`By: ${update.updatedByName || update.updatedByFullName || update.author}`, margin + 8, y);
          y += 7;
        }
        y += 3;
      });
    }

    doc.save(`Incident_Report_${incident.trackingNumber}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 p-8 max-w-[1700px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#800000] mb-1 flex items-center gap-2">
              <History className="h-7 w-7 mr-2 text-[#800000]" /> Incident History
            </h1>
            <p className="text-gray-600">View and access your past incident reports</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={handleExport} className="bg-[#800000] text-white">
              <Download className="h-5 w-5 mr-2" /> Export
            </Button>
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
                {status === "All"
                  ? incidents.length
                  : incidents.filter((i) => i.status === status).length}
              </div>
              <div className="text-gray-600 font-medium">
                {status === "All" ? "All Cases" : status}
              </div>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selected.length === 0}
                className="text-red-700 border-red-200"
              >
                Delete Selected
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-[#800000] text-white"
                disabled
              >
                <History className="h-5 w-5" />
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
                        <input
                          type="checkbox"
                          checked={selected.includes(incident.id)}
                          onChange={() => handleSelect(incident.id)}
                          className="mr-2"
                        />
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
                      <td className="p-3">{incident.finishedDate ? new Date(incident.finishedDate).toLocaleDateString() : "-"}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="mr-2"
                          onClick={() => router.push(`/incidents/tracking/${incident.trackingNumber}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="mr-2" onClick={() => handleDownloadPDF(incident)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-700 border-red-200"
                          disabled
                        >
                          <Trash2 className="h-4 w-4" />
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
              Showing {paginatedIncidents.length === 0 ? 0 : (page - 1) * incidentsPerPage + 1}
              -{(page - 1) * incidentsPerPage + paginatedIncidents.length} of {filteredIncidents.length} incidents
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
  );
} 