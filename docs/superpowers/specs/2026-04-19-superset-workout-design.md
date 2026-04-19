# Superset Workout & Planning — Design Spec

## Overview

Fitur ini menambahkan struktur `superset group` ke workout planning dan guided workout session. Tujuannya adalah memungkinkan user menyusun beberapa exercise dalam satu block, menjalankannya berurutan dalam beberapa ronde, dan mengatur dua jenis jeda:

- `micro-rest` antar exercise di dalam group
- `main rest` setelah satu ronde group selesai

Ruang lingkup MVP ini bersifat `hybrid`:

- superset bisa dipreset saat membuat atau mengedit plan
- superset juga bisa disesuaikan saat session berlangsung
- perubahan saat session hanya berlaku untuk session aktif, bukan langsung mengubah template plan

## Goals

- Mendukung `superset group` dengan jumlah exercise bebas dalam satu group
- Memungkinkan pengaturan `micro-rest` dan `main rest`
- Menjaga workout flow tetap guided dan mudah diikuti
- Mempertahankan logging hasil workout per exercise agar analytics tetap akurat
- Membuat struktur data plan dan session lebih jelas dibanding list exercise flat

## Non-Goals

- Tidak mencakup sinkronisasi perubahan runtime session kembali ke plan template pada MVP
- Tidak mencakup mode advanced dengan jumlah set berbeda per exercise dalam satu group
- Tidak mencakup edit penuh seluruh struktur workout saat session berjalan
- Tidak mengubah sistem progress analytics menjadi berbasis group; analytics tetap berbasis exercise

## Product Decisions

Keputusan desain yang sudah dikunci untuk MVP:

- Model utama menggunakan `block-based structure`
- Satu `superset block` bisa berisi banyak exercise
- Tersedia `micro-rest` dan `main rest`
- Runtime edit saat session bersifat `sedang`
- Semua exercise dalam satu superset mengikuti `rounds` yang sama

## Information Architecture

Plan tidak lagi diperlakukan sebagai daftar exercise flat. Plan menjadi daftar `workout block` yang berurutan.

Ada dua tipe block:

1. `single`
   Block berisi satu exercise biasa
2. `superset`
   Block berisi beberapa exercise yang dijalankan berurutan dalam satu ronde

Setiap block memiliki tanggung jawab yang jelas:

- menentukan urutan block di dalam plan
- menentukan berapa ronde block dijalankan
- menentukan jeda utama setelah ronde selesai

Khusus `superset`, block juga menentukan:

- urutan exercise internal
- jeda singkat antar exercise internal

## Data Model

### Plan Structure

MVP merekomendasikan penggantian struktur `WorkoutPlanExercise` yang flat menjadi struktur block + item. Nama model final boleh menyesuaikan implementasi, tetapi shape datanya harus mengikuti kontrak berikut:

```ts
type WorkoutPlanBlock = {
  id: string;
  planId: string;
  type: "single" | "superset";
  order: number;
  rounds: number;
  mainRestSeconds: number;
  microRestSeconds: number | null;
  label: string | null;
};

type WorkoutPlanBlockItem = {
  id: string;
  blockId: string;
  exerciseId: string;
  order: number;
  defaultReps: number;
};
```

Catatan desain:

- `rounds` menjadi unit kerja utama block
- pada `single block`, `rounds` adalah padanan langsung dari jumlah set
- `defaultSets` di level exercise tidak lagi menjadi sumber kebenaran untuk superset
- `single block` tetap memakai konsep block yang sama agar session engine konsisten
- `single block` cukup memiliki satu item exercise
- `microRestSeconds` bernilai `null` untuk `single block`
- `label` opsional bisa dipakai untuk tampilan seperti `Superset A`, `Superset B`

### Session Snapshot

Saat user memulai workout, aplikasi membuat snapshot session dari plan. Session snapshot tidak boleh bergantung langsung pada state plan yang masih bisa berubah di tempat lain.

Shape session yang direkomendasikan:

