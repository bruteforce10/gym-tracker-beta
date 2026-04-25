# First Login Onboarding & Plan Generator Design

## Context

Setelah user login atau daftar untuk pertama kali, aplikasi saat ini langsung mengarah ke dashboard. Flow itu terlalu cepat untuk produk fitness yang ingin terasa personal sejak hari pertama.

Repo sudah memiliki fondasi:
- auth flow di `src/app/login/page.tsx`
- target berbasis exercise melalui model `Goal`
- workout plan melalui model `WorkoutPlan`

Yang belum ada adalah lapisan onboarding fitness yang:
- mengumpulkan profil latihan user
- menghasilkan `goal` awal
- menghasilkan `workout plan` awal
- memberi user kesempatan review sebelum plan diaktifkan

## Goals

- Menambahkan onboarding pertama kali setelah login/register
- Mengumpulkan jawaban fitness inti tanpa membuat flow terasa panjang
- Menghasilkan `goal` awal dan `workout plan` awal dari jawaban onboarding
- Menyediakan halaman review sebelum plan aktif
- Menjaga logika plan tetap mudah dipahami, diuji, dan di-tune

## Non-Goals

- Membangun AI coach atau recommendation engine berbasis model
- Mengganti sistem `Goal` existing menjadi habit goal atau body composition goal
- Mengubah guided workout session yang sudah ada
- Menambah chat UI atau AI streaming interface

## Product Flow

1. User login atau register
2. Sistem cek apakah user sudah memiliki profil onboarding aktif
3. Jika belum, user diarahkan ke wizard onboarding
4. Setelah wizard selesai, sistem generate draft:
   - `goal` awal
   - `workout plan` awal
   - alasan singkat rekomendasi
5. User masuk ke halaman review
6. User konfirmasi untuk mengaktifkan hasil draft
7. Setelah aktif, user diarahkan ke dashboard dengan state yang sudah personal

## Recommendation

Gunakan pendekatan `hybrid rule-based + light scoring`.

### Rule-Based Layer

Dipakai untuk keputusan besar yang harus konsisten:
- pemilihan split program
- jumlah hari latihan
- kategori exercise
- baseline set, reps, dan rest

### Light Scoring Layer

Dipakai untuk memberi emphasis:
- lebih strength
- lebih hypertrophy
- lebih fat-loss supportive
- lebih beginner-friendly

Pendekatan ini dipilih karena:
- cocok dengan struktur repo saat ini
- mudah di-debug
- hasilnya tetap terasa personal
- bisa dikembangkan nanti memakai histori latihan tanpa membuang fondasi awal

## Data Model

### New Model: `UserFitnessProfile`

Simpan hasil onboarding di entitas terpisah agar profil fitness tidak bercampur langsung dengan data identitas `User`.

Field yang disarankan:
- `id`
- `userId`
- `primaryGoal`
- `secondaryGoal`
- `experienceLevel`
- `trainingDaysPerWeek`
- `loadLevel`
- `gender`
- `equipmentAccess`
- `planStatus`
- `draftPlanPayload`
- `planVersion`
- `onboardingCompletedAt`
- `createdAt`
- `updatedAt`

### Suggested Enum Values

- `primaryGoal` dan `secondaryGoal`
  - `muscle_gain`
  - `strength`
  - `fat_loss`
  - `general_fitness`

- `experienceLevel`
  - `beginner`
  - `intermediate`
  - `advanced`

- `loadLevel`
  - `very_light`
  - `light`
  - `moderate`
  - `heavy`

- `gender`
  - `male`
  - `female`
  - `prefer_not_to_say`

- `equipmentAccess`
  - `full_gym`
  - `limited_gym`
  - `home_gym`
  - `bodyweight`

- `planStatus`
  - `needs_onboarding`
  - `draft_generated`
  - `active`

### Existing Models Reused

- `WorkoutPlan`
  Menyimpan hasil plan aktif
- `Goal`
  Menyimpan target awal berbasis exercise

### Draft Strategy

Versi pertama menggunakan `draftPlanPayload` pada `UserFitnessProfile`.

