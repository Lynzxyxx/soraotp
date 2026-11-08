// Transport Telegram. Env: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID (boleh beberapa ID, pisah koma)
import { createHash } from 'crypto'
export const e = s => String(s ?? '-').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
export const rpf = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const ids = () => (process.env.TELEGRAM_ADMIN_ID || '').split(',').map(s => s.trim()).filter(Boolean)
export const isAdminChat = id => ids().includes(String(id))
export const tgSecret = () => createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN || '').digest('hex').slice(0, 32)
const NOCONF = { ok: false, error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_ID belum diisi' }
export async function tg(text, to) {
  const t = process.env.TELEGRAM_BOT_TOKEN, list = to ? [to] : ids()
  if (!t || !list.length) return NOCONF
  let last = { ok: true }
  for (const chat_id of list) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000),
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!j.ok) last = { ok: false, error: j.description || 'HTTP ' + r.status }
    } catch (x) { last = { ok: false, error: x.message } }
  }
  return last // tidak pernah melempar error: notifikasi tidak boleh merusak transaksi
}
export async function tgPhoto(buf, caption = '', to) {
  const t = process.env.TELEGRAM_BOT_TOKEN, list = to ? [to] : ids()
  if (!t || !list.length) return NOCONF
  let last = { ok: true }
  for (const chat_id of list) {
    try {
      const fd = new FormData()
      fd.append('chat_id', String(chat_id)); fd.append('caption', caption.slice(0, 1000)); fd.append('parse_mode', 'HTML')
      fd.append('photo', new Blob([buf], { type: 'image/png' }), 'rekap.png')
      const r = await fetch(`https://api.telegram.org/bot${t}/sendPhoto`, { method: 'POST', body: fd, signal: AbortSignal.timeout(15000) })
      const j = await r.json().catch(() => ({}))
      if (!j.ok) last = { ok: false, error: j.description || 'HTTP ' + r.status }
    } catch (x) { last = { ok: false, error: x.message } }
  }
  return last
}
