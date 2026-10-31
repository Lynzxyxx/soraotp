'use client'
import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import Shell, { useMe } from '@/components/Shell'
import { db, rp } from '@/lib/firebase'
function Body() {
  const me = useMe(), [l, setL] = useState([]), [f, setF] = useState('')
  useEffect(() => onSnapshot(query(collection(db, 'orders'), where('uid', '==', me.uid), orderBy('createdAt', 'desc')), s => setL(s.docs.map(d => ({ id: d.id, ...d.data() })))), [])
  return <div className="card"><b>Daftar Pembelian</b>
    <select onChange={e => setF(e.target.value)}><option value="">Semua Transaksi</option><option value="success">Berhasil</option><option value="waiting">Menunggu</option><option value="canceled">Dibatalkan</option></select>
    {!l.length && <p className="mut">Belum ada transaksi pembelian.</p>}
    {l.filter(x => !f || x.status === f).map(x => <div className="item" key={x.id}><span>{x.service}<br /><small>{x.number} {x.code && '• OTP ' + x.code}</small></span><span>{rp(x.price)} <span className={'tag ' + x.status}>{x.status}</span></span></div>)}</div>
}
export default function P() { return <Shell><Body /></Shell> }
