import { adb, uidFrom } from '@/lib/admin'
import { status, cancel } from '@/lib/provider'
import { FieldValue } from 'firebase-admin/firestore'
async function refund(ref, o) {
  await adb.runTransaction(async t => {
    const d = (await t.get(ref)).data()
    if (d.refunded) return
    t.update(ref, { refunded: true })
    t.update(adb.doc('users/' + d.uid), { saldo: FieldValue.increment(d.price) })
  })
}
// GET = cek status (polling), DELETE = batalkan + refund
export async function GET(req, { params }) {
  try {
    const uid = await uidFrom(req)
    const ref = adb.doc('orders/' + params.id); const o = (await ref.get()).data()
    if (!o || o.uid !== uid) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    if (o.status === 'waiting') {
      const s = await status(o.providerId)
      if (s.state === 'success') await ref.update({ status: 'success', code: s.code })
      if (s.state === 'canceled') { await ref.update({ status: 'canceled' }); await refund(ref, o) }
    }
    return Response.json({ order: (await ref.get()).data() })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
export async function DELETE(req, { params }) {
  try {
    const uid = await uidFrom(req)
    const ref = adb.doc('orders/' + params.id); const o = (await ref.get()).data()
    if (!o || o.uid !== uid || o.status !== 'waiting') return Response.json({ error: 'Tidak bisa dibatalkan' }, { status: 400 })
    await cancel(o.providerId); await ref.update({ status: 'canceled' }); await refund(ref, o)
    return Response.json({ ok: true })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
