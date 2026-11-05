import { rget, rupd, rtx, inc } from '@/lib/admin'
import { isPaid } from '@/lib/qris'
// Idempoten: kredit sekali saja, hanya jika provider bilang lunas
export async function settle(id) {
  const d = await rget('deposits/' + id)
  if (!d) return null
  if (d.status === 'pending' && await isPaid(id)) {
    const r = await rtx('deposits/' + id + '/status', s => (s === 'pending' ? 'processing' : undefined))
    if (r.committed) {
      await rupd('users/' + d.uid, { saldo: inc(d.amount), deposit: inc(d.amount) })
      await rupd('deposits/' + id, { status: 'success' })
    }
  }
  return rget('deposits/' + id)
}
// Refund order tepat sekali
export async function refund(id, o) {
  const r = await rtx('orders/' + id + '/refunded', v => (v ? undefined : true))
  if (r.committed) await rupd('users/' + o.uid, { saldo: inc(o.price) })
}
