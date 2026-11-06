'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell, { useMe } from '@/components/Shell'
import Catalog from '@/components/Catalog'
import { api, rp } from '@/lib/firebase'
function Body() {
  const me = useMe(), r = useRouter(), [err, setErr] = useState('')
  async function buy(x) {
    setErr('')
    try { const { id } = await api('/api/order', { method: 'POST', body: JSON.stringify(x) }); r.push('/pembelian/' + id) }
    catch (e) { setErr(e.message) }
  }
  return <>
    <h1 className="pt">Beli Nomor</h1><div className="mut">Saldo <span className="mono">{rp(me.saldo)}</span></div>
    {err && <div className="card" style={{ color: 'var(--bad)' }}>{err}</div>}
    <Catalog onBuy={buy} />
  </>
}
export default function P() { return <Shell><Body /></Shell> }
