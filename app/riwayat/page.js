'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Shell, { useMe } from '@/components/Shell'
import { watchMine, rp, ago } from '@/lib/firebase'
function Body() {
  const me = useMe(), [l, setL] = useState(null), [f, setF] = useState(''), [err, setErr] = useState('')
  useEffect(() => watchMine('orders', me.uid, setL, setErr), [me.uid])
  const rows = (l || []).filter(x => !f || x.status === f)
  return <>
    <h1 className="pt">Riwayat Pembelian</h1>
    <div className="card">
      <select value={f} onChange={e => setF(e.target.value)}><option value="">Semua</option><option value="success">Berhasil</option><option value="waiting">Menunggu</option><option value="canceled">Dibatalkan</option></select>
      {err && <p style={{ color: 'var(--bad)' }} className="mono">{err}</p>}
      {l === null && !err && <p className="mut">Memuat…</p>}
      {l && !rows.length && <p className="mut">Belum ada transaksi.</p>}
      {rows.map(x => <Link key={x.id} href={'/pembelian/' + x.id} className="item">
        <span>{String(x.service || '-')}<br /><span className="mut mono">{x.number || '-'}{x.code ? ' · ' + x.code : ''} · {ago(x.createdAt)}</span></span>
        <span style={{ textAlign: 'right' }}><span className="mono">{rp(x.price)}</span><br /><span className={'tag ' + x.status}>{x.status}</span></span></Link>)}
    </div></>
}
export default function P() { return <Shell><Body /></Shell> }
