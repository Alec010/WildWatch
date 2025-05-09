"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { AlertCircle, Bell, CheckCircle, ChevronRight, BellOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/utils/api"

interface ActivityLog {
  id: string
  activityType: string
  description: string
  createdAt: string
  isRead: boolean
  incident?: {
    id: string
    trackingNumber: string
  }
}

export default function OfficeAdminNotificationsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]
        if (!token) throw new Error("No authentication token found")
        const res = await fetch(`${API_BASE_URL}/api/activity-logs?page=0&size=50`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()
        setLogs(data.content || [])
      } catch (e: any) {
        setError(e.message || "Failed to load activity logs")
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const handleLogClick = async (log: ActivityLog) => {
    if (!log.isRead) {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]
        await fetch(`${API_BASE_URL}/api/activity-logs/${log.id}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        setLogs((prev) => prev.map((n) => (n.id === log.id ? { ...n, isRead: true } : n)))
      } catch {}
    }
    if (log.incident && log.incident.id) {
      router.push(`/office-admin/incidents/${log.incident.id}`)
    }
  }

  const formatActivityType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    // Convert both to Asia/Manila time
    const datePH = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    const nowPH = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    const diffMs = nowPH.getTime() - datePH.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`
    } else {
      return datePH.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: datePH.getFullYear() !== nowPH.getFullYear() ? "numeric" : undefined,
      })
    }
  }

  const unreadCount = logs.filter((log) => !log.isRead).length

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <OfficeAdminSidebar />
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full ml-64">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-6 w-6 text-[#8B0000] dark:text-red-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="bg-[#8B0000] hover:bg-[#8B0000]/90">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400">Stay updated with the latest activity and incidents</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load notifications</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <BellOff className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-gray-500 dark:text-gray-400">You don't have any notifications at the moment</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card
                key={log.id}
                className={cn(
                  "p-4 transition-all hover:shadow-md cursor-pointer group",
                  log.isRead
                    ? "bg-white dark:bg-gray-800"
                    : "bg-[#fff7f7] dark:bg-[#2a1515] border-l-4 border-l-[#8B0000]",
                )}
                onClick={() => handleLogClick(log)}
              >
                <div className="flex items-start gap-3">
                  {log.isRead ? (
                    <CheckCircle className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-[#8B0000] flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3
                        className={cn(
                          "font-medium text-sm",
                          log.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100",
                        )}
                      >
                        {formatActivityType(log.activityType)}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{log.description}</p>

                    {log.incident && log.incident.id && (
                      <div className="flex items-center mt-2 text-xs font-medium text-[#8B0000] dark:text-red-400 group-hover:underline">
                        View Incident Details
                        <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
