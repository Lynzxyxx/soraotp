# SoraOTP
1. `npm i`, salin `.env.example` ke `.env.local` lalu isi.
2. Firebase: aktifkan Authentication (Email/Password) dan **Realtime Database**; tempel isi `database.rules.json` di tab Rules lalu Publish.
3. Samakan endpoint di `lib/provider.js` (NusaOTP) dan `lib/qris.js` (buatqris) dengan dokumentasi masing-masing.
4. Webhook buatqris (opsional): `https://DOMAIN/api/deposit/callback`.
5. Admin: buka `/admin/soraotp` (isi OWNER_EMAIL, daftar dulu dengan email itu).
6. Deploy: push ke GitHub, import di Vercel, isi semua env var.
7. Webhook NusaOTP: panggil `/v2/set-webhook` dengan `https://DOMAIN/api/webhook/nusa?key=NUSA_WEBHOOK_SECRET`.
8. Notifikasi Telegram: isi TELEGRAM_BOT_TOKEN dan TELEGRAM_ADMIN_ID, kirim /start ke bot dari akunmu, lalu tekan 'Tes Telegram' di /admin/soraotp.
