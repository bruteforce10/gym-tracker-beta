# Workout Session Dynamic Superset Design

## Context

`/workout/session` saat ini menjalankan workout sebagai urutan linear:
- user memilih plan dan exercise di `/workout/start`
- session disimpan ke `sessionStorage`
- `/workout/session` memproses `exerciseIndex` dan `setIndex` satu per satu
- setelah setiap set selesai, app masuk ke rest timer biasa
- setelah seluruh exercise selesai, hasil workout disimpan sebagai `Workout` dan `ExerciseLog`

Flow ini nyaman untuk latihan normal, tetapi belum mendukung situasi nyata saat user ingin membuat superset dadakan di tengah sesi. Permintaan fitur yang divalidasi:
- superset ditambahkan saat sesi workout sedang berjalan
- perubahan hanya berlaku pada sesi aktif, tidak mengubah plan asli
- setelah set exercise utama selesai, ada jeda transisi 10 detik lalu pindah ke exercise superset
- exercise tambahan berjalan sebagai pasangan penuh sampai kedua sisi superset selesai
- pemilihan exercise tambahan harus cepat, dengan prioritas `favorite` dan `recent`
- `favorite` berlaku lintas app, bukan hanya di workout session

## Goals

- Menambahkan kemampuan `Tambah Superset` pada exercise aktif di `/workout/session`
- Menjalankan pasangan main exercise + superset secara bolak-balik sampai pasangan selesai
- Menyimpan superset sebagai state sesi aktif tanpa mengubah `WorkoutPlan`
- Menambahkan sistem `favorite exercise` per user yang bisa dipakai lintas app
- Menyediakan daftar `recent` yang membantu quick add tanpa memaksa user search dari nol
- Menjaga UI tetap cepat dipakai pada layar mobile saat user sedang latihan

## Non-Goals

- Mengubah plan user secara otomatis saat superset ditambahkan
- Menambahkan multi-superset chain atau circuit dengan lebih dari dua exercise
- Menambahkan input manual nama exercise baru saat quick add
- Mengubah struktur `Workout` dan `ExerciseLog` menjadi model superset permanen
- Menyelesaikan semua integrasi favorit di seluruh layar pada iterasi pertama selain menyediakan fondasi data dan picker pattern yang bisa dipakai ulang

## Approaches Considered

### 1. Session-only dynamic pairing with persistent favorites

Tambah satu model database untuk `favorite`, hitung `recent` dari data yang sudah ada, lalu kelola superset penuh hanya di state sesi aktif.

Kelebihan:
- memenuhi kebutuhan tanpa mengubah plan
- hasil workout tetap tersimpan dengan model log yang sekarang
- risiko migrasi kecil karena perubahan database terbatas
- cocok dengan pola app yang sudah memakai akun dan server state

Kekurangan:
- state sesi menjadi lebih kompleks
- urutan progress tidak lagi sekadar linear `exerciseIndex/setIndex`

### 2. Persist superset ke plan sementara sebelum sesi dimulai

Saat user menambah superset, sistem membuat variasi plan sementara lalu session membaca plan hasil modifikasi itu.

Kelebihan:
- flow session bisa tetap lebih linear
- pairing bisa terlihat seperti bagian dari urutan plan

Kekurangan:
- menambah kompleksitas sinkronisasi antara plan, draft session, dan hasil save
- rawan membuat user mengira plan asli ikut berubah
- terlalu berat untuk kebutuhan "dadakan saat workout"

### 3. Quick insert one-off exercise only

Exercise tambahan ditambahkan hanya sebagai sisipan satu set setelah rest 10 detik, bukan pasangan penuh.

Kelebihan:
- implementasi lebih kecil
- state timer lebih sederhana

Kekurangan:
- tidak sesuai perilaku yang dipilih user
- pengalaman superset terasa setengah jadi

## Recommendation

Pilih pendekatan 1: `session-only dynamic pairing with persistent favorites`.

Pendekatan ini paling pas dengan kebutuhan user:
- favorit konsisten lintas app dan lintas device
- superset tetap terasa spontan dan fleksibel
- plan asli tetap aman
- data workout akhir masih bisa memakai model `ExerciseLog` yang sekarang

