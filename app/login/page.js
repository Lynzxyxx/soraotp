'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
export default function Login() {
  const r = useRouter()
  const [reg, setReg] = useState(false), [f, setF] = useState({}), [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setErr('')
    try {
      if (reg) {
        if (f.pw !== f.pw2) return setErr('Password tidak sama')
        const c = await createUserWithEmailAndPassword(auth, f.email, f.pw)
        await setDoc(doc(db, 'users', c.user.uid), { name: f.name, email: f.email, wa: f.wa, saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now() })
      } else await signInWithEmailAndPassword(auth, f.email, f.pw)
      r.replace('/dashboard')
    } catch (x) { setErr(x.message.replace('Firebase: ', '')) }
  }
  return <div className="auth">
    <div className="logo">Sora<b>OTP</b></div>
    <div className="tabs"><button className={!reg ? 'on' : ''} onClick={() => setReg(false)}>Masuk</button><button className={reg ? 'on' : ''} onClick={() => setReg(true)}>Daftar</button></div>
    <form onSubmit={submit}>
      {reg && <input placeholder="Nama lengkap anda" required onChange={set('name')} />}
      <input type="email" placeholder="Email" required onChange={set('email')} />
      {reg && <input placeholder="Nomor WhatsApp (088xxxxx)" required onChange={set('wa')} />}
      <input type="password" placeholder="Password" required minLength={6} onChange={set('pw')} />
      {reg && <input type="password" placeholder="Ulangi Password" required onChange={set('pw2')} />}
      {err && <div className="err">{err}</div>}
      <button className="go">{reg ? 'Daftar Sekarang' : 'Masuk'}</button>
    </form>
  </div>
}
