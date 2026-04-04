# Plan Editor Reorder And Customization Design

## Context

`PlanEditorSheet` saat ini hanya menyimpan exercise yang dipilih sebagai array `ExerciseCatalogItem[]`. Urutan exercise mengikuti urutan pemilihan, belum bisa diubah ulang, dan nilai `sets`, `reps`, serta `restTime` selalu diambil dari default exercise ketika plan disimpan.

Akibatnya:
- user tidak bisa menyusun urutan latihan sesuai alur workout yang diinginkan
- user tidak bisa membuat variasi `sets/reps/rest` per exercise untuk plan tertentu
- UI edit plan terasa terbatas, terutama untuk custom plan

Permintaan fitur:
- user bisa drag-and-drop untuk mengurutkan exercise dalam plan
- user bisa mengedit `sets`, `reps`, dan `rest` per exercise
- nilai custom hanya berlaku pada plan tersebut, bukan global untuk exercise yang sama di plan lain
- interaksi harus nyaman di mobile dan desktop

## Goals

- Menambahkan sortable selected list di dalam `PlanEditorSheet`
- Menambahkan mini sheet editor per exercise untuk `sets`, `reps`, dan `rest`
- Menyimpan urutan dan nilai custom per item plan ke action save yang sudah ada
- Menjaga UI tetap ringkas dan mudah dipindai pada layar kecil

## Non-Goals

- Mengubah struktur database Prisma
- Menambahkan preset latihan baru di luar `sets`, `reps`, dan `rest`
- Mengubah flow pembuatan default plan
- Menambahkan keyboard reordering penuh pada iterasi ini

## Chosen Approach

Gunakan `compact sortable cards + mini sheet editor per exercise`.

Setiap exercise terpilih akan tampil sebagai card ringkas yang memuat:
- drag handle khusus reorder
- nama exercise dan label singkat
- ringkasan program `X set · Y reps · Z dtk`
- tombol `Edit`
- tombol `Hapus`

Ketika user menekan `Edit`, akan terbuka mini sheet dari bawah yang berisi tiga input numerik:
- `Sets`
- `Reps`
- `Rest (detik)`

Pendekatan ini dipilih karena:
- menjaga list tetap ringkas dan mudah discan
- tidak mencampur area drag dengan field input
- cocok untuk touch dan pointer
- lebih aman terhadap gesture conflict dibanding editor inline

## Data Model In Component

State `selectedExercises` di `PlanEditorSheet` akan diganti menjadi array item plan lokal, misalnya:

```ts
type EditablePlanExercise = {
  exerciseId: string;
  exercise: ExerciseCatalogItem;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  order: number;
}
```

Aturan state:
- saat exercise baru dipilih, item dibuat dari default `exercise.defaultSets`, `exercise.defaultReps`, dan `exercise.defaultRestTime`
- saat item diedit, hanya properti item itu yang berubah
- saat reorder, `order` dihitung ulang berdasarkan posisi list terbaru
- saat item dihapus lalu dipilih lagi, nilainya kembali ke default exercise

Untuk edit existing plan:
- state awal diisi dari `plan.exercises`
- nilai custom yang sudah tersimpan harus muncul kembali di card dan editor

## Interaction Design

### 1. Search Results

Bagian pencarian tetap bekerja seperti sekarang:
- user mencari exercise
- tap pada result akan menambah atau menghapus exercise dari selection

Perubahan kecil:
- selected count tetap tampil pada label
- jika exercise sudah dipilih, result card tetap menunjukkan status selected

### 2. Selected Exercises Section

Tambahkan section khusus di bawah hasil pencarian:
- judul `Urutan Exercise`
- helper text singkat bahwa card bisa digeser untuk mengatur alur latihan

Setiap selected card berisi:
- handle drag di sisi kiri
- nomor urut visual
- nama exercise
- label utama dan kategori singkat
- ringkasan `sets/reps/rest`
- tombol `Edit`
- tombol icon `Hapus`

State visual:
- card aktif drag mendapat elevasi lebih tinggi, border lebih terang, dan sedikit scale
- target drop menjaga layout stabil tanpa lompat besar
- empty state ditampilkan jika belum ada exercise yang dipilih

### 3. Mini Sheet Editor

Mini sheet editor dibuka dari tombol `Edit` pada card.

Isi editor:
- header dengan nama exercise
- tiga field numerik berlabel jelas
- helper text singkat untuk satuan `rest`
- tombol `Simpan Perubahan`
- tombol `Reset ke Default`

