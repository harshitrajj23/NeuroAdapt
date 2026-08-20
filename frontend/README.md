# 🧠 NeuroAdapt Frontend

The client-side interface for **NeuroAdapt** built with **Next.js 16 (Turbopack)**, **React 19**, and **TypeScript**.

For the complete platform architecture, AI/ML specifications, and system design, please see the [Root README](../README.md).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Key Routes

- `/` — Modern Animated Landing Page with Neural Particle Canvas
- `/auth` — Dual Authentication Portal (Child / Clinician)
- `/child` — Child Gamified Tele-Rehabilitation Dashboard
- `/child/exercises` — Cognitive Retraining Games (Attention, Memory, Reasoning, Problem Solving)
- `/child/progress` — Child Performance & Streak Analytics
- `/child/achievements` — Badges, XP & Milestones
- `/child/settings` — Accessibility Settings (Dark/Light Mode, Font Scaling)
- `/clinician` — Clinician Cohort Telemetry Dashboard
- `/clinician/patients` — Patient Registry & Search
- `/clinician/patients/[id]` — Individual Patient Chart, AI Voice Session Summary, and Parent Telegram Dispatcher
- `/clinician/plans` — Therapy Prescription Management
- `/clinician/analytics` — Cross-Cohort Accuracy & Latency Analytics

---

## 🛠️ Build & Verification
```bash
npm run build
```
