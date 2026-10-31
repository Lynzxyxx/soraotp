import { uidFrom } from '@/lib/admin'
import { settle } from '@/lib/credit'
export async function GET(req, { params }) {
  try {
    const uid = await uidFrom(req); const d = await settle(params.id)
    if (!d || d.uid !== uid) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return Response.json({ status: d.status })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
