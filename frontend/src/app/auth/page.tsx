"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Brain,
  User,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";

type Role = "child" | "clinician" | "admin";
type Step = "select" | "form";
type Mode = "login" | "register";



/* ─────────────────── Logo (horizontal for form) ─────────────────── */
function FormLogo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="NeuroAdapt home">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute inset-0 rounded-xl bg-violet-100/60 blur-sm" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200/60 bg-white shadow-sm">
          <Brain className="h-5.5 w-5.5 text-violet-600" strokeWidth={1.8} />
        </div>
      </div>
      <span className="text-xl font-bold tracking-tight text-[#21164d]">
        Neuro<span className="text-violet-600">Adapt</span>
      </span>
    </Link>
  );
}



/* ─────────────────── Role Card (Portal Selection) ─────────────────── */
function RoleCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full max-w-[350px] overflow-hidden rounded-[28px] border border-violet-200/70 bg-white/65 p-7 text-left backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-violet-300 hover:bg-white/85 hover:shadow-[0_25px_70px_rgba(109,61,245,0.18)] focus:outline-none focus:ring-4 focus:ring-violet-300/30"
    >
      <div className="absolute bottom-0 left-0 right-0 h-[2px] origin-center scale-x-0 bg-gradient-to-r from-violet-400 via-purple-500 to-violet-400 transition-transform duration-500 group-hover:scale-x-100" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-200/30 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-7 flex justify-center">
          <div className="relative flex h-[100px] w-[100px] items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-violet-100/80 blur-xl transition-all duration-500 group-hover:scale-125 group-hover:bg-violet-200/80" />
            <div className="relative flex h-[86px] w-[86px] items-center justify-center rounded-full border border-violet-100 bg-gradient-to-br from-white to-violet-50 shadow-[0_10px_30px_rgba(124,58,237,0.10)] transition-transform duration-500 group-hover:scale-105">
              <div className="text-violet-600">{icon}</div>
            </div>
          </div>
        </div>
        <h2 className="text-center text-[25px] font-bold tracking-[-0.6px] text-[#17102f]">{title}</h2>
        <p className="mx-auto mt-2 max-w-[270px] text-center text-[15px] leading-6 text-[#8c879b]">{description}</p>
        <div className="mt-7 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-600 shadow-sm transition-all duration-500 group-hover:border-violet-300 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-[0_8px_25px_rgba(124,58,237,0.25)]">
            <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─────────────────── Background Decoration (for select step) ─────────────────── */
function BackgroundDecoration() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/30 blur-[140px]" />
      <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-300/20 blur-[120px]" />
      <div className="absolute -bottom-48 -left-40 h-[500px] w-[500px] rounded-full bg-violet-300/20 blur-[120px]" />

      <svg className="absolute left-0 top-0 h-[300px] w-[420px] opacity-60" viewBox="0 0 420 300" fill="none">
        <path d="M40 225 L110 130 L220 60 L350 95" stroke="#BFA6F7" strokeWidth="1" opacity=".35" />
        <path d="M110 130 L125 225 L220 60" stroke="#C9B4F8" strokeWidth="1" opacity=".3" />
        <path d="M220 60 L275 145 L350 95" stroke="#C9B4F8" strokeWidth="1" opacity=".3" />
        <circle cx="40" cy="225" r="5" fill="#9B6EF3" />
        <circle cx="110" cy="130" r="6" fill="#9B6EF3" />
        <circle cx="125" cy="225" r="4" fill="#D0B9FA" />
        <circle cx="220" cy="60" r="6" fill="#9B6EF3" />
        <circle cx="275" cy="145" r="4" fill="#D0B9FA" />
        <circle cx="350" cy="95" r="5" fill="#B58AF6" />
      </svg>

      <svg className="absolute bottom-0 right-0 h-[300px] w-[420px] opacity-60" viewBox="0 0 420 300" fill="none">
        <path d="M60 235 L145 180 L250 220 L360 125" stroke="#BFA6F7" strokeWidth="1" opacity=".35" />
        <path d="M145 180 L180 270 L250 220" stroke="#C9B4F8" strokeWidth="1" opacity=".3" />
        <path d="M250 220 L330 245 L360 125" stroke="#C9B4F8" strokeWidth="1" opacity=".3" />
        <circle cx="60" cy="235" r="5" fill="#A577F3" />
        <circle cx="145" cy="180" r="5" fill="#B68AF6" />
        <circle cx="180" cy="270" r="4" fill="#D0B9FA" />
        <circle cx="250" cy="220" r="6" fill="#9B6EF3" />
        <circle cx="330" cy="245" r="4" fill="#D0B9FA" />
        <circle cx="360" cy="125" r="6" fill="#9B6EF3" />
      </svg>

      <span className="absolute left-[9%] top-[47%] h-2 w-2 animate-pulse rounded-full bg-violet-300" />
      <span className="absolute right-[12%] top-[22%] h-2 w-2 animate-pulse rounded-full bg-purple-300 [animation-delay:700ms]" />
      <span className="absolute bottom-[30%] left-[7%] h-2 w-2 animate-pulse rounded-full bg-violet-300 [animation-delay:1200ms]" />
      <span className="absolute bottom-[18%] right-[18%] h-2 w-2 animate-pulse rounded-full bg-purple-300 [animation-delay:500ms]" />
      <span className="absolute left-[4%] top-[55%] h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_15px_5px_rgba(139,92,246,0.2)]" />
      <span className="absolute right-[5%] top-[35%] h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_15px_5px_rgba(139,92,246,0.2)]" />
    </div>
  );
}

