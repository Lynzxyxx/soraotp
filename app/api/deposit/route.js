import { rkey, rset, uidFrom } from '@/lib/admin'
import { createQris } from '@/lib/qris'
import { notifyDeposit } from '@/lib/credit'
export async function POST(req) {
  try {
    const uid = await uidFrom(req)
    const { amount } = await req.json()
    if (!(amount >= 5000)) return Response.json({ error: 'Minimal deposit Rp 5.000' }, { status: 400 })
    const id = rkey('deposits')
    const q = await createQris(id, amount, `${new URL(req.url).origin}/api/deposit/callback?id=${id}`)
    await rset('deposits/' + id, { uid, amount, status: 'pending', qr: q.qr || null, trxId: q.id || null, createdAt: Date.now() })
    await notifyDeposit(uid, amount)
    return Response.json({ id, qr: q.qr })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
