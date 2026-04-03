# ExerciseDB Integration & Exercise Catalog Sync — Design Spec

## Overview

Tujuan perubahan ini adalah mengganti library exercise lokal yang sekarang tersebar di beberapa tempat dengan satu katalog exercise internal yang diimpor dari ExerciseDB. Aplikasi tidak akan bergantung langsung ke API eksternal saat runtime. ExerciseDB dipakai sebagai sumber upstream untuk proses import/sync, lalu seluruh fitur aplikasi membaca data dari database internal yang konsisten.

Perubahan ini juga menjadi titik reset untuk model lama yang masih menyimpan exercise sebagai nama string mentah. Setelah integrasi ini, seluruh alur utama harus memakai `exerciseId` yang konsisten untuk goal, workout log, workout plan, guided session, manual log, progress, dan halaman detail exercise.

## Selected Approach

Pendekatan yang dipilih adalah membuat tabel master `Exercise` di PostgreSQL melalui Prisma, lalu menyediakan script import satu arah dari ExerciseDB ke tabel tersebut.

Alternatif yang dipertimbangkan:

1. Runtime fetch langsung ke ExerciseDB dari UI/server action
   - Ditolak karena rawan rate limit, loading tidak stabil, dan memperbesar risiko mismatch schema/UI.

2. Menyimpan snapshot statis lokal di file TypeScript/JSON
   - Ditolak karena sulit dipelihara untuk dataset penuh dan buruk untuk relasi Prisma.

3. Import seluruh dataset ke database internal lalu query secara lokal
   - Dipilih karena paling konsisten, mudah di-query, dan menjadi fondasi yang sehat untuk seluruh fitur app.

## Scope

Termasuk dalam pekerjaan ini:

- Menambah model `Exercise` sebagai katalog internal
- Mengubah relasi domain agar memakai `exerciseId`
- Menyediakan import/sync script dari ExerciseDB
- Mereset data lama yang masih bergantung pada nama exercise string
- Mengganti source exercise di UI dan server actions ke katalog internal
- Menambah halaman katalog exercise dan halaman detail exercise
- Menyelaraskan komponen UI yang masih membaca `src/data/dummy.ts` atau `src/data/exercises.ts`
- Memperbaiki isu UI dasar di area yang disentuh, terutama label, `aria-label`, dan penggunaan `transition-all`

Di luar scope:

- Menyimpan `overview`, `instructions`, `keywords`, `exerciseTips`, `variations`, dan `relatedExerciseIds`
- Hosting ulang media ExerciseDB
- Sinkronisasi dua arah ke ExerciseDB
- Migrasi best-effort data lama berbasis nama

## Data Model

### New Model

Tambahkan model `Exercise` sebagai master catalog.

```prisma
model Exercise {
  id               String   @id @default(cuid())
  externalId       String   @unique
  slug             String   @unique
  name             String
  bodyParts        Json
  equipments       Json
  gender           String?
  exerciseType     String?
  targetMuscles    Json
  secondaryMuscles Json
  imageUrl         String?
  videoUrl         String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  goals            Goal[]
  logs             ExerciseLog[]
  planExercises    WorkoutPlanExercise[]
}
```

Catatan desain:

- `externalId` menyimpan ID asli dari ExerciseDB.
- `slug` dipakai untuk route detail page dan dibuat unik dari nama exercise.
- Field list seperti `bodyParts`, `equipments`, `targetMuscles`, dan `secondaryMuscles` disimpan sebagai `Json` array string untuk menjaga fleksibilitas terhadap bentuk data upstream dan menghindari coupling berlebih ke variasi format ExerciseDB.
- `imageUrl` dan `videoUrl` hanya menyimpan referensi URL/path upstream.

### Modified Models

`Goal`:

```prisma
model Goal {
  id            String    @id @default(cuid())
  userId        String
  exerciseId    String
  targetWeight  Float
  currentWeight Float     @default(0)
  deadline      DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise      Exercise  @relation(fields: [exerciseId], references: [id], onDelete: Restrict)
}
```

`ExerciseLog`:

```prisma
model ExerciseLog {
  id         String   @id @default(cuid())
  workoutId  String
  exerciseId String
  weight     Float
  reps       Int
  sets       Int

  workout    Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise   Exercise @relation(fields: [exerciseId], references: [id], onDelete: Restrict)
}
```

`WorkoutPlanExercise`:

