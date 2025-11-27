"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { CustomLoader } from "@/components/ui/custom-loader";
import {
  Bell,
  CheckCircle,
  ChevronRight,
  BellOff,
  AlertTriangle,
  Info,
  Shield,
  TrendingUp,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/utils/api";
import { useSidebar } from "@/contexts/SidebarContext";
import { useUser } from "@/contexts/UserContext";
import { Inter } from "next/font/google";
import {
  formatRelativeDate,
  formatDateWithYear,
  parseUTCDate,
} from "@/utils/dateUtils";

interface ActivityLog {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  incident?: {
    id: string;
    trackingNumber: string;
  };
}

const inter = Inter({ subsets: ["latin"] });

export default function NotificationsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { collapsed } = useSidebar();
  const { userRole } = useUser();

  const getContentMargin = () => {
    if (userRole === "OFFICE_ADMIN") {
      return collapsed ? "ml-20" : "ml-72";
    }
    return collapsed ? "ml-18" : "ml-64";
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        if (!token) throw new Error("No authentication token found");
        const res = await fetch(
          `${API_BASE_URL}/api/activity-logs?page=0&size=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setLogs(data.content || []);
      } catch (e: any) {
        setError(e.message || "Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleLogClick = async (log: ActivityLog) => {
    if (!log.isRead) {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        await fetch(`${API_BASE_URL}/api/activity-logs/${log.id}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setLogs((prev) =>
          prev.map((n) => (n.id === log.id ? { ...n, isRead: true } : n))
        );
      } catch {}
    }
    if (log.incident && log.incident.trackingNumber) {
      router.push(`/incidents/tracking/${log.incident.trackingNumber}`);
    }
  };

  const getNotificationIcon = (activityType: string) => {
    const type = activityType.toLowerCase();
    if (type.includes("incident") || type.includes("report")) {
      return <AlertTriangle className="h-5 w-5" />;
    }
    if (type.includes("status") || type.includes("update")) {
      return <TrendingUp className="h-5 w-5" />;
    }
    if (type.includes("comment") || type.includes("message")) {
      return <FileText className="h-5 w-5" />;
    }
    if (type.includes("user") || type.includes("profile")) {
      return <User className="h-5 w-5" />;
    }
    return <Info className="h-5 w-5" />;
  };

  const getNotificationColor = (activityType: string, isRead: boolean) => {
    const type = activityType.toLowerCase();
    const opacity = isRead ? "50" : "100";

    if (type.includes("points") || type.includes("reward")) {
      return {
        bg: isRead ? "bg-emerald-50" : "bg-emerald-100",
        border: `border-emerald-${isRead ? "200" : "300"}`,
        icon: `text-emerald-${isRead ? "400" : "600"}`,
        accent: "border-l-emerald-500",
      };
    }
    if (type.includes("verification") || type.includes("verify")) {
      return {
        bg: isRead ? "bg-amber-50" : "bg-amber-100",
        border: `border-amber-${isRead ? "200" : "300"}`,
        icon: `text-amber-${isRead ? "400" : "600"}`,
        accent: "border-l-amber-500",
      };
    }
    if (type.includes("new report") || type.includes("new incident")) {
      return {
        bg: isRead ? "bg-rose-50" : "bg-rose-100",
        border: `border-rose-${isRead ? "200" : "300"}`,
        icon: `text-rose-${isRead ? "400" : "600"}`,
        accent: "border-l-rose-500",
      };
    }
    if (type.includes("incident") || type.includes("report")) {
      return {
        bg: isRead ? "bg-red-50" : "bg-red-100",
        border: `border-red-${isRead ? "200" : "300"}`,
        icon: `text-red-${isRead ? "400" : "600"}`,
        accent: "border-l-red-500",
      };
    }
    if (type.includes("status") || type.includes("update")) {
      return {
        bg: isRead ? "bg-blue-50" : "bg-blue-100",
        border: `border-blue-${isRead ? "200" : "300"}`,
        icon: `text-blue-${isRead ? "400" : "600"}`,
        accent: "border-l-blue-500",
      };
    }
    if (type.includes("comment") || type.includes("message")) {
      return {
        bg: isRead ? "bg-green-50" : "bg-green-100",
        border: `border-green-${isRead ? "200" : "300"}`,
        icon: `text-green-${isRead ? "400" : "600"}`,
        accent: "border-l-green-500",
      };
    }
    if (type.includes("user") || type.includes("profile")) {
      return {
        bg: isRead ? "bg-purple-50" : "bg-purple-100",
        border: `border-purple-${isRead ? "200" : "300"}`,
        icon: `text-purple-${isRead ? "400" : "600"}`,
        accent: "border-l-purple-500",
      };
    }
    return {
      bg: isRead ? "bg-gray-50" : "bg-gray-100",
      border: `border-gray-${isRead ? "200" : "300"}`,
      icon: `text-gray-${isRead ? "400" : "600"}`,
      accent: "border-l-gray-500",
    };
  };

  const formatActivityType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatDate = (dateString: string) => {
    const date = parseUTCDate(dateString);
    const now = new Date();
    const datePH = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );
    const nowPH = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );
    const diffMs = nowPH.getTime() - datePH.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } else {
      return datePH.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          datePH.getFullYear() !== nowPH.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const unreadCount = logs.filter((log) => !log.isRead).length;

  if (loading) {
    return (
      <div
        className={`min-h-screen flex bg-gradient-to-br from-[#fafafa] via-white to-[#f8f9fa] ${inter.className}`}
      >
        <Sidebar />
        <div
          className={`flex-1 relative transition-all duration-300 ${getContentMargin()}`}
        >
          <Navbar
            title="Notifications"
            subtitle="Loading your notifications..."
            showSearch={false}
            showNewIncident={false}
          />
          <div className="pt-24">
            <CustomLoader
              title="Loading notifications..."
              subtitle="Fetching your latest activity updates"
              contentOnly
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex bg-gradient-to-br from-[#fafafa] via-white to-[#f8f9fa] ${inter.className}`}
      >
        <Sidebar />
        <div
          className={`flex-1 transition-all duration-300 ${getContentMargin()}`}
        >
          <Navbar
            title="Notifications"
            subtitle="Error loading notifications"
            showSearch={false}
            showNewIncident={false}
          />
          <div className="pt-24 px-6 pb-10">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-red-500 rounded-full shadow-lg">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-red-800 font-bold text-xl mb-2">
                      Unable to Load Notifications
                    </h3>
                    <p className="text-red-700 text-lg">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex bg-gradient-to-br from-[#fafafa] via-white to-[#f8f9fa] ${inter.className}`}
    >
      <Sidebar />

      <div
        className={`flex-1 transition-all duration-300 ${getContentMargin()}`}
      >
        <Navbar
          title="Notifications"
          subtitle={`${
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All caught up!"
          }`}
          showSearch={false}
          showNewIncident={false}
        />

        <div className="pt-24 px-4 pb-6">
          {/* Notifications Content */}
          <div className="max-w-[60vw] mx-auto mt-4">
            {logs.length === 0 ? (
              <div className="text-center py-20">
                <div className="max-w-lg mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <BellOff className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-4">
                    All Caught Up!
                  </h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    You don't have any notifications at the moment.
                    <br />
                    We'll notify you when there's new activity or updates.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => {
                  const colors = getNotificationColor(
                    log.activityType,
                    log.isRead
                  );
                  return (
                    <Card
                      key={log.id}
                      className={cn(
                        "transition-all duration-300 hover:shadow-xl cursor-pointer group border-l-4 overflow-hidden",
                        colors.bg,
                        colors.border,
                        colors.accent,
                        log.isRead ? "opacity-75" : "opacity-100"
                      )}
                      onClick={() => handleLogClick(log)}
                      style={{
                        animationName: "fadeInUp",
                        animationDuration: "0.6s",
                        animationTimingFunction: "ease-out",
                        animationFillMode: "forwards",
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Notification Icon */}
                          <div
                            className={cn(
                              "p-2 rounded-lg shadow-md transition-all duration-300 group-hover:scale-110",
                              colors.icon.includes("red")
                                ? "bg-red-500 text-white"
                                : colors.icon.includes("blue")
                                ? "bg-blue-500 text-white"
                                : colors.icon.includes("green")
                                ? "bg-green-500 text-white"
                                : colors.icon.includes("purple")
                                ? "bg-purple-500 text-white"
                                : "bg-gray-500 text-white"
                            )}
                          >
                            {getNotificationIcon(log.activityType)}
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3
                                className={cn(
                                  "font-bold text-base",
                                  log.isRead
                                    ? "text-slate-700"
                                    : "text-slate-900"
                                )}
                              >
                                {formatActivityType(log.activityType)}
                              </h3>
                              <div className="flex items-center gap-2 ml-4">
                                {!log.isRead && (
                                  <div className="w-2 h-2 bg-[#800000] rounded-full animate-pulse shadow-lg"></div>
                                )}
                                <div className="flex items-center gap-1 text-slate-500 text-xs bg-white/50 px-2 py-0.5 rounded-lg">
                                  <Calendar className="h-3 w-3" />
                                  <span className="whitespace-nowrap">
                                    {formatDate(log.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p
                              className={cn(
                                "text-sm leading-relaxed mb-2",
                                log.isRead ? "text-slate-600" : "text-slate-800"
                              )}
                            >
                              {log.description}
                            </p>

                            {/* Action Area */}
                            {log.incident && log.incident.trackingNumber && (
                              <div className="flex items-center justify-between pt-2 border-t border-white/50">
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <FileText className="h-3 w-3" />
                                  <span>
                                    Incident #
                                    {log.incident.trackingNumber.slice(-6)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[#800000] font-semibold text-sm group-hover:text-[#600000] transition-colors">
                                  <span>View Details</span>
                                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Read Status Indicator */}
                          <div className="flex flex-col items-center gap-2">
                            {log.isRead ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-[#800000] flex items-center justify-center shadow-lg">
                                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#800000]/5 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
