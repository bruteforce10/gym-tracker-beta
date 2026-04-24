# Workout Complete Summary Redesign

## Context

Halaman selesai workout sebelumnya terlalu mengikuti referensi visual mentah dan belum terasa menyatu dengan bahasa desain GRYNX.

Masalah utama yang divalidasi:
- tipografi terlalu besar untuk ritme mobile app saat ini
- aksen warna keluar dari palet utama di `src/app/globals.css`
- preview PNG mengambil fokus dari tujuan utama user setelah workout selesai
- bottom navigation mengganggu fokus aksi penutup

## Goals

- Membuat halaman selesai workout terasa native dengan style app yang sudah ada
- Menggunakan aksen `emerald` dari design tokens global sebagai warna keberhasilan
- Menampilkan hasil workout dengan hierarchy yang cepat dipindai
- Memfokuskan UX pada tiga aksi: `Download PNG`, `Share`, dan `Finished`
- Menghilangkan preview PNG dari alur utama

## Non-Goals

- Mendesain ulang flow workout aktif
- Mengubah format PNG share asset
- Menambahkan template report atau variasi visual baru untuk export

## Recommendation

Gunakan pendekatan `compact completion summary`:
- header sukses yang ringkas, bukan hero besar
- satu summary card utama untuk nama sesi dan metrik inti
- daftar exercise sebagai kartu ringkas mengikuti pola card existing
- action bar sticky di bawah
- sembunyikan bottom nav saat berada di route workout session agar fokus tidak pecah

## UI Direction

### Visual Language

- tetap dark dengan `gradient-mesh`, `glass-card`, dan `surface-elevated`
- emerald jadi accent utama untuk icon sukses, CTA share, dan badge penting
- hindari blok warna besar yang terasa asing dari dashboard

### Typography

- heading utama sekitar `28-32px`
- nama session sekitar `22-24px`
- metric value sekitar `18-20px`
- body utama `14-15px`
- caption dan helper `12-13px`

### Layout

1. success header ringkas
2. summary card berisi plan name + 3 metric utama + info chips
3. daftar exercise cards
4. sticky bottom actions:
   - `Download PNG`
   - `Share`
   - `Finished`

## UX Rules

- preview PNG tidak ditampilkan
- helper status ditampilkan sebagai teks kecil, bukan alert card besar
- `Share` tetap primary visual action
- `Finished` tetap mudah ditemukan untuk menutup flow tanpa gangguan

## Technical Notes

- summary data tetap memakai `WorkoutShareSummary`
- detail set tetap dihitung dari `snapshot.progress.allSets`
- bottom nav disembunyikan pada `/workout/session`
- implementasi utama berada di `src/components/workout-session-complete-view.tsx`
