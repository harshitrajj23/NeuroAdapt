"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, ClipboardList, Activity, Sparkles, X } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string | null;
}

export default function NotificationBell({
  userId,
  apiUrl,
}: {
  userId: number;
  apiUrl: string;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiUrl}/api/notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
        setNotifications(data.notifications || []);
      }
    } catch {
      // Ignore network hiccup
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [userId, apiUrl]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markRead = async (notifId: number) => {
    try {
      await fetch(`${apiUrl}/api/notifications/${notifId}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${apiUrl}/api/notifications/read-all/${userId}`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          fetchNotifications();
        }}
        style={{
          position: "relative",
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          border: "1.5px solid #EDE9FE",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: unreadCount > 0 ? "#7C3AED" : "#6B6580",
          boxShadow: "0 2px 8px rgba(124, 58, 237, 0.06)",
          transition: "all 0.15s ease",
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#EF4444",
              color: "white",
              fontSize: "10px",
              fontWeight: 800,
              borderRadius: "10px",
              padding: "2px 6px",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: 0,
            width: "360px",
            background: "white",
            border: "1px solid #EDE9FE",
            borderRadius: "18px",
            boxShadow: "0 18px 45px rgba(124, 58, 237, 0.15)",
            zIndex: 1000,
            padding: "16px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              paddingBottom: "10px",
              borderBottom: "1px solid #F3EFFE",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "#1A1035" }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#F5F0FF",
                    color: "#7C3AED",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7C3AED",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "#9A94A9" }}>
                <Bell className="h-6 w-6 text-violet-300" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: n.is_read ? "transparent" : "#FAF8FF",
                    border: n.is_read ? "1px solid transparent" : "1px solid #EDE9FE",
                    marginBottom: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        background: n.type === "assignment" ? "#7C3AED18" : "#05966918",
                        color: n.type === "assignment" ? "#7C3AED" : "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {n.type === "assignment" ? (
                        <ClipboardList className="h-4 w-4" />
                      ) : (
                        <Activity className="h-4 w-4" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "13px", color: "#1A1035", fontWeight: 700 }}>
                          {n.title}
                        </strong>
                        {!n.is_read && (
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: "#7C3AED",
                            }}
                          />
                        )}
                      </div>
                      <p style={{ fontSize: "12px", color: "#6B6580", margin: "4px 0 0", lineHeight: 1.35 }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
