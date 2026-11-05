import { rfind, rupd } from '@/lib/admin'
import { refund } from '@/lib/credit'
const pick = (o, ...k) => { for (const x of k) if (o?.[x] != null) return o[x] }
// Didaftarkan lewat /v2/set-webhook: https://DOMAIN/api/webhook/nusa?key=NUSA_WEBHOOK_SECRET
export async function POST(req) {
  if (!process.env.NUSA_WEBHOOK_SECRET || new URL(req.url).searchParams.get('key') !== process.env.NUSA_WEBHOOK_SECRET)
    return Response.json({ error: 'forbidden' }, { status: 403 })
  const b = await req.json().catch(() => ({})), d = b.data || b
  const pid = pick(d, 'order_id', 'id'); if (!pid) return Response.json({ ok: true })
  const found = await rfind('orders', 'providerId', String(pid))
  const [id, o] = Object.entries(found)[0] || []
  if (!o || o.status !== 'waiting') return Response.json({ ok: true })
  const code = pick(d, 'otp', 'code', 'sms'), st = String(pick(d, 'status') || '').toLowerCase()
  if (code || st === 'success') await rupd('orders/' + id, { status: 'success', code: code ? String(code) : null })
  else if (['canceled', 'cancel', 'expired'].includes(st)) { await rupd('orders/' + id, { status: 'canceled' }); await refund(id, o) }
  return Response.json({ ok: true })
}
