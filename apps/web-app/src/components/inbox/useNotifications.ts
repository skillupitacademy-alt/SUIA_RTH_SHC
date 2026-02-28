"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { clientLogger } from "@/utils/clientLogger";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function useNotifications() {
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch unread (${res.status})`);
      }
      const data = await res.json();
      setUnreadCount(data.unread ?? 0);
      setError(null);
    } catch (err) {
            clientLogger.error("Failed to fetch unread count", { error: err instanceof Error ? err.message : 'unknown' });
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const url = filterType 
        ? `/api/notifications?limit=20&type=${filterType}`
        : "/api/notifications?limit=20";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch notifications (${res.status})`);
      }
      const data = await res.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
            clientLogger.error("Failed to fetch notifications", { error: err instanceof Error ? err.message : 'unknown' });
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filterType]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Mark read failed (${res.status})`);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setError(null);
    } catch (err) {
            clientLogger.error("Failed to mark as read", { error: err instanceof Error ? err.message : 'unknown' });
      setError(err instanceof Error ? err.message : "Failed to update notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Mark all read failed (${res.status})`);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setError(null);
    } catch (err) {
            clientLogger.error("Failed to mark all as read", { error: err instanceof Error ? err.message : 'unknown' });
      setError(err instanceof Error ? err.message : "Failed to update notifications");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    filterType,
    setFilterType,
    markAsRead,
    markAllAsRead,
    refresh: () => {
      fetchUnreadCount();
      fetchNotifications();
    },
  };
}
