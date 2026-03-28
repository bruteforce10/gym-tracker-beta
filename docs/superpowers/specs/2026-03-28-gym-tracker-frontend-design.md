# Gym Progress Tracker — Frontend Design Spec

## Overview

Aplikasi mobile-first untuk melacak progres kekuatan gym. Frontend-only fase pertama menggunakan dummy data. Aesthetic: **Sleek Sports Tech** — premium, halus, glassmorphism subtle, mirip Apple Watch/Garmin app.

## Design Decisions

| Keputusan | Pilihan |
|---|---|
| Aesthetic | Sleek Sports Tech — gradient halus, glassmorphism, rounded cards |
| Color Accent | Emerald Green `#10B981` |
| Dark Mode | Ya, sebagai default |
| Navigation | 4 Tab + FAB (Dashboard, Progress, Goal, Profile + floating "+" untuk Add Workout) |
| Tech Stack | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| Data | Dummy data statis (JSON) |

## Color Palette

```
--bg-primary:     #0A0A0F     (near-black)
--bg-secondary:   #13131A     (dark card)
--bg-tertiary:    #1C1C27     (elevated surfaces)
--border:         #2A2A3A     (subtle borders)
--text-primary:   #F5F5F7     (white text)
--text-secondary: #8B8BA3     (muted text)
--accent:         #10B981     (emerald green)
--accent-glow:    #10B981/20  (glow effect)
--danger:         #EF4444     (negative delta)
--warning:        #F59E0B     (caution)
```

## Typography

- **Display/Headings**: `Outfit` (Google Fonts) — geometric, modern, sporty
- **Body**: `DM Sans` (Google Fonts) — clean readability di mobile
- **Numbers/Data**: `JetBrains Mono` — monospaced untuk angka berat/1RM agar mudah dibandingkan

## Pages & Components

### 1. Login Page (`/login`)
- Logo + app name "GymForge"
- Email/password form
- Google sign-in button
- Gradient mesh background subtle
- Animasi masuk: staggered fade-in

### 2. Dashboard (`/dashboard`)
**Header Section:**
- Greeting: "Halo, [Nama]" dengan tanggal hari ini
- Quick stat cards (glassmorphism): Total Workouts, Current Streak, Best 1RM

**Goal Progress Card:**
- Circular progress ring (animated) menampilkan % progress ke target
- Exercise name, current 1RM vs target weight
- Deadline countdown (jika ada)

**Recent Workouts:**
- List 3 workout terakhir dalam card format
- Setiap card: tanggal, jumlah exercise, highlight 1RM tertinggi

### 3. Add Workout (Bottom Sheet / Modal)
- Trigger: FAB "+" di bottom nav
- Slide-up bottom sheet (mobile-native feel)
- **Date picker** di atas
- **Exercise input**: dropdown + custom input
- **Set entry**: Weight (kg) + Reps per set, bisa tambah multiple sets
- **Add Exercise** button untuk menambah exercise lain ke session yg sama
- **Auto-calculated 1RM** ditampilkan real-time saat input weight & reps
- **Save** button dengan konfirmasi

### 4. Progress Page (`/progress`)
**Weekly Summary Section:**
- Week selector (swipe/arrow antar minggu)
- Untuk setiap exercise di minggu itu:
  - Exercise name
  - Peak 1RM minggu ini
  - Delta dari minggu sebelumnya (↑ hijau / ↓ merah)
  - Mini sparkline trend (4 minggu terakhir)

**Workout History:**
- Grouped by date
- Expandable workout cards menampilkan detail setiap set

### 5. Goal Page (`/goal`)
- **Active Goal Card** (prominent):
  - Exercise, target weight, current 1RM
  - Large circular progress visualization
  - Deadline (jika ada)
  - Edit button
- **Edit Goal Form**:
  - Exercise dropdown
  - Target weight input
  - Current weight input (auto-populated dari 1RM terakhir)
  - Deadline picker (opsional)

### 6. Profile Page (`/profile`)
- User avatar & nama
- Stats: member since, total workouts, total exercises logged
- Settings placeholder (untuk MVP, hanya UI)
- Logout button

### Bottom Navigation Bar
- Fixed di bawah, 4 icon + label
- Layout: `Dashboard` | `Progress` | `[FAB +]` | `Goal` | `Profile`
- FAB: Tombol bulat emerald green, elevated, dengan glow effect
- Active state: icon + label emerald green, inactive: muted gray

## Shared Components

| Component | Deskripsi |
|---|---|
| `BottomNav` | Fixed bottom navigation dengan FAB |
| `StatCard` | Glassmorphism card untuk quick stats |
| `ProgressRing` | Circular progress animasi SVG |
| `WorkoutCard` | Card untuk workout history item |
| `WeeklyDelta` | Badge menampilkan perubahan 1RM (↑/↓) |
| `ExerciseInput` | Form group: exercise + weight + reps + sets |
| `BottomSheet` | Slide-up modal untuk Add Workout |
| `PageHeader` | Header dengan greeting/title |

## Dummy Data Structure

```typescript
// Dummy user
const user = {
  id: "1",
  name: "Ahmad",
  email: "ahmad@example.com",
  createdAt: "2025-01-15"
};

// Active goal
const goal = {
  id: "1",
  exercise: "Bench Press",
  targetWeight: 100, // kg
  currentWeight: 72.5,
  deadline: "2026-06-30"
};

// Recent workouts (last 3 weeks)
const workouts = [
  {
    id: "1",
    date: "2026-03-28",
    exercises: [
      { exercise: "Bench Press", weight: 65, reps: 5, sets: 3 },
      { exercise: "Incline Press", weight: 50, reps: 8, sets: 3 },
      { exercise: "Tricep Dips", weight: 0, reps: 12, sets: 3 }
    ]
  },
  // ... more workouts per week
];
```

## Animation & Micro-interactions

- **Page transitions**: Subtle fade + slide
- **Progress ring**: Animated fill on mount (ease-out)
- **Cards**: Hover lift effect (translateY -2px + shadow)
- **FAB**: Pulse glow animation idle, scale on tap
- **Delta badges**: Count-up animation untuk angka
- **Bottom sheet**: Spring-physics slide up
- **Number inputs**: Haptic-like visual feedback (brief scale pulse)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + fonts + BottomNav
│   ├── page.tsx            # Redirect to /dashboard
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── progress/page.tsx
│   ├── goal/page.tsx
│   └── profile/page.tsx
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── bottom-nav.tsx
│   ├── fab-button.tsx
│   ├── stat-card.tsx
│   ├── progress-ring.tsx
│   ├── workout-card.tsx
│   ├── weekly-delta.tsx
│   ├── exercise-input.tsx
│   ├── bottom-sheet.tsx
│   └── page-header.tsx
├── data/
│   └── dummy.ts            # All dummy data
├── lib/
│   ├── utils.ts            # shadcn utils
│   └── calculations.ts     # 1RM formula, progress calc
└── styles/
    └── globals.css          # Design tokens + custom styles
```

## Verification Plan

### Automated
- `npm run build` — Next.js build tanpa error
- `npm run lint` — No lint warnings

### Browser Testing
- Buka setiap page di browser (viewport 390x844 — iPhone 14)
- Verifikasi bottom nav, FAB, dan navigasi antar page
- Verifikasi dark mode rendering
- Screenshot setiap page untuk dokumentasi
