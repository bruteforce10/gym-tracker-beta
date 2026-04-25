# Free Workout Mode Design

Date: 2026-04-25
Owner: Codex
Status: Draft for review

## Summary

Tambahkan `Mode Bebas` sebagai opsi tambahan pada flow memulai workout tanpa menggantikan `Plan Mode` yang sudah ada. Pada mode ini user memilih minimal 1 exercise lebih dulu dari katalog exercise lengkap, lalu stopwatch mulai saat sesi dimulai. Setelah masuk ke halaman session, user tetap bisa menambahkan exercise lain secara realtime melalui search dan filter favorit, lalu melanjutkan workout dengan tombol `next` seperti flow session yang ada sekarang.

Tujuan utamanya adalah membuat workout terasa lebih spontan untuk user yang tidak ingin menyiapkan atau mengikuti plan tertentu, sambil mempertahankan semua perilaku inti pada session workout yang sudah berjalan.

## Goals

- Menambahkan opsi `Mode Bebas` di halaman start workout.
- Mengizinkan user memilih exercise dari seluruh katalog database.
- Menyediakan search dan akses cepat ke exercise favorit.
- Memulai timer hanya setelah user menekan tombol mulai.
- Mengizinkan penambahan exercise baru selama session masih berlangsung.
- Mempertahankan `Plan Mode` tanpa regresi perilaku.

## Non-Goals

- Tidak mengubah flow onboarding atau pembuatan plan.
- Tidak menambahkan editor sets/reps/rest sebelum session dimulai.
- Tidak menambahkan drag-and-drop reordering sebelum start.
- Tidak menyatukan engine `Plan Mode` dan `Free Mode` menjadi arsitektur baru yang terpisah total.
- Tidak menambahkan persistence draft free workout di database sebelum workout disimpan.

## User Experience

### Start Workout

Halaman `/workout/start` akan memiliki dua mode entry:

- `Dari Plan`: flow yang sekarang tetap dipertahankan.
- `Mode Bebas`: membuka picker exercise bebas.

Saat user memilih `Mode Bebas`, tampilan start berubah dari pemilihan plan menjadi katalog exercise:

- Ada search input.
- Ada section atau filter `Favorit`.
- Ada hasil katalog umum dari database.
- User bisa memilih banyak exercise.
- Tombol start aktif setelah minimal 1 exercise dipilih.

Begitu tombol start ditekan:

- Session disimpan ke `sessionStorage`.
- `startedAt` diisi saat itu juga.
- User diarahkan ke `/workout/session`.

### In-Session Free Mode

Saat session bertipe bebas:

- Header session tetap menampilkan stopwatch aktif.
- Nama session tampil sebagai `Free Workout`.
- Current exercise tetap memakai kartu utama yang sama seperti flow sekarang.
- Progress tetap dihitung berdasarkan total set dari semua exercise yang sudah ada di session.
- User bisa menambahkan exercise kapan saja dari dalam halaman session.

Tambah exercise di tengah workout membuka picker yang serupa dengan picker start:

- Search real-time.
- Section favorit.
- Hasil katalog umum.

Exercise yang dipilih akan:

- Langsung ditambahkan ke `snapshot.exercises`.
- Langsung mendapat set entries default.
- Masuk ke akhir antrean exercise bebas.
- Tidak mengubah stopwatch.

Flow set entry tetap sama:

- User mengisi berat dan reps saat set berjalan.
- Setelah satu exercise selesai, tombol `next` atau alur existing akan lanjut ke exercise berikutnya.

## Product Decisions

Keputusan yang sudah disepakati untuk mode ini:

- `Mode Bebas` adalah opsi tambahan, bukan pengganti `Plan Mode`.
- User memilih minimal 1 exercise dulu sebelum timer dimulai.
- Detail set tidak diatur sebelum start; input dilakukan saat session berjalan.
- User bisa menambah exercise lain secara realtime selama workout berlangsung.
- Katalog mengambil semua exercise dari database, dengan akses ke favorit dan search.

## Data Model Changes

Session workout saat ini masih menganggap semua session punya `planId`, `planName`, dan `planOrder` yang identik dengan plan. Untuk mendukung `Mode Bebas`, model session perlu digeneralisasi.

### Proposed Session Shape

Tambahkan metadata mode pada `SessionData`:

- `sessionSource: "plan" | "free"`
- `planId: string | null`
- `planName: string`

`planName` tetap dipakai sebagai label tampilan agar komponen existing tidak perlu dirombak besar. Pada free mode, nilainya adalah `Free Workout`.

`planOrder` pada `SessionProgress` tetap dipertahankan, tetapi maknanya digeser menjadi urutan primary exercise session, bukan urutan eksklusif dari plan. Dengan begitu engine progress existing tetap bisa dipakai baik untuk plan maupun free mode.

### Session Exercise Source

`SessionExercise.source` saat ini:

- `plan`
- `dynamic-superset`

Perlu ditambah:

- `free`

Maknanya:

- `plan`: exercise berasal dari workout plan saat start.
- `free`: exercise berasal dari mode bebas, baik dipilih sebelum start maupun ditambah saat session berjalan.
- `dynamic-superset`: exercise sementara yang ditambahkan sebagai pasangan superset.

### Snapshot Initialization

`createInitialSnapshot` perlu mendukung session bebas dengan cara:

- mengisi `planOrder` dari semua exercise dengan source `plan` atau `free`
- memilih primary pertama dari urutan tersebut
- tetap membuat `allSets` untuk semua exercise

Normalisasi snapshot juga harus mempertahankan exercise yang ditambahkan di tengah session.

## Technical Approach

### 1. Workout Start Page

