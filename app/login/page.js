'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { auth, db, api } from '@/lib/firebase'
import { Eye, EyeOff } from '@/components/Icons'
import ThemeToggle from '@/components/ThemeToggle'
const G = () => <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
const ERR = {
  'auth/invalid-credential': 'Email atau password salah.', 'auth/wrong-password': 'Email atau password salah.', 'auth/user-not-found': 'Email atau password salah.',
  'auth/invalid-email': 'Format email tidak valid.', 'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
  'auth/user-disabled': 'Akun belum diverifikasi atau diblokir. Kalau kamu belum memverifikasi email, daftar ulang dengan email yang sama untuk mendapat kode baru.',
  'auth/popup-blocked': 'Pop-up diblokir browser. Izinkan pop-up lalu coba lagi.', 'auth/network-request-failed': 'Koneksi bermasalah. Coba lagi.',
  'auth/account-exists-with-different-credential': 'Email ini sudah terdaftar dengan password. Masuk memakai email dan password.',
  'auth/operation-not-allowed': 'Metode login ini belum diaktifkan di Firebase.', 'auth/unauthorized-domain': 'Domain ini belum diizinkan di Firebase (Authorized domains).',
  'auth/invalid-api-key': 'API key Firebase salah. Periksa env NEXT_PUBLIC_FIREBASE_API_KEY.', 'auth/internal-error': 'Kesalahan internal Firebase. Periksa env NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN lalu Redeploy.',
}
const errText = x => (x?.code ? ERR[x.code] || x.code.replace('auth/', '').replace(/-/g, ' ') : x?.message || 'Terjadi kesalahan')
async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const t = await r.text(); let j = {}; try { j = JSON.parse(t) } catch {}
  if (!r.ok) throw { message: j.error || `Server error ${r.status}` }
  return j
}
// profil untuk login Google pertama kali (Google sudah memverifikasi emailnya)
async function ensureProfile(u) {
  const s = await get(ref(db, 'users/' + u.uid))
  if (s.exists()) return false
  await set(ref(db, 'users/' + u.uid), { name: u.displayName || (u.email || '').split('@')[0], email: u.email, wa: '', saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now() })
  try { await api('/api/notify/register', { method: 'POST' }) } catch {}
  return true
}
const notifyLogin = m => { api('/api/notify/login', { method: 'POST', body: JSON.stringify({ method: m }) }).catch(() => {}) }
export default function Login() {
  const r = useRouter()
  const [inapp, setInapp] = useState(false)
  useEffect(() => { setInapp(/Instagram|FBAN|FBAV|TikTok|musical_ly|Line\/|; wv\)/i.test(navigator.userAgent)) }, [])
  const [reg, setReg] = useState(false), [stage, setStage] = useState('form'), [tok, setTok] = useState(''), [code, setCode] = useState(''), [cool, setCool] = useState(0)
  const [f, setF] = useState({}), [msg, setMsg] = useState(null), [show, setShow] = useState(false), [remember, setRemember] = useState(true), [busy, setBusy] = useState(false)
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t) }, [cool])
  const set_ = k => e => setF({ ...f, [k]: e.target.value })
  const persist = () => setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  const email = () => (f.email || '').trim().toLowerCase()
  const run = fn => async e => { e?.preventDefault?.(); setMsg(null); setBusy(true); try { await fn() } catch (x) { setMsg({ e: 1, t: errText(x), rr: x?.code === 'auth/user-disabled' }) } setBusy(false) }
  const submit = run(async () => {
    if (reg) {
      if (f.pw !== f.pw2) throw { message: 'Password tidak sama' }
      const j = await post('/api/auth/register/start', { name: f.name, email: email(), wa: f.wa, password: f.pw })
      setTok(j.token); setCode(''); setCool(60); setStage('verify'); setMsg({ t: 'Kode 6 digit sudah dikirim ke ' + email() })
    } else { await persist(); await signInWithEmailAndPassword(auth, email(), f.pw); notifyLogin('email'); r.replace('/dashboard') }
  })
  const verify = run(async () => {
    await post('/api/auth/register/verify', { email: email(), code: code.trim(), token: tok })
    await persist(); await signInWithEmailAndPassword(auth, email(), f.pw); r.replace('/dashboard')
  })
  const resend = run(async () => { await post('/api/auth/register/resend', { email: email(), token: tok }); setCool(60); setMsg({ t: 'Kode baru sudah dikirim.' }) })
  const google = run(async () => {
    await persist()
    const c = await signInWithPopup(auth, new GoogleAuthProvider()).catch(x => { if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(x?.code)) return null; throw x })
    if (!c) return
    if (!(await ensureProfile(c.user))) notifyLogin('google')
    r.replace('/dashboard')
  })
  async function lupa() {
    if (!f.email) return setMsg({ e: 1, t: 'Isi email dulu' })
    try { await sendPasswordResetEmail(auth, email()); setMsg({ t: 'Link reset password dikirim ke email.' }) } catch (x) { setMsg({ e: 1, t: errText(x) }) }
  }
  const pw = (k, ph) => <div className="pw"><input type={show ? 'text' : 'password'} placeholder={ph} required minLength={6} autoComplete={reg ? 'new-password' : 'current-password'} onChange={set_(k)} />
    <button type="button" onClick={() => setShow(!show)} aria-label="Tampilkan password">{show ? <EyeOff /> : <Eye />}</button></div>
  const verifying = reg && stage === 'verify'
  return <div className="au"><div className="tr"><ThemeToggle /></div>
    <div className="aucard">
      <div className="aubrand"><img src="/logo-sm.webp" alt="" width="38" height="38" />Sora<span>OTP</span></div>
      <h1>{verifying ? 'Verifikasi Email' : reg ? 'Buat Akun' : 'Selamat Datang Kembali'}</h1>
      <p className="ausub">{verifying ? <>Masukkan kode 6 digit yang dikirim ke <b>{email()}</b></> : reg ? 'Daftar dengan email. Kami kirim kode verifikasi 6 digit.' : 'Masukkan data kamu untuk masuk ke dashboard'}</p>
      {verifying ? <form onSubmit={verify}>
        <label>Kode verifikasi<i className="req">*</i></label>
        <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="______" inputMode="numeric" autoComplete="one-time-code" required style={{ textAlign: 'center', letterSpacing: 10, fontSize: 24 }} />
        {msg && <div className={msg.e ? 'err' : 'ok'} style={{ margin: '14px 0 0' }}>{msg.t}</div>}
        <button className="ausubmit" style={{ marginTop: 20 }} disabled={busy || code.length !== 6}>{busy ? 'Memproses…' : 'Verifikasi & Masuk'}</button>
        <p className="auswap">Belum menerima? <button type="button" className="aulink" disabled={cool > 0 || busy} onClick={resend} style={cool > 0 ? { opacity: .5, cursor: 'default' } : {}}>{cool > 0 ? `Kirim ulang (${cool}d)` : 'Kirim ulang kode'}</button></p>
        <p className="auswap" style={{ marginTop: 8 }}><button type="button" className="aulink" onClick={() => { setStage('form'); setMsg(null) }}>Ganti email</button></p>
      </form> : <>
        <button type="button" className="augo" onClick={google} disabled={busy}><G />Lanjutkan dengan Google</button>
        {inapp && <p className="mut" style={{ fontSize: 13, textAlign: 'center', margin: '10px 0 0', color: 'var(--warn)' }}>Kamu membuka lewat aplikasi lain (Instagram/TikTok/dll). Login Google sering ditolak di sini. Buka link ini di Chrome atau Safari.</p>}
        <div className="auor">Atau</div>
        <form onSubmit={submit}>
          {reg && <><label>Nama lengkap<i className="req">*</i></label><input placeholder="Nama kamu" required autoComplete="name" onChange={set_('name')} value={f.name || ''} /></>}
          <label>Alamat Email<i className="req">*</i></label><input type="email" placeholder="Masukkan email" required autoComplete="email" onChange={set_('email')} value={f.email || ''} />
          {reg && <><label>Nomor WhatsApp<i className="req">*</i></label><input placeholder="08xxxxxxxxxx" inputMode="tel" required autoComplete="tel" onChange={set_('wa')} value={f.wa || ''} /></>}
          <label>Password<i className="req">*</i></label>{pw('pw', 'Masukkan password')}
          {reg && <><label>Ulangi Password<i className="req">*</i></label>{pw('pw2', 'Ulangi password')}</>}
          {!reg && <div className="aurow"><label className="chk"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Ingat saya</label>
            <a href="#" onClick={e => { e.preventDefault(); lupa() }}>Lupa Password?</a></div>}
          {msg && <div className={msg.e ? 'err' : 'ok'} style={{ margin: '14px 0 0' }}>{msg.t}{msg.rr && <> <button type="button" className="aulink" onClick={() => { setReg(true); setMsg(null) }}>Daftar ulang</button></>}</div>}
          <button className="ausubmit" style={{ marginTop: reg ? 22 : 0 }} disabled={busy}>{busy ? 'Memproses…' : reg ? 'Kirim kode verifikasi' : 'Masuk'}</button>
        </form>
        <p className="auswap">{reg ? 'Sudah punya akun?' : 'Belum punya akun?'} <button type="button" className="aulink" onClick={() => { setReg(!reg); setMsg(null) }}>{reg ? 'Masuk' : 'Daftar'}</button></p></>}
    </div></div>
}
