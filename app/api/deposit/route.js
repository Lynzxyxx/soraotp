import { rkey, rset, uidFrom } from '@/lib/admin'
import { createQris } from '@/lib/qris'
import { notifyDeposit } from '@/lib/credit'
import { getSettings } from '@/lib/settings'
import { calcDeposit } from '@/lib/money'
export async function POST(req) {
  try {
    const uid = await uidFrom(req)
    const { amount } = await req.json(), st = await getSettings()
    if (!(amount >= st.minDeposit)) return Response.json({ error: 'Minimal deposit Rp ' + st.minDeposit.toLocaleString('id-ID') }, { status: 400 })
    const { fee, total } = calcDeposit(amount, st), id = rkey('deposits')
    const q = await createQris(id, total, `${new URL(req.url).origin}/api/deposit/callback?id=${id}`)
    const pay = q.pay || total
    await rset('deposits/' + id, { uid, amount, fee, pay, status: 'pending', qr: q.qr || null, trxId: q.id || null, raw: q.raw || null, createdAt: Date.now() })
    await notifyDeposit(uid, amount, pay)
    return Response.json({ id, qr: q.qr, fee, pay })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
