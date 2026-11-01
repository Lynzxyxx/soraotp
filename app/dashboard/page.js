'use client'
import Link from 'next/link'
import Shell, { useMe } from '@/components/Shell'
import { rp } from '@/lib/firebase'
function Body() {
  const me = useMe()
  return <>
    <div className="hero"><h2>Hai <span>{me.name}</span></h2><div style={{ opacity: .8 }}>Dapatkan nomor virtual instan 24 jam dengan sistem verifikasi OTP cepat & terpercaya.</div>
      <div className="row"><Link className="btn" href="/deposit">Isi Saldo</Link><Link className="btn d" href="/beli">Beli OTP</Link></div></div>
    <div className="card"><div className="mut">Saldo</div><div className="big">{rp(me.saldo)}</div></div>
    <div className="row"><div className="card" style={{ flex: 1 }}><div className="mut">Deposit</div><div className="big">{rp(me.deposit)}</div></div>
      <div className="card" style={{ flex: 1 }}><div className="mut">Pembelian</div><div className="big">{me.pembelian || 0}</div></div></div>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
