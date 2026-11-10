import { ownerFrom } from '@/lib/admin'
import { tgSecret, tgApi } from '@/lib/telegram'
// Mengaktifkan bot (toko + perintah admin) dengan mendaftarkan webhook ke Telegram
const PUBLIC = [['start', 'Menu utama'], ['beli', 'Beli nomor'], ['isi', 'Isi saldo'], ['saldo', 'Cek saldo'], ['pesanan', 'Pesanan saya'], ['riwayat', 'Riwayat deposit'], ['login', 'Masuk'], ['daftar', 'Daftar akun'], ['website', 'Buka website'], ['help', 'Bantuan']]
const ADMIN = [...PUBLIC, ['admin', 'Menu admin'], ['users', 'Daftar pengguna'], ['user', 'Cari pengguna'], ['orders', 'Pesanan terbaru'], ['deposits', 'Deposit terbaru'], ['order', 'Cari pesanan'], ['rekap', 'Kirim rekap'], ['status', 'Ringkasan cepat'], ['provider', 'Saldo provider'], ['setsaldo', 'Set saldo pengguna'], ['pw', 'Ganti password pengguna'], ['blokir', 'Blokir pengguna'], ['bukablokir', 'Buka blokir'], ['kirim', 'Kirim pesan siaran'], ['chats', 'Daftar chat bot'], ['otp', 'Isi OTP manual']]
const cmds = l => l.map(([command, description]) => ({ command, description }))
export async function POST(req) {
  try {
    await ownerFrom(req)
    if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN belum diisi')
    const w = await tgApi('setWebhook', { url: `${new URL(req.url).origin}/api/telegram/webhook`, secret_token: tgSecret(), allowed_updates: ['message', 'callback_query', 'my_chat_member'] })
    if (!w.ok) throw new Error('Telegram: ' + w.error)
    await tgApi('setMyCommands', { commands: cmds(PUBLIC) })
    for (const id of (process.env.TELEGRAM_ADMIN_ID || '').split(',').map(s => s.trim()).filter(Boolean)) await tgApi('setMyCommands', { commands: cmds(ADMIN), scope: { type: 'chat', chat_id: id } })
    return Response.json({ ok: true })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
