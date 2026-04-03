# Gym Progress Tracker — Backend Design Spec

## Overview

Backend untuk Gym Progress Tracker MVP menggunakan Prisma ORM v7 + PostgreSQL (Neon), Auth.js v5 (Google + Credentials providers), dan Next.js Server Actions sebagai data layer. Menggantikan dummy data di frontend dengan data real dari database.

## Design Decisions

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Database | PostgreSQL via Neon | Sesuai PRD, sudah tersedia |
| ORM | Prisma v7 | Sesuai PRD, driver adapter required |
| Auth | Auth.js v5 (NextAuth) | Sesuai PRD, Google + Credentials |
| Data Layer | Next.js Server Actions | Lebih sederhana dari API routes untuk MVP |
| Session Strategy | JWT | Tidak perlu session table, lebih ringan |

## Approach: Server Actions vs API Routes

**Server Actions (dipilih):**
- Langsung dipanggil dari Client Components
- Type-safe end-to-end
- Tidak perlu fetch/axios
- Cocok untuk MVP

**API Routes (alternatif):**
- Lebih eksplisit
- Cocok jika ada external consumers
- Overkill untuk MVP

## Prisma Schema

Berdasarkan ERD di PRD, dengan tambahan fields untuk Auth.js:

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../generated/client"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // hashed, for Credentials provider
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  goals    Goal[]
  workouts Workout[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Goal {
  id            String    @id @default(cuid())
  userId        String
  exercise      String
  targetWeight  Float
  currentWeight Float     @default(0)
  deadline      DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Workout {
  id        String        @id @default(cuid())
  userId    String
  date      DateTime
  createdAt DateTime      @default(now())

  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises ExerciseLog[]
}

model ExerciseLog {
  id        String  @id @default(cuid())
  workoutId String
  exercise  String
  weight    Float
  reps      Int
  sets      Int

  workout Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)
}
```

## Auth.js Configuration

- **Providers**: Google + Credentials (email/password)
- **Adapter**: Prisma Adapter
- **Session**: JWT strategy
- **Pages**: Custom login page `/login`
- **Callbacks**: session callback menambahkan `user.id` ke session

## Server Actions

### `src/actions/auth.ts`
- `registerUser(email, password, name)` — Buat user baru, hash password dengan bcrypt
- `loginWithCredentials(email, password)` — Validasi credentials

### `src/actions/goals.ts`
- `getActiveGoal()` — Ambil goal aktif user saat ini
- `upsertGoal(data)` — Buat atau update goal (hanya 1 aktif per user)

### `src/actions/workouts.ts`
- `createWorkout(date, exercises[])` — Simpan workout + exercise logs
- `getRecentWorkouts(limit)` — Ambil N workout terakhir
- `getWorkoutsByWeek(weekStart)` — Ambil workouts per minggu

### `src/actions/progress.ts`
- `getWeeklySummary(weekStart)` — Ringkasan mingguan + delta dari minggu sebelumnya
- `getCurrentStats()` — Total workouts, streak, best 1RM

## File Structure (Backend additions)

```
prisma/
├── schema.prisma
prisma.config.ts
src/
├── generated/
│   └── client/             # Prisma generated client
├── lib/
│   ├── prisma.ts           # Singleton Prisma Client instance
│   ├── auth.ts             # Auth.js configuration
│   └── auth-adapter.ts     # Prisma adapter for Auth.js
├── actions/
│   ├── auth.ts             # Register/login actions
│   ├── goals.ts            # Goal CRUD actions
│   ├── workouts.ts         # Workout CRUD actions
│   └── progress.ts         # Progress/stats actions
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts  # Auth.js API route handler
.env                         # Database URL, auth secrets
.env.example                 # Template
```

## Environment Variables

```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Auth.js
AUTH_SECRET="generated-secret"
AUTH_URL="http://localhost:3000"

# Google OAuth (user fills in later)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## Frontend Integration

Setelah backend siap, semua halaman diupdate untuk:
1. Mengganti import dari `@/data/dummy` ke server actions
2. Dashboard: `getActiveGoal()`, `getRecentWorkouts(3)`, `getCurrentStats()`
3. Progress: `getWorkoutsByWeek()`, `getWeeklySummary()`
4. Goal: `getActiveGoal()`, `upsertGoal()`
5. Add Workout: `createWorkout()`
6. Profile: session data dari Auth.js
7. Login: Auth.js `signIn()` / `signOut()`

## Verification Plan

### Build Test
- `npx prisma generate` — menghasilkan client tanpa error
- `npx prisma db push` — schema sync ke Neon tanpa error
- `npm run build` — build Next.js sukses

### Manual Testing
1. Buka `/login`, coba register user baru (email/password)
2. Login dan cek redirect ke `/dashboard`
3. Tambah workout via FAB, cek tersimpan di database
4. Cek progress page menampilkan data real
5. Edit goal, cek tersimpan
