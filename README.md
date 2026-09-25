# Aplikasi Keuangan — Mhempis

Dashboard keuangan rumah tangga: saldo rekening, transaksi, target tabungan, dan analitik pengeluaran.
Stack: Next.js 16 (App Router) + React 19 + **PostgreSQL (Prisma)** + Tailwind.

## Menjalankan di lokal / server

```bash
cp .env.example .env       # isi DATABASE_URL, AUTH_SECRET (openssl rand -hex 32), APP_URL
npm install
npx prisma migrate deploy  # buat/patch skema database (pakai `migrate dev` kalau mau bikin migrasi baru)
node --env-file=.env scripts/seed-demo.mjs   # buat akun contoh (SEED_EMAIL / SEED_PASSWORD)
npm run build && npm start # produksi di http://0.0.0.0:3000
```

Data contoh (rekening, transaksi, tabungan) otomatis diisi untuk setiap user baru saat login pertama.

## Database (PostgreSQL)

Semua environment (lokal maupun server) memakai PostgreSQL. Tidak ada lagi SQLite.

1. Siapkan database + user:
   ```sql
   CREATE ROLE keuangan LOGIN PASSWORD 'password-kuat';
   CREATE DATABASE keuangan OWNER keuangan;
   ```
2. Set `DATABASE_URL` di `.env`:
   ```
   DATABASE_URL="postgresql://keuangan:password-kuat@127.0.0.1:5432/keuangan?schema=public"
   ```
3. Terapkan skema: `npx prisma migrate deploy` (produksi) / `npx prisma migrate dev` (pengembangan).
4. Skema ada di `prisma/schema.prisma`, riwayat migrasi di `prisma/migrations/`.

## Halaman & tata letak

Halaman utama (`/`) langsung menampilkan **form Tambah Transaksi** di layar pertama — tanpa perlu buka modal
atau scroll. Di bawahnya baru ringkasan angka, daftar rekening, catatan transaksi, lalu bagian sekunder
(Target Tabungan & Grafik Analisis Pengeluaran) yang bisa dibuka-tutup.

## Login

### Email + kata sandi
Password disimpan sebagai hash **scrypt** (`lib/password.ts`), diverifikasi dengan perbandingan constant-time.
Sesi = cookie ber-HttpOnly, bertanda tangan HMAC-SHA256 (`lib/session-token.ts`), umur 30 hari.
Ada tombol **mata** di kolom kata sandi untuk melihat/menyembunyikan isian.

### Login Google (opsional)
1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web application**.
2. Tambahkan *Authorized redirect URIs*:
   - `https://<domain-anda>/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (untuk uji lokal)
3. Isi `.env`:
   ```
   GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="..."
   APP_URL="https://domain-anda"
   ```
4. Restart server. Tombol **Masuk dengan Google** akan muncul di halaman login.

Alur OAuth: Authorization Code, `state` anti-CSRF (cookie HttpOnly + tanda tangan HMAC), penukaran kode
dilakukan server-to-server memakai `client_secret`, dan identitas diambil dari endpoint `userinfo` Google
(hanya email yang `email_verified` diterima). Selama `GOOGLE_CLIENT_ID` kosong, tombol Google disembunyikan —
tidak ada jalur login alternatif/palsu.
Catatan: Google mewajibkan redirect **https** (kecuali `localhost`), jadi login Google tidak jalan lewat
akses IP LAN biasa.

## Catatan keamanan

Sudah diterapkan:
- Tidak ada autentikasi di sisi browser. Sesi diverifikasi di server (`proxy.ts` + setiap route handler + server component).
- `userId` **selalu** berasal dari sesi terverifikasi — bukan lagi dari header `x-user-id`, query, atau body.
- Semua endpoint memvalidasi kepemilikan data (anti IDOR) dan menolak nilai non-numerik (`NaN`).
- Validasi input terpusat di `lib/validation.ts`; rate limit login di `lib/rate-limit.ts`
  (10 percobaan/menit/IP — IP diambil dari entri **paling kanan** `x-forwarded-for` supaya header palsu
  dari client tidak bisa dipakai mengakali limiter).
- Security header (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) di `next.config.mjs`.
- `typescript.ignoreBuildErrors` dimatikan — error tipe menggagalkan build.
- Tidak ada kredensial demo yang ditampilkan di halaman login.

Catatan produksi:
- Rate limit masih in-memory per instance; untuk multi-instance gunakan Redis.
- CSP masih memakai `'unsafe-inline'` untuk script (kebutuhan bootstrap Next.js). Bisa dinaikkan ke nonce-based.
- Set `AUTH_SECRET` dan `APP_URL` (https) di environment hosting; cookie otomatis jadi `Secure` bila `APP_URL` https.
- Jalankan di belakang reverse proxy (nginx) yang mengeset `X-Forwarded-For`/`X-Real-IP`, dan pastikan hanya
  proxy tersebut yang bisa diakses langsung dari luar.
