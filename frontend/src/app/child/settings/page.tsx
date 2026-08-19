"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Volume2,
  Monitor,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Check,
} from "lucide-react";
import { useChildContext } from "../layout";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, theme, setTheme, fontSize, setFontSize } = useChildContext();
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("neuroadapt_user");
    router.push("/auth");
  };

  return (
    <>
      <div className="cd-page-header">
        <h1 className="cd-page-heading">Settings</h1>
        <p className="cd-page-desc">Customize your NeuroAdapt experience</p>
      </div>

      {/* Profile section */}
      <div className="cd-settings-section">
        <h2 className="cd-settings-section-title">
          <User className="h-5 w-5 text-violet-500" /> Profile
        </h2>
        <div className="cd-settings-card">
          <div className="cd-settings-profile">
            <div className="cd-settings-avatar">
              <span>{(user?.name || "U").charAt(0).toUpperCase()}</span>
            </div>
            <div className="cd-settings-profile-info">
              <span className="cd-settings-profile-name">{user?.name || "User"}</span>
              <span className="cd-settings-profile-email">{user?.email || ""}</span>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <span className="cd-settings-profile-role">Role: {user?.role || "child"}</span>
                {user?.age && (
                  <span className="cd-settings-profile-role" style={{ background: "#EDE9FE", color: "#6D28D9" }}>
                    Age: {user.age} yrs
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="cd-settings-section">
        <h2 className="cd-settings-section-title">
          <Palette className="h-5 w-5 text-violet-500" /> Appearance
        </h2>
        <div className="cd-settings-card">
          <div className="cd-settings-row">
            <div className="cd-settings-row-left">
              <Monitor className="h-4.5 w-4.5 text-gray-500" />
              <div>
                <span className="cd-settings-row-title">Theme</span>
                <span className="cd-settings-row-desc">Choose your preferred color scheme</span>
              </div>
            </div>
            <div className="cd-settings-toggle-group">
              <button
                className={`cd-settings-toggle-opt ${theme === "light" ? "cd-settings-toggle-opt--active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4" /> Light
              </button>
              <button
                className={`cd-settings-toggle-opt ${theme === "dark" ? "cd-settings-toggle-opt--active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
          </div>
          <div className="cd-settings-divider" />
          <div className="cd-settings-row">
            <div className="cd-settings-row-left">
              <span className="cd-settings-fontsize-icon">Aa</span>
              <div>
                <span className="cd-settings-row-title">Font Size</span>
                <span className="cd-settings-row-desc">Adjust text size for better readability</span>
              </div>
            </div>
            <div className="cd-settings-toggle-group">
              {(["normal", "large", "xlarge"] as const).map(size => (
                <button
                  key={size}
                  className={`cd-settings-toggle-opt ${fontSize === size ? "cd-settings-toggle-opt--active" : ""}`}
                  onClick={() => setFontSize(size)}
                >
                  {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sound & Notifications */}
      <div className="cd-settings-section">
        <h2 className="cd-settings-section-title">
          <Bell className="h-5 w-5 text-violet-500" /> Sound & Notifications
        </h2>
        <div className="cd-settings-card">
          <div className="cd-settings-row">
            <div className="cd-settings-row-left">
              <Volume2 className="h-4.5 w-4.5 text-gray-500" />
              <div>
                <span className="cd-settings-row-title">Sound Effects</span>
                <span className="cd-settings-row-desc">Play sounds during exercises</span>
              </div>
            </div>
            <button
              className={`cd-settings-switch ${soundEnabled ? "cd-settings-switch--on" : ""}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <span className="cd-settings-switch-knob" />
            </button>
          </div>
          <div className="cd-settings-divider" />
          <div className="cd-settings-row">
            <div className="cd-settings-row-left">
              <Bell className="h-4.5 w-4.5 text-gray-500" />
              <div>
                <span className="cd-settings-row-title">Notifications</span>
                <span className="cd-settings-row-desc">Receive session reminders</span>
              </div>
            </div>
            <button
              className={`cd-settings-switch ${notificationsEnabled ? "cd-settings-switch--on" : ""}`}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              <span className="cd-settings-switch-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="cd-settings-section">
        <h2 className="cd-settings-section-title">
          <Shield className="h-5 w-5 text-violet-500" /> Privacy & Security
        </h2>
        <div className="cd-settings-card">
          <div className="cd-settings-row">
            <div className="cd-settings-row-left">
              <Shield className="h-4.5 w-4.5 text-gray-500" />
              <div>
                <span className="cd-settings-row-title">Data Privacy</span>
                <span className="cd-settings-row-desc">Your data is encrypted and secure</span>
              </div>
            </div>
            <span className="cd-settings-badge-secure">
              <Check className="h-3 w-3" /> Secure
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="cd-settings-section">
        <button className="cd-settings-logout-btn" onClick={handleLogout}>
          <LogOut className="h-4.5 w-4.5" />
          Log Out
        </button>
      </div>

      <footer className="cd-footer">
        <span>NeuroAdapt © 2026 — AI-assisted cognitive rehabilitation</span>
      </footer>
    </>
  );
}
