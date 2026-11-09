import { aauth, rget, rupd, rpush, inc } from '@/lib/admin'
import { nAdmin } from '@/lib/notify'
// Aksi admin atas pengguna: dipakai admin panel web dan bot Telegram
export async function userAction(admin, uid, action, value) {
  const p = 'users/' + uid
  if (!(await rget(p))) throw new Error('User tidak ditemukan')
  const n = Number(value)
  if (action === 'addSaldo') { if (!Number.isFinite(n)) throw new Error('Nominal tidak valid'); await rupd(p, { saldo: inc(n) }) }
  else if (action === 'setSaldo') { if (!Number.isFinite(n) || n < 0) throw new Error('Nominal tidak valid'); await rupd(p, { saldo: n }) }
  else if (action === 'freeze') await rupd(p, { saldoFrozen: !!value })
  else if (action === 'block') { await rupd(p, { blocked: !!value }); await aauth.updateUser(uid, { disabled: !!value }); if (value) await aauth.revokeRefreshTokens(uid) }
  else if (action === 'password') { if (String(value).length < 6) throw new Error('Password minimal 6 karakter'); await aauth.updateUser(uid, { password: String(value) }); await aauth.revokeRefreshTokens(uid) }
  else if (action === 'role') { if (!['user', 'reseller', 'owner'].includes(value)) throw new Error('Role tidak valid'); await rupd(p, { role: value }) }
  else throw new Error('Aksi tidak dikenal')
  await rpush('adminLogs', { admin, uid, action, value: action === 'password' ? '***' : value ?? null, at: Date.now() })
  await nAdmin(admin, action, uid, value)
}
