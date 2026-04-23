# Workout Share Sticker Design

## Context

Setelah workout selesai, app saat ini hanya menyimpan hasil sesi lalu keluar dari flow workout. Belum ada momen penutup yang bisa dipakai user untuk membagikan hasil latihan ke social media.

Kebutuhan yang divalidasi:
- hasil share muncul langsung setelah workout selesai
- output utama berupa `PNG` transparan seperti sticker
- visual mengikuti referensi yang sangat minimal: ruang kosong dominan, logo kecil, teks metrik besar
- sticker memakai logo dari `public/grynx-logo-horizontal.png`
- metrik utama yang ditampilkan hanya:
  - durasi workout
  - jumlah exercise
  - best lift berdasarkan `estimasi 1RM` terbaik
- user bisa `download` hasilnya dan mencoba `share` ke social media story melalui share sheet perangkat bila tersedia

## Goals

- Menambahkan momen `share result` langsung setelah workout berhasil disimpan
- Menampilkan preview sticker transparan yang siap diunduh
- Menghasilkan file `PNG` transparan dengan komposisi yang tetap rapi di atas background apa pun
- Mengaktifkan tombol `Share` yang memakai native share sheet pada device yang mendukung
- Menjaga iterasi pertama tetap fokus pada satu visual sticker yang sangat ringan dan mudah dipakai

## Non-Goals

- Membuat integrasi direct post khusus ke Instagram Story, TikTok Story, atau platform tertentu
- Menyediakan banyak template share pada iterasi pertama
- Menambahkan background story 9:16 penuh pada versi awal
- Menampilkan semua detail workout seperti total volume, semua exercise, atau daftar set
- Mengubah struktur data `Workout` dan `ExerciseLog`

## Approaches Considered

### 1. Sticker-only export

Setelah workout selesai, user melihat preview sticker dan bisa mengunduh PNG transparan.

Kelebihan:
- implementasi paling kecil
- sangat stabil di web
- tidak bergantung pada dukungan share API

Kekurangan:
- friction lebih tinggi untuk user mobile karena harus upload manual ke social app

### 2. Sticker export + native share sheet

Preview sticker tetap jadi pusat pengalaman, lalu tombol `Share` mencoba mengirim file PNG ke native share sheet. Jika browser atau device tidak mendukung, app fallback ke download biasa.

Kelebihan:
- pengalaman mobile lebih nyaman
- masih aman karena ada fallback download
- paling sesuai dengan tujuan user untuk memamerkan hasil workout

Kekurangan:
- perilaku share berbeda-beda antar browser/device
- tidak menjamin direct share ke story tertentu

### 3. Sticker + ready-made story canvas

Selain sticker transparan, app juga membuat versi kanvas penuh 9:16 siap upload.

Kelebihan:
- lebih dekat ke pengalaman story editor penuh

Kekurangan:
- scope membesar
- tidak sesuai prioritas visual referensi yang diminta user sekarang

## Recommendation

Pilih pendekatan 2: `sticker export + native share sheet`.

Pendekatan ini memberi pengalaman yang paling seimbang:
- tetap menghasilkan asset utama berupa sticker transparan
- lebih enak dipakai di mobile lewat share sheet
- tetap aman di browser yang tidak mendukung karena bisa fallback ke download

## User Flow

### Finish And Save

Saat user menyelesaikan set terakhir:
- app menyimpan workout seperti flow sekarang
- jika save sukses, sesi tidak langsung ditutup
- app menampilkan `share result sheet`

### Share Result Sheet

Sheet menampilkan:
- preview sticker transparan
- tombol `Download PNG`
- tombol `Share`
- tombol `Close`

Aturan aksi:
- `Download PNG` selalu tersedia
- `Share` aktif jika export PNG berhasil dibuat; lalu mencoba `navigator.share` dengan file
- jika `navigator.share` atau `navigator.canShare` tidak tersedia, tombol `Share` fallback ke perilaku download

### Exit

