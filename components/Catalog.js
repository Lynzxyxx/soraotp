'use client'
import { useEffect, useState } from 'react'
import { api, rp } from '@/lib/firebase'
const lc = s => (s || '').toLowerCase()
export default function Catalog({ onBuy }) {
  const [cs, setCs] = useState([]), [c, setC] = useState(null), [sheet, setSheet] = useState(false), [cq, setCq] = useState('')
  const [ss, setSs] = useState([]), [q, setQ] = useState(''), [sv, setSv] = useState(null), [ps, setPs] = useState(null)
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [buying, setBuying] = useState('')
  async function go(path, cb) { setBusy(true); setErr(''); try { cb((await api(path)).data) } catch (e) { setErr(e.message) } setBusy(false) }
  useEffect(() => { go('/api/catalog?type=country', l => {
    setCs(l); let saved = ''; try { saved = localStorage.getItem('sora_country') } catch {}
    setC(l.find(x => x.id === saved) || l.find(x => lc(x.name) === 'indonesia') || l[0] || null)
  }) }, [])
  useEffect(() => { if (c) { setSv(null); setPs(null); setSs([]); go('/api/catalog?type=services&country=' + encodeURIComponent(c.id), setSs) } }, [c])
  const pickC = x => { setC(x); setSheet(false); setCq(''); try { localStorage.setItem('sora_country', x.id) } catch {} }
  const pickS = s => { setSv(s); setPs(null); go(`/api/catalog?type=products&country=${encodeURIComponent(c.id)}&service=${encodeURIComponent(s.id)}`, setPs) }
  async function buy(p) { setBuying(p.id); try { await onBuy({ country: c.id, service: sv.id, product: p.id, label: sv.name + ' - ' + p.name }) } finally { setBuying('') } }
  return <div className="card">
    <div className="mut">Negara</div>
    <button className="pick" onClick={() => setSheet(true)}><span>{c?.name || 'Memuat…'}</span><span className="mut">Ganti</span></button>
    {!sv && <input placeholder="Cari aplikasi…" value={q} onChange={e => setQ(lc(e.target.value))} />}
    {err && <p style={{ color: 'var(--bad)' }}>{err}</p>}{busy && !err && <p className="mut">Memuat…</p>}
    {!sv && ss.filter(s => lc(s.name).includes(q)).map(s => <a key={s.id} className="item" href="#" onClick={e => { e.preventDefault(); pickS(s) }}><span>{s.name}</span><span className="mut">›</span></a>)}
    {sv && <><div className="item"><b>{sv.name}</b><button className="btn d" onClick={() => setSv(null)}>Kembali</button></div>
      {ps && !ps.length && <p className="mut">Stok kosong.</p>}
      {(ps || []).map(p => <div className="item" key={p.id}><span>{p.name}{p.stock != null && <span className="mut"> · stok {p.stock}</span>}<br /><span className="mono">{rp(p.price)}</span></span>
        {onBuy && <button className="btn" disabled={!!buying} onClick={() => buy(p)}>{buying === p.id ? '…' : 'Beli'}</button>}</div>)}</>}
    <div className={'sback' + (sheet ? ' on' : '')} onClick={() => setSheet(false)} />
    <div className={'sheet' + (sheet ? ' on' : '')}><b>Pilih negara</b><input placeholder="Cari negara…" value={cq} onChange={e => setCq(e.target.value)} />
      <div className="lst">{cs.filter(x => lc(x.name).includes(lc(cq))).map(x => <a key={x.id} href="#" className="item" onClick={e => { e.preventDefault(); pickC(x) }}><span>{x.name}</span>{c?.id === x.id && <span style={{ color: 'var(--ac)' }}>✓</span>}</a>)}</div></div>
  </div>
}