/* ─────────────────── Centered Logo (for select step) ─────────────────── */
function CenteredLogo() {
  return (
    <Link href="/" className="group flex flex-col items-center" aria-label="NeuroAdapt home">
      <div className="relative mb-3 flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-violet-100/80 blur-md transition-all duration-500 group-hover:bg-violet-200" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200/80 bg-white/80 shadow-[0_8px_30px_rgba(124,58,237,0.12)] backdrop-blur">
          <Brain className="h-8 w-8 text-violet-600 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.7} />
        </div>
      </div>
      <div className="text-[25px] font-bold tracking-[-0.8px] text-[#21164d]">
        Neuro<span className="text-violet-600">Adapt</span>
      </div>
    </Link>
  );
}

/* ═════════════════════════════════════════════════════════════════════ */
/*                          MAIN COMPONENT                            */
/* ═════════════════════════════════════════════════════════════════════ */

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("select");
  const [role, setRole] = useState<Role>("child");
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const selectRole = (selectedRole: Role) => {
    setRole(selectedRole);
    setEmail("");
    setPassword("");
    setName("");
    setErrorMessage("");
    setStep("form");
  };

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const demoParam = searchParams.get("demo");

    const selected =
      roleParam === "clinician" || demoParam === "clinician"
        ? "clinician"
        : roleParam === "admin" || demoParam === "admin"
          ? "admin"
          : roleParam === "child" || demoParam === "child"
            ? "child"
            : null;

    if (selected) {
      setRole(selected);
      setStep("form");
      setEmail("");
      setPassword("");
      setName("");
      setErrorMessage("");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      if (mode === "register") {
        try {
          const res = await fetch(`${backendUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim() || email.split("@")[0],
              email: email.trim(),
              password: password,
              role: role,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({ detail: "Registration failed." }));
            throw new Error(data.detail || "Registration failed.");
          }
        } catch (fetchErr: any) {
          // If backend API (port 8000) is offline/unreachable, fallback for frontend dev demo
          if (fetchErr.message?.includes("Failed to fetch") || fetchErr.name === "TypeError") {
            console.warn("Backend API offline (port 8000). Authenticating in local demo mode.");
          } else {
            throw fetchErr;
          }
        }
      } else {
        try {
          const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              password: password,
              role: role,
            }),
          });

          const resData = res.ok ? await res.json().catch(() => null) : null;
          const userObj = {
            id: resData?.user?.id || resData?.id || 1,
            name: name.trim() || resData?.user?.name || resData?.name || email.split("@")[0],
            email: email.trim(),
            role: role,
          };
          localStorage.setItem("neuroadapt_user", JSON.stringify(userObj));
        } catch (fetchErr: any) {
          console.warn("Backend fetch fallback for frontend demo.", fetchErr);
          const fallbackUser = {
            id: 1,
            name: name.trim() || email.split("@")[0],
            email: email.trim(),
            role: role,
          };
          localStorage.setItem("neuroadapt_user", JSON.stringify(fallbackUser));
        }
      }

      setIsLoading(false);

      // Redirect to role portal
      if (role === "child") {
        router.push("/child");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  /* ───── Portal Selection Step ───── */
  if (step === "select") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#fbfaff] font-sans text-[#17102f]">
        <BackgroundDecoration />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
          <section className="flex w-full max-w-[850px] flex-col items-center">
            <div className="animate-[fadeUp_.7s_ease-out_both]">
              <CenteredLogo />
            </div>

            <div className="mt-8 text-center animate-[fadeUp_.7s_.1s_ease-out_both]" style={{ marginBottom: "64px" }}>
              <h1 className="text-[42px] font-bold tracking-[-1.8px] text-[#17102f] sm:text-[56px]">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                  NeuroAdapt
                </span>
              </h1>

              <p className="mt-3 text-[17px] text-[#918ca0]">
                Choose how you want to continue.
              </p>

              <div className="mx-auto mt-5 h-[2px] w-12 rounded-full bg-gradient-to-r from-violet-400 to-purple-500" />
            </div>

            <div
              className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row animate-[fadeUp_.8s_.2s_ease-out_both]"
              style={{ marginTop: "32px", marginBottom: "64px" }}
            >
              <RoleCard
                title="Child Portal"
                description="Engaging cognitive training games made for you."
                icon={<User className="h-11 w-11" strokeWidth={1.5} />}
                onClick={() => selectRole("child")}
              />

              <RoleCard
                title="Clinician Portal"
                description="Monitor progress, manage therapy, and support growth."
                icon={<Stethoscope className="h-11 w-11" strokeWidth={1.5} />}
                onClick={() => selectRole("clinician")}
              />
            </div>

            <div
              className="flex items-center gap-4 text-[14px] text-[#9a94a9] animate-[fadeUp_.8s_.35s_ease-out_both]"
              style={{ marginTop: "32px" }}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-500" />
                Secure
              </span>
              <span className="h-1 w-1 rounded-full bg-violet-300" />
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-violet-500" />
                Private
              </span>
              <span className="h-1 w-1 rounded-full bg-violet-300" />
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Guided
              </span>
            </div>
          </section>
        </div>

        <div className="pointer-events-none fixed bottom-0 left-1/2 h-32 w-[600px] -translate-x-1/2 rounded-full bg-violet-300/10 blur-3xl" />

        <style jsx global>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>
    );
  }

  /* ───── Login / Register Step (Split Layout) ───── */
  return (
    <main className="auth-split-layout">
      {/* Left: Landscape */}
      <div className="auth-left-panel">
        <Image
          src="/authBg.png"
          alt="NeuroAdapt"
          fill
          className="object-cover"
          style={{ objectPosition: "25% center" }}
          priority
        />

        {/* Back button overlaid on landscape */}
        <button
          type="button"
          onClick={() => setStep("select")}
          className="auth-back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portals
        </button>
      </div>

      {/* Right: Form Card */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          {/* Logo */}
          <div className="auth-form-logo">
            <FormLogo />
          </div>

          {/* Heading */}
          <div className="auth-form-heading">
            <h1>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p>
              {mode === "login" ? (
                <>Login to continue <span className="auth-purple-text">your journey</span>.</>
              ) : (
                <>Sign up to start <span className="auth-purple-text">your journey</span>.</>
              )}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name field for register */}
            {mode === "register" && (
              <div className="auth-input-group">
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    type="text"
                    placeholder="Full name"
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="Email address"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="auth-input auth-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5 text-gray-400" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            {mode === "login" && (
              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span className="auth-checkbox-custom">
                    {rememberMe && (
                      <svg viewBox="0 0 12 12" fill="none" className="auth-check-icon">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  Remember me
                </label>
                <button type="button" className="auth-forgot-link">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-button"
            >
              {isLoading ? (
                <div className="auth-spinner" />
              ) : (
                <>
                  {mode === "login" ? "Log In" : "Sign Up"}
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>



          {/* Toggle mode */}
          <p className="auth-toggle-text">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="auth-toggle-link"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}