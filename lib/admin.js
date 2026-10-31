import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
const app = getApps()[0] || initializeApp({ credential: cert({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
}) })
export const adb = getFirestore(app)
export const aauth = getAuth(app)
async function verify(req) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '')
  return aauth.verifyIdToken(t)
}
// user biasa: ditolak jika diblokir
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
// khusus owner
export async function ownerFrom(req) {
  const d = await verify(req)
  const ref = adb.doc('users/' + d.uid); const u = (await ref.get()).data()
  if (!u) throw new Error('forbidden')
  if (u.role !== 'owner' && process.env.OWNER_EMAIL && d.email === process.env.OWNER_EMAIL) { await ref.update({ role: 'owner' }) }
  else if (u.role !== 'owner') throw new Error('forbidden')
  return d.uid
}
export { FieldValue }
