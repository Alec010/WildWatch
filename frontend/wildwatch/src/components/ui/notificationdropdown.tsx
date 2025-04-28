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

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "status_change" | "comment" | "assignment" | "resolution" | "new";
  incidentId?: string;
}

interface NotificationDropdownProps {
  className?: string;
}

export default function NotificationDropdown({
  className,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  }, []);

  // Setup WebSocket for real-time notifications
  useEffect(() => {
    // In a real application, you would connect to a WebSocket server here
    // const socket = new WebSocket('ws://your-websocket-server/notifications');

    // socket.onmessage = (event) => {
    //   const newNotification = JSON.parse(event.data);
    //   setNotifications(prev => [newNotification, ...prev]);
    //   setUnreadCount(prev => prev + 1);
    // };

    // return () => {
    //   socket.close();
    // };

    // For demo purposes, we'll simulate a new notification after 10 seconds
    const timer = setTimeout(() => {
      const newNotification: Notification = {
        id: "4",
        title: "New Assignment",
        message: "Your incident has been assigned to Officer Johnson",
        timestamp: new Date().toISOString(),
        isRead: false,
        type: "assignment",
        incidentId: "inc-001",
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      // In a real app, you would fetch notifications from an API
      // const response = await fetch('/api/notifications');
      // const data = await response.json();
      // setNotifications(data);
      // setUnreadCount(data.filter(n => !n.isRead).length);

      // For demo purposes, we'll use sample data
      const sampleNotifications: Notification[] = [
        {
          id: "1",
          title: "Status Update",
          message:
            "Your incident report INC-2023-0001 (Bullying) has been changed to 'In Progress'",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          isRead: false,
          type: "status_change",
          incidentId: "inc-001",
        },
        {
          id: "2",
          title: "New Comment",
          message:
            "Admin added a comment to your incident report: 'We are investigating this issue'",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
          isRead: false,
          type: "comment",
          incidentId: "inc-001",
        },
        {
          id: "3",
          title: "Incident Resolved",
          message:
            "Your incident report INC-2023-0002 (Lost Item) has been resolved",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          isRead: false,
          type: "resolution",
          incidentId: "inc-002",
        },
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const refreshNotifications = () => {
    setIsRefreshing(true);
    // In a real app, you would fetch new notifications here
    fetchNotifications();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "comment":
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      case "assignment":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "resolution":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "new":
        return <FileText className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNotificationItemClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.incidentId) {
      router.push(`/incidents/${notification.incidentId}`);
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
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
          <div className="max-h-80 overflow-y-auto">
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
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatNotificationTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
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
              onClick={() => router.push("/notifications")}
            >
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