## Data Model

### New Prisma Model

Tambahkan model baru:

```prisma
model FavoriteExercise {
  id         String   @id @default(cuid())
  userId     String
  exerciseId String
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise   Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

  @@unique([userId, exerciseId])
  @@index([userId, createdAt])
}
```

Relasi tambahan:
- `User.favoriteExercises FavoriteExercise[]`
- `Exercise.favoritedBy FavoriteExercise[]`

### Recent Source

`Recent` tidak membutuhkan tabel baru.

Daftar recent diambil dari aktivitas yang memang dilakukan user:
- sumber utama: `ExerciseLog` terbaru milik user
- fallback: `WorkoutPlanExercise` yang paling baru atau paling sering muncul jika log recent belum cukup

Hasil akhirnya adalah daftar exercise unik yang diurutkan berdasarkan recency.

## Session State Design

State session saat ini berupa daftar exercise linear. Untuk mendukung superset penuh, setiap unit exercise aktif perlu bisa punya pasangan sementara.

Representasi yang diusulkan:

```ts
type SessionExercise = {
  sessionExerciseId: string;
  exerciseId: string;
  name: string;
  imageUrl?: string | null;
  category: ExerciseDisplayCategory | null;
  primaryLabel: string;
  trainingStyle: "compound" | "isolation";
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  source: "plan" | "dynamic-superset";
};

type SessionPairing = {
  primarySessionExerciseId: string;
  supersetSessionExerciseId: string;
  transitionRestSeconds: number;
  status: "active" | "cancelled" | "completed";
};

type ActiveTurn = {
  sessionExerciseId: string;
  lane: "primary" | "superset";
};
```

Prinsip utama:
- exercise dari plan tetap menjadi backbone urutan sesi
- exercise superset tambahan disisipkan sebagai session item baru dengan `source: "dynamic-superset"`
- pairing disimpan terpisah dari plan order supaya mudah dibatalkan tanpa merusak daftar exercise utama
- seluruh state pairing disimpan ke `sessionStorage` bersama state session lain agar aman saat refresh

## Workout Flow

### Start State

Saat session dimulai:
- user memilih plan dan subset exercise seperti flow sekarang
- session menyimpan daftar exercise plan tanpa superset
- state turn awal menunjuk ke exercise plan aktif

### Add Superset

Saat user menekan `Tambah Superset` pada exercise aktif:
- app membuka quick add sheet
- user memilih exercise dari `Favorite`, `Recent`, atau hasil search
- app menolak jika exercise yang dipilih sama dengan exercise aktif
- jika exercise aktif sudah punya pairing aktif, user diberi pilihan `Ganti Superset` atau `Batal`
- jika dikonfirmasi, app membuat `SessionExercise` baru untuk exercise tambahan dan `SessionPairing` baru dengan `transitionRestSeconds = 10`

Pairing hanya berlaku untuk exercise aktif yang sedang dijalankan, bukan untuk seluruh plan.

### Turn Sequence

Urutan perilaku setelah pairing aktif:

1. User menyelesaikan set pada primary exercise.
2. App masuk ke `transition rest` selama 10 detik.
3. Setelah timer selesai atau user menekan `Skip`, giliran pindah ke superset exercise.
4. User menyelesaikan satu set superset.
5. App masuk ke `normal rest` memakai `restTime` milik exercise yang baru diselesaikan.
6. Setelah rest normal selesai, giliran kembali ke lane yang masih punya set tersisa.
7. Pola ini berulang sampai kedua lane selesai.

Aturan sisa set:
- jika primary punya set lebih banyak, sisa set primary dilanjutkan normal setelah superset selesai
- jika superset punya set lebih banyak, sisa set superset diselesaikan dulu sebelum lanjut ke next exercise plan
- session hanya pindah ke exercise plan berikutnya jika primary dan superset pada pairing aktif sama-sama selesai, atau pairing dibatalkan

### Cancel Superset

User bisa menekan `Batalkan Superset` selama pairing masih aktif.

Perilaku cancel:
- set yang sudah selesai tetap disimpan di state session
- set superset yang belum dikerjakan dibuang dari flow
- pairing ditandai `cancelled`
- giliran kembali ke flow normal primary exercise

