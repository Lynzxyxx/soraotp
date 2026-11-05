'use client'
import { useEffect, useState } from 'react'
import { api, rp } from '@/lib/firebase'
export default function Catalog({ onBuy }) {
  const [cs, setCs] = useState([]), [c, setC] = useState(''), [ss, setSs] = useState([]), [q, setQ] = useState('')
  const [sv, setSv] = useState(null), [ps, setPs] = useState(null), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function go(path, cb) { setBusy(true); setErr(''); try { cb((await api(path)).data) } catch (e) { setErr(e.message) } setBusy(false) }
  useEffect(() => { go('/api/catalog?type=country', l => { setCs(l); if (l[0]) setC(l[0].id) }) }, [])
  useEffect(() => { if (c) { setSv(null); setPs(null); go('/api/catalog?type=services&country=' + encodeURIComponent(c), setSs) } }, [c])
  const pick = s => { setSv(s); setPs(null); go(`/api/catalog?type=products&country=${encodeURIComponent(c)}&service=${encodeURIComponent(s.id)}`, setPs) }
  return <div className="card">
    <select value={c} onChange={e => setC(e.target.value)}>{cs.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
    {!sv && <input placeholder="Cari aplikasi…" onChange={e => setQ(e.target.value.toLowerCase())} />}
    {err && <p style={{ color: '#f87171' }}>{err}</p>}{busy && <p className="mut">Memuat…</p>}
    {!sv && ss.filter(s => (s.name || '').toLowerCase().includes(q)).map(s => <div className="item" key={s.id}><span>{s.name}</span><button className="btn d" onClick={() => pick(s)}>Lihat</button></div>)}
    {sv && <><div className="item"><b>{sv.name}</b><button className="btn d" onClick={() => setSv(null)}>Kembali</button></div>
      {ps && !ps.length && <p className="mut">Stok kosong.</p>}
      {(ps || []).map(p => <div className="item" key={p.id}><span>{p.name}<br /><small className="mut">Stok: {p.stock ?? '-'} • {rp(p.price)}</small></span>
        {onBuy ? <button className="btn" onClick={() => onBuy({ country: c, service: sv.id, product: p.id, label: sv.name + ' - ' + p.name })}>Beli</button> : <b>{rp(p.price)}</b>}</div>)}</>}
  </div>
}