```prisma
model WorkoutPlanExercise {
  id          String      @id @default(cuid())
  planId      String
  exerciseId  String
  defaultSets Int         @default(3)
  defaultReps Int         @default(10)
  restTime    Int         @default(60)
  order       Int

  plan        WorkoutPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  exercise    Exercise    @relation(fields: [exerciseId], references: [id], onDelete: Restrict)
}
```

## Import & Sync Pipeline

### Source of Truth

ExerciseDB adalah sumber upstream. Database internal aplikasi adalah source of truth runtime.

### Import Behavior

Sediakan script import yang:

1. Mengambil seluruh dataset exercise dari ExerciseDB
2. Menormalkan hanya field berikut:
   - `externalId`
   - `name`
   - `bodyParts`
   - `equipments`
   - `gender`
   - `exerciseType`
   - `targetMuscles`
   - `secondaryMuscles`
   - `imageUrl`
   - `videoUrl`
3. Membuat `slug` yang stabil dan unik
4. Melakukan upsert ke tabel `Exercise`

Field lain dari ExerciseDB diabaikan sepenuhnya pada saat import.

### Import Safety

Import harus bersifat fail-safe:

- Jangan menghapus katalog lama sebelum import baru valid
- Lakukan validasi minimal terhadap payload upstream
- Abaikan record yang tidak memiliki identifier atau nama yang valid
- Laporkan jumlah inserted, updated, skipped, dan errored

### Runtime Querying

Setelah import tersedia, aplikasi runtime tidak boleh mengambil detail exercise langsung dari ExerciseDB. Semua route, action, dan komponen query data dari Prisma.

## Data Reset Strategy

Dipilih strategi reset penuh untuk data lama yang terkait exercise agar tidak ada data setengah sinkron.

Reset mencakup:

- `Goal`
- `ExerciseLog`
- `Workout`
- `WorkoutPlanExercise`
- `WorkoutPlan`

Urutan reset harus aman terhadap foreign key. Setelah reset selesai dan catalog baru sudah ada, default plans dapat dibuat ulang dari katalog `Exercise`.

Data lama berbasis nama exercise tidak akan dimigrasikan.

## Domain Flow Changes

### Goal

- Goal form memilih exercise dari katalog internal
- Data yang disimpan adalah `exerciseId`
- Saat render, nama exercise di-resolve dari relasi `exercise`
- Perhitungan 1RM terkini membandingkan `ExerciseLog.exerciseId` terhadap `Goal.exerciseId`

### Manual Workout Logging

- Manual log memilih exercise dari katalog internal
- Data workout menyimpan `exerciseId`, bukan nama exercise
- Setelah save, seluruh tampilan progress dan workout history membaca nama dari relasi `exercise`

### Workout Plans

- Plan editor membaca seluruh exercise dari katalog internal
- `WorkoutPlanExercise.exerciseId` merefer ke tabel `Exercise`
- Default upper/lower plans dibangun dari hasil klasifikasi katalog internal, bukan dari `src/data/exercises.ts`

### Guided Session

- Session state browser boleh membawa label turunan untuk kebutuhan UI instan
- Saat save, payload akhir tetap menggunakan `exerciseId`
- Ringkasan session, progress, dan history membaca relasi ke `Exercise`

### Progress

- Agregasi weekly summary tetap dihitung dari `ExerciseLog`
- Nama yang ditampilkan berasal dari relasi `exercise`
- Tidak ada lagi grouping berdasarkan string bebas

## Exercise Classification

Dataset ExerciseDB memakai struktur seperti `bodyParts`, `targetMuscles`, dan metadata lain, sementara flow plan sekarang membutuhkan grouping seperti upper/lower atau kategori visual.

Karena app masih butuh grouping untuk plan dan UI, sediakan layer mapping internal yang menurunkan kategori aplikasi dari metadata ExerciseDB. Mapping ini bukan source of truth upstream, tetapi aturan aplikasi.

Aturan awal:

- `upper`: chest, back, shoulders, upper arms, lower arms
- `lower`: upper legs, lower legs, glutes
- jika sebuah exercise tidak jatuh ke grouping yang dibutuhkan, exercise tetap ada di katalog tetapi tidak wajib ikut default plan

Mapping ini disimpan di layer util/service aplikasi, bukan di dataset import mentah.

## Routes & UI Surfaces

### New Routes

- `/exercises`
  - katalog exercise
  - menampilkan list/filter/search dari database internal

- `/exercises/[slug]`
  - halaman detail exercise
  - hanya menampilkan:
    - gambar dan/atau video
    - `bodyParts`
    - `equipments`
    - `gender`
    - `exerciseType`
    - `targetMuscles`
    - `secondaryMuscles`

