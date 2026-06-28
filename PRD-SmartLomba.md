# PRD — SmartLomba (Backend Integration)

**Produk:** SmartLomba — Sistem Pengelolaan Lomba Sekolah
**Versi dokumen:** 1.0 — **FINAL**
**Tanggal:** 18 Juni 2026
**Sumber:** Laporan Desain Awal UTS (Umar M. Mauladdawilah & Risma Fitri A., Universitas Ma Chung) + Front-end yang sudah jadi (HTML/CSS/JS)
**Status front-end:** ✅ 5 halaman jadi (perlu beberapa penyesuaian + 2 halaman baru: `signup.html`, `lomba-saya.html`). **Status backend:** 🔜 Belum dibangun (target: integrasi lokal — **PHP Native + PostgreSQL**, role: **Admin & Peserta**)

---

## 1. Ringkasan & Tujuan

SmartLomba adalah aplikasi web untuk mendigitalisasi pengelolaan kompetisi akademik sekolah: mulai dari pendaftaran peserta, verifikasi dokumen, sampai (ke depannya) pelaksanaan ujian dan penilaian otomatis.

**Tujuan dokumen ini:** menjadi acuan tunggal saat membangun backend dan menyambungkannya ke front-end yang sudah ada, supaya pengerjaan berikutnya lebih cepat dan tidak perlu menebak-nebak bentuk data/endpoint.

**Tujuan produk (dari laporan):**
- Digitalisasi administrasi pendaftaran (dari kertas → digital).
- Verifikasi peserta yang transparan (status real-time).
- Pengelolaan bank soal & penilaian otomatis (fase lanjutan).
- Leaderboard hasil lomba (fase lanjutan).

---

## 2. Scope

### 2.1 In Scope — yang dibutuhkan front-end saat ini (MVP backend)
Inilah yang harus jalan supaya halaman yang ada (+ 1 halaman baru) berfungsi:

1. **Autentikasi & Registrasi Akun** — login Admin & Peserta (dual-portal) + **halaman registrasi akun peserta** (`signup.html`, halaman baru). Admin = 1 akun seeded.
2. **Manajemen Lomba (Admin)** — admin bisa **menambah lomba baru**; lomba inilah yang muncul & bisa dipilih peserta saat daftar lomba.
3. **Daftar lomba** — list lomba untuk halaman daftar lomba & admin.
4. **Pendaftaran lomba (Peserta, sudah login)** — di `registrasi.html`: data diri **prefilled & read-only**, peserta tinggal pilih lomba → submit (bikin baris `user_lomba`).
5. **Manajemen pendaftaran (Admin)** — list, search, filter status, detail, **verifikasi / tolak**, hapus, bulk action.
6. **Dashboard Peserta** — profil, lomba yang diikuti, status verifikasi, edit profil.
7. **Halaman "Lomba Saya" (Peserta)** — halaman baru (`lomba-saya.html`) berisi daftar lengkap pendaftaran milik peserta, **dengan filter status**.
8. **Dashboard Admin (statistik)** — total peserta, lomba aktif, pendaftaran per lomba, registrasi terbaru.

> **Penting — 2 alur terpisah (jangan ketuker):**
> - **Registrasi Akun** (`signup.html`, BARU): bikin akun peserta + password → menyimpan ke tabel `users`. Diakses dari link di `index.html`.
> - **Daftar Lomba** (`registrasi.html`, sudah ada): hanya untuk peserta yang **sudah login**; data diri prefilled & read-only; pilih lomba → menyimpan ke tabel `user_lomba`.

### 2.2 Out of Scope (sekarang) — disebut di laporan tapi belum ada di front-end
Ditahan dulu, dibangun setelah MVP stabil:

- **Bank Soal** (manajemen soal & kunci jawaban).
- **Ujian Online / CBT** (pelaksanaan ujian, timer, sesi).
- **Penilaian otomatis** (auto-scoring pilihan ganda).
- **Leaderboard** (peringkat real-time).
- **Upload bukti administrasi** (file upload dokumen peserta).
- **Sertifikat & pengumuman pemenang** (ada UI placeholder di dashboard admin).

