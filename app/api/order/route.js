import { userFrom, rtx, rupd, rset, rkey, inc } from '@/lib/admin'
import { products, order } from '@/lib/provider'
import { notifyOrderNew } from '@/lib/credit'
import { getSettings, marginFor } from '@/lib/settings'
export async function POST(req) {
  try {
    const me = await userFrom(req), uid = me.uid
    const { country, service, product, label, app, countryName, serverName } = await req.json()
    const p = (await products(country, service, marginFor(await getSettings(), me.role))).find(x => x.id === String(product))
    if (!p) return Response.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    let why = ''
    const r = await rtx('users/' + uid, u => {
      if (u === null) return u
      if (u.saldoFrozen) { why = 'Saldo dibekukan admin'; return }
      if ((u.saldo || 0) < p.price) { why = 'Saldo tidak cukup'; return }
      u.saldo = u.saldo - p.price; u.pembelian = (u.pembelian || 0) + 1
      return u
    })
    if (!r.committed || !r.snapshot.val()) throw new Error(why || 'Gagal memproses saldo')
    try {
      const o = await order(country, service, product), id = rkey('orders')
      const doc = { uid, service: String(label || p.name).slice(0, 80), app: String(app || '').slice(0, 60), countryName: String(countryName || '').slice(0, 60), serverName: String(serverName || p.name).slice(0, 60),
        price: p.price, cost: p.cost, providerId: o.orderId, number: o.number || null, status: 'waiting', code: null, refunded: false, createdAt: Date.now() }
      await rset('orders/' + id, doc)
      await notifyOrderNew(doc)
      return Response.json({ id })
    } catch (e) {
      await rupd('users/' + uid, { saldo: inc(p.price), pembelian: inc(-1) })
      return Response.json({ error: e.message }, { status: 502 })
    }
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
