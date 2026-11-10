import { ownerFrom, rget, rpush } from '@/lib/admin'
import { finishOrder } from '@/lib/credit'
import { cancel } from '@/lib/provider'
// Admin: isi OTP manual (setelah membaca dari dashboard NusaOTP) atau batalkan + refund pesanan yang masih menunggu
export async function POST(req) {
  try {
    const admin = await ownerFrom(req), { id, action, code } = await req.json()
    const o = await rget('orders/' + id)
    if (!o) throw new Error('Pesanan tidak ditemukan')
    if (o.status !== 'waiting') throw new Error('Pesanan sudah bukan status menunggu')
    if (action === 'otp') { const c = String(code || '').trim(); if (!/^[\w-]{3,12}$/.test(c)) throw new Error('Kode OTP tidak valid'); await finishOrder(id, o, 'success', c) }
    else if (action === 'cancel') { try { await cancel(o.providerId) } catch {} ; await finishOrder(id, o, 'canceled') }
    else throw new Error('Aksi tidak dikenal')
    await rpush('adminLogs', { admin, action: 'order-' + action, value: String(id), at: Date.now() })
    return Response.json({ ok: true })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
