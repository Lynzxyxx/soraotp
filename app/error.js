'use client'
export default function Error({ error, reset }) {
  return <div style={{ padding: 24 }}><b>Terjadi kesalahan di halaman ini</b>
    <p className="mut mono" style={{ wordBreak: 'break-word' }}>{error?.message}</p>
    <button className="btn" onClick={reset}>Coba lagi</button> <a className="btn d" href="/dashboard">Ke dashboard</a></div>
}
