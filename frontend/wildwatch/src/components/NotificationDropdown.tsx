"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/apiClient";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface Notification {
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

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

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

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const notificationsData = (await api.getActivityLogs()) as Notification[];

      // Detect new notifications by comparing with previous IDs
      const currentNotificationIds = new Set<string>(
        notificationsData.map((n) => n.id)
      );
      const previousIds = previousNotificationIdsRef.current;

      // Check if there are any new notifications
      const hasNewNotifications = notificationsData.some(
        (n) => !previousIds.has(n.id)
      );

      // Play sound if there are new notifications
      if (hasNewNotifications && previousIds.size > 0) {
        // Only play if we had previous notifications (skip on initial load)
        await playNotificationSound();
      }

      // Update previous notification IDs
      previousNotificationIdsRef.current = currentNotificationIds;

      setNotifications(notificationsData);
      // Derive unread count locally; backend count endpoint may not exist for ActivityLog
      const unread = notificationsData.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();

    // Set up interval to check for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await api.markActivityLogAsRead(notification.id);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

      // Navigate to the bulletin if it's a bulletin upvote
      if (
        notification.activityType === "BULLETIN_UPVOTE" ||
        notification.activityType === "BULLETIN_UPVOTE_UPDATE"
      ) {
        router.push(`/office-admin/office-bulletin`);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllActivityLogsAsRead();

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Format notification message
  const formatNotificationMessage = (notification: Notification) => {
    return notification.description;
  };

  // Helper to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-[#8B0000] hover:text-[#6B0000] hover:bg-red-50"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B0000]"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 rounded-full p-2 mt-1">
                        <Bell className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                          {formatNotificationMessage(notification)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-600 hover:text-[#8B0000]"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3 mr-1" />
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