> Role **Operator/guru dibatalkan** — sistem hanya punya 2 role: **Admin** & **Peserta** (biar simpel).

> Catatan: stat **"Soal Tersedia"** dan **"Penilaian Selesai"** di dashboard admin ditampilkan dengan label/badge **"Dalam Pembangunan"** (bukan angka), karena fitur soal & penilaian belum dibuat.

---

## 3. Peran Pengguna (Roles)

Sistem hanya punya **2 role**: Admin & Peserta.

| Role | Pengguna | Akses Utama (MVP) |
| --- | --- | --- |
| **Admin** | Panitia | **Tambah lomba**, lihat semua pendaftaran, verifikasi/tolak, hapus, lihat statistik dashboard. |
| **Peserta** | Siswa | Registrasi, lihat dashboard sendiri, lihat lomba yang diikuti & status (+ halaman "Lomba Saya"), edit profil. |

> **Admin = 1 akun saja** yang di-seed di database (`username: admin`, `password: admin`). Tidak ada registrasi admin — registrasi hanya untuk peserta. (Ganti password admin sebelum dipakai di luar lokal.)
> Front-end login punya 2 tab: **Admin** & **Peserta** — sudah sesuai.

---

## 4. Tech Stack

| Layer | Pilihan | Catatan |
| --- | --- | --- |
| Front-end | HTML + CSS + Vanilla JS (`assets/app.js`) | Sudah jadi, static. Tinggal sambung `fetch()` ke API. |
| Backend | **PHP Native (tanpa framework)** | Endpoint REST ditulis manual via front controller / router sederhana. |
| Database | **PostgreSQL 17.9** | Sesuai laporan. |
| DB access | **PDO** (driver `pgsql`) | Wajib pakai prepared statements (anti SQL injection). |
| Auth | Token sederhana + `password_hash()` | Lihat §8. |

**Arsitektur:** Client–Server. Browser (static FE) → REST API (PHP native) → PostgreSQL via PDO.

**Catatan PHP native:**
- Gunakan satu entry point (`index.php` / `api.php`) sebagai router, route berdasarkan `$_SERVER['REQUEST_METHOD']` + `$_SERVER['REQUEST_URI']`.
- Baca body JSON via `json_decode(file_get_contents('php://input'), true)`.
- Selalu set header `Content-Type: application/json` + header CORS.
- Password pakai fungsi bawaan PHP: `password_hash($pw, PASSWORD_BCRYPT)` & `password_verify()`.

---

## 5. Data Model / Database Schema

Berdasarkan laporan ada 3 tabel inti (`User`, `Lomba`, `User_Lomba`), tapi skema di laporan **belum lengkap** dibanding kebutuhan front-end. Di bawah ini versi yang sudah direkonsiliasi dengan field yang benar-benar dipakai UI.

### 5.1 `users`
| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | serial PK | |
| `nama` | varchar(150) | Nama lengkap |
| `email` | varchar(150) unique | Login peserta & kontak |
| `username` | varchar(50) nullable | Opsional, untuk login admin |
| `password_hash` | varchar(255) | bcrypt |
| `role` | enum(`admin`,`peserta`) | |
| `nisn` | varchar(10) nullable | Hanya peserta (10 digit) |
| `asal_sekolah` | varchar(150) | |
| `jenjang` | varchar(20) nullable | SD / SMP / SMA-SMK |
| `kelas` | varchar(30) nullable | mis. "XI MIPA 2" |
| `no_hp_ortu` | varchar(20) nullable | |
| `status` | varchar(20) nullable | status akun (opsional) — lihat catatan |
| `created_at` / `updated_at` / `deleted_at` | timestamp | Audit + soft delete |

### 5.2 `lomba`
| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | serial PK | |
| `nama_lomba` | varchar(150) | mis. "Olimpiade Matematika" |
| `kode_lomba` | varchar(30) unique | |
| `deskripsi` | text nullable | |
| `tanggal_pelaksanaan` | date/timestamp | |
| `maksimal_peserta` | int | kuota |
| `pelaksana` | varchar(150) | |
| `is_active` | boolean default true | untuk stat "Lomba Aktif" |
| `created_at` / `updated_at` / `deleted_at` | timestamp | |

