'use client'
import { useEffect, useState } from 'react'
import Shell, { useMe } from '@/components/Shell'
import Catalog from '@/components/Catalog'
import { api, rp } from '@/lib/firebase'
function Body() {
  const me = useMe()
  const [o, setO] = useState(null), [err, setErr] = useState('')
  useEffect(() => {
    if (!o || o.status !== 'waiting') return
    const t = setInterval(async () => { try { setO({ ...(await api('/api/order/' + o.id)).order, id: o.id }) } catch {} }, 4000)
    return () => clearInterval(t)
  }, [o])
  async function buy(x) {
    setErr('')
    try { const { id } = await api('/api/order', { method: 'POST', body: JSON.stringify(x) }); setO({ id, status: 'waiting', service: x.label }) }
    catch (e) { setErr(e.message) }
  }
  async function cancel() { try { await api('/api/order/' + o.id, { method: 'DELETE' }); setO({ ...o, status: 'canceled' }) } catch (e) { setErr(e.message) } }
  return <>
    <div className="card mut">Saldo: <b>{rp(me.saldo)}</b></div>
    {err && <div className="card" style={{ color: '#f87171' }}>{err}</div>}
    {o && <div className="card"><b>{o.service}</b> <span className={'tag ' + o.status}>{o.status}</span>
      {o.number && <div className="big">{o.number}</div>}
      {o.code && <div className="big">OTP: {o.code}</div>}
      {o.status === 'waiting' && <><p className="mut">Menunggu SMS…</p><button className="btn r" onClick={cancel}>Batalkan</button></>}</div>}
    <Catalog onBuy={buy} />
  </>
}
export default function P() { return <Shell><Body /></Shell> }
