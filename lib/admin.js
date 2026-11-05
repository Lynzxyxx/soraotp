import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase, ServerValue } from 'firebase-admin/database'
// Init malas: baru jalan saat request, supaya build Vercel tidak gagal
function app() {
  if (getApps()[0]) return getApps()[0]
  const key = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/^"|"$/g, '').replace(/\\n/g, '\n')
  return initializeApp({
    credential: cert({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: key }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  })
}
const D = () => getDatabase(app())
export const aauth = new Proxy({}, { get: (_, k) => { const o = getAuth(app()); const v = o[k]; return typeof v === 'function' ? v.bind(o) : v } })
export const rget = async p => (await D().ref(p).get()).val()
export const rset = (p, v) => D().ref(p).set(v)
export const rupd = (p, v) => D().ref(p).update(v)
export const rkey = p => D().ref(p).push().key
export const rpush = async (p, v) => { const r = D().ref(p).push(); await r.set(v); return r.key }
export const rtx = (p, fn) => D().ref(p).transaction(fn)
export const inc = n => ServerValue.increment(n)
async function verify(req) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '')
  return aauth.verifyIdToken(t)
}
export async function uidFrom(req) {
  const { uid } = await verify(req)
  const u = await rget('users/' + uid)
  if (!u) throw new Error('Akun tidak ditemukan')
  if (u.blocked) throw new Error('Akun diblokir')
  return uid
}
export async function userFrom(req) {
  const uid = await uidFrom(req)
  return { uid, ...(await rget('users/' + uid)) }
}
export async function ownerFrom(req) {
  const d = await verify(req)
  const mail = (process.env.OWNER_EMAIL || '').toLowerCase().trim()
  const isMail = !!mail && (d.email || '').toLowerCase() === mail
  const u = await rget('users/' + d.uid)
  if (!u && isMail) { // akun owner belum punya profil -> buat otomatis
    await rset('users/' + d.uid, { name: mail.split('@')[0], email: d.email, wa: '', saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now(), role: 'owner' })
    return d.uid
  }
  if (!u) throw new Error('forbidden')
  if (u.role !== 'owner') { if (isMail) await rupd('users/' + d.uid, { role: 'owner' }); else throw new Error('forbidden') }
  return d.uid
}
export async function rfind(p, child, value) {
  return (await D().ref(p).orderByChild(child).equalTo(value).get()).val() || {}
}
