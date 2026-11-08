'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ref, onValue } from 'firebase/database'
import Shell from '@/components/Shell'
import { api, db, rp } from '@/lib/firebase'
const LBL = { pending: 'MENUNGGU PEMBAYARAN', processing: 'DIPROSES', success: 'BERHASIL' }
const COL = { pending: 'var(--warn)', processing: 'var(--warn)', success: 'var(--ac)' }
function Body() {
  const { id } = useParams(), r = useRouter()
  const [d, setD] = useState(null), [err, setErr] = useState(''), [fb, setFb] = useState(false), [busy, setBusy] = useState(false)
  useEffect(() => onValue(ref(db, 'deposits/' + id), s => setD(s.val() ? { ...s.val() } : false), () => setFb(true)), [id])
  const load = async () => { try { const j = await api('/api/deposit/' + id); setD(v => ({ ...(v || {}), ...j.deposit })); setErr(j.warn || '') } catch (e) { setErr(e.message); setD(v => (v === null ? false : v)) } }
  useEffect(() => { if (fb) { load(); const t = setInterval(load, 10000); return () => clearInterval(t) } }, [fb, id])
  useEffect(() => { const t = setTimeout(() => setD(v => { if (v === null) load(); return v }), 4000); return () => clearTimeout(t) }, [id])
  useEffect(() => { // memicu pengecekan ke buatqris selama belum lunas
    if (!d || d.status !== 'pending') return
    const t = setInterval(() => api('/api/deposit/' + id).then(j => setErr(j.warn || '')).catch(e => setErr(e.message)), 12000)
    return () => clearInterval(t)
  }, [d?.status, id])
  async function refresh() { setBusy(true); await load(); setBusy(false) }
  if (d === null) return <div className="sk" style={{ height: 320 }} />
  if (d === false) return <div className="card">Deposit tidak ditemukan. {err && <span className="mut mono">{err}</span>}<div className="row"><button className="btn d" onClick={() => r.push('/riwayat-deposit')}>Kembali ke Riwayat Deposit</button></div></div>
  const pay = d.pay || d.amount
  return <>
    <div className="card"><h1 className="pt" style={{ margin: 0 }}>Detail Deposit</h1><div className="mut">Informasi tagihan dan status pembayaran</div></div>
    <div className="tiles">
      <div className="tile2"><span>ID deposit</span><b className="mono" style={{ color: 'var(--ac)' }}>#{id.slice(-8)}</b></div>
      <div className="tile2"><span>Status</span><b style={{ color: COL[d.status] }}>{LBL[d.status] || String(d.status).toUpperCase()}</b></div>
      <div className="tile2"><span>Saldo yang diterima</span><b className="mono">{rp(d.amount)}</b></div>
      <div className="tile2"><span>Biaya admin</span><b className="mono">{rp(d.fee || 0)}</b></div>
      <div className="tile2"><span>Jumlah yang dibayar</span><b className="mono" style={{ color: 'var(--ac)' }}>{rp(pay)}</b></div>
      <div className="tile2"><span>Dibuat</span><b className="mono" style={{ fontSize: 14 }}>{new Date(d.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</b></div>
    </div>
    {d.status === 'pending' && <div className="card" style={{ textAlign: 'center' }}>
      {d.qr ? <><p className="mut" style={{ marginTop: 0 }}>Scan QRIS dan bayar tepat <b className="mono" style={{ color: 'var(--tx)' }}>{rp(pay)}</b></p>
        <img src={d.qr} alt="QRIS" style={{ width: '100%', maxWidth: 300, background: '#fff', padding: 8, borderRadius: 6 }} /></>
        : <p className="mut">Gambar QR tidak tersedia untuk tagihan ini. Buat deposit baru.</p>}
      <p className="mut"><span className="dot" />Menunggu pembayaran. Saldo masuk otomatis, halaman ini aman ditinggalkan.</p>
      <button className="btn d" disabled={busy} onClick={refresh}>Cek status</button></div>}
    {d.status === 'success' && <div className="card" style={{ color: 'var(--ac)' }}>Pembayaran diterima. Saldo sudah ditambahkan ke akunmu.</div>}
    {err && <p className="mono" style={{ fontSize: 13, color: 'var(--warn)', wordBreak: 'break-word' }}>{err}</p>}
    <div><button className="btn d" onClick={() => r.push('/riwayat-deposit')}>‹ Kembali ke Riwayat Deposit</button></div>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