### 5.3 `user_lomba` (pendaftaran — bridge table M:N)
| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | serial PK | |
| `user_id` | int FK → users.id | |
| `lomba_id` | int FK → lomba.id | |
| `nomor_registrasi` | varchar(30) unique | mis. `SL-2025-0249` |
| `status` | enum(`pending`,`terverifikasi`,`ditolak`) default `pending` | **status verifikasi per pendaftaran** |
| `alasan_penolakan` | text nullable | "Motif Penolakan" dari laporan |
| `nilai` | numeric nullable | untuk fase penilaian |
| `created_at` (= tanggal daftar) / `updated_at` / `deleted_at` | timestamp | |
| | | **UNIQUE(user_id, lomba_id)** — cegah daftar lomba sama 2x |

**Relasi:** `users` 1—N `user_lomba` N—1 `lomba` (Many-to-Many lewat `user_lomba`).

### 5.4 `sessions` (token login)
| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `token` | varchar(64) PK | dari `bin2hex(random_bytes(32))` |
| `user_id` | int FK → users.id | |
| `created_at` | timestamp | |
| `expires_at` | timestamp | cek saat validasi token |

> Opsional bila pakai JWT (stateless) — kalau JWT, tabel ini tidak perlu.

> ✅ **Keputusan (terkunci):** `status` verifikasi diletakkan di `user_lomba` (bukan di `users` seperti di laporan), karena verifikasi bersifat per-pendaftaran dan satu peserta bisa ikut beberapa lomba dengan status berbeda. Cocok dengan tabel di `admin-peserta.html` (status per baris). Kolom `status` di `users` dipakai hanya untuk status akun (opsional) dan boleh dihilangkan kalau tak perlu.

---

## 6. Spesifikasi API

Konvensi:
- Base URL lokal: `http://localhost:3000/api`
- Format response: JSON dengan envelope `{ "success": boolean, "data": ..., "message": string }`
- Auth: header `Authorization: Bearer <token>` untuk endpoint terproteksi.
- Status code: `200` OK, `201` Created, `400` validasi, `401` unauth, `403` forbidden, `404` not found, `409` konflik (mis. NISN duplikat).

### 6.1 Autentikasi & Registrasi Akun
| Method | Endpoint | Dipakai oleh | Body / Query | Response |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | `signup.html` (BARU) | `{ nama, nisn, asal_sekolah, jenjang, kelas, email, no_hp_ortu, password }` | `{ user }` (role otomatis `peserta`) |
| POST | `/auth/login` | `index.html` | `{ identifier, password, role }` | `{ token, user:{id,nama,role,...} }` |
| GET | `/auth/me` | semua dashboard | — (Bearer) | `{ user }` |
| POST | `/auth/logout` | tombol "Keluar" | — (Bearer) | `{ success }` |

> **PHP native:** `/auth/register` membuat baris di `users` (role=`peserta`), password di-hash `password_hash()`. Saat login, `identifier` = **email** (peserta) atau **username `admin`** (admin). Login → `password_verify()` → buat token acak (`bin2hex(random_bytes(32))`), simpan di `sessions(token, user_id, expires_at)`. Endpoint terproteksi cek token dari header `Authorization: Bearer ...`.

### 6.2 Lomba
| Method | Endpoint | Dipakai oleh | Catatan |
| --- | --- | --- | --- |
| GET | `/lomba` | `registrasi.html` (step 2), admin | List lomba aktif |
| GET | `/lomba/:id` | — | Detail |
| POST | `/lomba` | **admin — fitur "Tambah Lomba" (MVP)** | Body: `{ nama_lomba, kode_lomba, tanggal_pelaksanaan, maksimal_peserta, pelaksana, deskripsi? }`. Khusus admin. |
| PUT | `/lomba/:id` | admin *(near-term)* | Edit lomba |
| DELETE | `/lomba/:id` | admin *(near-term)* | Soft delete lomba |

