"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"

interface Incident {
  id: string
  trackingNumber: string
  dateOfIncident: string
  location: string
  incidentType: string
  submittedByFullName: string
  status: string
  priorityLevel: "HIGH" | "MEDIUM" | "LOW"
}

export default function UpdateIncidentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]

        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`http://localhost:8080/api/incidents/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setIncident(data)
      } catch (error) {
        console.error("Error fetching incident:", error)
        setError(error instanceof Error ? error.message : "Failed to load incident")
      } finally {
        setLoading(false)
      }
    }

    fetchIncident()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000]"></div>
        </div>
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="flex h-screen">
        <OfficeAdminSidebar />
        <div className="flex-1 p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error || "Incident not found"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <OfficeAdminSidebar />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb and Header */}
            <div className="mb-8">
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link href="/office-admin/approved-cases" className="hover:text-[#8B0000]">
                  Approved Case Tracker
                </Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span>Update Incident</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Update: {incident.incidentType}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Case ID: {incident.trackingNumber}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Priority:{" "}
                    <Badge
                      className={`ml-2 ${
                        incident.priorityLevel === "HIGH"
                          ? "bg-red-50 text-red-700"
                          : incident.priorityLevel === "MEDIUM"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {incident.priorityLevel}
                    </Badge>
                  </div>

                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700"
                  >
                    {incident.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Content sections will go here */}
          </div>
        </div>
      </div>
    </div>
  )
} 