import { rfind } from '@/lib/admin'
import { finishOrder } from '@/lib/credit'
const pick = (o, ...k) => { for (const x of k) if (o?.[x] != null) return o[x] }
// Didaftarkan lewat /v2/set-webhook: https://DOMAIN/api/webhook/nusa?key=NUSA_WEBHOOK_SECRET
export async function POST(req) {
  if (!process.env.NUSA_WEBHOOK_SECRET || new URL(req.url).searchParams.get('key') !== process.env.NUSA_WEBHOOK_SECRET)
    return Response.json({ error: 'forbidden' }, { status: 403 })
  const b = await req.json().catch(() => ({})), d = b.data || b
  const pid = pick(d, 'order_id', 'id'); if (!pid) return Response.json({ ok: true })
  const [id, o] = Object.entries(await rfind('orders', 'providerId', String(pid)))[0] || []
  if (!o || o.status !== 'waiting') return Response.json({ ok: true })
  const code = pick(d, 'otp', 'code', 'sms'), st = String(pick(d, 'status') || '').toLowerCase()
  if (code || st === 'success') await finishOrder(id, o, 'success', code)
  else if (['canceled', 'cancel', 'expired'].includes(st)) await finishOrder(id, o, 'canceled')
  return Response.json({ ok: true })
}
