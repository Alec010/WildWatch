"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OfficeAdminSidebar } from "@/components/OfficeAdminSidebar"
import { AlertCircle, Bell, CheckCircle, ChevronRight, BellOff, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/utils/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
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
        setFilteredLogs(data.content || [])
      } catch (e: any) {
        setError(e.message || "Failed to load activity logs")
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  useEffect(() => {
    let result = [...logs]

    // Apply filter
    if (filter === "unread") {
      result = result.filter((log) => !log.isRead)
    } else if (filter === "read") {
      result = result.filter((log) => log.isRead)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (log) =>
          log.description.toLowerCase().includes(query) ||
          formatActivityType(log.activityType).toLowerCase().includes(query) ||
          (log.incident?.trackingNumber && log.incident.trackingNumber.toLowerCase().includes(query)),
      )
    }

    setFilteredLogs(result)
  }, [logs, filter, searchQuery])

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

  const markAllAsRead = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
      await fetch(`${API_BASE_URL}/api/activity-logs/mark-all-read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      setLogs((prev) => prev.map((log) => ({ ...log, isRead: true })))
    } catch {}
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
        timeZone: 'Asia/Manila'
      })
    }
  }

  const unreadCount = logs.filter((log) => !log.isRead).length

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <OfficeAdminSidebar />
      <div className="flex-1 ml-64 flex">
        {/* Main content - Notifications */}
        <div className="flex-1 p-6 max-w-[800px]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
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

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="whitespace-nowrap">
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread" disabled={unreadCount === 0}>
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>
            </Tabs>
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
          ) : filteredLogs.length === 0 ? (
            <Card className="p-8 flex flex-col items-center justify-center text-center">
              <BellOff className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery
                  ? "No notifications match your search criteria"
                  : filter === "unread"
                    ? "You don't have any unread notifications"
                    : "You don't have any notifications at the moment"}
              </p>
              {(searchQuery || filter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
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
                      <CheckCircle className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-[#8B0000] flex items-center justify-center flex-shrink-0">
                        <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-1">
                        <h3
                          className={cn(
                            "font-medium text-sm",
                            log.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100",
                          )}
                        >
                          {formatActivityType(log.activityType)}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{log.description}</p>

                      {log.incident && log.incident.id && (
                        <div className="flex items-center mt-2 text-xs font-medium text-[#8B0000] dark:text-red-400 group-hover:underline">
                          View Incident #{log.incident.trackingNumber}
                          <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && filteredLogs.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {filteredLogs.length} {filteredLogs.length === 1 ? "notification" : "notifications"}
              {filter !== "all" && ` (${filter})`}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:block w-[320px] p-6 border-l border-gray-200 dark:border-gray-800">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-[#8B0000] dark:text-red-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Quick Stats</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unread Notifications</span>
                  <Badge
                    variant={unreadCount > 0 ? "destructive" : "secondary"}
                    className={unreadCount > 0 ? "bg-[#8B0000]" : ""}
                  >
                    {unreadCount}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Notifications</span>
                  <Badge variant="secondary">{logs.length}</Badge>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tips</h2>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Click a notification to mark it as read and view details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Stay updated by checking your notifications regularly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Unread notifications are highlighted for your attention.</span>
                </li>
              </ul>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-[#8B0000] dark:text-red-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
              </div>
              {logs.length > 0 ? (
                <div className="space-y-3">
                  {logs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="text-xs border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0"
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatActivityType(log.activityType)}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{log.description}</p>
                      <p className="text-gray-400 dark:text-gray-500 mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