### Existing Routes to Update

- `/goal`
- `/plan`
- `/workout/start`
- `/workout/session`
- manual workout sheet
- halaman progress yang menampilkan nama exercise

### Exercise Detail Layout

Halaman detail harus ringkas dan mobile-first:

- media section di bagian atas
- metadata disusun sebagai chips atau grid ringkas
- tanpa blok teks panjang
- jika `videoUrl` kosong atau tidak valid untuk embed/playback, tampilkan gambar sebagai media utama
- jika keduanya kosong, tampilkan placeholder state yang konsisten

## UI Guardrails

Area yang disentuh harus mengikuti pedoman web interface:

- icon-only button wajib punya `aria-label`
- form control harus punya label yang terhubung
- hindari `transition-all`; gunakan properti spesifik
- loading text memakai elipsis `…`
- state kosong harus punya fallback yang utuh
- nomor/angka komparatif di UI yang cocok memakai `tabular-nums`

Temuan eksplorasi yang perlu dibereskan saat implementasi:

- pilihan exercise di [src/components/add-workout-sheet.tsx](/Users/mm/Documents/gym-tracker/src/components/add-workout-sheet.tsx) masih dari `src/data/dummy.ts`
- pilihan goal di [src/app/(app)/goal/page.tsx](/Users/mm/Documents/gym-tracker/src/app/(app)/goal/page.tsx) masih dari `src/data/dummy.ts`
- beberapa icon button belum memiliki `aria-label`
- beberapa select/input label belum terhubung dengan `id`

## Files Expected to Change

Area utama yang diperkirakan berubah:

- `prisma/schema.prisma`
- `src/actions/goals.ts`
- `src/actions/workouts.ts`
- `src/actions/plans.ts`
- `src/actions/progress.ts`
- `src/components/add-workout-sheet.tsx`
- `src/components/plan-editor-sheet.tsx`
- `src/app/(app)/goal/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/workout/start/page.tsx`
- `src/app/(app)/workout/session/page.tsx`
- route baru katalog/detail exercise
- util/import script untuk ExerciseDB

`src/data/dummy.ts` dan `src/data/exercises.ts` akan berhenti menjadi source of truth runtime. Jika masih tersisa, keberadaannya hanya transisional dan harus dipangkas jika sudah tidak dipakai.

## Error Handling

- Jika catalog kosong, halaman yang membutuhkan exercise harus menampilkan empty state yang jelas
- Jika detail exercise tidak ditemukan, route detail harus memberi not found state yang aman
- Jika import gagal, catalog lama tetap dipakai
- Jika default plan tidak bisa dibuat karena mapping kategori kosong, app tidak crash dan user tetap bisa membuat custom plan
- Jika media tidak tersedia, UI fallback ke placeholder

## Testing & Verification

Verifikasi minimum yang harus dilakukan saat implementasi:

1. Prisma schema valid dan client berhasil digenerate
2. Import berhasil mengisi seluruh catalog `Exercise`
3. Reset data lama menghapus semua data exercise-dependent tanpa menyisakan FK error
4. Goal baru bisa dibuat dari catalog baru
5. Manual log menyimpan `exerciseId` dan tetap muncul benar di progress/history
6. Workout plan bisa dibuat/edit dari catalog baru
7. Guided session bisa selesai dan auto-save ke struktur data baru
8. Progress mingguan tetap menghitung 1RM dengan benar
9. Exercise detail page aman saat media kosong
10. Form dan icon button yang disentuh memenuhi accessibility dasar

## Rollout Sequence

Urutan implementasi yang direkomendasikan:

1. Ubah schema Prisma
2. Tambah import script dan katalog internal
3. Reset data lama
4. Ubah server actions dan query domain ke `exerciseId`
5. Ubah UI forms dan session flow
6. Tambah katalog exercise dan detail page
7. Bersihkan fallback lama dan unused data sources
8. Lakukan verifikasi end-to-end

## Acceptance Criteria

Perubahan dianggap selesai jika:

- seluruh source exercise runtime berasal dari tabel `Exercise`
- tidak ada fitur inti yang masih menyimpan nama exercise sebagai identifier
- dataset ExerciseDB berhasil diimport penuh dengan field yang sudah disepakati
- detail page hanya menampilkan media dan metadata inti yang disepakati
- data lama yang tidak sinkron telah di-reset
- flow goal, manual log, plan, guided session, dan progress tetap berjalan dari satu katalog yang sama
