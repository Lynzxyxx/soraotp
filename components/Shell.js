'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { ref, onValue } from 'firebase/database'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Close } from '@/components/Icons'
import { auth, db } from '@/lib/firebase'
const Ctx = createContext(null)
export const useMe = () => useContext(Ctx)
const MENU = [['/dashboard','Dashboard'],['/deposit','Isi Saldo'],['/beli','Beli'],['/riwayat','Riwayat Pembelian'],['/layanan','Layanan & Harga'],['/profile','Pengaturan Akun'],['/tutorial','Tutorial'],['/syarat','Syarat & Ketentuan']]
export default function Shell({ children }) {
  const r = useRouter(), path = usePathname()
  const [me, setMe] = useState(null), [open, setOpen] = useState(false)
  useEffect(() => {
    let off = () => {}
    const un = onAuthStateChanged(auth, u => {
      off(); if (!u) return r.replace('/login')
      off = onValue(ref(db, 'users/' + u.uid), s => setMe(s.val() ? { uid: u.uid, ...s.val() } : null))
    })
    return () => { un(); off() }
  }, [])
  if (!me) return <p style={{ padding: 24 }}>Memuat…</p>
  if (me.blocked) return <p style={{ padding: 24 }}>Akun kamu diblokir. Hubungi admin. <button onClick={() => signOut(auth)}>Logout</button></p>
  return <Ctx.Provider value={me}>
    <div className="top"><button onClick={() => setOpen(!open)}>{open ? <Close /> : <Menu />}</button><div className="brand"><img src="/logo.webp" alt="" />Sora<span>OTP</span></div><span /></div>
    {open && <nav className="side" onClick={() => setOpen(false)}>
      {MENU.map(([h, t]) => <Link key={h} href={h} className={path === h ? 'on' : ''}>{t}</Link>)}
      {me.role === 'owner' && <Link href="/admin/soraotp">Admin Panel</Link>}
      <button style={{ color: '#e11d48' }} onClick={() => signOut(auth)}>Logout</button>
    </nav>}
    <main className="wrap">{children}</main>
    <footer>© 2026 <b>SoraOTP</b>. All Rights Reserved.</footer>
  </Ctx.Provider>
}
