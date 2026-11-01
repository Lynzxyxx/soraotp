'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { ref, onValue, set } from 'firebase/database'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Close } from '@/components/Icons'
import { auth, db } from '@/lib/firebase'
const Ctx = createContext(null)
export const useMe = () => useContext(Ctx)
const MENU = [['/dashboard','Dashboard'],['/deposit','Isi Saldo'],['/beli','Beli'],['/riwayat','Riwayat Pembelian'],['/layanan','Layanan & Harga'],['/profile','Pengaturan Akun'],['/tutorial','Tutorial'],['/syarat','Syarat & Ketentuan']]
const Top = ({ onMenu, open }) => <div className="top"><button onClick={onMenu}>{open ? <Close /> : <Menu />}</button>
  <div className="brand"><img src="/logo-sm.webp" alt="" width="30" height="30" />Sora<span>OTP</span></div><span style={{ width: 40 }} /></div>
export default function Shell({ children }) {
  const r = useRouter(), path = usePathname()
  const [me, setMe] = useState(null), [open, setOpen] = useState(false), [err, setErr] = useState('')
  useEffect(() => {
    let off = () => {}
    const un = onAuthStateChanged(auth, u => {
      off(); if (!u) return r.replace('/login')
      // tampil instan dari cache, lalu diperbarui realtime
      try { const c = localStorage.getItem('sora_me_' + u.uid); if (c) setMe(JSON.parse(c)) } catch {}
      off = onValue(ref(db, 'users/' + u.uid), s => {
        const v = s.val()
        if (v) {
          const m = { uid: u.uid, ...v }; setMe(m); setErr('')
          try { localStorage.setItem('sora_me_' + u.uid, JSON.stringify(m)) } catch {}
        } else { // profil belum ada (mis. akun lama) -> buat otomatis
          set(ref(db, 'users/' + u.uid), { name: (u.email || '').split('@')[0], email: u.email, wa: '', saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now() }).catch(e => setErr(e.message))
        }
      }, e => setErr(e.message))
    })
    return () => { un(); off() }
  }, [])
  const out = () => { try { localStorage.removeItem('sora_me_' + (me?.uid || auth.currentUser?.uid)) } catch {} signOut(auth) }
  if (!me) return <><Top onMenu={() => {}} />
    <main className="wrap">{err
      ? <div className="card"><b>Gagal memuat data</b><p className="mut">{err}</p><button className="btn" onClick={() => location.reload()}>Coba lagi</button> <button className="btn d" onClick={out}>Logout</button></div>
      : <><div className="sk" style={{ height: 150 }} /><div className="sk" style={{ height: 80 }} /><div className="sk" style={{ height: 80 }} /></>}</main></>
  if (me.blocked) return <p style={{ padding: 24 }}>Akun kamu diblokir. Hubungi admin. <button className="btn d" onClick={out}>Logout</button></p>
  return <Ctx.Provider value={me}>
    <Top onMenu={() => setOpen(!open)} open={open} />
    {open && <nav className="side" onClick={() => setOpen(false)}>
      {MENU.map(([h, t]) => <Link key={h} href={h} className={path === h ? 'on' : ''}>{t}</Link>)}
      {me.role === 'owner' && <Link href="/admin/soraotp">Admin Panel</Link>}
      <button style={{ color: '#f87171' }} onClick={out}>Logout</button>
    </nav>}
    <main className="wrap">{children}</main>
    <footer>© 2026 <b>SoraOTP</b>. All Rights Reserved.</footer>
  </Ctx.Provider>
}
