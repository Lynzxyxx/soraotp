'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ref, onValue } from 'firebase/database'
import Shell from '@/components/Shell'
import { api, db, rp } from '@/lib/firebase'
const WAIT = 180, EXP = 1200 // detik: tombol batal aktif / pesanan kedaluwarsa
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
const LBL = { waiting: 'MENUNGGU OTP', success: 'BERHASIL', canceled: 'DIBATALKAN' }
const COL = { waiting: 'var(--warn)', success: 'var(--ac)', canceled: 'var(--bad)' }
function Body() {
  const { id } = useParams(), r = useRouter()
  const [o, setO] = useState(null), [err, setErr] = useState(''), [now, setNow] = useState(Date.now()), [cp, setCp] = useState(''), [busy, setBusy] = useState(false), [fb, setFb] = useState(false)
  useEffect(() => onValue(ref(db, 'orders/' + id), s => setO(s.val() ? { ...s.val() } : false), () => setFb(true)), [id])
  const load = async () => { try { const j = await api('/api/order/' + id); setO(j.order || false); setErr(j.warn || '') } catch (e) { setErr(e.message); setO(v => (v === null ? false : v)) } }
  useEffect(() => { if (fb) { load(); const t = setInterval(load, 5000); return () => clearInterval(t) } }, [fb, id])
  useEffect(() => { const t = setTimeout(() => setO(v => { if (v === null) load(); return v }), 4000); return () => clearTimeout(t) }, [id])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (!o || o.status !== 'waiting') return
    const t = setInterval(() => api('/api/order/' + id).then(j => setErr(j.warn || '')).catch(() => {}), 6000)
    return () => clearInterval(t)
  }, [o?.status, id])
  const copy = (k, v) => { navigator.clipboard?.writeText(String(v)); setCp(k); setTimeout(() => setCp(''), 1500) }
  async function refresh() { setBusy(true); setErr(''); await load(); setBusy(false) }
  async function cancel() { setBusy(true); setErr(''); try { await api('/api/order/' + id, { method: 'DELETE' }) } catch (e) { setErr(e.message) } setBusy(false) }
  if (o === null) return <div className="sk" style={{ height: 320 }} />
  if (o === false) return <div className="card">Pesanan tidak ditemukan. {err && <span className="mut mono">{err}</span>}<div className="row"><button className="btn d" onClick={() => r.push('/riwayat')}>Kembali ke Riwayat</button></div></div>
  const age = Math.floor((now - o.createdAt) / 1000), left = Math.max(0, WAIT - age), exp = Math.max(0, EXP - age)
  return <>
    <div className="card"><h1 className="pt" style={{ margin: 0 }}>Informasi Pesanan</h1><div className="mut">Detail transaksi dan status penerimaan kode OTP</div></div>
    <div className="tiles">
      <div className="tile2"><span>Order ID</span><b className="mono" style={{ color: 'var(--ac)' }}>#{o.providerId || id.slice(-6)}</b></div>
      <div className="tile2"><span>Nomor</span><b className="mono">{o.number || '…'}{o.number && <button className="cpy" onClick={() => copy('n', o.number)}>{cp === 'n' ? 'tersalin' : 'salin'}</button>}</b></div>
      <div className="tile2"><span>Layanan</span><b>{String(o.app || o.service).toUpperCase()}</b><small className="mut">{[o.countryName, o.serverName].filter(Boolean).join(' · ')}</small></div>
      <div className="tile2"><span>Harga</span><b className="mono">{rp(o.price)}</b></div>
      <div className="tile2"><span>Status pesanan</span><b style={{ color: COL[o.status] }}>{LBL[o.status] || String(o.status).toUpperCase()}</b></div>
      {o.status === 'success' && <div className="tile2"><span>Kode OTP</span><b className="mono" style={{ fontSize: 26, letterSpacing: 4, color: 'var(--ac)' }}>{o.code || '—'}{o.code && <button className="cpy" onClick={() => copy('c', o.code)}>{cp === 'c' ? 'tersalin' : 'salin'}</button>}</b></div>}
    </div>
    {o.status === 'waiting' && <div className="card" style={{ textAlign: 'center' }}>
      <div className="spin lg2" /><div style={{ fontWeight: 600 }}>Menunggu OTP…</div>
      <div className="mut">{exp > 0 ? <>Kedaluwarsa dalam <span className="mono">{mmss(exp)}</span></> : 'Waktu habis, menunggu konfirmasi provider'}</div>
      <p className="mut" style={{ fontSize: 13 }}>Halaman diperbarui otomatis. Aman ditinggalkan, lihat lagi dari Riwayat.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn d" disabled={busy} onClick={refresh}>Refresh</button>
        <button className="btn r" disabled={busy || left > 0} onClick={cancel}>{left > 0 ? 'Batalkan (' + mmss(left) + ')' : 'Batalkan pesanan'}</button></div></div>}
    {o.status === 'canceled' && <div className="card mut">Pesanan dibatalkan. Saldo dikembalikan.</div>}
    {err && <p style={{ color: 'var(--bad)' }} className="mono">{err}</p>}
    <div><button className="btn d" onClick={() => r.push('/riwayat')}>‹ Kembali ke Riwayat</button></div>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
