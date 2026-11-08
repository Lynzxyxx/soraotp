import { rget } from '@/lib/admin'
import { tg, tgSecret, isAdminChat, e, rpf } from '@/lib/telegram'
import { sendRecap, PERIODS } from '@/lib/recap'
import { getSettings } from '@/lib/settings'
import { balance } from '@/lib/provider'
import { wib, LN } from '@/lib/notify'
// Perintah bot (khusus chat admin). Didaftarkan lewat admin panel > Rekap & Bot > Aktifkan perintah bot.
export async function POST(req) {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== tgSecret()) return Response.json({ error: 'forbidden' }, { status: 403 })
  const msg = (await req.json().catch(() => ({}))).message, ok = Response.json({ ok: true })
  if (!msg?.text) return ok
  const chat = msg.chat.id, [raw, ...args] = msg.text.trim().split(/\s+/), c = raw.toLowerCase().replace(/@.*$/, '')
  if (!isAdminChat(chat)) { await tg('⛔ Bot ini khusus admin SoraOTP.', chat); return ok }
  try {
    if (c === '/start' || c === '/help') {
      await tg(`🤖 <b>BOT SORAOTP</b>\n<i>Perintah admin</i>\n${LN}\n📊 /rekap  <i>kirim rekap sesuai pengaturan</i>\n📊 /rekap 7d  <i>today · 7d · 30d · all</i>\n📈 /status  <i>ringkasan cepat</i>\n🔎 /cari email  <i>cari pengguna</i>\n${LN}\n🕒 ${wib()}`, chat)
    } else if (c === '/rekap') {
      const st = await getSettings(), period = PERIODS[args[0]] ? args[0] : st.recapPeriod
      await tg(`⏳ Menyiapkan rekap <b>${e(PERIODS[period])}</b>…`, chat)
      const out = await sendRecap(period, st.recapFormat, chat)
      const f = Object.values(out).find(v => !v.ok); if (f) await tg('❌ Gagal mengirim rekap: ' + e(f.error), chat)
    } else if (c === '/status') {
      const [users, orders, deps] = (await Promise.all([rget('users'), rget('orders'), rget('deposits')])).map(x => x || {})
      let prov = '—'; try { const b = await balance(); prov = typeof b === 'object' ? 'terhubung' : rpf(b) } catch { prov = '⚠️ gagal terhubung' }
      await tg(`📈 <b>STATUS SORAOTP</b>\n${LN}\n👥 Pengguna  <b>${Object.keys(users).length}</b>\n⏳ Pesanan berjalan  <b>${Object.values(orders).filter(o => o.status === 'waiting').length}</b>\n💳 Deposit pending  <b>${Object.values(deps).filter(d => d.status === 'pending').length}</b>\n🏦 Saldo NusaOTP  <b>${e(prov)}</b>\n${LN}\n🕒 ${wib()}`, chat)
    } else if (c === '/cari') {
      const q = args.join(' ').toLowerCase(); if (!q) { await tg('Format: <code>/cari email</code>', chat); return ok }
      const users = Object.entries((await rget('users')) || {}).filter(([, u]) => ((u.email || '') + (u.name || '')).toLowerCase().includes(q)).slice(0, 3)
      if (!users.length) await tg('🔎 Pengguna tidak ditemukan.', chat)
      for (const [, u] of users) await tg(`👤 <b>${e(u.name)}</b>\n${LN}\n✉️ <code>${e(u.email)}</code>\n📱 ${e(u.wa || '-')}\n👛 Saldo  <b>${rpf(u.saldo)}</b>\n🛒 Pembelian  <b>${u.pembelian || 0}</b>\n🏷 Role  <b>${e(u.role || 'user')}</b>${u.blocked ? '\n🚫 <b>DIBLOKIR</b>' : ''}${u.saldoFrozen ? '\n🧊 <b>Saldo dibekukan</b>' : ''}`, chat)
    } else await tg('Perintah tidak dikenal. Kirim /help.', chat)
  } catch (x) { await tg('❌ Error: ' + e(x.message), chat) }
  return ok
}
