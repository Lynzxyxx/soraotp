import { aauth, ownerFrom, rget, rupd, rpush, inc } from '@/lib/admin'
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
    const admin = await ownerFrom(req)
    const { uid, action, value } = await req.json()
    const p = 'users/' + uid
    if (!(await rget(p))) throw new Error('User tidak ditemukan')
    const n = Number(value)
    if (action === 'addSaldo') await rupd(p, { saldo: inc(n) })        // negatif = kurangi
    else if (action === 'setSaldo') await rupd(p, { saldo: n })
    else if (action === 'freeze') await rupd(p, { saldoFrozen: !!value })   // banned saldo
    else if (action === 'block') { await rupd(p, { blocked: !!value }); await aauth.updateUser(uid, { disabled: !!value }); if (value) await aauth.revokeRefreshTokens(uid) }
    else if (action === 'password') { if (String(value).length < 6) throw new Error('Password minimal 6 karakter'); await aauth.updateUser(uid, { password: String(value) }); await aauth.revokeRefreshTokens(uid) }
    else if (action === 'role') { if (!['user', 'reseller', 'owner'].includes(value)) throw new Error('Role tidak valid'); await rupd(p, { role: value }) }
    else throw new Error('Aksi tidak dikenal')
    await rpush('adminLogs', { admin, uid, action, value: action === 'password' ? '***' : value ?? null, at: Date.now() })
    return Response.json({ ok: true })
  } catch (e) { return err(e) }
}