```ts
type SessionBlock = {
  id: string;
  type: "single" | "superset";
  label: string | null;
  rounds: number;
  mainRestSeconds: number;
  microRestSeconds: number | null;
  items: Array<{
    exerciseId: string;
    name: string;
    imageUrl?: string | null;
    category: string | null;
    primaryLabel: string;
    trainingStyle: "compound" | "isolation";
    defaultReps: number;
  }>;
};

type SessionData = {
  planId: string;
  planName: string;
  startedAt: string;
  blocks: SessionBlock[];
};
```

### Runtime Session State

Session engine tidak lagi cukup dengan `exerciseIndex` dan `setIndex`. State minimum yang dibutuhkan:

```ts
type SessionCursor = {
  blockIndex: number;
  roundIndex: number;
  itemIndex: number;
};
```

Tambahan state:

- status timer aktif: `input | micro-rest | main-rest | done`
- hasil entry per block/item/round
- runtime overrides untuk block aktif

## Plan Editor UX

Plan editor berubah dari editor daftar exercise menjadi editor daftar block.

### Primary Actions

- `Tambah Single Exercise`
- `Tambah Superset Group`
- `Reorder Block`

### Superset Group Card

Setiap superset group tampil sebagai satu card besar yang memuat:

- nama atau label group
- jumlah exercise di dalamnya
- `rounds`
- `micro-rest`
- `main rest`
- daftar exercise internal

Di dalam group card user bisa:

- menambah exercise ke group
- menghapus exercise dari group
- mengubah urutan exercise di dalam group
- mengubah `defaultReps` per exercise

### Recommended Creation Flow

1. User menekan `Tambah Superset Group`
2. User memilih beberapa exercise
3. Sistem membuat satu superset block baru
4. User mengatur `rounds`, `micro-rest`, dan `main rest`
5. User dapat membuka pengelolaan group untuk edit isi group

### Single Block UX

Single block tetap sederhana:

- satu card
- satu exercise
- `rounds`
- `main rest`

Struktur ini sengaja dibuat seragam dengan superset block agar engine session dan persistence tetap konsisten.

## Workout Session UX

Session membaca plan snapshot berbasis block.

### Single Block Flow

Untuk `single block`, perilaku hampir sama dengan flow saat ini:

- tampilkan exercise aktif
- input hasil ronde aktif
- setelah ronde selesai, jalankan `main rest`
- pindah ke ronde berikutnya atau block berikutnya

### Superset Block Flow

Untuk `superset block`, flow berjalan seperti ini:

1. Tampilkan block aktif, ronde aktif, dan exercise aktif
2. User menyelesaikan exercise item saat ini
3. Jika masih ada exercise berikutnya dalam ronde yang sama:
   - jalankan `micro-rest`
   - pindah ke exercise berikutnya
4. Jika exercise saat ini adalah item terakhir dalam ronde:
   - jika masih ada ronde berikutnya, jalankan `main rest`
   - kembali ke item pertama
5. Jika semua ronde selesai, pindah ke block berikutnya

### Session Header

Header session perlu menampilkan konteks block, bukan hanya exercise:

- nama plan
- block aktif, misalnya `Superset A`
- ronde, misalnya `Round 2/3`
- item, misalnya `Exercise 1/4`
- stopwatch total session

### Active Block Controls

Saat session berlangsung, runtime edit dibatasi pada block aktif.

User bisa:

- mengubah `micro-rest`
- mengubah `main rest`
- menambah exercise ke group aktif
- menghapus exercise dari group aktif
- skip timer

User tidak bisa:

- mengacak seluruh urutan plan
- membuat perubahan global ke semua block
- otomatis menyimpan perubahan runtime ke plan template

## Runtime Edit Rules

Untuk menjaga state session tetap konsisten, aturan MVP adalah:

- jika user menambah exercise ke group aktif saat session berjalan, exercise baru mulai berlaku pada ronde berikutnya
- jika user menghapus exercise dari group aktif saat session berjalan, penghapusan berlaku untuk sisa ronde yang belum dijalankan
- jika sebuah superset group tinggal memiliki satu exercise, session tetap valid, tetapi UI sebaiknya memberi saran bahwa group itu bisa dikonversi menjadi `single block`
- jika `micro-rest = 0`, aplikasi langsung pindah ke exercise berikutnya tanpa menampilkan timer screen