Payload ini menyimpan hasil generator yang belum diaktifkan:
- ringkasan plan
- daftar exercise draft
- goal draft
- review summary

Alasan keputusan ini:
- scope implementasi lebih kecil
- route review tetap bisa di-refresh tanpa kehilangan state
- tidak perlu menambah model draft terpisah untuk versi pertama

Jika nanti kebutuhan review semakin kompleks, payload ini bisa dipindah ke model `GeneratedPlanDraft` tanpa mengubah alur produk utama.

## Onboarding Questions

Urutan onboarding dibuat dari keputusan paling mudah ke paling teknis.

1. `Apa tujuan utama latihanmu?`
2. `Apa tujuan sekundermu?`
3. `Berapa kali kamu realistis latihan per minggu?`
4. `Level gym kamu sekarang apa?`
5. `Kemampuan bebanmu secara umum seperti apa?`
6. `Kamu biasanya latihan di mana?`
7. `Gender`

## Answer Rules

- User memilih satu `primaryGoal`
- User memilih satu `secondaryGoal`
- `secondaryGoal` tidak boleh sama dengan `primaryGoal`
- `trainingDaysPerWeek` diisi fleksibel oleh user dan menjadi input wajib
- `gender` hanya dipakai untuk minor adjustment, bukan penentu struktur plan

## Generator Architecture

Generator dibagi menjadi empat tahap.

### 1. Normalize Answers

Jawaban onboarding diubah menjadi profil internal yang stabil:
- `primaryGoal`
- `secondaryGoal`
- `experienceLevel`
- `trainingDaysPerWeek`
- `loadLevel`
- `equipmentAccess`
- `genderAdjustment`

Tujuan tahap ini adalah memastikan semua logika sesudahnya memakai bentuk data yang konsisten.

### 2. Select Program Template

Pilih split dasar berdasarkan frekuensi dan level.

Aturan awal yang direkomendasikan:
- 2 hari: `full_body`
- 3 hari: `full_body_alt` atau variasi `upper_lower_plus_full`
- 4 hari: `upper_lower`
- 5 hari: `goal_based_split`
- 6 hari: `push_pull_legs_x2` hanya jika level mendukung

Versi pertama harus memilih template konservatif bila ada konflik sinyal.

### 3. Apply Goal & Constraint Modifiers

Setelah template dasar dipilih, generator mengubah detail plan.

Modifier utama:
- `strength`
  - compound lebih dominan
  - reps lebih rendah
  - rest lebih panjang
- `muscle_gain`
  - volume lebih tinggi
  - variasi exercise lebih kaya
  - accessory lebih penting
- `fat_loss`
  - density lebih efisien
  - durasi sesi lebih terkendali
- `general_fitness`
  - distribusi seimbang
  - tidak terlalu ekstrem

Constraint modifier:
- `beginner`
  - kurangi kompleksitas
  - pilih gerakan stabil dan mudah dipahami
- `home_gym` atau `bodyweight`
  - ganti exercise yang butuh machine atau setup khusus
- `very_light`
  - start konservatif
- `gender`
  - hanya penyesuaian copy atau preference kecil

### 4. Build Outputs

Generator menghasilkan:
- `draft workout plan`
- `draft goal`
- `review summary`

## Goal Generation

Model `Goal` sekarang paling dekat dengan target weight per exercise, jadi goal awal untuk versi pertama harus mengikuti struktur itu.

### Recommendation

Gunakan `exercise-based starter goal`.

Aturan:
- pilih 1 atau 2 exercise anchor dari plan
- buat 1 goal aktif utama
- target disesuaikan dengan level dan fokus utama

Contoh arah:
- `strength beginner`
  - target pada bench press, squat, atau anchor movement sejenis
- `muscle_gain beginner`
  - tetap exercise-based, tetapi target lebih konservatif
- `general_fitness`
  - pilih exercise anchor yang mudah dipahami dan tidak menakutkan

### Deferred Scope

Goal tipe berikut belum masuk versi pertama:
- consistency goal mingguan
- body composition goal
- habit goal

Jika nanti ingin mendukung itu, schema `Goal` perlu diperluas.

## UX/UI Direction

### Visual Direction

