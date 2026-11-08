import { ownerFrom, rpush } from '@/lib/admin'
import { creditDeposit } from '@/lib/credit'
// Admin menandai deposit pending sebagai lunas (setelah memeriksa dashboard buatqris) dan mengkredit saldo sekali
export async function POST(req) {
  try {
    const admin = await ownerFrom(req), { id } = await req.json()
    const ok = await creditDeposit(String(id), 'manual')
    if (!ok) throw new Error('Deposit tidak ditemukan atau sudah bukan pending')
    await rpush('adminLogs', { admin, action: 'credit-deposit', value: String(id), at: Date.now() })
    return Response.json({ ok: true })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
