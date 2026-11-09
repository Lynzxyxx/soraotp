'use client'
import { useState } from 'react'
import { ref, update } from 'firebase/database'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import Shell, { useMe } from '@/components/Shell'
import { auth, db, api } from '@/lib/firebase'
function TgLink() {
  const [r, setR] = useState(null), [e, setE] = useState('')
  async function go() { setE(''); try { setR(await api('/api/telegram/link-code', { method: 'POST' })) } catch (x) { setE(x.message) } }
  return <div className="card"><b>Hubungkan Telegram</b><p className="mut">Beli nomor dan terima OTP langsung dari bot Telegram memakai akun yang sama.</p>
    <button className="btn d" onClick={go}>Buat kode</button>
    {r && <p>Kode: <b className="mono" style={{ fontSize: 22, letterSpacing: 3 }}>{r.code}</b><br /><span className="mut">Berlaku 5 menit. Kirim <span className="mono">/login {r.code}</span> ke bot{r.link && <>, atau <a href={r.link}>buka bot di Telegram</a></>}.</span></p>}
    {e && <p style={{ color: 'var(--bad)' }}>{e}</p>}</div>
}
function Body() {
  const me = useMe()
  const [n, setN] = useState(me.name || ''), [w, setW] = useState(me.wa || ''), [p, setP] = useState({}), [m, setM] = useState('')
  async function save() { try { await update(ref(db, 'users/' + me.uid), { name: n, wa: w }); setM('Profil disimpan') } catch (e) { setM(e.message) } }
  async function pw() {
    try {
      if (!p.a || (p.b || '').length < 6 || p.b !== p.c) return setM('Isi password lama, dan password baru minimal 6 karakter yang sama')
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(me.email, p.a))
      await updatePassword(auth.currentUser, p.b); setM('Password diganti')
    } catch (e) { setM((e.code || e.message).replace('auth/', '')) }
  }
  return <>
    <div className="card"><b>Informasi Profil</b><div className="mut">{me.email} • {me.role || 'user'}</div>
      <input value={n} onChange={e => setN(e.target.value)} placeholder="Nama lengkap" /><input value={w} onChange={e => setW(e.target.value)} placeholder="Nomor WhatsApp" />
      <button className="btn" onClick={save}>Simpan Profil</button></div>
    <div className="card"><b>Ubah Password</b>
      <input type="password" placeholder="Password saat ini" onChange={e => setP({ ...p, a: e.target.value })} />
      <input type="password" placeholder="Password baru" onChange={e => setP({ ...p, b: e.target.value })} />
      <input type="password" placeholder="Konfirmasi password baru" onChange={e => setP({ ...p, c: e.target.value })} />
      <button className="btn" onClick={pw}>Ganti Password</button></div>
    <TgLink />
    {m && <div className="card mut">{m}</div>}
  </>
}
export default function P() { return <Shell><Body /></Shell> }
