# Gym Fit Resumable Import Design

## Context

Importer snapshot Gym Fit saat ini mengambil:
- beberapa page reference dari endpoint search
- lalu detail per exercise satu per satu
- lalu upsert hasilnya ke tabel `Exercise`

Pendekatan ini bekerja saat quota masih longgar, tetapi rawan berhenti di tengah saat provider mengembalikan `429`. Delay sederhana tidak cukup membantu jika masalah utamanya adalah quota bulanan atau batas request yang ketat.

Jumlah data saat ini sekitar `273` exercise, jadi kebutuhan utamanya bukan throughput tinggi, melainkan:
- bisa dicicil
- bisa dilanjutkan tanpa mulai dari nol
- tetap idempotent saat dijalankan ulang

## Goals

- Mengubah importer Gym Fit menjadi import bertahap yang bisa di-resume
- Menghindari kehilangan progres saat import terputus
- Memungkinkan user membatasi jumlah item per run, misalnya 100 atau 150
- Tetap aman dijalankan berulang karena semua write ke DB bersifat upsert

## Non-Goals

- Menghilangkan seluruh request detail per exercise
- Menjamin lolos quota bulanan provider
- Menambahkan scheduler otomatis
- Menambahkan dashboard admin khusus untuk status import

## Chosen Approach

Gunakan `batch import + checkpoint lokal + optional delay`.

Importer akan bekerja seperti ini:
1. Ambil daftar reference exercise dari search endpoint
2. Tentukan subset yang akan diproses pada run saat ini berdasarkan checkpoint dan batas batch
3. Fetch detail hanya untuk subset tersebut
4. Upsert ke tabel `Exercise`
5. Simpan checkpoint baru setelah batch selesai

Pendekatan ini dipilih karena:
- paling efektif untuk quota kecil
- sederhana dijalankan manual
- meminimalkan pengulangan request yang tidak perlu
- mudah dipahami dan mudah dioperasikan ulang

## Command Shape

Importer tetap dijalankan lewat script npm, tetapi mendukung argumen opsional seperti:

```bash
npm run exercise:import -- --batch-size=100
```

Argumen yang didukung:
- `--batch-size`
  Jumlah maximum exercise detail yang diproses pada satu run
- `--delay-ms`
  Delay opsional antar request detail atau antar batch kecil
- `--reset-progress`
  Menghapus checkpoint dan memulai lagi dari awal

Tidak perlu menambah banyak flag lain pada iterasi ini.

## Checkpoint Strategy

Checkpoint akan disimpan di file lokal dalam repo, misalnya:

`./.cache/gymfit-import-state.json`

Isi minimal:

```json
{
  "lastCompletedOffset": 100,
  "totalRefs": 273,
  "updatedAt": "2026-04-05T12:00:00.000Z"
}
```

Aturan:
- checkpoint hanya di-update setelah upsert batch berhasil
- jika proses gagal di tengah fetch detail, offset tidak maju
- run berikutnya akan melanjutkan dari offset terakhir yang sukses

Jika user memakai `--reset-progress`, file checkpoint dihapus atau direset ke awal.

## Import Flow

### 1. Fetch References

Importer tetap mengambil daftar reference dari endpoint search dengan paging normal.

Hasil ini digunakan untuk:
- mengetahui total data
- menentukan daftar ID yang akan diproses

Jika endpoint search sendiri kena `429`, importer berhenti dan menampilkan pesan yang jelas tanpa mengubah checkpoint.

### 2. Slice By Checkpoint

Setelah total reference didapat:
- baca checkpoint lokal
- ambil subset berdasarkan `lastCompletedOffset`
- batasi dengan `batch-size`

Contoh:
- total refs: `273`
- checkpoint: `100`
- batch size: `100`

Run berikutnya hanya memproses reference `100..199`.

### 3. Detail Fetch

Fetch detail tetap menggunakan concurrency kecil, tetapi:
- concurrency diturunkan dari mode agresif
- ada opsi `delay-ms`

Tujuan delay bukan mengatasi quota bulanan, tetapi mengurangi kemungkinan spike request yang memicu pembatasan tambahan.

### 4. Database Write

Semua item yang berhasil dinormalisasi akan tetap di-upsert ke tabel `Exercise`.

Karena sifatnya upsert:
- aman dijalankan ulang
- aman jika batch sama tidak sengaja terproses lagi
- tidak menimbulkan duplikasi data

## Error Handling

### Quota / 429

Jika provider mengembalikan `429`:
- importer berhenti dengan pesan jelas
- checkpoint tidak dimajukan
- data batch yang belum selesai dianggap belum committed

Pesan output harus membantu user memahami bahwa:
- progress sebelumnya tetap aman
- import bisa dilanjutkan nanti

### Partial Detail Failures

Untuk iterasi ini, jika satu batch terkena error berat dari provider:
- hentikan batch
- jangan update checkpoint

Pendekatan ini lebih aman daripada melanjutkan dengan progress ambigu.

### Database Failure

Jika upsert gagal:
- hentikan proses
- jangan update checkpoint

## UX / DX Output

Output terminal importer harus jelas dan ringkas, misalnya:
- total references ditemukan
- checkpoint mulai dari offset berapa
- batch size yang digunakan
- berapa detail berhasil diproses pada run ini
- checkpoint baru berada di offset berapa
- apakah semua data sudah selesai atau masih ada sisa

Contoh ringkasan:

```json
{
  "totalRefs": 273,
  "startOffset": 100,
  "processedThisRun": 100,
  "nextOffset": 200,
  "remaining": 73,
  "completed": false
}
```

## File Changes Expected

- `scripts/import-gymfit-catalog.mjs`
- `package.json`
- menambah file checkpoint runtime di `.cache/` saat script dijalankan

## Risks And Mitigations

- Risiko: quota tetap habis walau batch kecil
  Mitigasi: importer bisa dilanjutkan lain waktu tanpa mulai dari awal

- Risiko: checkpoint korup atau tidak sinkron
  Mitigasi: sediakan `--reset-progress`

- Risiko: user bingung apakah import sudah selesai seluruhnya
  Mitigasi: tampilkan summary `completed: true/false` dan `remaining`

- Risiko: file checkpoint ikut masuk git
  Mitigasi: pastikan `.cache/` di-ignore

## Recommendation

Implement importer Gym Fit sebagai `resumable batch importer` dengan:
- `batch-size` yang bisa diatur
- checkpoint lokal berbasis offset
- optional delay antar request
- summary output yang jelas

Ini adalah pendekatan paling efektif untuk dataset kecil seperti `273` item ketika provider quota-nya sempit, tanpa memaksa user mengulang import dari nol setiap kali kena `429`.
