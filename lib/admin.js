import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
// Init malas: baru jalan saat request, supaya build Vercel tidak gagal
function app() {
  if (getApps()[0]) return getApps()[0]
  const key = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/^"|"$/g, '').replace(/\\n/g, '\n')
  return initializeApp({ credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: key,
  }) })
}
const lazy = get => new Proxy({}, { get: (_, k) => { const o = get(); const v = o[k]; return typeof v === 'function' ? v.bind(o) : v } })
export const adb = lazy(() => getFirestore(app()))
export const aauth = lazy(() => getAuth(app()))
async function verify(req) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '')
  return aauth.verifyIdToken(t)
}
export async function uidFrom(req) {
  const { uid } = await verify(req)
  const u = (await adb.doc('users/' + uid).get()).data()
  if (!u) throw new Error('Akun tidak ditemukan')
  if (u.blocked) throw new Error('Akun diblokir')
  return uid
}
export async function userFrom(req) {
  const uid = await uidFrom(req)
  return { uid, ...(await adb.doc('users/' + uid).get()).data() }
}
export async function ownerFrom(req) {
  const d = await verify(req)
  const ref = adb.doc('users/' + d.uid); const u = (await ref.get()).data()
  if (!u) throw new Error('forbidden')
  if (u.role !== 'owner' && process.env.OWNER_EMAIL && d.email === process.env.OWNER_EMAIL) await ref.update({ role: 'owner' })
  else if (u.role !== 'owner') throw new Error('forbidden')
  return d.uid
}
export { FieldValue }
