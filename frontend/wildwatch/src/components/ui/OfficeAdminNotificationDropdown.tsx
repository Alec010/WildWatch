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
  ArrowRightLeft,
  ArrowUp,
  TrendingUp,
  User,
  Info,
  CalendarPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getApiBaseUrl, getWsBaseUrl } from "@/utils/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  formatRelativeDate,
  formatDateWithYear,
  parseUTCDate,
} from "@/utils/dateUtils";

// Helper function to sort notifications: unread first (newest first), then read (newest first)
const sortNotificationsByDate = (
  notifications: ActivityLog[]
): ActivityLog[] => {
  return [...notifications].sort((a, b) => {
    // First, prioritize unread over read
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // Then sort by date (newest first)
    try {
      const dateA = parseUTCDate(a.createdAt).getTime();
      const dateB = parseUTCDate(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    } catch (error) {
      console.error("Error sorting notifications:", error);
      return 0;
    }
  });
};

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
  userId?: string;
}

interface OfficeAdminNotificationDropdownProps {
  className?: string;
}

export default function OfficeAdminNotificationDropdown({
  className,
}: OfficeAdminNotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      notificationAudioRef.current = new Audio("/notification_sound.mp3");
      // Preload the audio to ensure it's ready to play
      notificationAudioRef.current.preload = "auto";
      // Set volume (optional, adjust as needed)
      notificationAudioRef.current.volume = 0.5;
    }

    // Cleanup: pause and reset audio on unmount
    return () => {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Fetch current user profile to get user ID and role
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token =
          typeof document !== "undefined"
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("token="))
                ?.split("=")[1]
            : null;

        if (!token) {
          return;
        }

        const apiBaseUrl = getApiBaseUrl();
        if (!apiBaseUrl) {
          return;
        }

        const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

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

    if (typeof document !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, []);

  // Play notification sound
  const playNotificationSound = async () => {
    if (notificationAudioRef.current) {
      try {
        // Reset audio to start from beginning
        notificationAudioRef.current.currentTime = 0;
        await notificationAudioRef.current.play();
      } catch (error) {
        // Some browsers may block autoplay, log but don't throw
        console.log("Could not play notification sound:", error);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const token =
        typeof document !== "undefined"
          ? document.cookie
              .split("; ")
              .find((row) => row.startsWith("token="))
              ?.split("=")[1]
          : null;

      if (!token) {
        console.warn("No authentication token found for notifications");
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        console.error("API base URL is not configured");
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const response = await fetch(
        `${apiBaseUrl}/api/activity-logs?page=0&size=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      ).catch((fetchError) => {
        // Handle network errors (CORS, connection refused, etc.)
        console.error("Network error fetching notifications:", fetchError);
        throw new Error(
          `Failed to connect to server. Please check your connection and ensure the API server is running.`
        );
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn("Authentication failed, clearing notifications");
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.content)) {
        throw new Error("Invalid response format");
      }

      // Filter notifications based on user_id and role
      // Only show notifications where user_id matches current user AND user role is OFFICE_ADMIN
      const filteredNotifications = data.content.filter(
        (notification: ActivityLog) => {
          // Check if user role is OFFICE_ADMIN
          if (userRole !== "OFFICE_ADMIN") {
            return false;
          }
          // Check if notification's userId matches current user's ID
          if (currentUserId && notification.userId) {
            return notification.userId === currentUserId;
          }
          // If userId is not available in notification, include it for backward compatibility
          // but only if role check passes
          return true;
        }
      );

      // Sort notifications: unread first (newest first), then read (newest first)
      const sortedNotifications = sortNotificationsByDate(
        filteredNotifications
      );

      // Detect new notifications by comparing with previous IDs
      const currentNotificationIds = new Set<string>(
        sortedNotifications.map((n) => n.id)
      );
      const previousIds = previousNotificationIdsRef.current;

      // Check if there are any new notifications
      const hasNewNotifications = sortedNotifications.some(
        (n) => !previousIds.has(n.id)
      );

      // Play sound if there are new notifications
      if (hasNewNotifications && previousIds.size > 0) {
        // Only play if we had previous notifications (skip on initial load)
        await playNotificationSound();
      }

      // Update previous notification IDs
      previousNotificationIdsRef.current = currentNotificationIds;

      setNotifications(sortedNotifications);
      const unreadCount = sortedNotifications.filter(
        (notification: ActivityLog) => !notification.isRead
      ).length;
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
      try {
        const wsBaseUrl = getWsBaseUrl();
        if (!wsBaseUrl) {
          console.error("WebSocket base URL is not configured");
          // Fall back to polling if WebSocket URL is not configured
          if (!pollInterval) {
            console.log("Falling back to polling for notifications");
            pollInterval = setInterval(fetchNotifications, 30000);
          }
          return;
        }
        console.log("Connecting to WebSocket at:", `${wsBaseUrl}/ws`);
        // Create SockJS connection with error handling
        const socket = new SockJS(`${wsBaseUrl}/ws`, null, {
          transports: ["websocket", "xhr-streaming", "xhr-polling"],
          timeout: 10000,
        });
        const stompClient = new Client({
          webSocketFactory: () => socket as any,
          reconnectDelay: RECONNECT_DELAY,
          heartbeatIncoming: 60000, // Set client heartbeat to 60 seconds
          heartbeatOutgoing: 60000, // Set server heartbeat to 60 seconds
          onConnect: () => {
            setWsConnected(true);
            reconnectAttempts = 0;
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            stompClient.subscribe("/topic/notifications", async (message) => {
              const notification = JSON.parse(message.body);

              // Filter notifications based on user_id and role
              // Only show notifications where user_id matches current user AND user role is OFFICE_ADMIN
              if (userRole !== "OFFICE_ADMIN") {
                return; // Ignore if user is not OFFICE_ADMIN
              }

              // Check if notification's userId matches current user's ID
              if (currentUserId && notification.userId) {
                if (notification.userId !== currentUserId) {
                  return; // Ignore notifications not for this user
                }
              }

              setNotifications((prev) => {
                const exists = prev.some((n) => n.id === notification.id);
                let updatedNotifications: ActivityLog[];

                if (exists) {
                  // Update existing notification
                  updatedNotifications = prev.map((n) =>
                    n.id === notification.id ? notification : n
                  );
                } else {
                  // Add new notification
                  playNotificationSound().catch((error) => {
                    console.log("Could not play notification sound:", error);
                  });
                  console.log("Notification sound played");
                  updatedNotifications = [notification, ...prev];
                  setHasNewNotification(true);
                  setTimeout(() => setHasNewNotification(false), 3000);
                }

                // Sort: unread first (newest first), then read (newest first)
                const sortedNotifications =
                  sortNotificationsByDate(updatedNotifications);
                const newUnreadCount = sortedNotifications.filter(
                  (n) => !n.isRead
                ).length;
                setUnreadCount(newUnreadCount);
                return sortedNotifications;
              });
            });
          },
          onStompError: () => {
            setWsConnected(false);
            if (!pollInterval) {
              pollInterval = setInterval(fetchNotifications, 30000); // Increase to 30 seconds
            }
          },
          onWebSocketClose: () => {
            setWsConnected(false);
            if (!pollInterval) {
              pollInterval = setInterval(fetchNotifications, 30000); // Increase to 30 seconds
            }
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts++;
              setTimeout(connectStomp, RECONNECT_DELAY);
            }
          },
        });
        // Add debug event listeners
        socket.onopen = () => console.log("SockJS connection opened");
        socket.onclose = (e) => console.log("SockJS connection closed", e);
        socket.onerror = (e) => console.error("SockJS connection error", e);

        stompClient.activate();
        stompClientRef.current = stompClient;
      } catch (error) {
        console.error("WebSocket connection error:", error);
        // Fall back to polling if WebSocket fails
        if (!pollInterval) {
          console.log("Falling back to polling for notifications");
          pollInterval = setInterval(fetchNotifications, 30000);
        }
      }
    };

    // Only connect if user profile is loaded and user is OFFICE_ADMIN
    if (currentUserId && userRole === "OFFICE_ADMIN") {
      // Connect to WebSocket first, only fetch notifications once
      connectStomp();
      // Initial fetch of notifications
      fetchNotifications();
    }

    // Don't set up polling here - it will only be set up if WebSocket fails

    return () => {
      stompClientRef.current?.deactivate();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentUserId, userRole]);

  const isNotificationNew = (dateString: string): boolean => {
    try {
      const date = parseUTCDate(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();

      // Consider "new" if less than 1 minute old
      return diffMs >= 0 && diffMs < 60000;
    } catch (error) {
      return false;
    }
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      // Parse the UTC date and calculate difference
      const date = parseUTCDate(dateString);
      const now = new Date();

      // Calculate difference in milliseconds
      const diffMs = now.getTime() - date.getTime();

      // Ensure we don't get negative values (for future dates)
      if (diffMs < 0) {
        return "Just now";
      }

      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return "Just now";
      } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
      } else {
        // For older dates, format in Asia/Manila timezone
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
          timeZone: "Asia/Manila",
        });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
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
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Redirect to office-admin incident pages
      if (notification.incident) {
        if (
          notification.activityType === "NEW_CASE_ASSIGNED" ||
          notification.activityType === "TRANSFER_RECEIVED" ||
          notification.activityType === "TRANSFER_APPROVED"
        ) {
          router.push(`/office-admin/incidents/${notification.incident.id}`);
        } else if (notification.incident.trackingNumber) {
          router.push(`/office-admin/incidents/${notification.incident.id}`);
        } else {
          router.push(`/office-admin/incidents/${notification.incident.id}`);
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Immediately update local state and maintain sort order
      setNotifications((prev) => {
        const updated = prev.map((notification) => ({
          ...notification,
          isRead: true,
        }));
        // Sort: unread first (newest first), then read (newest first)
        return sortNotificationsByDate(updated);
      });
      setUnreadCount(0);

      const token =
        typeof document !== "undefined"
          ? document.cookie
              .split("; ")
              .find((row) => row.startsWith("token="))
              ?.split("=")[1]
          : null;

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw new Error("API base URL is not configured");
      }

      const response = await fetch(`${apiBaseUrl}/api/activity-logs/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch((fetchError) => {
        // Handle network errors
        console.error("Network error marking all as read:", fetchError);
        throw new Error(
          `Failed to connect to server. Please check your connection.`
        );
      });

      if (!response.ok) {
        // If the API call fails, revert the local state and maintain sort order
        setNotifications((prev) => {
          const reverted = prev.map((notification) => ({
            ...notification,
            isRead: false,
          }));
          return sortNotificationsByDate(reverted);
        });
        setUnreadCount(
          (prev) => prev + notifications.filter((n) => !n.isRead).length
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token =
        typeof document !== "undefined"
          ? document.cookie
              .split("; ")
              .find((row) => row.startsWith("token="))
              ?.split("=")[1]
          : null;

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw new Error("API base URL is not configured");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/activity-logs/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      ).catch((fetchError) => {
        // Handle network errors
        console.error("Network error marking as read:", fetchError);
        throw new Error(
          `Failed to connect to server. Please check your connection.`
        );
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state after successful API call and maintain sort order
      setNotifications((prev) => {
        const updated = prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        );
        // Sort: unread first (newest first), then read (newest first)
        return sortNotificationsByDate(updated);
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
    if (
      activityType.includes("verification") ||
      activityType.includes("verify")
    ) {
      return {
        bg: isRead ? "bg-amber-50/30" : "bg-amber-50/50",
        border: `border-amber-${isRead ? "100" : "200"}`,
        icon: `text-amber-${isRead ? "300" : "400"}`,
        accent: "border-l-amber-400",
      };
    }
    if (
      activityType.includes("new report") ||
      activityType.includes("new incident") ||
      activityType.includes("new_report_received")
    ) {
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
    if (
      activityType.includes("resolution_extended") ||
      activityType.includes("extended")
    ) {
      return {
        bg: isRead ? "bg-indigo-50/30" : "bg-indigo-50/50",
        border: `border-indigo-${isRead ? "100" : "200"}`,
        icon: `text-indigo-${isRead ? "300" : "400"}`,
        accent: "border-l-indigo-400",
      };
    }
    if (
      activityType.includes("transfer") ||
      activityType.includes("assigned")
    ) {
      return {
        bg: isRead ? "bg-purple-50/30" : "bg-purple-50/50",
        border: `border-purple-${isRead ? "100" : "200"}`,
        icon: `text-purple-${isRead ? "300" : "400"}`,
        accent: "border-l-purple-400",
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
    if (
      activityType.includes("incident") ||
      activityType.includes("report") ||
      activityType.includes("new_report_received")
    ) {
      return <AlertTriangle className="h-5 w-5 text-red-400" />;
    }
    if (activityType.includes("status") || activityType.includes("update")) {
      return <TrendingUp className="h-5 w-5 text-blue-400" />;
    }
    if (
      activityType.includes("resolution_extended") ||
      activityType.includes("extended")
    ) {
      return <CalendarPlus className="h-5 w-5 text-indigo-400" />;
    }
    if (
      activityType.includes("verification") ||
      activityType.includes("verify")
    ) {
      return <CheckCircle className="h-5 w-5 text-amber-400" />;
    }
    if (
      activityType.includes("transfer") ||
      activityType.includes("assigned")
    ) {
      return <ArrowRightLeft className="h-5 w-5 text-purple-400" />;
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
        return "Transfer Verified";
      case "NEW_CASE_ASSIGNED":
        return "New Case Assigned";
      case "UPVOTE":
        return "New Upvote";
      case "RESOLUTION_EXTENDED":
        return "Resolution Extended";
      default:
        return type.replace(/_/g, " ");
    }
  };

  const handleViewAllNotifications = () => {
    router.push("/office-admin/notifications");
  };

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleNotificationClick}
      >
        <Bell
          className={`h-5 w-5 text-gray-600 ${
            hasNewNotification ? "animate-pulse" : ""
          }`}
        />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
              unreadCount > 0 ? "animate-bounce" : ""
            }`}
          >
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-[400px] sm:w-[450px] md:w-[500px] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Admin Notifications</h3>
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
                const colors = getNotificationColor(
                  notification.activityType,
                  notification.isRead ?? false
                );
                return (
                  <div
                    key={notification.id}
                    className={`relative p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-300 ${
                      !notification.isRead ? colors.bg : ""
                    }`}
                    onClick={() => handleNotificationItemClick(notification)}
                  >
                    {!notification.isRead && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    <div className="flex items-start">
                      <div
                        className={`p-2 rounded-lg ${colors.icon} bg-opacity-10`}
                      >
                        {getNotificationIcon(notification.activityType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4
                            className={`font-medium text-sm ${
                              notification.isRead
                                ? "text-gray-900"
                                : "text-gray-900"
                            }`}
                          >
                            {formatActivityType(notification.activityType)}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            notification.isRead
                              ? "text-gray-600"
                              : "text-gray-800"
                          }`}
                        >
                          {notification.description}
                        </p>
                        {!notification.isRead &&
                          isNotificationNew(notification.createdAt) && (
                            <div className="mt-2 flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${colors.accent.replace(
                                  "border-l-",
                                  "bg-"
                                )}`}
                              ></div>
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
