import { ownerFrom } from '@/lib/admin'
import { tgSecret } from '@/lib/telegram'
// Mengaktifkan perintah bot (/rekap, /status, /cari) dengan mendaftarkan webhook ke Telegram
export async function POST(req) {
  try {
    await ownerFrom(req)
    const t = process.env.TELEGRAM_BOT_TOKEN; if (!t) throw new Error('TELEGRAM_BOT_TOKEN belum diisi')
    const call = (m, body) => fetch(`https://api.telegram.org/bot${t}/${m}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())
    const w = await call('setWebhook', { url: `${new URL(req.url).origin}/api/telegram/webhook`, secret_token: tgSecret(), allowed_updates: ['message'] })
    if (!w.ok) throw new Error('Telegram: ' + (w.description || 'setWebhook gagal'))
    await call('setMyCommands', { commands: [
      { command: 'rekap', description: 'Kirim rekap (today, 7d, 30d, all)' }, { command: 'status', description: 'Ringkasan cepat' },
      { command: 'cari', description: 'Cari pengguna berdasarkan email/nama' }, { command: 'help', description: 'Daftar perintah' }] })
    return Response.json({ ok: true })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
