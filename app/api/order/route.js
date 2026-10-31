import { adb, userFrom } from '@/lib/admin'
import { services, order } from '@/lib/provider'
import { FieldValue } from 'firebase-admin/firestore'
export async function POST(req) {
  try {
    const me = await userFrom(req); const uid = me.uid
    const { serviceId } = await req.json()
    const svc = (await services(me.role)).find(s => s.id === String(serviceId))
    if (!svc) return Response.json({ error: 'Layanan tidak ditemukan' }, { status: 404 })
    const uref = adb.doc('users/' + uid)
    await adb.runTransaction(async t => {
      const u = await t.get(uref)
      if (u.data()?.saldoFrozen) throw new Error('Saldo dibekukan admin')
      if ((u.data()?.saldo || 0) < svc.price) throw new Error('Saldo tidak cukup')
      t.update(uref, { saldo: FieldValue.increment(-svc.price), pembelian: FieldValue.increment(1) })
    })
    try {
      const o = await order(svc.id)
      const ref = await adb.collection('orders').add({ uid, service: svc.name, price: svc.price,
        providerId: o.orderId, number: o.number, status: 'waiting', code: null, refunded: false, createdAt: Date.now() })
      return Response.json({ id: ref.id })
    } catch (e) {
      await uref.update({ saldo: FieldValue.increment(svc.price), pembelian: FieldValue.increment(-1) })
      return Response.json({ error: e.message }, { status: 502 })
    }
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
