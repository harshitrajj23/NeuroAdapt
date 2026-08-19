"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Stethoscope,
  Building,
  Shield,
  Bell,
  Check,
  LogOut,
  Mail,
  Lock,
} from "lucide-react";
import { useClinicianContext } from "../layout";

export default function ClinicianSettingsPage() {
  const { user } = useClinicianContext();
  const router = useRouter();

  const [clinicName, setClinicName] = useState("National Cognitive Rehabilitation Centre");
  const [licenseNumber, setLicenseNumber] = useState("MED-COG-2026-8891");
  const [alertCritical, setAlertCritical] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("neuroadapt_user");
    router.push("/auth");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage("Settings saved successfully.");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <>
      <div className="cl-section-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="cl-topbar-title" style={{ fontSize: "26px" }}>Clinician Practice Settings</h1>
          <p className="cl-section-subtitle">Manage clinical profile, institutional affiliation, and alert parameters</p>
        </div>
      </div>

      {saveMessage && (
        <div
          style={{
            padding: "12px 18px",
            background: "#ECFDF5",
            color: "#059669",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: 600,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Check className="h-4 w-4" /> {saveMessage}
        </div>
      )}

      {/* Clinician Profile Card */}
      <div className="cl-section">
        <div
          style={{
            background: "white",
            border: "1px solid #F0ECF9",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #6D28D9, #8B5CF6)",
                color: "white",
                fontSize: "24px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 20px rgba(109, 40, 217, 0.25)",
              }}
            >
              {(user?.name || "Dr").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1A1035", margin: "0 0 4px" }}>
                {user?.name || "Dr. Rajesh Mehta"}
              </h2>
              <div style={{ fontSize: "13.5px", color: "#6B6580", display: "flex", gap: "16px" }}>
                <span>Email: <strong>{user?.email || "dr.mehta@neuroadapt.org"}</strong></span>
                <span>Role: <strong>Clinician / Specialist</strong></span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="cl-modal-form">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="cl-form-group">
                <label className="cl-form-label">Clinical Institution / Hospital Name</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="cl-form-input"
                  />
                </div>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Medical / Rehabilitation License ID</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="cl-form-input"
                />
              </div>
            </div>

            {/* Notification Preferences */}
            <div style={{ marginTop: "12px" }}>
              <label className="cl-form-label" style={{ marginBottom: "10px", display: "block" }}>
                Clinical Alert Triggers
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13.5px", color: "#4C4658" }}>
                  <input
                    type="checkbox"
                    checked={alertCritical}
                    onChange={(e) => setAlertCritical(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#7C3AED" }}
                  />
                  <span>Trigger instant alert when patient accuracy dips below 60% in a session</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13.5px", color: "#4C4658" }}>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#7C3AED" }}
                  />
                  <span>Generate weekly cohort AI progress summary digests</span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <button type="submit" className="cl-topbar-action-btn" style={{ padding: "10px 24px" }}>
                Save Practice Settings
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security & Regulatory Compliance */}
      <div className="cl-section">
        <div
          style={{
            background: "white",
            border: "1px solid #F0ECF9",
            borderRadius: "20px",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ECFDF5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 style={{ fontSize: "14.5px", fontWeight: 700, color: "#1A1035", margin: 0 }}>
                Data Privacy & Regulatory Protection
              </h4>
              <p style={{ fontSize: "12.5px", color: "#9A94A9", margin: "2px 0 0" }}>
                All child session latency and accuracy records are encrypted in Supabase PostgreSQL (PRD Section 19).
              </p>
            </div>
          </div>
          <span className="cl-status-badge cl-status-badge--on-track">Compliance Verified</span>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ marginTop: "24px" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            borderRadius: "12px",
            background: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FEE2E2",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <LogOut className="h-4 w-4" /> Log Out of Clinician Portal
        </button>
      </div>

      <footer style={{ textAlign: "center", padding: "32px 0 12px", fontSize: "12.5px", color: "#B0ABBD" }}>
        NeuroAdapt Clinician Portal • SIH260206 Cognitive Retraining Program
      </footer>
    </>
  );
}