Setelah user menutup sheet:
- app boleh melanjutkan redirect atau reset flow workout yang sekarang
- kegagalan share/export tidak boleh membatalkan workout yang sudah tersimpan

## Data Requirements

Sticker memakai data dari sesi workout yang baru selesai. Tidak perlu query halaman lain.

Data yang dibutuhkan:
- `durationLabel`
  - dihitung dari `startedAt` sampai `endedAt`
- `exerciseCount`
  - jumlah exercise unik dalam sesi yang benar-benar ikut tersimpan
- `bestLift`
  - angka `estimasi 1RM` terbaik dari semua set valid
- `bestLiftExerciseName`
  - nama exercise pemilik estimasi 1RM tertinggi

## Metric Definitions

### Duration

Durasi dihitung dari selisih `endedAt - startedAt` pada sesi yang baru selesai.

Format display:
- gunakan format yang sudah mudah dibaca di UI workout, misalnya `45m`, `1h 12m`, atau `52:10`
- implementasi boleh memakai helper format khusus asalkan konsisten di preview dan nama file

### Exercise Count

Gunakan jumlah exercise unik yang benar-benar ada dalam hasil save workout.

Aturan:
- jika satu exercise punya banyak set, tetap dihitung satu
- jika sesi mengandung dynamic superset atau item tambahan lain di masa depan, tetap dihitung berdasarkan exercise unik yang tersimpan

### Best Lift

`Best Lift` didefinisikan sebagai estimasi `1RM` tertinggi dari seluruh set valid di workout yang baru selesai.

Rumus yang dipakai:
- gunakan helper `calculate1RM(weight, reps)` yang sudah ada di `src/lib/calculations.ts`
- formula tetap Epley agar konsisten dengan dashboard dan progress

Aturan validasi:
- abaikan set dengan `weight <= 0` atau `reps <= 0`
- jika tidak ada set valid, tampilkan `-` dan hilangkan nama exercise

## Sticker Visual Direction

Sticker harus terasa seperti asset ringan yang bisa ditempel di story mana pun.

Prinsip desain:
- background transparan penuh
- komposisi minimal dengan banyak negative space
- angka metrik tampil besar dan langsung terbaca
- label metrik kecil dan rapi
- logo `GRYNX` horizontal tampil kecil sebagai penanda brand
- jangan tambahkan card border besar, panel gelap, atau latar dekoratif penuh

Susunan konten yang diusulkan:
- blok metrik vertikal atau staggered dengan teks besar:
  - `Duration`
  - `Exercises`
  - `Best Lift`
- di bawah `Best Lift`, tampilkan nama exercise kecil
- logo kecil di area bawah kiri atau bawah kanan

Gaya:
- super minimal seperti referensi
- fokus pada tipografi besar, bukan ornament
- tetap terbaca di background terang maupun gelap ketika dipakai sebagai sticker

## Component Design

### `WorkoutShareResultSheet`

Komponen client untuk:
- menerima summary workout yang sudah selesai
- menampilkan preview sticker
- mengelola status export
- memicu download/share

Tanggung jawab:
- membuka setelah save sukses
- menjaga UX tetap halus jika export butuh beberapa saat
- menampilkan error ringan tanpa memblokir close

### `WorkoutShareSticker`

Komponen visual murni yang dirender sebagai area transparan untuk di-capture.

Tanggung jawab:
- menerima summary yang sudah siap display
- memuat logo `grynx-logo-horizontal.png`
- menjaga layout tetap stabil di ukuran export tetap

### `buildWorkoutShareSummary`

Helper untuk membentuk data share dari hasil sesi.

Tanggung jawab:
- menghitung durasi
- menghitung jumlah exercise unik
- mencari `bestLift` dan `bestLiftExerciseName`
- menghasilkan display label yang konsisten

### `exportElementToPng`

Utility client-side untuk:
- menangkap node sticker
- menghasilkan `Blob` atau `File` PNG transparan
- dipakai bersama oleh aksi `Download` dan `Share`

