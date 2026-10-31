'use client'
import { useEffect, useState } from 'react'
import Shell, { useMe } from '@/components/Shell'
import { api, rp } from '@/lib/firebase'
function Body() {
  const me = useMe()
  const [s, setS] = useState([]), [q, setQ] = useState(''), [o, setO] = useState(null), [err, setErr] = useState('')
  useEffect(() => { fetch('/api/services').then(r => r.json()).then(j => setS(j.data || [])) }, [])
  useEffect(() => {
    if (!o || o.status !== 'waiting') return
    const t = setInterval(async () => { try { setO({ ...(await api('/api/order/' + o.id)).order, id: o.id }) } catch {} }, 4000)
    return () => clearInterval(t)
  }, [o])
  async function buy(x) {
    setErr('')
    try { const { id } = await api('/api/order', { method: 'POST', body: JSON.stringify({ serviceId: x.id }) }); setO({ id, status: 'waiting', service: x.name }) }
    catch (e) { setErr(e.message) }
  }
  async function cancel() { try { await api('/api/order/' + o.id, { method: 'DELETE' }); setO({ ...o, status: 'canceled' }) } catch (e) { setErr(e.message) } }
  return <>
    <div className="card mut">Saldo: <b>{rp(me.saldo)}</b></div>
    {err && <div className="card" style={{ color: '#dc2626' }}>{err}</div>}
    {o && <div className="card"><b>{o.service}</b> <span className={'tag ' + o.status}>{o.status}</span>
      {o.number && <div className="big">{o.number}</div>}
      {o.code && <div className="big" style={{ color: '#16a34a' }}>OTP: {o.code}</div>}
      {o.status === 'waiting' && <><p className="mut">Menunggu SMS…</p><button className="btn r" onClick={cancel}>Batalkan</button></>}</div>}
    <div className="card"><input placeholder="Cari layanan…" onChange={e => setQ(e.target.value.toLowerCase())} />
      {s.filter(x => x.name.toLowerCase().includes(q)).map(x => <div className="item" key={x.id}><span>{x.name}<br /><small>{rp(x.price)}</small></span><button className="btn" onClick={() => buy(x)}>Beli</button></div>)}</div>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
