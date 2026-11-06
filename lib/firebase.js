import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase, ref, query, orderByChild, equalTo, onValue } from 'firebase/database'
const app = getApps()[0] || initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
})
export const auth = getAuth(app)
export const db = getDatabase(app)
// pantau data milik user (orders/deposits), terbaru di atas
export function watchMine(path, uid, cb, onErr) {
  return onValue(query(ref(db, path), orderByChild('uid'), equalTo(uid)), s => {
    const l = []; s.forEach(c => { l.push({ id: c.key, ...c.val() }) })
    cb(l.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
  }, e => onErr && onErr(e.message))
}
export async function api(path, opts = {}) {
  const token = await auth.currentUser.getIdToken()
  const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } })
  const t = await r.text(); let j = {}
  try { j = JSON.parse(t) } catch { throw new Error(`Server error ${r.status}`) }
  if (!r.ok) throw new Error(j.error || 'Terjadi kesalahan')
  return j
}
export const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
export const ago = t => { const s = Math.max(0, Math.floor((Date.now() - t) / 1000)); return s < 60 ? s + ' dtk lalu' : s < 3600 ? Math.floor(s / 60) + ' mnt lalu' : new Date(t).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) }
