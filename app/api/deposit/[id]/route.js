import { uidFrom, rget } from '@/lib/admin'
import { settle } from '@/lib/credit'
export async function GET(req, { params }) {
  try {
    const uid = await uidFrom(req)
    let warn = ''
    try { await settle(params.id) } catch (e) { warn = e.message } // cek ke buatqris; error tetap mengembalikan data
    const d = await rget('deposits/' + params.id)
    if (!d || d.uid !== uid) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return Response.json({ status: d.status, warn, deposit: { amount: d.amount, fee: d.fee || 0, pay: d.pay || d.amount, status: d.status, qr: d.qr || null, createdAt: d.createdAt } })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
