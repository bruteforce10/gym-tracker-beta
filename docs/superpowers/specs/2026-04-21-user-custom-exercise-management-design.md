# User Custom Exercise Management Design

## Scope

Menambahkan pengelolaan custom exercise milik user langsung dari halaman detail exercise:

- tombol `Edit` untuk custom exercise milik user yang sedang login
- tombol `Delete` yang mengubah status menjadi `archived`
- halaman edit user yang memakai form custom exercise yang sudah ada
- filter katalog sederhana `Semua` / `Buatan Saya`

## Access Rules

- Aksi owner hanya muncul untuk exercise dengan `source = "user"`.
- Exercise harus dibuat oleh user yang sedang login (`createdByUserId` sama dengan viewer).
- User tidak bisa mengedit atau menghapus custom exercise milik user lain.
- User delete tidak melakukan hard delete.

## Data Behavior

- Delete oleh user mengubah `status` menjadi `archived`.
- Exercise archived hilang dari katalog karena query katalog sudah mengecualikan status archived.
- Relasi lama di plan, goal, dan workout log tetap dibiarkan utuh.
- Edit oleh user tetap memakai validasi dan duplicate-check yang sama seperti flow create.

## UI Flow

- Halaman detail exercise menampilkan tombol owner action jika viewer adalah pemilik custom exercise.
- Tombol `Edit` membuka halaman `/exercises/[slug]/edit`.
- Tombol `Delete` membuka dialog konfirmasi dan setelah sukses mengembalikan user ke katalog exercise.
- Setelah edit berhasil, user diarahkan ke slug terbaru agar rename tidak menyebabkan redirect ke slug lama.

## Catalog Filter

- Ditambahkan filter `Katalog` dengan pilihan `Semua` dan `Buatan Saya`.
- Filter `Buatan Saya` hanya menampilkan exercise `source = user` dengan `createdByUserId` milik viewer aktif.
- Filter ini sengaja dibuat ringan agar tidak menambah kompleksitas UI katalog.

## Testing Notes

- TypeScript compile harus lolos untuk server action owner, form edit user, detail page, dan route edit baru.
- Manual smoke test:
  - buat custom exercise baru
  - buka detail dan pastikan tombol owner muncul
  - edit nama exercise dan pastikan redirect ke slug baru berhasil
  - delete exercise dan pastikan item hilang dari katalog
  - aktifkan filter `Buatan Saya` dan pastikan hanya custom exercise milik user yang tampil
