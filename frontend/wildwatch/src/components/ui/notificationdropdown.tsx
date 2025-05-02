"use client";

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
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { API_BASE_URL, WS_BASE_URL } from "@/utils/api";

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
  const notificationRef = useRef<HTMLDivElement>(null);

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

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
    // Poll every 2 seconds
    const interval = setInterval(fetchNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  // Setup WebSocket for real-time notifications
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/notifications`);
    
    ws.onmessage = (event) => {
      const newActivity = JSON.parse(event.data);
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n.id === newActivity.id);
        if (exists) {
          // Update existing notification
          const updatedNotifications = prev.map(n => n.id === newActivity.id ? newActivity : n);
          // Recalculate unread count
          const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
          setUnreadCount(newUnreadCount);
          return updatedNotifications;
        } else {
          // Add new notification at the beginning
          const updatedNotifications = [newActivity, ...prev];
          // Recalculate unread count
          const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
          setUnreadCount(newUnreadCount);
          // Show pulse animation for new notification
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 3000);
          return updatedNotifications;
        }
      });
    };

    return () => {
      ws.close();
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

      const response = await fetch(`${API_BASE_URL}/api/activity-logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update notifications and calculate unread count
      setNotifications(data.content);
      const unreadCount = data.content.filter((notification: ActivityLog) => !notification.isRead).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Add polling for notifications
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling interval
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
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

      // Redirect to the tracking page if there's an incident
      if (notification.incident) {
        router.push(`/incidents/tracking/${notification.incident.trackingNumber}`);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "STATUS_CHANGE":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "UPDATE":
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      case "NEW_REPORT":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "CASE_RESOLVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "VERIFICATION":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case "STATUS_CHANGE":
        return "Status Update";
      case "UPDATE":
        return "Case Update";
      case "NEW_REPORT":
        return "New Report";
      case "CASE_RESOLVED":
        return "Case Resolved";
      case "VERIFICATION":
        return "Case Verified";
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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
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
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationItemClick(notification)}
                >
                  <div className="flex items-start">
                    <div className="bg-gray-100 rounded-full p-2 mr-3">
                      {getNotificationIcon(notification.activityType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-900">
                          {formatActivityType(notification.activityType)}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
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
