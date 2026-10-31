import { adb, uidFrom } from '@/lib/admin'
import { createQris } from '@/lib/qris'
export async function POST(req) {
  try {
    const uid = await uidFrom(req)
    const { amount } = await req.json()
    if (!(amount >= 5000)) return Response.json({ error: 'Minimal deposit Rp 5.000' }, { status: 400 })
    const ref = adb.collection('deposits').doc()
    const q = await createQris(ref.id, amount)
    await ref.set({ uid, amount, status: 'pending', qr: q.qr, createdAt: Date.now() })
    return Response.json({ id: ref.id, qr: q.qr })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