## Export Strategy

Preview dan export harus berasal dari komponen yang sama agar hasil yang dilihat user sama dengan file akhir.

Aturan teknis:
- render sticker dalam ukuran tetap untuk kualitas export yang konsisten
- hindari background warna solid agar alpha channel tetap transparan
- pastikan aset logo sudah termuat sebelum export final jika memungkinkan
- hasil export berupa file PNG dengan nama yang mudah dikenali, misalnya `grynx-workout-2026-04-23.png`

Flow export:
1. user menekan `Download PNG` atau `Share`
2. app membuat PNG dari `WorkoutShareSticker`
3. jika aksi `Download`, file langsung diunduh
4. jika aksi `Share`, app mencoba mengirim file ke native share sheet
5. jika share tidak didukung atau gagal karena capability, fallback ke download

## Share Behavior

Web app tidak boleh mengklaim bisa direct-post ke story platform tertentu.

Perilaku yang didukung:
- memakai `navigator.share` dengan `File` PNG jika tersedia
- memakai `navigator.canShare` saat tersedia untuk memeriksa dukungan file share
- fallback ke download jika API tidak ada atau tidak mendukung file

Copy UX yang disarankan:
- tombol `Share`
- bantuan kecil opsional: `Kalau share tidak tersedia di browser ini, file akan diunduh`

## Error Handling

- jika export gagal, tampilkan pesan singkat seperti `Sticker belum bisa diexport. Coba lagi.`
- jika share gagal karena user cancel, jangan tampilkan error keras
- jika share gagal karena environment tidak mendukung, fallback ke download
- jika logo gagal dimuat, export tetap boleh berjalan selama layout tidak rusak
- jika data `bestLift` kosong, tampilkan placeholder aman tanpa membuat UI pecah

## Testing Plan

- unit test `buildWorkoutShareSummary`:
  - menghitung durasi dengan benar
  - menghitung exercise unik dengan benar
  - memilih estimasi 1RM tertinggi
  - mengembalikan fallback aman saat tidak ada set valid
- component test:
  - sheet menampilkan tiga metrik utama
  - nama exercise best lift muncul hanya saat ada data
  - tombol `Download PNG` selalu tersedia
- manual mobile smoke test:
  - preview tampil rapi setelah workout selesai
  - file hasil download transparan
  - share sheet muncul pada browser/device yang mendukung
  - fallback ke download bekerja saat share API tidak tersedia

## Files Expected To Change

- `src/app/(app)/workout/session/page.tsx`
- komponen baru untuk result sheet dan sticker share
- helper baru untuk membentuk summary workout share
- utility baru untuk export PNG di client
- kemungkinan penambahan toast/helper UI ringan jika dibutuhkan

## Risks And Mitigations

- Risiko: hasil PNG tidak benar-benar transparan
  Mitigasi: gunakan komponen tanpa solid background dan verifikasi alpha channel secara manual

- Risiko: native share tidak konsisten antar browser mobile
  Mitigasi: jadikan download sebagai baseline dan share sebagai enhancement

- Risiko: export file terasa lambat di device lemah
  Mitigasi: jaga layout sederhana, ukuran export tetap, dan minim aset berat

- Risiko: flow selesai workout terasa tertahan terlalu lama
  Mitigasi: sheet dibuka setelah save sukses, tetapi export dilakukan saat user menekan aksi, bukan blocking sejak awal

## Acceptance Criteria

- setelah workout tersimpan, user melihat preview share result sebelum keluar dari flow
- preview menampilkan `Duration`, `Exercises`, dan `Best Lift`
- `Best Lift` memakai estimasi 1RM tertinggi dari workout yang baru selesai
- sticker menggunakan logo `public/grynx-logo-horizontal.png`
- user bisa mengunduh hasil sebagai PNG transparan
- user bisa mencoba share file melalui native share sheet pada environment yang mendukung
- jika share API tidak tersedia, user tetap mendapatkan hasil melalui download