## Persistence & Logging

Workout result tetap disimpan per exercise agar fitur progress yang sudah ada tetap akurat.

Sistem tidak boleh menyimpan hasil superset hanya sebagai satu record group, karena itu akan merusak:

- total volume per exercise
- histori performa per exercise
- perhitungan PR
- tampilan progress yang sudah ada

### Recommended Logging Shape

Setiap hasil exercise yang disimpan tetap punya weight/reps per entry, tetapi ditambah metadata block:

```ts
type WorkoutExerciseLogMeta = {
  blockType: "single" | "superset";
  blockOrder: number;
  blockLabel: string | null;
  roundIndex: number;
  itemOrder: number;
};
```

Metadata ini bisa ditaruh sebagai field baru pada log, atau sebagai struktur terpisah yang tetap bisa di-query bersama log exercise.

Prinsip pentingnya:

- analytics utama tetap berjalan per exercise
- UI history bisa tahu exercise mana yang berasal dari satu superset yang sama

## Error Handling & Recovery

### Session Exit

Jika user keluar dari session, aplikasi menyimpan draft session lokal agar bisa dilanjutkan. Data yang disimpan harus mencakup:

- snapshot blocks
- cursor session
- hasil input yang sudah selesai
- runtime overrides yang sudah diterapkan

### Cross-Tab Safety

Jika plan diubah di tab lain saat session sedang berjalan, session tetap memakai snapshot saat start. Session tidak boleh ikut berubah mendadak.

### Validation Rules

Sistem harus mencegah:

- superset block tanpa exercise
- `rounds < 1`
- `mainRestSeconds < 0`
- `microRestSeconds < 0`
- duplicate order antar block atau antar item dalam block yang sama

## Code Architecture Notes

File session saat ini sudah berorientasi `exercise-flat`. Fitur superset akan cepat membuat file itu sulit dirawat jika logic baru dimasukkan langsung ke komponen utama.

Sebelum atau bersamaan dengan implementasi, disarankan memecah logic menjadi unit yang lebih kecil:

- `session block resolver`
  Menentukan block/item/round aktif dari cursor
- `session transition engine`
  Menentukan transisi setelah item selesai
- `rest timer controller`
  Mengelola `micro-rest` dan `main rest`
- `session persistence mapper`
  Mengubah state session menjadi payload logging

Targetnya adalah membuat komponen UI lebih fokus pada render, sementara aturan workout flow tinggal di helper yang teruji.

## Testing Strategy

Area pengujian utama:

1. Membuat plan campuran yang berisi single block dan superset block
2. Mengedit superset group: tambah, hapus, reorder exercise internal
3. Menjalankan session dengan urutan `single -> superset -> single`
4. Memastikan transisi `micro-rest` dan `main rest` sesuai aturan
5. Menguji runtime edit pada active superset group
6. Memastikan `micro-rest = 0` langsung melompati timer screen
7. Memastikan auto-save workout tetap menghasilkan log exercise yang valid
8. Memastikan progress/history yang sudah ada tetap dapat membaca data workout baru

## Recommended Implementation Sequence

Urutan implementasi yang direkomendasikan:

1. Introduce block-based schema and serializers
2. Adapt plan editor to create and edit blocks
3. Change workout start flow to produce session snapshot berbasis block
4. Refactor session engine agar cursor berbasis `blockIndex`, `roundIndex`, `itemIndex`
5. Add runtime edit controls untuk active superset block
6. Extend workout logging dengan metadata block
7. Update progress/history rendering jika diperlukan untuk menampilkan konteks superset

## Success Criteria

Fitur dianggap berhasil bila:

- user bisa membuat plan dengan superset group berisi banyak exercise
- user bisa mengatur `rounds`, `micro-rest`, dan `main rest`
- session workout dapat menjalankan group secara round-based tanpa membingungkan user
- user bisa mengubah timer dan komposisi group aktif saat session
- hasil workout tetap tercatat akurat per exercise
- fitur progress existing tidak rusak oleh struktur baru ini
