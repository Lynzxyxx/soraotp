'use client'
import Link from 'next/link'
import Shell, { useMe } from '@/components/Shell'
import { rp } from '@/lib/firebase'
function Body() {
  const me = useMe()
  return <>
    <div className="hero"><h2>Halo <span>@{(me.email || '').split('@')[0]}</span></h2>
      <div className="mut">Saldo</div><div className="big">{rp(me.saldo)}</div>
      <div className="row"><Link className="btn" href="/beli">Beli nomor</Link><Link className="btn d" href="/deposit">Isi saldo</Link></div></div>
    <div className="stats" style={{ gridTemplateColumns: '1fr 1fr' }}><div><b>{rp(me.deposit)}</b><span>Total deposit</span></div><div><b>{me.pembelian || 0}</b><span>Pembelian</span></div></div>
    <Link className="card item" href="/riwayat"><span>Lihat riwayat pembelian</span><span className="mut">›</span></Link>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
