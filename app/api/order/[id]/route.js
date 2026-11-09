import { uidFrom, rget } from '@/lib/admin'
import { checkOrder, cancelOrder } from '@/lib/shop'
// GET = cek status (polling/refresh), DELETE = batalkan + refund
export async function GET(req, { params }) {
  try {
    const uid = await uidFrom(req), o = await rget('orders/' + params.id)
    if (!o || o.uid !== uid) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return Response.json(await checkOrder(params.id, o))
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
export async function DELETE(req, { params }) {
  try {
    const uid = await uidFrom(req), o = await rget('orders/' + params.id)
    if (!o || o.uid !== uid || o.status !== 'waiting') return Response.json({ error: 'Tidak bisa dibatalkan' }, { status: 400 })
    await cancelOrder(params.id, o)
    return Response.json({ ok: true })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
