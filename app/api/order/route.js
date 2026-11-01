import { userFrom, rtx, rupd, rset, rkey, inc } from '@/lib/admin'
import { services, order } from '@/lib/provider'
export async function POST(req) {
  try {
    const me = await userFrom(req); const uid = me.uid
    const { serviceId } = await req.json()
    const svc = (await services(me.role)).find(s => s.id === String(serviceId))
    if (!svc) return Response.json({ error: 'Layanan tidak ditemukan' }, { status: 404 })
    let why = ''
    const r = await rtx('users/' + uid, u => {
      if (u === null) return u
      if (u.saldoFrozen) { why = 'Saldo dibekukan admin'; return }
      if ((u.saldo || 0) < svc.price) { why = 'Saldo tidak cukup'; return }
      u.saldo = u.saldo - svc.price; u.pembelian = (u.pembelian || 0) + 1
      return u
    })
    if (!r.committed || !r.snapshot.val()) throw new Error(why || 'Gagal memproses saldo')
    try {
      const o = await order(svc.id), id = rkey('orders')
      await rset('orders/' + id, { uid, service: svc.name, price: svc.price, providerId: o.orderId, number: o.number, status: 'waiting', code: null, refunded: false, createdAt: Date.now() })
      return Response.json({ id })
    } catch (e) {
      await rupd('users/' + uid, { saldo: inc(svc.price), pembelian: inc(-1) })
      return Response.json({ error: e.message }, { status: 502 })
    }
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
