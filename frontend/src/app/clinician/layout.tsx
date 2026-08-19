"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart2,
  Settings,
  LogOut,
  Bell,
  Search,
  Stethoscope,
  Plus,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import "./clinician-dashboard.css";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     CLINICIAN CONTEXT                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ClinicianProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ClinicianContextType {
  user: ClinicianProfile | null;
  apiUrl: string;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ClinicianContext = createContext<ClinicianContextType>({
  user: null,
  apiUrl: "",
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function useClinicianContext() {
  return useContext(ClinicianContext);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                           SIDEBAR                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function Sidebar({
  userName,
  onLogout,
}: {
  userName: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    { id: "/clinician", label: "Dashboard", icon: <LayoutDashboard className="h-[19px] w-[19px]" strokeWidth={1.8} /> },
    { id: "/clinician/patients", label: "Patients", icon: <Users className="h-[19px] w-[19px]" strokeWidth={1.8} /> },
    { id: "/clinician/plans", label: "Therapy Plans", icon: <ClipboardList className="h-[19px] w-[19px]" strokeWidth={1.8} /> },
    { id: "/clinician/analytics", label: "Cohort Analytics", icon: <BarChart2 className="h-[19px] w-[19px]" strokeWidth={1.8} /> },
    { id: "/clinician/settings", label: "Settings", icon: <Settings className="h-[19px] w-[19px]" strokeWidth={1.8} /> },
  ];

  const isActive = (id: string) => {
    if (id === "/clinician") return pathname === "/clinician";
    return pathname.startsWith(id);
  };

  return (
    <aside className="cl-sidebar">
      {/* Logo */}
      <Link href="/" className="cl-sidebar-logo" aria-label="NeuroAdapt home">
        <div className="cl-sidebar-logo-icon">
          <Brain className="h-6 w-6 text-violet-600" strokeWidth={1.8} />
        </div>
        <span className="cl-sidebar-logo-text">
          Neuro<span className="cl-sidebar-logo-accent">Adapt</span>
        </span>
        <span className="cl-sidebar-badge">MD</span>
      </Link>

      <div className="cl-sidebar-separator" />

      {/* Navigation */}
      <nav className="cl-sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.id}
            className={`cl-sidebar-nav-item ${isActive(item.id) ? "cl-sidebar-nav-item--active" : ""}`}
          >
            <span className="cl-sidebar-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {isActive(item.id) && <span className="cl-sidebar-nav-indicator" />}
          </Link>
        ))}
      </nav>

      {/* User Bottom card */}
      <div className="cl-sidebar-bottom">
        <div className="cl-sidebar-separator" />
        <div className="cl-sidebar-user">
          <div className="cl-sidebar-user-avatar">
            <span>{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="cl-sidebar-user-info">
            <span className="cl-sidebar-user-name">{userName}</span>
            <span className="cl-sidebar-user-role">Clinician</span>
          </div>
        </div>
        <button onClick={onLogout} className="cl-sidebar-logout">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         MAIN LAYOUT                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function ClinicianLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ClinicianProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // Derive page title
  const pageTitle = (() => {
    if (pathname === "/clinician") return "Clinician Dashboard";
    if (pathname.startsWith("/clinician/patients/")) return "Patient Longitudinal Profile";
    if (pathname.includes("/patients")) return "Patient Management";
    if (pathname.includes("/plans")) return "Therapy Plans";
    if (pathname.includes("/analytics")) return "Cohort Progress Analytics";
    if (pathname.includes("/settings")) return "Clinician Settings";
    return "Clinician Portal";
  })();

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("neuroadapt_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === "clinician") {
          setUser(parsed);
        } else if (parsed.role === "child") {
          router.replace("/child");
        } else {
          router.replace("/auth?role=clinician");
        }
      } else {
        router.replace("/auth?role=clinician");
      }
    } catch {
      router.replace("/auth?role=clinician");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("neuroadapt_user");
    router.push("/auth?role=clinician");
  };

  if (!mounted || !user) {
    return (
      <div className="cl-loading">
        <div className="cl-loading-spinner" />
        <span>Loading Clinician Portal...</span>
      </div>
    );
  }

  const displayName = user.name || "Clinician";

  return (
    <ClinicianContext.Provider value={{ user, apiUrl, refreshTrigger, triggerRefresh }}>
      <div className="cl-layout">
        <Sidebar userName={displayName} onLogout={handleLogout} />
        <main className="cl-main">
          {/* Topbar */}
          <header className="cl-topbar">
            <div className="cl-topbar-left">
              <div>
                <h1 className="cl-topbar-title">{pageTitle}</h1>
                <span className="cl-topbar-subtitle">Clinician Oversight & Neurocognitive Progress Monitoring</span>
              </div>
            </div>
            <div className="cl-topbar-right">
              <Link href="/clinician/patients" className="cl-topbar-action-btn">
                <Plus className="h-4 w-4" /> Add Patient
              </Link>
              <NotificationBell userId={user.id} apiUrl={apiUrl} />
            </div>
          </header>

          {/* Page Content */}
          <div className="cl-content custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </ClinicianContext.Provider>
  );
}