Aturan input:
- `Sets` minimal `1`
- `Reps` minimal `1`
- `Rest` minimal `0`
- nilai negatif atau kosong tidak boleh disimpan

Saat user menyimpan:
- perubahan langsung memutakhirkan ringkasan pada card
- mini sheet menutup

## Save Flow

`handleSave` akan mengirim array final berdasarkan editable state lokal:

```ts
{
  exerciseId,
  defaultSets,
  defaultReps,
  restTime,
  order
}
```

Untuk create plan:
- gunakan array editable state yang sudah diurutkan

Untuk edit plan:
- gunakan array editable state yang sudah diurutkan
- nama plan tetap bisa diubah seperti sekarang

Tidak diperlukan perubahan action server karena kontrak `createWorkoutPlan` dan `updateWorkoutPlanExercises` sudah menerima nilai yang dibutuhkan.

## Drag And Drop Strategy

Gunakan library drag-and-drop yang mendukung mobile dan desktop dengan baik, serta sensor touch dan pointer yang stabil.

Kriteria:
- mendukung drag handle
- stabil di bottom sheet / scroll container
- bisa dipakai lintas touch dan mouse

Implementasi harus:
- memakai drag handle khusus, bukan seluruh card
- menjaga touch target minimal `44x44`
- menonaktifkan seleksi teks saat drag
- menjaga container tetap `overscroll-contain` agar gesture terasa terkontrol

## Accessibility And Web Guidelines

UI harus mematuhi pedoman berikut:
- semua icon button punya `aria-label`
- semua input editor punya label eksplisit
- copy loading memakai elipsis tipografis, misalnya `Menyimpan…`
- focus state terlihat jelas pada tombol, handle, dan input
- text panjang di card tetap aman dengan `min-w-0` dan truncation
- destructive action `Hapus` tetap jelas dan tidak bergantung pada warna saja
- interaction utama tidak bergantung pada hover

## Responsive Behavior

### Mobile

- selected card tetap satu kolom
- drag handle lebih besar dan mudah disentuh
- mini sheet editor tetap dari bawah layar
- spacing antar control cukup longgar untuk jari

### Desktop

- komposisi tetap satu kolom dalam sheet agar konsisten
- pointer drag tetap presisi
- tombol `Edit` dan `Hapus` tetap mudah dijangkau tanpa membuat card terlalu tinggi

## Edge Cases

- jika tidak ada selected exercise, tampilkan empty state yang menjelaskan user perlu memilih exercise dulu
- jika save ditekan tanpa nama plan, cegah submit seperti perilaku sekarang
- jika save ditekan tanpa selected exercise, cegah submit
- jika item terakhir dihapus saat editor terbuka, editor harus menutup aman
- jika save server gagal, editable state lokal tidak boleh hilang

## Testing Plan

- create custom plan baru, pilih beberapa exercise, reorder, save, lalu reload
- edit existing plan, ubah satu item menjadi custom `sets/reps/rest`, save, lalu reload
- pastikan exercise yang sama di plan berbeda bisa memiliki nilai berbeda
- uji reorder dengan touch gesture di mobile viewport
- uji reorder dengan mouse di desktop viewport
- uji focus, label, dan `aria-label` pada tombol edit/hapus/drag handle

## Files Expected To Change

- `src/components/plan-editor-sheet.tsx`
- mungkin menambah komponen kecil baru untuk editor item plan jika file utama mulai terlalu padat

## Risks And Mitigations

- Risiko: gesture drag bentrok dengan scroll sheet
  Mitigasi: drag hanya lewat handle khusus dan gunakan sensor yang mendukung activation constraint

- Risiko: file `plan-editor-sheet.tsx` makin besar dan sulit dirawat
  Mitigasi: ekstrak card sortable dan mini sheet editor ke komponen kecil bila implementasi mulai bercabang

- Risiko: user bingung apakah angka custom sudah tersimpan
  Mitigasi: tampilkan ringkasan jelas di card dan langsung perbarui setelah save editor

## Recommendation

Implement fitur ini dalam satu iterasi terfokus pada `PlanEditorSheet` dengan pendekatan:
- sortable selected cards
- mini sheet editor per exercise
- state lokal yang menyimpan `order`, `defaultSets`, `defaultReps`, dan `restTime`

Pendekatan ini memberi peningkatan UX yang jelas tanpa perlu mengubah kontrak backend atau schema database.
