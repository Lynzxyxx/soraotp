'use client'
import { useEffect, useState } from 'react'
import { api, rp } from '@/lib/firebase'
const lc = s => (s || '').toLowerCase()
const ini = s => (s || '?').replace(/[^a-z0-9 ]/gi, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
const STEPS = ['Aplikasi', 'Negara', 'Konfirmasi']
export default function BuyFlow({ onBuy }) {
  const [step, setStep] = useState(1), [apps, setApps] = useState(null), [cs, setCs] = useState([]), [app, setApp] = useState(null)
  const [q, setQ] = useState(''), [cq, setCq] = useState(''), [open, setOpen] = useState(''), [pm, setPm] = useState({}), [sel, setSel] = useState(null)
  const [err, setErr] = useState(''), [buying, setBuying] = useState(false)
  useEffect(() => { (async () => {
    try {
      const c = (await api('/api/catalog?type=country')).data; setCs(c)
      const d = c.find(x => lc(x.name) === 'indonesia') || c[0]
      setApps(d ? (await api('/api/catalog?type=services&country=' + encodeURIComponent(d.id))).data : [])
    } catch (e) { setErr(e.message); setApps([]) }
  })() }, [])
  async function expand(c) {
    if (open === c.id) return setOpen('')
    setOpen(c.id); if (pm[c.id]) return
    setPm(m => ({ ...m, [c.id]: { load: true } }))
    try {
      const l = (await api(`/api/catalog?type=products&country=${encodeURIComponent(c.id)}&service=${encodeURIComponent(app.id)}`)).data
      setPm(m => ({ ...m, [c.id]: { list: l } }))
    } catch (e) { setPm(m => ({ ...m, [c.id]: { error: e.message } })) }
  }
  async function buy() {
    setBuying(true); setErr('')
    try { await onBuy({ country: sel.c.id, service: app.id, product: sel.p.id, label: app.name + ' - ' + sel.p.name, app: app.name, countryName: sel.c.name, serverName: sel.p.name }) }
    catch (e) { setErr(e.message) }
    setBuying(false)
  }
  const goApp = a => { setApp(a); setOpen(''); setPm({}); setCq(''); setSel(null); setStep(2) }
  return <>
    <div className="stp">{STEPS.map((s, i) => <span key={s} className={step === i + 1 ? 'on' : step > i + 1 ? 'dn' : ''}>{s}</span>)}</div>
    {err && <div className="card" style={{ color: 'var(--bad)' }}>{err}</div>}
    <div className="stepin" key={step}>
      {step === 1 && <>
        <input className="srch" placeholder="Cari aplikasi…" value={q} onChange={e => setQ(lc(e.target.value))} />
        {apps === null && <div className="apps">{[1, 2, 3, 4, 5, 6].map(i => <div className="sk" key={i} style={{ height: 96 }} />)}</div>}
        <div className="apps">{(apps || []).filter(a => lc(a.name).includes(q)).map(a => <button className="tile" key={a.id} onClick={() => goApp(a)}>
          {a.icon ? <img src={a.icon} alt="" width="40" height="40" /> : <i>{ini(a.name)}</i>}<span>{a.name}</span></button>)}</div>
        {apps && !apps.length && !err && <p className="mut">Tidak ada aplikasi.</p>}</>}
      {step === 2 && <>
        <button className="back" onClick={() => setStep(1)}>‹ Ganti aplikasi</button>
        <div className="card" style={{ padding: 12 }}><b>{app.name}</b><span className="mut"> · pilih negara dan server</span></div>
        <input className="srch" placeholder="Cari negara…" value={cq} onChange={e => setCq(e.target.value)} />
        <div className="mut" style={{ margin: '6px 2px' }}>{cs.length} negara</div>
        {cs.filter(c => lc(c.name).includes(lc(cq))).map(c => { const m = pm[c.id]; return <div className={'acc' + (open === c.id ? ' on' : '')} key={c.id}>
          <button onClick={() => expand(c)}><span>{c.name}{c.stock != null && <span className="mut"> · stok {c.stock}</span>}</span><span className="chev">›</span></button>
          {open === c.id && <div className="accb">
            {(!m || m.load) && <p className="mut"><span className="spin" /> Memuat server…</p>}
            {m?.error && <p style={{ color: 'var(--bad)' }}>{m.error}</p>}
            {m?.list && !m.list.length && <p className="mut">Stok kosong.</p>}
            {m?.list?.map(p => <div className="item" key={p.id}><span>{p.name}{p.stock != null && <span className="mut"> · stok {p.stock}</span>}<br /><span className="mono">{rp(p.price)}</span></span>
              <button className="btn" onClick={() => { setSel({ c, p }); setStep(3) }}>Pilih</button></div>)}</div>}
        </div> })}</>}
      {step === 3 && sel && <>
        <button className="back" onClick={() => setStep(2)}>‹ Kembali ke server</button>
        <div className="card">
          <div className="kv"><span className="mut">Aplikasi</span><b>{app.name}</b></div>
          <div className="kv"><span className="mut">Negara</span><b>{sel.c.name}</b></div>
          <div className="kv"><span className="mut">Server</span><b className="mono">{sel.p.name}</b></div>
          {sel.p.stock != null && <div className="kv"><span className="mut">Stok</span><b className="mono">{sel.p.stock}</b></div>}
          <div className="kv"><span className="mut">Harga</span><b className="mono" style={{ fontSize: 18 }}>{rp(sel.p.price)}</b></div></div>
        <p className="mut">Harga dicek ulang ke provider saat pembelian. Nomor langsung dipesan setelah kamu menekan tombol di bawah.</p>
        <button className="btn xl" style={{ width: '100%' }} disabled={buying} onClick={buy}>{buying ? 'Memproses…' : 'Beli sekarang — ' + rp(sel.p.price)}</button></>}
    </div></>
}
