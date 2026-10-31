import { adb, aauth, ownerFrom, FieldValue } from '@/lib/admin'
const err = e => Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 })
export async function GET(req) {
  try {
    await ownerFrom(req)
    const q = (new URL(req.url).searchParams.get('q') || '').toLowerCase()
    const s = await adb.collection('users').orderBy('createdAt', 'desc').limit(300).get()
    const l = s.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => !q || (u.email + u.name + u.wa).toLowerCase().includes(q))
    return Response.json({ users: l.slice(0, 50) })
  } catch (e) { return err(e) }
}
// POST {uid, action, value}
export async function POST(req) {
  try {
    const admin = await ownerFrom(req)
    const { uid, action, value } = await req.json()
    const ref = adb.doc('users/' + uid)
    if (!(await ref.get()).exists) throw new Error('User tidak ditemukan')
    const n = Number(value)
    if (action === 'addSaldo') await ref.update({ saldo: FieldValue.increment(n) })        // negatif = kurangi
    else if (action === 'setSaldo') await ref.update({ saldo: n })
    else if (action === 'freeze') await ref.update({ saldoFrozen: !!value })               // banned saldo
    else if (action === 'block') { await ref.update({ blocked: !!value }); await aauth.updateUser(uid, { disabled: !!value }); if (value) await aauth.revokeRefreshTokens(uid) }
    else if (action === 'password') { if (String(value).length < 6) throw new Error('Password minimal 6 karakter'); await aauth.updateUser(uid, { password: String(value) }); await aauth.revokeRefreshTokens(uid) }
    else if (action === 'role') { if (!['user', 'reseller', 'owner'].includes(value)) throw new Error('Role tidak valid'); await ref.update({ role: value }) }
    else throw new Error('Aksi tidak dikenal')
    await adb.collection('adminLogs').add({ admin, uid, action, value: action === 'password' ? '***' : value ?? null, at: Date.now() })
    return Response.json({ ok: true })
  } catch (e) { return err(e) }
}
