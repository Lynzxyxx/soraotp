'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { auth, api, rp } from '@/lib/firebase'
export default function Admin() {
  const r = useRouter()
  const [ready, setReady] = useState(false), [users, setUsers] = useState([]), [q, setQ] = useState(''), [err, setErr] = useState('')
  const load = async (s = q) => { try { setUsers((await api('/api/admin/users?q=' + encodeURIComponent(s))).users); setErr('') } catch (e) { setErr(e.message) } }
  useEffect(() => onAuthStateChanged(auth, u => { if (!u) return r.replace('/login'); setReady(true); load('') }), [])
  async function act(uid, action, value) {
    try { await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ uid, action, value }) }); load() } catch (e) { alert(e.message) }
  }
  if (!ready) return <p style={{ padding: 24 }}>Memuat…</p>
  if (err === 'forbidden') return <p style={{ padding: 24 }}>Akses ditolak. Akun ini bukan owner. Login dengan email yang diisi di OWNER_EMAIL.</p>
  return <main className="wrap" style={{ maxWidth: 900 }}>
    <div className="card"><div className="item" style={{ padding: 0 }}><b>Admin SoraOTP</b><button className="btn d" onClick={async () => { try { await api('/api/notify/test', { method: 'POST' }); alert('Notifikasi tes terkirim ke Telegram') } catch (e) { alert(e.message) } }}>Tes Telegram</button></div>
      <input placeholder="Cari email / nama / WA…" value={q} onChange={e => { setQ(e.target.value); load(e.target.value) }} /></div>
    {users.map(u => <div className="card" key={u.uid}>
      <b>{u.name}</b> <span className="tag">{u.role || 'user'}</span> {u.blocked && <span className="tag canceled">diblokir</span>} {u.saldoFrozen && <span className="tag waiting">saldo dibekukan</span>}
      <div className="mut">{u.email} • {u.wa} • Saldo {rp(u.saldo)}</div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => { const v = prompt('Tambah saldo (negatif untuk kurangi):'); v && act(u.uid, 'addSaldo', v) }}>+/- Saldo</button>
        <button className="btn d" onClick={() => { const v = prompt('Set saldo menjadi:'); v !== null && act(u.uid, 'setSaldo', v) }}>Set Saldo</button>
        <button className="btn d" onClick={() => act(u.uid, 'freeze', !u.saldoFrozen)}>{u.saldoFrozen ? 'Buka Saldo' : 'Banned Saldo'}</button>
        <button className="btn d" onClick={() => { const v = prompt('Password baru (min 6):'); v && act(u.uid, 'password', v) }}>Ganti PW</button>
        <button className="btn r" onClick={() => act(u.uid, 'block', !u.blocked)}>{u.blocked ? 'Buka Blokir' : 'Blokir'}</button>
        <select value={u.role || 'user'} onChange={e => act(u.uid, 'role', e.target.value)} style={{ width: 'auto' }}>
          <option value="user">user</option><option value="reseller">reseller</option><option value="owner">owner</option></select>
      </div></div>)}
  </main>
}
