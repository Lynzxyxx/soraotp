import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
const app = getApps()[0] || initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
})
export const auth = getAuth(app)
export const db = getFirestore(app)
export async function api(path, opts = {}) {
  const token = await auth.currentUser.getIdToken()
  const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'Terjadi kesalahan')
  return j
}
export const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
