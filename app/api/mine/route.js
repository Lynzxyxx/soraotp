import { uidFrom, rfind } from '@/lib/admin'
// Daftar order/deposit milik user lewat server (cadangan bila aturan database klien belum dipublish)
export async function GET(req) {
  try {
    const uid = await uidFrom(req)
    const path = new URL(req.url).searchParams.get('path')
    if (!['orders', 'deposits'].includes(path)) throw new Error('path tidak valid')
    const all = await rfind(path, 'uid', uid)
    const data = Object.entries(all).map(([id, v]) => ({ id, ...v })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return Response.json({ data })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