### 6.3 Pendaftaran
| Method | Endpoint | Dipakai oleh | Body / Query | Response |
| --- | --- | --- | --- | --- |
| POST | `/pendaftaran` | `registrasi.html` (submit, **Bearer**) | `{ lomba_id }` — user diambil dari token, **bukan** dari body | `{ nomor_registrasi, status:"pending" }` |
| GET | `/pendaftaran` | `admin-peserta.html`, dashboard admin | `?status=&search=&page=&limit=` | `{ data:[...], total, page }` |
| GET | `/pendaftaran/:id` | modal detail admin | — | `{ pendaftaran + data peserta }` |
| PATCH | `/pendaftaran/:id/verifikasi` | tombol **Verifikasi / Tolak** di modal detail | `{ status, alasan_penolakan? }` — `status` = `terverifikasi` atau `ditolak`. `alasan_penolakan` wajib bila status `ditolak`. | `{ updated }` |
| PATCH | `/pendaftaran/bulk` | bulk verify | `{ ids:[], status }` | `{ updated_count }` |
| DELETE | `/pendaftaran/:id` | hapus | — | `{ success }` |
| DELETE | `/pendaftaran/bulk` | bulk delete | `{ ids:[] }` | `{ deleted_count }` |

### 6.4 Peserta (self-service)
| Method | Endpoint | Dipakai oleh | Catatan |
| --- | --- | --- | --- |
| GET | `/peserta/me` | `peserta-dashboard.html` + **prefill `registrasi.html` Step 1 (read-only)** | Data profil (nama, NISN, sekolah, jenjang, kelas, email, no_hp_ortu) |
| PUT | `/peserta/me` | modal Edit Profil (`saveProfile`) | Update profil |
| GET | `/peserta/me/pendaftaran` | "Lomba Saya" (dashboard) + halaman `lomba-saya.html` | `?status=` (semua/terverifikasi/pending/ditolak). List pendaftaran milik peserta + status. |

### 6.5 Dashboard (Admin)
| Method | Endpoint | Dipakai oleh | Response |
| --- | --- | --- | --- |
| GET | `/dashboard/stats` | `admin-dashboard.html` | `{ total_peserta, lomba_aktif }` — `soal_tersedia` & `penilaian_persen` tidak dikirim (FE tampilkan badge **"Dalam Pembangunan"**) |
| GET | `/dashboard/pendaftaran-per-lomba` | bar chart | `[{ lomba, jumlah }]` |
| GET | `/pendaftaran?limit=5&sort=terbaru` | "Registrasi Terbaru" | reuse endpoint 6.3 |

> Endpoint dari laporan asli (`POST /auth/login`, `GET /lomba`, `POST /pendaftaran`, `PATCH /verifikasi/{id}`) semuanya tercakup di atas — hanya diperluas agar semua interaksi front-end ter-cover.

---

## 7. Peta Integrasi Front-end → API

