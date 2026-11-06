'use client'
import { useEffect, useState } from 'react'
import Shell, { useMe } from '@/components/Shell'
import { api, watchMine, rp, ago } from '@/lib/firebase'
function Body() {
  const me = useMe()
  const [amount, setAmount] = useState(10000), [list, setList] = useState([]), [msg, setMsg] = useState(''), [cur, setCur] = useState(null), [busy, setBusy] = useState(false)
  useEffect(() => watchMine('deposits', me.uid, setList, setMsg), [me.uid])
  useEffect(() => {
    if (!cur) return
    const t = setInterval(async () => { try { const j = await api('/api/deposit/' + cur.id); if (j.status !== 'pending') { setCur(null); setMsg(j.status === 'success' ? 'Deposit berhasil, saldo bertambah.' : 'Deposit ' + j.status) } } catch {} }, 4000)
    return () => clearInterval(t)
  }, [cur])
  async function pay() {
    setBusy(true); setMsg('')
    try { const j = await api('/api/deposit', { method: 'POST', body: JSON.stringify({ amount: Number(amount) }) }); setCur(j); if (!j.qr) setMsg('Tagihan dibuat tetapi provider tidak mengirim gambar QR.') }
    catch (e) { setMsg(e.message) }
    setBusy(false)
  }
  return <>
    <h1 className="pt">Isi Saldo</h1>
    <div className="card"><div className="mut">Nominal (minimal Rp 5.000)</div>
      <input type="number" inputMode="numeric" min="5000" value={amount} onChange={e => setAmount(e.target.value)} />
      <div className="chips">{[5000, 10000, 20000, 50000, 100000].map(n => <button key={n} onClick={() => setAmount(n)}>{n.toLocaleString('id-ID')}</button>)}</div>
      <button className="btn lg" style={{ width: '100%' }} disabled={busy} onClick={pay}>{busy ? 'Membuat QRIS…' : 'Bayar dengan QRIS'}</button>
      {msg && <p className="mono" style={{ fontSize: 13, color: 'var(--warn)', wordBreak: 'break-word' }}>{msg}</p>}
      {cur?.qr && <><img src={cur.qr} alt="QRIS" style={{ width: '100%', maxWidth: 280, background: '#fff', padding: 8, borderRadius: 6 }} /><p className="mut"><span className="dot" />Menunggu pembayaran… saldo masuk otomatis.</p></>}</div>
    <div className="card"><b>Riwayat Deposit</b>
      {!list.length && <p className="mut">Belum ada transaksi.</p>}
      {list.map(d => <div className="item" key={d.id}><span className="mut mono">{ago(d.createdAt)}</span><span><span className="mono">{rp(d.amount)}</span> <span className={'tag ' + (d.status === 'pending' ? 'waiting' : d.status)}>{d.status}</span></span></div>)}</div></>
}
export default function P() { return <Shell><Body /></Shell> }
