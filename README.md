# Aplikasi Keuangan — Mhempis

Dashboard keuangan rumah tangga: saldo rekening, transaksi, target tabungan, dan analitik pengeluaran.
Stack: Next.js 16 (App Router) + React 19 + Prisma + Tailwind.

## Menjalankan di lokal

```bash
cp .env.example .env      # lalu isi AUTH_SECRET (openssl rand -hex 32)
npm install
npx prisma db push        # buat skema database
node scripts/seed-demo.mjs # buat akun contoh (SEED_EMAIL / SEED_PASSWORD di .env)
npm run dev               # http://localhost:3000
```

Data contoh (rekening, transaksi, tabungan) otomatis diisi untuk setiap user baru saat login pertama.

## Login

### Email + kata sandi
Password disimpan sebagai hash **scrypt** (`lib/password.ts`), diverifikasi dengan perbandingan constant-time.
Sesi = cookie `pf_session` ber-HttpOnly, bertanda tangan HMAC-SHA256 (`lib/session-token.ts`), umur 30 hari.

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

## Catatan keamanan

Sudah diterapkan:
- Tidak ada autentikasi di sisi browser. Sesi diverifikasi di server (`proxy.ts` + setiap route handler + server component).
- `userId` **selalu** berasal dari sesi terverifikasi — bukan lagi dari header `x-user-id`, query, atau body.
- Semua endpoint memvalidasi kepemilikan data (anti IDOR) dan menolak nilai non-numerik (`NaN`).
- Validasi input terpusat di `lib/validation.ts`; rate limit login di `lib/rate-limit.ts`.
- Security header (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) di `next.config.mjs`.
- `typescript.ignoreBuildErrors` dimatikan — error tipe menggagalkan build.
- Tidak ada kredensial demo yang ditampilkan di halaman login.

Belum / catatan produksi:
- **Database**: SQLite hanya untuk lokal. Di serverless (Vercel) filesystem bersifat sementara → **wajib** pindah ke
  PostgreSQL: ubah `provider = "postgresql"` di `prisma/schema.prisma` + set `DATABASE_URL` di environment.
- Rate limit masih in-memory per instance; untuk multi-instance gunakan Redis/Upstash.
- CSP masih memakai `'unsafe-inline'` untuk script (kebutuhan bootstrap Next.js). Bisa dinaikkan ke nonce-based.
- Set `AUTH_SECRET` dan `APP_URL` (https) di environment hosting; cookie otomatis jadi `Secure` bila `APP_URL` https.