| Halaman | Aksi UI | Endpoint |
| --- | --- | --- |
| `index.html` | Submit login (Admin/Peserta) | `POST /auth/login` |
| `index.html` | Link "Registrasi / Belum punya akun?" → `signup.html` | *(navigasi, no API)* |
| `signup.html` **(BARU)** | Submit pendaftaran akun | `POST /auth/register` |
| `registrasi.html` | Cek login + prefill data diri (read-only) | `GET /peserta/me` |
| `registrasi.html` | Step 2 load pilihan lomba | `GET /lomba` |
| `registrasi.html` | "Kirim Pendaftaran" (pilih lomba) | `POST /pendaftaran` `{ lomba_id }` |
| `admin-dashboard.html` | **Tambah Lomba** (tombol + form/modal) | `POST /lomba` |
| `admin-dashboard.html` | Load stat & chart | `GET /dashboard/stats`, `GET /dashboard/pendaftaran-per-lomba` |
| `admin-dashboard.html` | Tabel registrasi terbaru | `GET /pendaftaran?limit=5` |
| `admin-peserta.html` | Tabel + search + filter | `GET /pendaftaran?search=&status=&page=` |
| `admin-peserta.html` | Modal detail (Verifikasi / **Tolak** / Tutup) | `GET /pendaftaran/:id` |
| `admin-peserta.html` | Verifikasi → status `terverifikasi` | `PATCH /pendaftaran/:id/verifikasi` |
| `admin-peserta.html` | **Tolak** → status `ditolak` (+ alasan) | `PATCH /pendaftaran/:id/verifikasi` |
| `admin-peserta.html` | Bulk verify / delete | `PATCH /pendaftaran/bulk`, `DELETE /pendaftaran/bulk` |
| `peserta-dashboard.html` | Load profil & lomba saya *(filter status di sidebar DIHAPUS)* | `GET /peserta/me`, `GET /peserta/me/pendaftaran` |
| `peserta-dashboard.html` | Simpan Edit Profil | `PUT /peserta/me` |
| `peserta-dashboard.html` | "Lihat Semua →" (section Lomba Saya) → `lomba-saya.html` | *(navigasi, no API)* |
| `lomba-saya.html` **(BARU)** | List semua pendaftaran peserta + filter status | `GET /peserta/me/pendaftaran?status=` |

---

## 8. Autentikasi & Keamanan
- Password disimpan sebagai hash via `password_hash($pw, PASSWORD_BCRYPT)`; verifikasi dengan `password_verify()`. **Jangan** pernah simpan plaintext.
- Token login disimpan di tabel `sessions` (atau pakai JWT bila mau); client kirim via header `Authorization: Bearer <token>`.
- Semua query DB pakai **PDO prepared statements** (parameter binding) — wajib, anti SQL injection.
- Endpoint admin dicek `role === 'admin'` di middleware/guard sebelum proses.
- Endpoint `/peserta/me*` hanya akses data milik user dari token — **jangan** terima `user_id` dari client.
- Soft delete: query default `WHERE deleted_at IS NULL`.
- Set header CORS (`Access-Control-Allow-Origin`, `-Methods`, `-Headers`) dan tangani preflight `OPTIONS`.

---

## 9. Aturan Validasi (server-side)

**Registrasi akun (`POST /auth/register`):**
- `nisn`: wajib 10 digit angka, unik.
- `email`: format valid, unik.
- Field wajib: nama, nisn, asal_sekolah, jenjang, kelas, email, no_hp_ortu, password.
- `password`: minimal 8 karakter (saran). "Konfirmasi password" divalidasi di front-end (`signup.html`).

**Daftar lomba (`POST /pendaftaran`):**
- Wajib login (token valid) — user diambil dari token.
- `lomba_id` wajib & lomba harus aktif/ada.
- Tidak boleh daftar lomba yang sama 2x (constraint `UNIQUE(user_id, lomba_id)`).
- Cek kuota: tolak jika jumlah peserta `terverifikasi` di lomba ≥ `maksimal_peserta` (opsional di MVP).
- `nomor_registrasi` di-generate server (format `SL-<tahun>-<urut4digit>`).

**Verifikasi (`PATCH /pendaftaran/:id/verifikasi`):**
- `status` harus `terverifikasi` atau `ditolak`. Jika `ditolak`, `alasan_penolakan` wajib diisi.

---

## 10. Keputusan

### ✅ Sudah terkunci
1. **Backend:** PHP Native (tanpa framework), PostgreSQL via PDO.
2. **Letak `status` verifikasi:** di tabel `user_lomba`.
3. **Role:** hanya **Admin & Peserta** (Operator/guru dibatalkan).
4. **Admin:** 1 akun seeded (`admin`/`admin`), tidak ada registrasi admin.
5. **Admin bisa tambah lomba** (`POST /lomba`) — masuk MVP.
6. **Verifikasi pendaftaran:** modal detail punya tombol **Verifikasi** (→ `terverifikasi`) & **Tolak** (→ `ditolak`, dengan alasan), plus Tutup.
7. **Halaman baru `lomba-saya.html`** untuk peserta (list lomba yang **diikuti peserta itu** + filter status). Filter status di sidebar `peserta-dashboard.html` **dihapus**.
8. **Alur registrasi DIPISAH:**
   - **Akun** dibuat lewat `signup.html` (BARU) → `POST /auth/register`. Link-nya ada di `index.html`.
   - **Daftar lomba** lewat `registrasi.html` (harus sudah login) → `POST /pendaftaran` hanya kirim `{ lomba_id }`.
   - Di `registrasi.html`, data diri **prefilled & read-only** (diambil dari `GET /peserta/me`).
