'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { ref, onValue, set } from 'firebase/database'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Close } from '@/components/Icons'
import ThemeToggle from '@/components/ThemeToggle'
import { auth, db, rp } from '@/lib/firebase'
const Ctx = createContext(null)
export const useMe = () => useContext(Ctx)
const MENU = [['/dashboard','Dashboard'],['/deposit','Isi Saldo'],['/beli','Beli Nomor'],['/riwayat','Riwayat Pembelian'],['/layanan','Layanan & Harga'],['/profile','Pengaturan Akun'],['/tutorial','Tutorial'],['/syarat','Syarat & Ketentuan']]
const Top = ({ onMenu, open, saldo }) => <div className="top"><button className="ib" onClick={onMenu} aria-label="Menu">{open ? <Close /> : <Menu />}</button>
  <div className="brand"><img src="/logo-sm.webp" alt="" width="28" height="28" />Sora<span>OTP</span></div>
  {saldo == null ? <span style={{ width: 40 }} /> : <Link className="bal" href="/deposit">{rp(saldo)}</Link>}</div>
export default function Shell({ children }) {
  const r = useRouter(), path = usePathname()
  const [me, setMe] = useState(null), [open, setOpen] = useState(false), [err, setErr] = useState('')
  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    let off = () => {}
    const un = onAuthStateChanged(auth, u => {
      off(); if (!u) return r.replace('/login')
      try { const c = localStorage.getItem('sora_me_' + u.uid); if (c) setMe(JSON.parse(c)) } catch {}
      off = onValue(ref(db, 'users/' + u.uid), s => {
        const v = s.val()
        if (v) { const m = { uid: u.uid, ...v }; setMe(m); setErr(''); try { localStorage.setItem('sora_me_' + u.uid, JSON.stringify(m)) } catch {} }
        else set(ref(db, 'users/' + u.uid), { name: (u.email || '').split('@')[0], email: u.email, wa: '', saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now() }).catch(e => setErr(e.message))
      }, e => setErr(e.message))
    })
    return () => { un(); off() }
  }, [])
  const out = () => { try { localStorage.removeItem('sora_me_' + (me?.uid || auth.currentUser?.uid)) } catch {} signOut(auth) }
  if (!me) return <><Top onMenu={() => {}} />
    <main className="wrap">{err
      ? <div className="card"><b>Gagal memuat data</b><p className="mut mono">{err}</p><button className="btn" onClick={() => location.reload()}>Coba lagi</button> <button className="btn d" onClick={out}>Logout</button></div>
      : <><div className="sk" style={{ height: 120 }} /><div className="sk" style={{ height: 70 }} /><div className="sk" style={{ height: 70 }} /></>}</main></>
  if (me.blocked) return <p style={{ padding: 24 }}>Akun kamu diblokir. Hubungi admin. <button className="btn d" onClick={out}>Logout</button></p>
  const items = [...MENU, ...(me.role === 'owner' ? [['/admin/soraotp', 'Admin Panel']] : [])]
  return <Ctx.Provider value={me}>
    <Top onMenu={() => setOpen(!open)} open={open} saldo={me.saldo} />
    <div className={'scrim' + (open ? ' on' : '')} onClick={() => setOpen(false)} />
    <nav className={'side' + (open ? ' on' : '')} aria-hidden={!open}>
      <div className="who" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><b>@{(me.email || '').split('@')[0]}</b><span className="mut mono">{rp(me.saldo)}</span></div><ThemeToggle /></div>
      {items.map(([h, t], i) => <Link key={h} href={h} className={path === h ? 'on' : ''} style={{ animationDelay: 40 + i * 28 + 'ms' }}>{t}</Link>)}
      <button className="lo" style={{ color: 'var(--bad)', marginTop: 'auto' }} onClick={out}>Logout</button>
    </nav>
    <main className="wrap">{children}</main>
    <footer>© 2026 <b>SoraOTP</b></footer>
  </Ctx.Provider>
}
