'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { auth, db, api } from '@/lib/firebase'
import { Eye, EyeOff } from '@/components/Icons'
import ThemeToggle from '@/components/ThemeToggle'
const G = () => <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
const ERR = {
  'auth/email-already-in-use': 'Email ini sudah terdaftar dan tidak bisa didaftarkan lagi. Silakan masuk.',
  'auth/invalid-credential': 'Email atau password salah.', 'auth/wrong-password': 'Email atau password salah.', 'auth/user-not-found': 'Email atau password salah.',
  'auth/invalid-email': 'Format email tidak valid.', 'auth/weak-password': 'Password minimal 6 karakter.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.', 'auth/user-disabled': 'Akun ini diblokir. Hubungi admin.',
  'auth/popup-blocked': 'Pop-up diblokir browser. Izinkan pop-up lalu coba lagi.', 'auth/network-request-failed': 'Koneksi bermasalah. Coba lagi.',
  'auth/account-exists-with-different-credential': 'Email ini sudah terdaftar dengan password. Masuk memakai email dan password.',
  'auth/invalid-api-key': 'API key Firebase salah. Periksa env NEXT_PUBLIC_FIREBASE_API_KEY.', 'auth/internal-error': 'Kesalahan internal Firebase. Periksa env NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN lalu Redeploy.', 'auth/operation-not-allowed': 'Metode login ini belum diaktifkan di Firebase.', 'auth/unauthorized-domain': 'Domain ini belum diizinkan di Firebase (Authorized domains).',
}
const errText = x => (x?.code ? ERR[x.code] || x.code.replace('auth/', '').replace(/-/g, ' ') : x?.message || 'Terjadi kesalahan')
// buat profil di database bila belum ada (daftar baru / login Google pertama kali)
async function ensureProfile(u, extra = {}) {
  const s = await get(ref(db, 'users/' + u.uid))
  if (s.exists()) return false
  await set(ref(db, 'users/' + u.uid), { name: u.displayName || (u.email || '').split('@')[0], email: u.email, wa: '', saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now(), ...extra })
  try { await api('/api/notify/register', { method: 'POST' }) } catch {}
  return true
}
const notifyLogin = m => { api('/api/notify/login', { method: 'POST', body: JSON.stringify({ method: m }) }).catch(() => {}) }
export default function Login() {
  const r = useRouter()
  const [inapp, setInapp] = useState(false)
  useEffect(() => { setInapp(/Instagram|FBAN|FBAV|TikTok|musical_ly|Line\/|; wv\)/i.test(navigator.userAgent)) }, [])
  const [reg, setReg] = useState(false), [f, setF] = useState({}), [msg, setMsg] = useState(null), [show, setShow] = useState(false), [remember, setRemember] = useState(true), [busy, setBusy] = useState(false)
  const set_ = k => e => setF({ ...f, [k]: e.target.value })
  const persist = () => setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  async function submit(e) {
    e.preventDefault(); setMsg(null); setBusy(true)
    try {
      await persist()
      const email = (f.email || '').trim().toLowerCase()
      if (reg) {
        if (f.pw !== f.pw2) throw { message: 'Password tidak sama' }
        const c = await createUserWithEmailAndPassword(auth, email, f.pw)
        await ensureProfile(c.user, { name: (f.name || '').trim(), wa: (f.wa || '').trim() })
      } else { await signInWithEmailAndPassword(auth, email, f.pw); notifyLogin('email') }
      r.replace('/dashboard')
    } catch (x) { setMsg({ e: 1, t: errText(x), sw: x?.code === 'auth/email-already-in-use' }) }
    setBusy(false)
  }
  async function google() {
    setMsg(null); setBusy(true)
    try {
      await persist()
      const c = await signInWithPopup(auth, new GoogleAuthProvider())
      const created = await ensureProfile(c.user)
      if (!created) notifyLogin('google')
      r.replace('/dashboard')
    } catch (x) { if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(x?.code)) setMsg({ e: 1, t: errText(x) }) }
    setBusy(false)
  }
  async function lupa() {
    if (!f.email) return setMsg({ e: 1, t: 'Isi email dulu' })
    try { await sendPasswordResetEmail(auth, f.email.trim()); setMsg({ t: 'Link reset password dikirim ke email.' }) } catch (x) { setMsg({ e: 1, t: errText(x) }) }
  }
  const pw = (k, ph) => <div className="pw"><input type={show ? 'text' : 'password'} placeholder={ph} required minLength={6} autoComplete={reg ? 'new-password' : 'current-password'} onChange={set_(k)} />
    <button type="button" onClick={() => setShow(!show)} aria-label="Tampilkan password">{show ? <EyeOff /> : <Eye />}</button></div>
  return <div className="au"><div className="tr"><ThemeToggle /></div>
    <div className="aucard">
      <div className="aubrand"><img src="/logo-sm.webp" alt="" width="38" height="38" />Sora<span>OTP</span></div>
      <h1>{reg ? 'Buat Akun' : 'Selamat Datang Kembali'}</h1>
      <p className="ausub">{reg ? 'Daftar untuk mulai membeli nomor OTP' : 'Masukkan data kamu untuk masuk ke dashboard'}</p>
      <button type="button" className="augo" onClick={google} disabled={busy}><G />Lanjutkan dengan Google</button>
      {inapp && <p className="mut" style={{ fontSize: 13, textAlign: 'center', margin: '10px 0 0', color: 'var(--warn)' }}>Kamu membuka lewat aplikasi lain (Instagram/TikTok/dll). Login Google sering ditolak di sini. Buka link ini di Chrome atau Safari.</p>}
      <div className="auor">Atau</div>
      <form onSubmit={submit}>
        {reg && <><label>Nama lengkap<i className="req">*</i></label><input placeholder="Nama kamu" required autoComplete="name" onChange={set_('name')} /></>}
        <label>Alamat Email<i className="req">*</i></label><input type="email" placeholder="Masukkan email" required autoComplete="email" onChange={set_('email')} />
        {reg && <><label>Nomor WhatsApp<i className="req">*</i></label><input placeholder="08xxxxxxxxxx" inputMode="tel" required autoComplete="tel" onChange={set_('wa')} /></>}
        <label>Password<i className="req">*</i></label>{pw('pw', 'Masukkan password')}
        {reg && <><label>Ulangi Password<i className="req">*</i></label>{pw('pw2', 'Ulangi password')}</>}
        {!reg && <div className="aurow"><label className="chk"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Ingat saya</label>
          <a href="#" onClick={e => { e.preventDefault(); lupa() }}>Lupa Password?</a></div>}
        {msg && <div className={msg.e ? 'err' : 'ok'} style={{ margin: '14px 0 0' }}>{msg.t}{msg.sw && <> <button type="button" className="aulink" onClick={() => { setReg(false); setMsg(null) }}>Masuk sekarang</button></>}</div>}
        <button className="ausubmit" style={{ marginTop: reg ? 22 : 0 }} disabled={busy}>{busy ? 'Memproses…' : reg ? 'Daftar' : 'Masuk'}</button>
      </form>
      <p className="auswap">{reg ? 'Sudah punya akun?' : 'Belum punya akun?'} <button type="button" className="aulink" onClick={() => { setReg(!reg); setMsg(null) }}>{reg ? 'Masuk' : 'Daftar'}</button></p>
    </div></div>
}
