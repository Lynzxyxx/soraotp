import { uidFrom, rget, rupd } from '@/lib/admin'
import { refund } from '@/lib/credit'
import { status, cancel } from '@/lib/provider'
// GET = cek status (polling), DELETE = batalkan + refund
export async function GET(req, { params }) {
  try {
    const uid = await uidFrom(req)
    const o = await rget('orders/' + params.id)
    if (!o || o.uid !== uid) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    if (o.status === 'waiting') {
      let s = { state: 'waiting' }
      try { s = await status(o.providerId) } catch {}   // hasil utama datang via webhook
      if (s.state === 'success') await rupd('orders/' + params.id, { status: 'success', code: s.code || null })
      if (s.state === 'canceled') { await rupd('orders/' + params.id, { status: 'canceled' }); await refund(params.id, o) }
    }
    return Response.json({ order: await rget('orders/' + params.id) })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
export async function DELETE(req, { params }) {
  try {
    const uid = await uidFrom(req)
    const o = await rget('orders/' + params.id)
    if (!o || o.uid !== uid || o.status !== 'waiting') return Response.json({ error: 'Tidak bisa dibatalkan' }, { status: 400 })
    await cancel(o.providerId); await rupd('orders/' + params.id, { status: 'canceled' }); await refund(params.id, o)
    return Response.json({ ok: true })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
