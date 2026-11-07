'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Shell, { useMe } from '@/components/Shell'
import { watchMine, rp, ago } from '@/lib/firebase'
function Body() {
  const me = useMe(), [l, setL] = useState(null), [f, setF] = useState(''), [err, setErr] = useState('')
  useEffect(() => watchMine('deposits', me.uid, setL, setErr), [me.uid])
  const rows = (l || []).filter(x => !f || x.status === f)
  return <>
    <h1 className="pt">Riwayat Deposit</h1>
    <div className="card">
      <select value={f} onChange={e => setF(e.target.value)}><option value="">Semua</option><option value="success">Berhasil</option><option value="pending">Menunggu pembayaran</option></select>
      {err && <p style={{ color: 'var(--bad)' }} className="mono">{err}</p>}
      {l === null && !err && <p className="mut">Memuat…</p>}
      {l && !rows.length && <p className="mut">Belum ada transaksi.</p>}
      {rows.map(d => <div className="item" key={d.id}>
        <span><span className="mono">{rp(d.amount)}</span>{d.pay && d.pay !== d.amount && <span className="mut mono" style={{ fontSize: 12 }}> (bayar {rp(d.pay)})</span>}<br /><span className="mut mono" style={{ fontSize: 12 }}>{ago(d.createdAt)}</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={'tag ' + (d.status === 'pending' ? 'waiting' : d.status)}>{d.status}</span><Link className="btn d xs" href={'/deposit/' + d.id}>Detail</Link></span></div>)}
    </div></>
}
export default function P() { return <Shell><Body /></Shell> }
