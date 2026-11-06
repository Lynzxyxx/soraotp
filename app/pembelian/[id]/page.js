'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ref, onValue } from 'firebase/database'
import Shell from '@/components/Shell'
import { api, db, rp } from '@/lib/firebase'
const WAIT = 180 // detik sebelum pesanan boleh dibatalkan (aturan provider)
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
function Body() {
  const { id } = useParams()
  const [o, setO] = useState(null), [err, setErr] = useState(''), [now, setNow] = useState(Date.now()), [cp, setCp] = useState('')
  useEffect(() => onValue(ref(db, 'orders/' + id), s => setO(s.val() ? { ...s.val() } : false), e => setErr(e.message)), [id])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { // cadangan jika webhook terlambat
    if (!o || o.status !== 'waiting') return
    const t = setInterval(() => api('/api/order/' + id).catch(() => {}), 6000)
    return () => clearInterval(t)
  }, [o?.status, id])
  const copy = (k, v) => { navigator.clipboard?.writeText(String(v)); setCp(k); setTimeout(() => setCp(''), 1500) }
  async function cancel() { setErr(''); try { await api('/api/order/' + id, { method: 'DELETE' }) } catch (e) { setErr(e.message) } }
  if (o === null) return <div className="sk" style={{ height: 180 }} />
  if (o === false) return <div className="card">Pesanan tidak ditemukan. {err && <span className="mut mono">{err}</span>}<div className="row"><Link className="btn d" href="/riwayat">Riwayat</Link></div></div>
  const age = Math.floor((now - o.createdAt) / 1000), left = Math.max(0, WAIT - age)
  return <>
    <h1 className="pt">{o.service}</h1>
    <div className="card">
      <div className="row" style={{ marginTop: 0, justifyContent: 'space-between' }}><span className={'tag ' + o.status}>{o.status}</span><span className="mut mono">{rp(o.price)}</span></div>
      <div className="mut" style={{ marginTop: 14 }}>Nomor</div>
      <div className="big">{o.number || '…'}</div>
      {o.number && <button className="btn d" onClick={() => copy('n', o.number)}>{cp === 'n' ? 'Tersalin' : 'Salin nomor'}</button>}
      <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '18px 0' }} />
      {o.status === 'waiting' && <><div><span className="dot" />Menunggu SMS masuk… <span className="mono mut">{mmss(age)}</span></div>
        <div className="row"><button className="btn r" disabled={left > 0} onClick={cancel}>{left > 0 ? 'Batalkan dalam ' + mmss(left) : 'Batalkan & refund'}</button></div></>}
      {o.status === 'success' && <><div className="mut">Kode OTP</div><div className="otp">{o.code || '—'}</div>{o.code && <button className="btn" onClick={() => copy('c', o.code)}>{cp === 'c' ? 'Tersalin' : 'Salin kode'}</button>}</>}
      {o.status === 'canceled' && <div className="mut">Pesanan dibatalkan. Saldo dikembalikan.</div>}
      {err && <p style={{ color: 'var(--bad)' }}>{err}</p>}
    </div>
    <div className="row"><Link className="btn d" href="/beli">Beli lagi</Link><Link className="btn d" href="/riwayat">Riwayat</Link></div>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
