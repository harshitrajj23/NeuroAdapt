



"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  Gamepad2,
  BarChart3,
  Trophy,
  TrendingUp,
  Award,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import "./child-dashboard.css";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       USER CONTEXT                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  age?: number;
}

interface ChildContextType {
  user: UserProfile | null;
  apiUrl: string;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  fontSize: "normal" | "large" | "xlarge";
  setFontSize: (s: "normal" | "large" | "xlarge") => void;
}

const ChildContext = createContext<ChildContextType>({
  user: null,
  apiUrl: "",
  theme: "light",
  setTheme: () => {},
  fontSize: "normal",
  setFontSize: () => {},
});

export function useChildContext() {
  return useContext(ChildContext);
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
    { id: "/child", label: "Dashboard", icon: <LayoutDashboard className="h-[20px] w-[20px]" strokeWidth={1.8} /> },
    { id: "/child/exercises", label: "Exercises", icon: <Gamepad2 className="h-[20px] w-[20px]" strokeWidth={1.8} /> },
    { id: "/child/progress", label: "Progress", icon: <BarChart3 className="h-[20px] w-[20px]" strokeWidth={1.8} /> },
    { id: "/child/achievements", label: "Achievements", icon: <Trophy className="h-[20px] w-[20px]" strokeWidth={1.8} /> },
    { id: "/child/settings", label: "Settings", icon: <Settings className="h-[20px] w-[20px]" strokeWidth={1.8} /> },
  ];

  const isActive = (id: string) => {
    if (id === "/child") return pathname === "/child";
    return pathname.startsWith(id);
  };

  return (
    <aside className="cd-sidebar">
      {/* Logo */}
      <Link href="/" className="cd-sidebar-logo" aria-label="NeuroAdapt home">
        <div className="cd-sidebar-logo-icon">
          <Brain className="h-6 w-6 text-violet-600" strokeWidth={1.8} />
        </div>
        <span className="cd-sidebar-logo-text">
          Neuro<span className="cd-sidebar-logo-accent">Adapt</span>
        </span>
      </Link>

      {/* Separator */}
      <div className="cd-sidebar-separator" />

      {/* Navigation */}
      <nav className="cd-sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.id}
            className={`cd-sidebar-nav-item ${isActive(item.id) ? "cd-sidebar-nav-item--active" : ""}`}
          >
            <span className="cd-sidebar-nav-icon">{item.icon}</span>
            <span className="cd-sidebar-nav-label">{item.label}</span>
            {isActive(item.id) && <span className="cd-sidebar-nav-indicator" />}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="cd-sidebar-bottom">
        <div className="cd-sidebar-separator" />
        {/* User card */}
        <div className="cd-sidebar-user">
          <div className="cd-sidebar-user-avatar">
            <span>{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="cd-sidebar-user-info">
            <span className="cd-sidebar-user-name">{userName}</span>
            <span className="cd-sidebar-user-role">Child</span>
          </div>
        </div>
        <button onClick={onLogout} className="cd-sidebar-logout">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         LAYOUT                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [fontSize, setFontSizeState] = useState<"normal" | "large" | "xlarge">("normal");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Derive page title from pathname
  const pageTitle = (() => {
    if (pathname === "/child") return "Dashboard";
    if (pathname.includes("/exercises")) return "Exercises";
    if (pathname.includes("/progress")) return "Progress";
    if (pathname.includes("/achievements")) return "Achievements";
    if (pathname.includes("/settings")) return "Settings";
    return "Dashboard";
  })();

  useEffect(() => {
    setMounted(true);
    try {
      // Load user
      const stored = localStorage.getItem("neuroadapt_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === "child") {
          setUser(parsed);
        } else if (parsed.role === "clinician") {
          router.replace("/clinician");
        } else {
          router.replace("/auth?role=child");
        }
      } else {
        router.replace("/auth?role=child");
      }

      // Load theme
      const savedTheme = localStorage.getItem("neuroadapt_child_theme") as "light" | "dark" | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      }

      // Load font size
      const savedFont = localStorage.getItem("neuroadapt_child_fontsize") as "normal" | "large" | "xlarge" | null;
      if (savedFont === "normal" || savedFont === "large" || savedFont === "xlarge") {
        setFontSizeState(savedFont);
      }
    } catch {
      router.replace("/auth?role=child");
    }
  }, [router]);

  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    try {
      localStorage.setItem("neuroadapt_child_theme", t);
    } catch {}
  };

  const setFontSize = (s: "normal" | "large" | "xlarge") => {
    setFontSizeState(s);
    try {
      localStorage.setItem("neuroadapt_child_fontsize", s);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem("neuroadapt_user");
    router.push("/auth?role=child");
  };

  if (!mounted || !user) {
    return (
      <div className="cd-loading">
        <div className="cd-loading-spinner" />
        <span>Loading your dashboard...</span>
      </div>
    );
  }

  const displayName = user.name || user.email?.split("@")[0] || "User";

  return (
    <ChildContext.Provider value={{ user, apiUrl, theme, setTheme, fontSize, setFontSize }}>
      <div className={`cd-layout cd-theme-${theme} cd-font-${fontSize}`} data-theme={theme}>
        <Sidebar userName={displayName} onLogout={handleLogout} />
        <main className="cd-main">
          {/* Top bar */}
          <header className="cd-topbar">
            <div className="cd-topbar-left">
              <h2 className="cd-topbar-title">{pageTitle}</h2>
            </div>
            <div className="cd-topbar-right">
              <NotificationBell userId={user.id} apiUrl={apiUrl} />
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="cd-content custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </ChildContext.Provider>
  );
}