9. **Identifier login:** Peserta = **email + password**. Admin = **username `admin` + password**.
10. **Stat "Soal Tersedia" & "Penilaian Selesai"** (dashboard admin): ditampilkan dengan badge **"Dalam Pembangunan"** sampai fitur Bank Soal & Penilaian dibuat.

> ✅ Semua keputusan sudah terkunci — PRD final.

### 📌 Action item front-end
- **`signup.html` (BARU):** buat halaman registrasi akun (mirip `index.html` tapi lengkap: nama, NISN, asal_sekolah, jenjang, kelas, email, no_hp_ortu, password + konfirmasi password).
- **`index.html`:** tambah link/tombol "Registrasi / Belum punya akun?" → `signup.html`.
- **`registrasi.html`:** Step 1 jadikan **prefill + read-only** (data dari user login), hapus kebutuhan input data diri; tambah guard "harus login" (redirect ke `index.html` kalau belum).
- **`admin-dashboard.html`:** tambah tombol + form/modal **"Tambah Lomba"**.
- **`admin-peserta.html`:** di modal detail tambah tombol **Tolak** (saat ini hanya Verifikasi & Tutup).
- **`peserta-dashboard.html`:** hapus blok "Semua Status" + filter status di sidebar; pastikan "Lihat Semua →" mengarah ke `lomba-saya.html`.
- **`lomba-saya.html` (BARU):** buat halaman daftar pendaftaran peserta + filter status.

---

## 11. Setup Lokal (rencana)
```
/smartlomba
  /frontend            # HTML + assets/ (5 ada + signup.html & lomba-saya.html BARU)
  /backend
    index.php          # front controller / router (entry point semua /api/*)
    /config
      db.php           # koneksi PDO ke PostgreSQL
      cors.php         # header CORS + handle OPTIONS
    /routes            # mapping URL → handler
    /controllers       # auth, lomba, pendaftaran, peserta, dashboard
    /helpers           # response JSON, auth/token guard, validasi
    /sql
      schema.sql       # CREATE TABLE users, lomba, user_lomba, sessions
      seed.sql         # 1 admin + beberapa lomba contoh
    .env / config.php  # DB host/name/user/pass, dsb
```
Langkah:
1. Install PostgreSQL 17.9, buat database `smartlomba`. Pastikan ekstensi PDO `pgsql` aktif di `php.ini` (`extension=pdo_pgsql`).
2. Import `schema.sql` lalu `seed.sql`.
3. Jalankan server: `php -S localhost:3000 -t backend` (built-in server, cukup untuk lokal).
4. Arahkan `fetch()` di `assets/app.js` ke `http://localhost:3000` (atau path `/api`).
5. Pastikan header CORS aktif + preflight `OPTIONS` ditangani.

> Routing PHP native sederhana: di `index.php`, ambil `$method = $_SERVER['REQUEST_METHOD']` dan `$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)`, lalu `switch`/match ke handler yang sesuai.

---

## 12. Rencana Fase
| Fase | Isi |
| --- | --- |
| **Fase 1 (MVP)** | Auth (admin seeded + registrasi peserta), **tambah lomba oleh admin**, daftar lomba, pendaftaran, verifikasi/tolak, dashboard peserta & admin, halaman "Lomba Saya" (§2.1). |
| **Fase 2** | Bank soal + CBT/ujian online + timer sesi. |
| **Fase 3** | Penilaian otomatis + leaderboard + sertifikat. |
| **Fase 4** | Upload dokumen + laporan/rekap ekspor. |