## Timer State Machine

Status timer saat ini hanya membedakan `input`, `resting`, dan `done`. Untuk superset, state perlu dipisah agar transisi 10 detik dan rest normal terasa jelas.

Status yang diusulkan:

```ts
type WorkoutState =
  | "input-primary"
  | "input-superset"
  | "rest-transition"
  | "rest-normal"
  | "done";
```

Aturan:
- `rest-transition` selalu 10 detik dan secara visual berbeda dari rest biasa
- `rest-normal` memakai `restTime` milik exercise yang baru diselesaikan
- tombol `Skip` tersedia pada kedua mode rest
- tombol `+30s` hanya tersedia pada `rest-normal`, bukan `rest-transition`, agar transisi superset tetap cepat dan konsisten

## Save Strategy

Tidak perlu mengubah model `Workout` dan `ExerciseLog`.

Saat auto-save:
- session mengumpulkan semua set yang benar-benar selesai, baik dari primary maupun dynamic superset
- setiap set tetap disimpan sebagai entry `ExerciseLog` biasa
- exercise superset tambahan tampil di history seperti log exercise lain pada workout yang sama

Konsekuensi yang diterima:
- history tidak perlu mengetahui konsep pairing untuk iterasi pertama
- fitur ini fokus pada pengalaman sesi dan akurasi log

## Favorite And Recent API

Tambahkan server actions untuk:
- mengambil quick list exercise untuk session picker
- toggle favorite exercise

Kontrak yang diusulkan:

```ts
getExerciseQuickPickerData({
  limitFavorites?: number;
  limitRecent?: number;
  query?: string;
})

toggleFavoriteExercise(exerciseId: string)
```

Payload quick picker:
- `favorites: ExerciseCatalogItem[]`
- `recent: ExerciseCatalogItem[]`
- `results: ExerciseCatalogItem[]`

Aturan query:
- `favorites` selalu tampil paling atas
- `recent` mengecualikan item yang sudah ada di favorites
- `results` mengecualikan item yang sudah tampil di favorites atau recent untuk menghindari duplikasi visual

## UI And UX Direction

UI harus mengikuti pola mobile-first dan cepat dipakai dengan sedikit tap. Arah ini akan menjadi panduan saat nanti implementasi memakai skill frontend yang relevan.

### Session Surface

Tambahkan tombol `Tambah Superset` dekat tombol `Selesaikan Set`, bukan di header.

Alasannya:
- aksi ini kontekstual terhadap set yang sedang dikerjakan
- posisi dekat CTA utama membuat tindakan terasa natural
- user tidak perlu mencari kontrol tambahan di area atas layar

### Quick Add Sheet

Saat dibuka, tampilkan bottom sheet dengan urutan:
- section `Favorite`
- section `Recent`
- field `Cari exercise`
- hasil pencarian

Desain item exercise:
- nama exercise
- label kecil kategori atau body area
- badge `Compound` atau `Isolation`
- tombol bintang kecil untuk toggle favorite langsung dari item

Optimasi UX:
- favorite dan recent bisa muncul sebagai horizontal quick chips atau compact cards
- search tetap tersedia, tetapi bukan fokus utama
- setelah user memilih item, tampilkan konfirmasi singkat sebelum pairing diaktifkan

Copy konfirmasi:
- `Tambahkan Cable Fly sebagai superset dengan Bench Press untuk sisa set?`

Actions:
- `Ya, mulai superset`
- `Batal`

### Active Pair UI

Saat pairing aktif:
- card hero utama menampilkan pasangan, misalnya `Bench Press + Cable Fly`
- tampilkan indikator lane aktif yang jelas: `Sekarang: Bench Press` atau `Sekarang: Cable Fly`
- tampilkan tombol kecil `Batalkan Superset`
- tampilkan status sisa set kedua lane agar user tahu pairing belum selesai

### Timer Visuals

`Transition rest 10 detik` harus terlihat berbeda dari `rest normal`.

Rekomendasi:
- `rest-transition` memakai label dan aksen amber
- `rest-normal` tetap memakai aksen emerald yang sudah ada
- teks harus menjelaskan konteks, misalnya `Pindah ke superset` vs `Istirahat`

