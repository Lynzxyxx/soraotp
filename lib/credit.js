import { adb, FieldValue } from '@/lib/admin'
import { isPaid } from '@/lib/qris'
// Idempoten: hanya kredit sekali, dan hanya jika provider benar-benar bilang lunas
export async function settle(id) {
  const ref = adb.doc('deposits/' + id); const d = (await ref.get()).data()
  if (!d) return null
  if (d.status === 'pending' && await isPaid(id)) {
    await adb.runTransaction(async t => {
      const c = (await t.get(ref)).data()
      if (c.status !== 'pending') return
      t.update(ref, { status: 'success' })
      t.update(adb.doc('users/' + c.uid), { saldo: FieldValue.increment(c.amount), deposit: FieldValue.increment(c.amount) })
    })
  }
  return (await ref.get()).data()
}
