'use client'
import { useEffect, useState } from 'react'
import Shell from '@/components/Shell'
import { rp } from '@/lib/firebase'
export default function P() {
  const [s, setS] = useState([])
  useEffect(() => { fetch('/api/services').then(r => r.json()).then(j => setS(j.data || [])) }, [])
  return <Shell><div className="card"><b>Layanan & Harga</b>
    {s.map(x => <div className="item" key={x.id}><span>{x.name}</span><b>{rp(x.price)}</b></div>)}</div></Shell>
}
