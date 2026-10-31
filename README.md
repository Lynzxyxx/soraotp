# SoraOTP
1. `npm i` lalu salin `.env.example` ke `.env.local` dan isi.
2. Firebase: aktifkan Authentication (Email/Password) + Firestore, tempel `firestore.rules`, buat index dari `firestore.indexes.json`.
3. Sesuaikan endpoint di `lib/provider.js` dengan dokumentasi API NusaOTP kamu.
4. Deposit: samakan endpoint di `lib/qris.js` dengan API buatqris.site; webhook ke `/api/deposit/callback`.
5. Deploy: push ke GitHub -> import di Vercel -> isi semua env var.
6. Admin: buka /admin/soraotp (isi OWNER_EMAIL, daftar dulu pakai email itu).
