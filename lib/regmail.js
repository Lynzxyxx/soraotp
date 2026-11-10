// Pendaftaran email dengan verifikasi kode 6 digit (anti akun palsu).
// Akun dibuat NONAKTIF dulu; baru aktif + profil dibuat setelah kode dari email benar.
import { createHash, randomInt, randomBytes } from 'crypto'
import { aauth, rget, rset, rupd, rtx } from '@/lib/admin'
import { sendMail, otpMail, mailHint } from '@/lib/mailer'
import { nRegister } from '@/lib/notify'
import { tg, e } from '@/lib/telegram'
const TTL = 10 * 60 * 1000, COOLDOWN = 60 * 1000, MAXTRY = 5, MAXSEND = 5
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const hash = (v, uid) => createHash('sha256').update(`${v}:${uid}:${process.env.FIREBASE_CLIENT_EMAIL || ''}`).digest('hex')
export const hashKey = s => createHash('sha256').update(String(s)).digest('hex').slice(0, 16)
async function limited(key, max, win) {
  let hit = false
  await rtx('rl/' + key, v => { const now = Date.now(); if (!v || now - v.t > win) return { n: 1, t: now }; if (v.n >= max) { hit = true; return } return { n: v.n + 1, t: v.t } })
  return hit
}
async function issue(uid, email, name, patch, full) {
  const code = String(randomInt(100000, 1000000)), m = otpMail(code, name)
  const rec = { code: hash(code, uid), exp: Date.now() + TTL, tries: 0, sent: Date.now(), ...patch }
  await (full ? rset : rupd)('pendingReg/' + uid, rec)
  try { await sendMail({ to: email, ...m }) }
  catch (x) {
    await tg(`⚠️ <b>Email OTP gagal terkirim</b>\n<code>${e(email)}</code>\n${e(x.message)}${mailHint(x.message) ? '\n💡 ' + e(mailHint(x.message)) : ''}`)
    throw new Error('Gagal mengirim email verifikasi. Coba lagi beberapa saat.')
  }
}
export async function startRegistration({ name, email, wa, password, rl }) {
  email = String(email || '').trim().toLowerCase(); name = String(name || '').trim().slice(0, 60); wa = String(wa || '').trim().slice(0, 20)
  if (name.length < 2) throw new Error('Nama terlalu pendek')
  if (!EMAIL.test(email)) throw new Error('Format email tidak valid')
  if (String(password || '').length < 6) throw new Error('Password minimal 6 karakter')
  if (rl && await limited(rl, 10, 3600000)) throw new Error('Terlalu banyak percobaan. Coba lagi dalam satu jam.')
  let user = null; try { user = await aauth.getUserByEmail(email) } catch {}
  if (user && (await rget('users/' + user.uid))) throw new Error('Email ini sudah terdaftar dan tidak bisa didaftarkan lagi. Silakan masuk.')
  const prev = user && await rget('pendingReg/' + user.uid)
  if (prev && Date.now() - (prev.sent || 0) < COOLDOWN) throw new Error(`Tunggu ${Math.ceil((COOLDOWN - (Date.now() - prev.sent)) / 1000)} detik sebelum meminta kode lagi.`)
  if (user) await aauth.updateUser(user.uid, { password, displayName: name, disabled: true })
  else user = await aauth.createUser({ email, password, displayName: name, disabled: true, emailVerified: false })
  const token = randomBytes(16).toString('hex') // mengikat kode ke perangkat yang memulai pendaftaran
  await issue(user.uid, email, name, { name, wa, email, tok: hash(token, user.uid), sends: 1 }, true)
  return { token }
}
export async function resendCode({ email, token }) {
  email = String(email || '').trim().toLowerCase()
  let user; try { user = await aauth.getUserByEmail(email) } catch { throw new Error('Pendaftaran tidak ditemukan. Mulai lagi.') }
  const p = await rget('pendingReg/' + user.uid)
  if (!p || p.tok !== hash(token || '', user.uid)) throw new Error('Pendaftaran tidak ditemukan. Mulai lagi.')
  if (Date.now() - (p.sent || 0) < COOLDOWN) throw new Error(`Tunggu ${Math.ceil((COOLDOWN - (Date.now() - p.sent)) / 1000)} detik sebelum meminta kode lagi.`)
  if ((p.sends || 0) >= MAXSEND) throw new Error('Batas pengiriman kode tercapai. Mulai pendaftaran lagi nanti.')
  await issue(user.uid, email, p.name, { sends: (p.sends || 0) + 1 }, false)
  return { ok: true }
}
export async function verifyRegistration({ email, code, token }) {
  email = String(email || '').trim().toLowerCase()
  let user; try { user = await aauth.getUserByEmail(email) } catch { throw new Error('Kode salah atau kedaluwarsa. Minta kode baru.') }
  const p = await rget('pendingReg/' + user.uid)
  if (!p || p.exp < Date.now() || p.tok !== hash(token || '', user.uid)) throw new Error('Kode salah atau kedaluwarsa. Minta kode baru.')
  if ((p.tries || 0) >= MAXTRY) throw new Error('Terlalu banyak percobaan salah. Minta kode baru.')
  if (p.code !== hash(String(code || '').trim(), user.uid)) { await rupd('pendingReg/' + user.uid, { tries: (p.tries || 0) + 1 }); throw new Error('Kode salah.') }
  if (await rget('users/' + user.uid)) throw new Error('Email ini sudah terdaftar. Silakan masuk.')
  await aauth.updateUser(user.uid, { disabled: false, emailVerified: true })
  await rset('users/' + user.uid, { name: p.name, email, wa: p.wa || '', saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now(), regNotified: true })
  await rset('pendingReg/' + user.uid, null)
  await nRegister(user.uid)
  return { uid: user.uid }
}
