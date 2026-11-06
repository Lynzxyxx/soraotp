// Notifikasi ke bot Telegram. Env: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID (boleh beberapa ID, pisah koma)
export const e = s => String(s ?? '-').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
export const rpf = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
export async function tg(text) {
  const t = process.env.TELEGRAM_BOT_TOKEN, ids = (process.env.TELEGRAM_ADMIN_ID || '').split(',').map(s => s.trim()).filter(Boolean)
  if (!t || !ids.length) return { ok: false, error: 'TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_ID belum diisi' }
  let last = { ok: true }
  for (const chat_id of ids) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(4000),
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      })
      const j = await r.json().catch(() => ({}))
      if (!j.ok) last = { ok: false, error: j.description || 'HTTP ' + r.status }
    } catch (x) { last = { ok: false, error: x.message } }
  }
  return last // tidak pernah melempar error: notifikasi tidak boleh merusak transaksi
}
