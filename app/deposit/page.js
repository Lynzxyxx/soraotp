'use client'
import { useEffect, useState } from 'react'
import Shell, { useMe } from '@/components/Shell'
import { api, watchMine, rp } from '@/lib/firebase'
function Body() {
  const me = useMe()
  const [amount, setAmount] = useState(5000), [list, setList] = useState([]), [msg, setMsg] = useState(''), [cur, setCur] = useState(null)
  useEffect(() => { if (!cur) return; const t = setInterval(async () => { try { const j = await api('/api/deposit/' + cur.id); if (j.status !== 'pending') { setCur(null); setMsg('Deposit ' + j.status) } } catch {} }, 4000); return () => clearInterval(t) }, [cur])
  useEffect(() => watchMine('deposits', me.uid, setList), [])
  async function pay() {
    try { const j = await api('/api/deposit', { method: 'POST', body: JSON.stringify({ amount: Number(amount) }) }); setCur(j); setMsg('Scan QRIS lalu bayar. Saldo masuk otomatis.') }
    catch (e) { setMsg(e.message) }
  }
  return <>
    <div className="card"><b>Form Isi Saldo</b><div className="mut">Minimal deposit Rp 5.000</div>
      <input type="number" min="5000" value={amount} onChange={e => setAmount(e.target.value)} />
      <button className="btn" style={{ width: '100%' }} onClick={pay}>Bayar Sekarang</button>{msg && <p className="mut">{msg}</p>}{cur?.qr && <img src={cur.qr} alt="QRIS" style={{ width: '100%', maxWidth: 280 }} />}</div>
    <div className="card"><b>Riwayat Deposit</b>
      {!list.length && <p className="mut">Belum ada transaksi.</p>}
      {list.map(d => <div className="item" key={d.id}><span>{new Date(d.createdAt).toLocaleString('id-ID')}<br /><small>{d.id}</small></span><span>{rp(d.amount)} <span className={'tag ' + d.status}>{d.status}</span></span></div>)}</div>
  </>
}
export default function P() { return <Shell><Body /></Shell> }
