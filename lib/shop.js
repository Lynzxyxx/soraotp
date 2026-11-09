import { rget, rtx, rupd, rset, rkey, inc } from '@/lib/admin'
import { products, order, status, cancel } from '@/lib/provider'
import { getSettings, marginFor } from '@/lib/settings'
import { calcDeposit } from '@/lib/money'
import { createQris } from '@/lib/qris'
import { notifyOrderNew, notifyDeposit, finishOrder } from '@/lib/credit'
import { rpf } from '@/lib/telegram'
// Beli nomor: dipakai API web dan bot Telegram. me = { uid, role }
export async function placeOrder(me, { country, service, product, label, app, countryName, serverName }, extra = {}) {
  const st = await getSettings()
  const p = (await products(country, service, marginFor(st, me.role))).find(x => x.id === String(product))
  if (!p) throw new Error('Produk tidak ditemukan')
  let why = ''
  const r = await rtx('users/' + me.uid, u => {
    if (u === null) return u
    if (u.saldoFrozen) { why = 'Saldo dibekukan admin'; return }
    if ((u.saldo || 0) < p.price) { why = 'Saldo tidak cukup'; return }
    u.saldo = u.saldo - p.price; u.pembelian = (u.pembelian || 0) + 1
    return u
  })
  if (!r.committed || !r.snapshot.val()) throw new Error(why || 'Gagal memproses saldo')
  try {
    const o = await order(country, service, product), id = rkey('orders')
    const doc = { uid: me.uid, service: String(label || p.name).slice(0, 80), app: String(app || '').slice(0, 60), countryName: String(countryName || '').slice(0, 60), serverName: String(serverName || p.name).slice(0, 60),
      price: p.price, cost: p.cost, providerId: o.orderId, number: o.number || null, status: 'waiting', code: null, refunded: false, createdAt: Date.now(), ...extra }
    await rset('orders/' + id, doc)
    await notifyOrderNew(doc)
    return { id, doc }
  } catch (e) {
    await rupd('users/' + me.uid, { saldo: inc(p.price), pembelian: inc(-1) })
    throw e
  }
}
// Buat tagihan deposit QRIS
export async function makeDeposit(uid, amount, origin, extra = {}) {
  const st = await getSettings()
  if (!(amount >= st.minDeposit)) throw new Error('Minimal deposit ' + rpf(st.minDeposit))
  const { fee, total } = calcDeposit(amount, st), id = rkey('deposits')
  const q = await createQris(id, total, `${origin}/api/deposit/callback?id=${id}`)
  const pay = q.pay || total
  await rset('deposits/' + id, { uid, amount, fee, pay, status: 'pending', qr: q.qr || null, trxId: q.id || null, raw: q.raw || null, createdAt: Date.now(), ...extra })
  await notifyDeposit(uid, amount, pay)
  return { id, qr: q.qr, fee, pay }
}
// Cek status order ke provider (hasil utama datang via webhook)
export async function checkOrder(id, o) {
  let warn = ''
  if (o.status === 'waiting') {
    let s = { state: 'waiting' }
    try { s = await status(o.providerId) } catch (e) { warn = e.message }
    if (s.state === 'success') await finishOrder(id, o, 'success', s.code)
    if (s.state === 'canceled') await finishOrder(id, o, 'canceled')
  }
  return { order: await rget('orders/' + id), warn }
}
export async function cancelOrder(id, o) { await cancel(o.providerId); return finishOrder(id, o, 'canceled') }