### Preview Area

Bagian `Selanjutnya` tidak bisa lagi sekadar menampilkan urutan linear.

Saat pairing aktif:
- tampilkan ringkasan `Sisa pasangan superset`
- setelah pairing selesai, baru tampilkan `Setelah itu` untuk exercise plan berikutnya

## Reusable Picker Pattern Across App

Karena favorit berlaku lintas app, pola picker perlu bisa dipakai ulang di:
- `plan` editor
- goal picker
- manual log atau workout sheet
- session quick add

Iterasi pertama tidak harus memodifikasi semua screen sekaligus, tetapi struktur data dan komponen picker harus dirancang reusable agar integrasi lanjutan murah.

## Edge Cases

- jika `Favorite` dan `Recent` kosong, sheet tetap terbuka dan fokus ke search
- jika fetch picker gagal, tampilkan pesan singkat dan tombol retry tanpa mengganggu sesi
- jika toggle favorite gagal, pemilihan exercise untuk superset tetap boleh lanjut
- jika user memilih exercise yang sama dengan exercise aktif, blokir dengan pesan yang jelas
- jika tab refresh saat pairing aktif, state pairing dan lane aktif harus pulih dari `sessionStorage`
- jika auto-save gagal, session storage jangan dibersihkan
- jika primary selesai lebih dulu daripada superset, sisa superset tetap harus selesai sebelum lanjut ke exercise berikutnya
- jika superset dipilih dari exercise yang juga ada nanti di urutan plan, item itu tetap dianggap log terpisah untuk sesi ini

## Testing Plan

- unit test helper state pairing:
  - membuat pairing baru
  - menentukan next lane setelah rest
  - menyelesaikan pairing saat jumlah set berbeda
  - membatalkan pairing
- unit test quick picker data:
  - favorites tersortir benar
  - recent diambil dari log terbaru
  - hasil search tidak menduplikasi favorites dan recent
- integration test workout session:
  - tambah superset dari favorite
  - selesai set primary lalu masuk transition rest 10 detik
  - pindah ke superset, lalu kembali ke primary
  - selesai pairing lalu lanjut ke next exercise
  - auto-save menyimpan exercise tambahan
- UI test:
  - tombol `Tambah Superset` muncul pada state input
  - indikator lane aktif terlihat jelas
  - visual `rest-transition` berbeda dari `rest-normal`

## Files Expected To Change

- `prisma/schema.prisma`
- migration Prisma baru untuk `FavoriteExercise`
- `src/actions/exercises.ts`
- mungkin action baru khusus quick picker session jika lebih bersih dipisah
- `src/app/(app)/workout/session/page.tsx`
- `src/app/(app)/workout/start/page.tsx`
- `src/components/exercise-picker.tsx`
- mungkin komponen baru untuk quick add superset sheet dan favorite toggle button

## Risks And Mitigations

- Risiko: state session menjadi terlalu rumit di satu file page
  Mitigasi: ekstrak helper state machine atau reducer khusus session pairing

- Risiko: user bingung membedakan transisi 10 detik dan rest normal
  Mitigasi: pakai status visual, copy, dan warna yang jelas berbeda

- Risiko: quick picker terlalu penuh jika memuat favorite, recent, dan search sekaligus
  Mitigasi: prioritaskan favorite dan recent sebagai compact sections, lalu biarkan search mengambil ruang utama hanya saat user mengetik

- Risiko: favorite ingin dipakai di banyak layar sehingga implementasi awal melebar
  Mitigasi: selesaikan fondasi data dan pola picker reusable dulu, lalu adopsi screen by screen

## Acceptance Criteria

- user bisa menambah superset dadakan dari sesi workout tanpa mengubah plan
- setelah set primary selesai, ada jeda 10 detik sebelum pindah ke superset
- superset berjalan bolak-balik sampai pasangan selesai atau dibatalkan
- favorite tersimpan per user dan bisa dipakai lintas app
- recent membantu quick add tanpa mewajibkan search manual
- workout akhir tetap tersimpan benar termasuk exercise tambahan dari superset
