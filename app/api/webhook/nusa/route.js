import { rfind, rset } from '@/lib/admin'
import { finishOrder } from '@/lib/credit'
import { parseOrderPayload } from '@/lib/provider'
// Didaftarkan lewat /v2/set-webhook: https://DOMAIN/api/webhook/nusa?key=NUSA_WEBHOOK_SECRET
async function bodyOf(req) {
  const t = await req.text()
  try { return JSON.parse(t) } catch {}
  try { const o = Object.fromEntries(new URLSearchParams(t)); if (Object.keys(o).length) return o } catch {}
  return {}
}
async function handle(req, b) {
  const url = new URL(req.url)
  if (!process.env.NUSA_WEBHOOK_SECRET || url.searchParams.get('key') !== process.env.NUSA_WEBHOOK_SECRET) {
    await rset('debug/lastWebhookRejected', { at: Date.now() }).catch(() => {})
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }
  const data = Object.keys(b || {}).length ? b : Object.fromEntries([...url.searchParams].filter(([k]) => k !== 'key'))
  await rset('debug/lastWebhook', { at: Date.now(), body: JSON.stringify(data).slice(0, 1500) }).catch(() => {})
  const p = parseOrderPayload(data); if (!p.id) return Response.json({ ok: true })
  const [id, o] = Object.entries(await rfind('orders', 'providerId', p.id))[0] || []
  if (o && o.status === 'waiting' && p.state !== 'waiting') await finishOrder(id, o, p.state, p.code)
  return Response.json({ ok: true })
}
export const POST = async req => handle(req, await bodyOf(req))
export const GET = async req => handle(req, {})
