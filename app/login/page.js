'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import { auth, db } from '@/lib/firebase'
import { Eye, EyeOff } from '@/components/Icons'
import ThemeToggle from '@/components/ThemeToggle'
export default function Login() {
  const r = useRouter()
  const [reg, setReg] = useState(false), [f, setF] = useState({}), [msg, setMsg] = useState(null), [show, setShow] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const bad = e => setMsg({ e: 1, t: (e.code || e.message || '').replace('auth/', '').replace(/-/g, ' ') })
  async function submit(e) {
    e.preventDefault(); setMsg(null)
    try {
      if (reg) {
        if (f.pw !== f.pw2) return setMsg({ e: 1, t: 'Password tidak sama' })
        const c = await createUserWithEmailAndPassword(auth, f.email, f.pw)
        await set(ref(db, 'users/' + c.user.uid), { name: f.name, email: f.email, wa: f.wa, saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now() })
      } else await signInWithEmailAndPassword(auth, f.email, f.pw)
      r.replace('/dashboard')
    } catch (x) { bad(x) }
  }
  async function lupa() {
    if (!f.email) return setMsg({ e: 1, t: 'Isi email dulu' })
    try { await sendPasswordResetEmail(auth, f.email); setMsg({ t: 'Link reset password dikirim ke email.' }) } catch (x) { bad(x) }
  }
  const pwField = (k, ph) => <div className="pw"><input type={show ? 'text' : 'password'} placeholder={ph} required minLength={6} onChange={set(k)} /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div>
  return <div className="lg"><div className="tr"><ThemeToggle /></div><div className="lgcard">
    <form className="lgform" onSubmit={submit}>
      <h1>{reg ? 'BUAT AKUN' : 'WELCOME BACK!'}</h1>
      <p className="sub">{reg ? 'Daftar untuk mulai beli nomor OTP' : 'Masuk ke SoraOTP'}</p>
      {reg && <><label>Nama lengkap</label><input placeholder="Nama kamu" required onChange={set('name')} /></>}
      <label>Email</label><input type="email" placeholder="example@gmail.com" required onChange={set('email')} />
      {reg && <><label>Nomor WhatsApp</label><input placeholder="088xxxxx" required onChange={set('wa')} /></>}
      <label>Password</label>{pwField('pw', '••••••')}
      {reg && <><label>Ulangi Password</label>{pwField('pw2', '••••••')}</>}
      {!reg && <div className="lgrow"><span /><a href="#" onClick={e => { e.preventDefault(); lupa() }}>Lupa password?</a></div>}
      <button className="lgbtn" style={{ marginTop: reg ? 18 : 0 }}>{reg ? 'DAFTAR SEKARANG' : 'SIGN IN'}</button>
      {msg && <div className={msg.e ? 'err' : 'ok'}>{msg.t}</div>}
      <div className="swap">{reg ? 'Sudah punya akun?' : 'Belum punya akun?'} <button type="button" onClick={() => { setReg(!reg); setMsg(null) }}>{reg ? 'Masuk' : 'Daftar'}</button></div>
    </form>
    <div className="lgimg"><img src="/logo.webp" alt="SoraOTP" /></div>
  </div></div>
}
