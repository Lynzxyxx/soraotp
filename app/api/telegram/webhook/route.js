import { tgSecret } from '@/lib/telegram'
import { handleUpdate } from '@/lib/bot'
export const maxDuration = 30
// Webhook bot Telegram. Didaftarkan lewat admin panel > Rekap & Bot > Aktifkan perintah bot.
export async function POST(req) {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== tgSecret()) return Response.json({ error: 'forbidden' }, { status: 403 })
  const up = await req.json().catch(() => null)
  if (up) { try { await handleUpdate(up, new URL(req.url).origin) } catch (x) { console.error('bot error', x) } }
  return Response.json({ ok: true })
}
