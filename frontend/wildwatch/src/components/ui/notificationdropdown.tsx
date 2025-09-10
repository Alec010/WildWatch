"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  ArrowRightLeft,
  ArrowUp,
  TrendingUp,
  User,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { API_BASE_URL, WS_BASE_URL } from "@/utils/api";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface ActivityLog {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
  incident: {
    id: string;
    trackingNumber: string;
  } | null;
  isRead?: boolean;
}

interface NotificationDropdownProps {
  className?: string;
}

export default function NotificationDropdown({
  className,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const notificationAudio = typeof window !== "undefined"
    ? new Audio("/notification_sound.mp3")
    : null;

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/activity-logs?page=0&size=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.content)) {
        throw new Error("Invalid response format");
      }

      setNotifications(data.content);
      const unreadCount = data.content.filter((notification: ActivityLog) => !notification.isRead).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Set empty notifications and zero unread count on error
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Setup STOMP over SockJS and fallback polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 5000;

    const connectStomp = () => {
      const socket = new SockJS(`${API_BASE_URL.replace(/\/api$/, '')}/ws`);
      const stompClient = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: RECONNECT_DELAY,
        onConnect: () => {
          setWsConnected(true);
          reconnectAttempts = 0;
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          stompClient.subscribe('/topic/notifications', (message) => {
            const notification = JSON.parse(message.body);
            setNotifications(prev => {
              const exists = prev.some(n => n.id === notification.id);
              if (exists) {
                const updatedNotifications = prev.map(n => n.id === notification.id ? notification : n);
                const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
                setUnreadCount(newUnreadCount);
                return updatedNotifications;
              } else {
                // Play sound for new notification
                if (notificationAudio) {
                  notificationAudio.play();
                  console.log('Notification sound played');
                }
                const updatedNotifications = [notification, ...prev];
                const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
                setUnreadCount(newUnreadCount);
                setHasNewNotification(true);
                setTimeout(() => setHasNewNotification(false), 3000);
                return updatedNotifications;
              }
            });
          });
        },
        onStompError: () => {
          setWsConnected(false);
          if (!pollInterval) {
            pollInterval = setInterval(fetchNotifications, 5000);
          }
        },
        onWebSocketClose: () => {
          setWsConnected(false);
          if (!pollInterval) {
            pollInterval = setInterval(fetchNotifications, 5000);
          }
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(connectStomp, RECONNECT_DELAY);
          }
        },
      });
      stompClient.activate();
      stompClientRef.current = stompClient;
    };

    connectStomp();
    fetchNotifications();

    return () => {
      stompClientRef.current?.deactivate();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const formatNotificationTime = (dateString: string) => {
    try {
      // Parse the UTC date string
      const date = new Date(dateString);
      const now = new Date();
      
      // Get the time difference in milliseconds
      const diffMs = now.getTime() - date.getTime();
      
      // Convert to minutes, hours, and days
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return "Just now";
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
      } else {
        // For older notifications, show the actual date in local timezone
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationItemClick = async (notification: ActivityLog) => {
    try {
      // Mark as read first
      if (!notification.isRead) {
        await markAsRead(notification.id);
        // Immediately update the unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Redirect to the correct page if there's an incident
      if (notification.incident) {
        if (notification.activityType === "NEW_CASE_ASSIGNED") {
          router.push(`/office-admin/incidents/${notification.incident.id}`);
        } else {
          router.push(`/incidents/tracking/${notification.incident.trackingNumber}`);
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Immediately update local state
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/activity-logs/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // If the API call fails, revert the local state
        setNotifications(prev => prev.map(notification => ({ ...notification, isRead: false })));
        setUnreadCount(prev => prev + notifications.filter(n => !n.isRead).length);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/api/activity-logs/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state after successful API call
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const refreshNotifications = () => {
    setIsRefreshing(true);
    fetchNotifications();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const activityType = type.toLowerCase();
    const opacity = isRead ? "30" : "50";

    if (activityType.includes("points") || activityType.includes("reward")) {
      return {
        bg: isRead ? "bg-emerald-50/30" : "bg-emerald-50/50",
        border: `border-emerald-${isRead ? "100" : "200"}`,
        icon: `text-emerald-${isRead ? "300" : "400"}`,
        accent: "border-l-emerald-400",
      };
    }
    if (activityType.includes("verification") || activityType.includes("verify")) {
      return {
        bg: isRead ? "bg-amber-50/30" : "bg-amber-50/50",
        border: `border-amber-${isRead ? "100" : "200"}`,
        icon: `text-amber-${isRead ? "300" : "400"}`,
        accent: "border-l-amber-400",
      };
    }
    if (activityType.includes("new report") || activityType.includes("new incident") || activityType.includes("new_report_received")) {
      return {
        bg: isRead ? "bg-rose-50/30" : "bg-rose-50/50",
        border: `border-rose-${isRead ? "100" : "200"}`,
        icon: `text-rose-${isRead ? "300" : "400"}`,
        accent: "border-l-rose-400",
      };
    }
    if (activityType.includes("incident") || activityType.includes("report")) {
      return {
        bg: isRead ? "bg-red-50/30" : "bg-red-50/50",
        border: `border-red-${isRead ? "100" : "200"}`,
        icon: `text-red-${isRead ? "300" : "400"}`,
        accent: "border-l-red-400",
      };
    }
    if (activityType.includes("status") || activityType.includes("update")) {
      return {
        bg: isRead ? "bg-blue-50/30" : "bg-blue-50/50",
        border: `border-blue-${isRead ? "100" : "200"}`,
        icon: `text-blue-${isRead ? "300" : "400"}`,
        accent: "border-l-blue-400",
      };
    }
    if (activityType.includes("comment") || activityType.includes("message")) {
      return {
        bg: isRead ? "bg-green-50/30" : "bg-green-50/50",
        border: `border-green-${isRead ? "100" : "200"}`,
        icon: `text-green-${isRead ? "300" : "400"}`,
        accent: "border-l-green-400",
      };
    }
    if (activityType.includes("user") || activityType.includes("profile")) {
      return {
        bg: isRead ? "bg-purple-50/30" : "bg-purple-50/50",
        border: `border-purple-${isRead ? "100" : "200"}`,
        icon: `text-purple-${isRead ? "300" : "400"}`,
        accent: "border-l-purple-400",
      };
    }
    return {
      bg: isRead ? "bg-gray-50/30" : "bg-gray-50/50",
      border: `border-gray-${isRead ? "100" : "200"}`,
      icon: `text-gray-${isRead ? "300" : "400"}`,
      accent: "border-l-gray-400",
    };
  };

  const getNotificationIcon = (type: string) => {
    const activityType = type.toLowerCase();
    if (activityType.includes("incident") || activityType.includes("report") || activityType.includes("new_report_received")) {
      return <AlertTriangle className="h-5 w-5 text-red-400" />;
    }
    if (activityType.includes("status") || activityType.includes("update")) {
      return <TrendingUp className="h-5 w-5 text-blue-400" />;
    }
    if (activityType.includes("verification") || activityType.includes("verify")) {
      return <CheckCircle className="h-5 w-5 text-amber-400" />;
    }
    if (activityType.includes("points") || activityType.includes("reward")) {
      return <TrendingUp className="h-5 w-5 text-emerald-400" />;
    }
    if (activityType.includes("comment") || activityType.includes("message")) {
      return <FileText className="h-5 w-5 text-green-400" />;
    }
    if (activityType.includes("user") || activityType.includes("profile")) {
      return <User className="h-5 w-5 text-purple-400" />;
    }
    return <Info className="h-5 w-5 text-gray-400" />;
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case "STATUS_CHANGE":
        return "Status Update";
      case "UPDATE":
        return "Case Update";
      case "NEW_REPORT":
        return "New Report";
      case "NEW_REPORT_RECEIVED":
        return "New Report Received";
      case "CASE_RESOLVED":
        return "Case Resolved";
      case "VERIFICATION":
        return "Case Verified";
      case "TRANSFER":
        return "Case Transferred";
      case "TRANSFER_RECEIVED":
        return "Case Received";
      case "TRANSFER_APPROVED":
        return "Transfer Approved";
      case "UPVOTE":
        return "New Upvote";
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const handleViewAllNotifications = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const user = await response.json();
      if (user.role === "OFFICE_ADMIN") {
        router.push("/office-admin/notifications");
      } else {
        router.push("/notifications");
      }
    } catch {
      router.push("/notifications");
    }
  };

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleNotificationClick}
      >
        <Bell className={`h-5 w-5 text-gray-600 ${hasNewNotification ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${unreadCount > 0 ? 'animate-bounce' : ''}`}>
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-[400px] sm:w-[450px] md:w-[500px] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                onClick={refreshNotifications}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => {
                const colors = getNotificationColor(notification.activityType, notification.isRead ?? false);
                return (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-300 ${
                      !notification.isRead ? colors.bg : ""
                    }`}
                    onClick={() => handleNotificationItemClick(notification)}
                  >
                    <div className="flex items-start">
                      <div className={`p-2 rounded-lg ${colors.icon} bg-opacity-10`}>
                        {getNotificationIcon(notification.activityType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-medium text-sm ${notification.isRead ? "text-gray-900" : "text-gray-900"}`}>
                            {formatActivityType(notification.activityType)}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${notification.isRead ? "text-gray-600" : "text-gray-800"}`}>
                          {notification.description}
                        </p>
                        {!notification.isRead && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${colors.accent.replace('border-l-', 'bg-')}`}></div>
                            <span className="text-xs text-gray-500">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-2 border-t border-gray-200 text-center">
            <Button
              variant="link"
              className="text-[#800000] text-xs hover:underline"
              onClick={handleViewAllNotifications}
            >
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
