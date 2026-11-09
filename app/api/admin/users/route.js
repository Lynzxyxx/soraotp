import { ownerFrom, rget } from '@/lib/admin'
import { userAction } from '@/lib/adminops'
const err = e => Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 })
export async function GET(req) {
  try {
    await ownerFrom(req)
    const q = (new URL(req.url).searchParams.get('q') || '').toLowerCase()
    const all = (await rget('users')) || {}
    const l = Object.entries(all).map(([uid, u]) => ({ uid, ...u })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .filter(u => !q || ((u.email || '') + (u.name || '') + (u.wa || '')).toLowerCase().includes(q))
    return Response.json({ users: l.slice(0, 50) })
  } catch (e) { return err(e) }
}
// POST {uid, action, value}
export async function POST(req) {
  try {
    const admin = await ownerFrom(req), { uid, action, value } = await req.json()
    await userAction(admin, uid, action, value)
    return Response.json({ ok: true })
  } catch (e) { return err(e) }
}
