'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ref, onValue } from 'firebase/database'
import Shell from '@/components/Shell'
import { api, db, rp } from '@/lib/firebase'
const WAIT = 180, EXP = 1200 // detik: tombol batal aktif / pesanan kedaluwarsa
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
const LBL = { waiting: 'Menunggu', success: 'Selesai', canceled: 'Dibatalkan' }
function Body() {
  const { id } = useParams(), r = useRouter()
  const [o, setO] = useState(null), [err, setErr] = useState(''), [now, setNow] = useState(Date.now()), [cp, setCp] = useState(''), [busy, setBusy] = useState(false)
  const [fb, setFb] = useState(false) // true bila baca langsung ditolak rules -> pakai server
  useEffect(() => onValue(ref(db, 'orders/' + id), s => setO(s.val() ? { ...s.val() } : false), () => setFb(true)), [id])
  const load = async () => { try { setO((await api('/api/order/' + id)).order || false) } catch (e) { setErr(e.message); setO(v => (v === null ? false : v)) } }
  useEffect(() => { if (fb) { load(); const t = setInterval(load, 5000); return () => clearInterval(t) } }, [fb, id])
  useEffect(() => { const t = setTimeout(() => setO(v => { if (v === null) load(); return v }), 4000); return () => clearTimeout(t) }, [id])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (!o || o.status !== 'waiting') return
    const t = setInterval(() => api('/api/order/' + id).catch(() => {}), 6000)
    return () => clearInterval(t)
  }, [o?.status, id])
  const copy = (k, v) => { navigator.clipboard?.writeText(String(v)); setCp(k); setTimeout(() => setCp(''), 1500) }
  async function refresh() { setBusy(true); setErr(''); await load(); setBusy(false) }
  async function cancel() { setBusy(true); setErr(''); try { await api('/api/order/' + id, { method: 'DELETE' }) } catch (e) { setErr(e.message) } setBusy(false) }
  if (o === null) return <div className="sk" style={{ height: 260 }} />
  if (o === false) return <div className="card">Pesanan tidak ditemukan. {err && <span className="mut mono">{err}</span>}<div className="row"><Link className="btn d" href="/riwayat">Riwayat</Link></div></div>
  const age = Math.floor((now - o.createdAt) / 1000), left = Math.max(0, WAIT - age), exp = Math.max(0, EXP - age)
  const app = o.app || o.service
  return <>
    <button className="back" onClick={() => r.push('/riwayat')}>‹ Detail pesanan</button>
    <div className="card">
      <div className="row" style={{ marginTop: 0, justifyContent: 'space-between', alignItems: 'center' }}>
        <div><b>{app}</b><div className="mut mono">{[o.countryName, o.serverName].filter(Boolean).join(' · ')}</div></div>
        <span className={'tag ' + o.status}>{LBL[o.status] || o.status}</span></div>
      <div className="kv" style={{ marginTop: 14 }}><span className="mut">Nomor</span><span className="mono">{o.number || '…'} {o.number && <button className="cpy" onClick={() => copy('n', o.number)}>{cp === 'n' ? 'tersalin' : 'salin'}</button>}</span></div>
      <div className="kv"><span className="mut">Harga</span><b className="mono">{rp(o.price)}</b></div>
      <div className="kv"><span className="mut">Dipesan</span><span className="mono">{new Date(o.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
    </div>
    {o.status === 'waiting' && <div className="card" style={{ textAlign: 'center' }}>
      <div className="spin lg2" />
      <div style={{ fontWeight: 600 }}>Menunggu OTP…</div>
      <div className="mut">{exp > 0 ? <>Kedaluwarsa dalam <span className="mono">{mmss(exp)}</span></> : 'Waktu habis, menunggu konfirmasi provider'}</div>
      <p className="mut" style={{ fontSize: 13 }}>Halaman ini diperbarui otomatis. Aman ditinggalkan, lihat lagi dari Riwayat.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn d" disabled={busy} onClick={refresh}>Refresh</button>
        <button className="btn r" disabled={busy || left > 0} onClick={cancel}>{left > 0 ? 'Batalkan (' + mmss(left) + ')' : 'Batalkan pesanan'}</button></div></div>}
    {o.status === 'success' && <div className="card" style={{ textAlign: 'center' }}>
      <div className="mut">Kode OTP</div><div className="otp">{o.code || '—'}</div>
      {o.code && <button className="btn" onClick={() => copy('c', o.code)}>{cp === 'c' ? 'Tersalin' : 'Salin kode'}</button>}
      <p className="mut" style={{ fontSize: 13 }}>OTP diterima</p></div>}
    {o.status === 'canceled' && <div className="card mut">Pesanan dibatalkan. Saldo dikembalikan.</div>}
    {err && <p style={{ color: 'var(--bad)' }} className="mono">{err}</p>}
    <div className="row"><Link className="btn d" href="/beli">Beli lagi</Link><Link className="btn d" href="/riwayat">Riwayat</Link></div>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