Perbarui [src/app/(app)/workout/start/page.tsx](/Users/mm/Documents/gym-tracker/src/app/(app)/workout/start/page.tsx):

- Tambahkan state pemilih mode start.
- Pertahankan branch UI `Plan Mode` yang ada.
- Tambahkan branch UI `Free Mode`.

Untuk `Free Mode`, gunakan ulang pola dari action dan picker yang sudah ada:

- `getExerciseQuickPickerData` untuk favorit dan hasil eksplorasi awal
- `searchExercises` atau `getFavoriteAwareExerciseCatalog` untuk katalog lebih luas jika dibutuhkan

Implementasi awal sebaiknya memprioritaskan reuse dari komponen picker yang ada, bukan membuat sistem pencarian baru dari nol.

### 2. Session Storage Contract

Perbarui [src/lib/workout-session.ts](/Users/mm/Documents/gym-tracker/src/lib/workout-session.ts):

- Generalisasi `SessionData`
- Tambahkan `sessionSource`
- Izinkan `planId` bernilai `null`
- Tambahkan `free` ke `SessionExerciseSource`
- Ubah generator `planOrder` agar memasukkan source `free`

Backward compatibility tetap perlu dijaga agar snapshot lama yang sudah tersimpan dari flow plan tetap bisa dinormalisasi dengan aman.

### 3. In-Session Add Exercise

Perbarui [src/app/(app)/workout/session/page.tsx](/Users/mm/Documents/gym-tracker/src/app/(app)/workout/session/page.tsx):

- Tampilkan CTA `Tambah Exercise` bila `snapshot.sessionSource === "free"`
- CTA membuka picker/search sheet
- Saat user memilih exercise, app:
  - membangun `SessionExercise` baru dengan source `free`
  - menambahkan exercise ke `snapshot.exercises`
  - membuat `allSets` default lewat `createInitialSetEntries`
  - menambahkan `sessionExerciseId` ke akhir `planOrder`

Jika session bebas belum punya primary active yang valid, exercise pertama yang ditambahkan harus menjadi primary aktif. Namun untuk implementasi fase ini, karena user wajib memilih minimal 1 exercise sebelum start, kondisi tersebut seharusnya tidak terjadi kecuali snapshot korup.

### 4. Progress and Next Logic

Logic existing untuk pindah exercise sudah bergantung pada `planOrder` dan `primaryIndex`. Karena free mode juga akan mengisi `planOrder`, behavior dasar bisa tetap dipakai.

Penyesuaian yang dibutuhkan:

- copy UI wording agar tidak terlalu plan-centric saat free mode
- pastikan label seperti `Exercise 1/N` tetap berasal dari panjang `planOrder`
- pastikan `nextPlanExercises` juga membaca antrean free mode dengan benar

Superset tetap dapat dibiarkan bekerja mengikuti perilaku existing, tetapi tidak menjadi fokus utama feature ini. Jika ada konflik UX, priority adalah stabilitas flow utama tambah exercise dan next antar exercise.

## Error Handling

- Jika picker gagal memuat katalog, tampilkan empty/error state non-blocking dan berikan aksi retry.
- Jika session storage korup atau tidak lengkap, redirect kembali ke `/workout/start`.
- Jika penambahan exercise gagal karena data exercise tidak valid, tampilkan toast atau inline error dan biarkan session berjalan.
- Jika save workout di akhir gagal, session tetap dipertahankan seperti perilaku existing.

## Testing Strategy

### Manual Scenarios

1. Start `Plan Mode` dan pastikan flow lama tetap identik.
2. Start `Free Mode`, pilih 1 exercise, mulai session, lalu selesaikan workout sampai tersimpan.
3. Start `Free Mode`, pilih beberapa exercise, cek urutan dan progress.
4. Saat session `Free Mode` sedang berjalan, tambahkan exercise baru lalu lanjut `next`.
5. Gunakan search untuk menemukan exercise umum.
6. Gunakan favorit untuk memilih exercise favorit.
7. Toggle favorite dari picker lalu pastikan state UI ikut berubah.
8. Reload halaman session dan pastikan snapshot free mode tetap pulih dari `sessionStorage`.
9. Coba session lama dari `Plan Mode` dan pastikan normalization tidak rusak.

### Unit/Behavior Checks

Tambahkan atau perbarui test untuk utilitas session:

- `createInitialSnapshot` memasukkan source `free` ke `planOrder`
- `buildStoredSessionSnapshot` tetap kompatibel dengan payload lama
- helper add-exercise-to-session menambahkan exercise dan set entries dengan benar

## Risks

- Ada coupling kuat antara istilah `plan` dan session engine saat ini, terutama pada nama field dan copy UI.
- Menambah exercise ke session yang sedang berjalan bisa memunculkan edge case pada `primaryIndex` bila implementasi append order tidak konsisten.
- Superset logic existing cukup kompleks, sehingga perubahan pada antrean primary harus dijaga seminimal mungkin.

## Recommended Implementation Order

1. Generalisasi model session untuk mendukung `free`.
2. Tambahkan UI mode selector di workout start.
3. Implementasikan picker `Free Mode` sebelum start.
4. Implementasikan `Tambah Exercise` di halaman session.
5. Rapikan copy UI untuk membedakan `Plan Mode` dan `Free Mode`.
6. Verifikasi flow plan lama dan save workout akhir.

## Open Questions Resolved

- Free mode menjadi opsi tambahan: resolved.
- Source exercise memakai seluruh katalog database: resolved.
- Favorit dan search tersedia: resolved.
- Timer mulai setelah user tekan start, bukan saat masuk picker: resolved.
- Detail set diisi saat session berjalan: resolved.
- Exercise baru bisa ditambahkan saat workout ongoing: resolved.
