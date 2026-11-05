'use client'
import { useEffect, useState } from 'react'
export default function Stats() {
  const [s, setS] = useState({})
  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(setS).catch(() => {}) }, [])
  const f = v => (v == null ? '-' : Number(v).toLocaleString('id-ID') + '+')
  return <div className="stats">{[['Layanan', s.layanan], ['Negara', s.negara], ['Pengguna', s.pengguna], ['Pembelian', s.pembelian]].map(([l, v]) =>
    <div className="card st" key={l}><div className="big">{f(v)}</div><div className="mut">{l}</div></div>)}</div>
}
