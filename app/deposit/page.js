'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Shell, { useMe } from '@/components/Shell'
import { api, watchMine, rp, ago } from '@/lib/firebase'
import { calcDeposit } from '@/lib/money'
function Body() {
  const me = useMe(), r = useRouter()
  const [amount, setAmount] = useState(10000), [cfg, setCfg] = useState({ feePercent: 0, feeFlat: 0, minDeposit: 5000 })
  const [list, setList] = useState([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { api('/api/quote').then(setCfg).catch(() => {}) }, [])
  useEffect(() => watchMine('deposits', me.uid, setList, setMsg), [me.uid])
  const a = Number(amount) || 0, { fee, total } = calcDeposit(a, cfg)
  const pending = list.find(d => d.status === 'pending')
  async function pay() {
    setBusy(true); setMsg('')
    try { const j = await api('/api/deposit', { method: 'POST', body: JSON.stringify({ amount: a }) }); r.push('/deposit/' + j.id) }
    catch (e) { setMsg(e.message); setBusy(false) }
  }
  return <>
    <h1 className="pt">Isi Saldo</h1>
    {pending && <Link href={'/deposit/' + pending.id} className="card item" style={{ borderColor: 'var(--warn)' }}><span>Ada deposit menunggu pembayaran <span className="mono">{rp(pending.pay || pending.amount)}</span></span><span style={{ color: 'var(--warn)' }}>Lanjutkan ›</span></Link>}
    <div className="card"><div className="mut">Nominal saldo (minimal {rp(cfg.minDeposit)})</div>
      <input type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} />
      <div className="chips">{[5000, 10000, 20000, 50000, 100000].map(n => <button key={n} onClick={() => setAmount(n)}>{n.toLocaleString('id-ID')}</button>)}</div>
      <div className="kv"><span className="mut">Saldo yang kamu terima</span><span className="mono">{rp(a)}</span></div>
      <div className="kv"><span className="mut">Biaya admin</span><span className="mono">{rp(fee)}</span></div>
      <div className="kv"><b>Jumlah yang harus dibayar</b><b className="mono" style={{ fontSize: 18, color: 'var(--ac)' }}>{rp(total)}</b></div>
      <button className="btn xl" style={{ width: '100%', marginTop: 12 }} disabled={busy || a < cfg.minDeposit} onClick={pay}>{busy ? 'Membuat QRIS…' : 'Bayar dengan QRIS'}</button>
      {msg && <p className="mono" style={{ fontSize: 13, color: 'var(--warn)', wordBreak: 'break-word' }}>{msg}</p>}</div>
    <div className="card"><div className="item" style={{ paddingTop: 0 }}><b>Riwayat Deposit</b><Link href="/riwayat-deposit" style={{ fontSize: 14 }}>Lihat semua</Link></div>
      {!list.length && <p className="mut">Belum ada transaksi.</p>}
      {list.slice(0, 5).map(d => <div className="item" key={d.id}><span><span className="mono">{rp(d.amount)}</span><br /><span className="mut mono" style={{ fontSize: 12 }}>{ago(d.createdAt)}</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={'tag ' + (d.status === 'pending' ? 'waiting' : d.status)}>{d.status}</span><Link className="btn d xs" href={'/deposit/' + d.id}>Detail</Link></span></div>)}</div></>
}
export default function P() { return <Shell><Body /></Shell> }
