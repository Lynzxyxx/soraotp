import { rget, rupd, rtx, inc } from '@/lib/admin'
import { isPaid } from '@/lib/qris'
import { nOrderNew, nDepositNew, nDepositOk, nOrderOk, nOrderCancel } from '@/lib/notify'
export const notifyOrderNew = nOrderNew
export const notifyDeposit = nDepositNew
// Kredit saldo untuk deposit 'pending' tepat sekali (aman dari balapan webhook vs polling vs admin)
export async function creditDeposit(id, how = 'auto') {
  const d = await rget('deposits/' + id)
  if (!d) return false
  const r = await rtx('deposits/' + id + '/status', s => (s === 'pending' ? 'processing' : undefined))
  if (!r.committed) return false
  await rupd('users/' + d.uid, { saldo: inc(d.amount), deposit: inc(d.amount) })
  await rupd('deposits/' + id, { status: 'success', paidBy: how })
  await nDepositOk(d, id, how)
  return true
}
// Cek ke buatqris (pakai transaction_id dari provider), kredit bila lunas.
// BuatQRIS membatasi frekuensi cek status, jadi dibatasi 1x per 15 detik per deposit (webhook boleh memaksa).
export async function settle(id, { force = false } = {}) {
  const d = await rget('deposits/' + id)
  if (!d) return null
  if (d.status === 'pending') {
    const claim = force || (await rtx('deposits/' + id + '/lastCheck', v => (!v || Date.now() - v > 15000 ? Date.now() : undefined))).committed
    if (claim) {
      let paid = false
      try { paid = await isPaid(d.trxId || id) }
      catch (e) {
        if (!/terlalu sering/i.test(e.message)) throw e
        const m = /dalam (\d+) detik/i.exec(e.message)
        if (force && m && Number(m[1]) <= 8) {
          await new Promise(r => setTimeout(r, (Number(m[1]) + 1) * 1000))
          paid = await isPaid(d.trxId || id).catch(() => false)
        }
      }
      if (paid) await creditDeposit(id)
    }
  }
  return rget('deposits/' + id)
}
// Refund order tepat sekali
export async function refund(id, o) {
  const r = await rtx('orders/' + id + '/refunded', v => (v ? undefined : true))
  if (r.committed) await rupd('users/' + o.uid, { saldo: inc(o.price) })
}
// Ubah status order dari 'waiting' tepat sekali (aman dari balapan webhook vs polling) + kirim notifikasi
export async function finishOrder(id, o, state, code) {
  const r = await rtx('orders/' + id + '/status', s => (s === 'waiting' ? state : undefined))
  if (!r.committed) return false
  if (state === 'success') { await rupd('orders/' + id, { code: code ? String(code) : null }); await nOrderOk(o) }
  else { await refund(id, o); await nOrderCancel(o) }
  return true
}