Gunakan arah `performance editorial`:
- tetap dark dan atletik seperti GRYNX
- emerald tetap menjadi aksen utama
- layout terasa tegas, fokus, dan cepat dipindai
- onboarding tidak terasa seperti survei panjang

### Core Interaction Pattern

- satu pertanyaan per layar
- option cards besar dan mudah ditap
- progress bar jelas
- tombol `Kembali` dan `Lanjut`
- state pilihan sebelumnya tetap terlihat saat user mundur

### Screen Flow

1. `Welcome Setup`
   - intro singkat
   - ekspektasi bahwa flow hanya beberapa langkah

2. `Question Steps`
   - primary goal
   - secondary goal
   - training days
   - experience level
   - load level
   - equipment access
   - gender

3. `Generating Plan`
   Tampilkan staged loading:
   - membaca profil latihan
   - memilih template program
   - menyiapkan goal awal

4. `Plan Review`
   Tiga blok utama:
   - `Profilmu`
   - `Plan awal`
   - `Goal awal`

5. `Activation`
   CTA utama:
   - `Aktifkan Plan`
   CTA sekunder:
   - `Ubah Jawaban`

6. `Post-Activation`
   Redirect ke dashboard dengan welcome state yang mengakui plan baru aktif

## UX Rules

- Jangan simpan ke database pada setiap step
- Simpan hasil final saat submit onboarding selesai
- Jika user keluar di tengah flow, lanjutkan dari draft lokal atau state terakhir yang masih valid
- Halaman review harus bisa mengembalikan user ke wizard tanpa reset total
- Progress indicator harus selalu terlihat
- Versi pertama tidak menyediakan edit exercise manual sebelum aktivasi; perubahan dilakukan dengan kembali ke jawaban onboarding atau mengedit plan setelah aktif

## Error Handling

- Jika generator gagal:
  tampilkan fallback dengan template dasar, bukan blank page
- Jika penyimpanan ke database gagal:
  pertahankan draft sementara dan beri retry
- Jika user sudah onboarding tetapi belum punya plan aktif:
  arahkan ke review draft, bukan dashboard kosong
- Jika jawaban tampak bertentangan:
  jangan anggap invalid, pilih output konservatif

## Technical Integration Notes

- Auth flow saat ini redirect ke `/dashboard`
- Flow baru membutuhkan gate setelah login/register agar first-time user menuju onboarding
- User lama yang sudah punya profil aktif tidak boleh dipaksa melewati onboarding lagi
- Review draft sebaiknya berada di route terpisah agar state dan refresh handling lebih stabil

## Accessibility & Web UI Guardrails

Implementasi onboarding harus membawa guardrails ini:
- label form wajib terhubung ke input melalui `htmlFor`
- input punya `name` dan `autocomplete`
- icon-only buttons wajib punya `aria-label`
- loading copy memakai `…`, bukan `...`
- hindari `transition-all`
- tampilkan error dekat area yang bermasalah
- touch targets aman untuk mobile

Temuan relevan dari screen login saat ini:
- `src/app/login/page.tsx` label belum terhubung ke input
- tombol show/hide password belum punya `aria-label`
- auth inputs belum punya `name` dan `autocomplete`
- masih ada `transition-all`

## Testing Strategy

### Unit Tests

- normalization logic
- template selection
- goal emphasis scoring
- constraint modifier
- output builder

### Integration Tests

- first login/register diarahkan ke onboarding
- submit onboarding menghasilkan review draft
- konfirmasi review mengaktifkan plan dan goal
- user existing bypass onboarding

### UI Regression Checks

- mobile layout tetap aman pada layar kecil
- progress step tidak overflow
- loading, error, dan empty state tetap terbaca
- review screen tetap rapi untuk plan pendek maupun panjang

## Rollout Guidance

Mulai dengan versi pertama yang:
- menghasilkan satu plan awal
- menghasilkan satu goal aktif utama
- memakai review screen sebelum aktivasi
- belum melakukan adaptasi otomatis dari histori workout

Setelah itu baru pertimbangkan:
- regenerasi plan berkala
- personalisasi dari completion rate
- goal non-exercise
- edit plan yang lebih granular sebelum aktivasi
