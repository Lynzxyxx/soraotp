'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, api, rp, ago } from '@/lib/firebase'
import ThemeToggle from '@/components/ThemeToggle'
const TABS = [['ringkasan', 'Ringkasan'], ['pengguna', 'Pengguna'], ['pesanan', 'Pesanan'], ['deposit', 'Deposit'], ['rekap', 'Rekap & Bot'], ['pengaturan', 'Pengaturan']]
const Stat = ({ l, v }) => <div className="card sc"><div className="mut">{l}</div><div className="big">{v}</div></div>
const Badge = ({ ok, children }) => <span className={'tag ' + (ok ? 'success' : 'canceled')}>{children}</span>

function AdminLogin() {
  const [f, setF] = useState({}), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function go(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { await signInWithEmailAndPassword(auth, f.email, f.pw) } catch (x) { setErr((x.code || x.message).replace('auth/', '').replace(/-/g, ' ')) }
    setBusy(false)
  }
  return <div className="lg"><div className="tr"><ThemeToggle /></div>
    <form className="lgcard" style={{ maxWidth: 400, display: 'block' }} onSubmit={go}>
      <div className="lgform" style={{ maxWidth: 'none' }}><h1>ADMIN SORAOTP</h1><p className="sub">Masuk dengan akun owner</p>
        <label>Email</label><input type="email" required onChange={e => setF({ ...f, email: e.target.value })} />
        <label>Password</label><input type="password" required onChange={e => setF({ ...f, pw: e.target.value })} />
        {err && <div className="err">{err}</div>}
        <button className="lgbtn" style={{ marginTop: 16 }} disabled={busy}>{busy ? 'Masuk…' : 'MASUK'}</button></div></form></div>
}
function Summary() {
  const [s, setS] = useState(null), [e, setE] = useState('')
  useEffect(() => { api('/api/admin/data?type=stats').then(setS).catch(x => setE(x.message)) }, [])
  if (e) return <p style={{ color: 'var(--bad)' }} className="mono">{e}</p>
  if (!s) return <div className="sk" style={{ height: 200 }} />
  const p = s.conn.provider
  return <>
    <div className="sg"><Stat l="Pengguna" v={s.pengguna} /><Stat l="Total pesanan" v={s.pesanan} /><Stat l="Pesanan berjalan" v={s.berjalan} />
      <Stat l="Omzet pesanan" v={rp(s.omzet)} /><Stat l="Estimasi laba pesanan" v={rp(s.laba)} /><Stat l="Total deposit sukses" v={rp(s.deposit)} /><Stat l="Total saldo pengguna" v={rp(s.saldoUser)} /></div>
    <div className="card" style={{ marginTop: 12 }}><b>Status koneksi</b>
      <div className="item"><span>Deposit otomatis (BuatQRIS)</span><Badge ok={s.conn.qris}>{s.conn.qris ? 'Terkonfigurasi' : 'Env belum diisi'}</Badge></div>
      <div className="item"><span>Provider layanan (NusaOTP){p.ok && typeof p.saldo !== 'object' && <span className="mut mono"> · saldo {rp(p.saldo)}</span>}</span><Badge ok={p.ok}>{p.ok ? 'Terhubung' : 'Gagal'}</Badge></div>
      {!p.ok && <p className="mono" style={{ color: 'var(--bad)', fontSize: 12 }}>{p.error}</p>}
      <div className="item"><span>Database</span><Badge ok>Firebase Realtime Database aktif</Badge></div>
      <div className="item"><span>Notifikasi Telegram</span><Badge ok={s.conn.telegram}>{s.conn.telegram ? 'Terkonfigurasi' : 'Env belum diisi'}</Badge></div></div></>
}
function Users() {
  const [users, setUsers] = useState([]), [q, setQ] = useState(''), [err, setErr] = useState('')
  const load = async (s = q) => { try { setUsers((await api('/api/admin/users?q=' + encodeURIComponent(s))).users); setErr('') } catch (e) { setErr(e.message) } }
  useEffect(() => { load('') }, [])
  async function act(uid, action, value) { try { await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ uid, action, value }) }); load() } catch (e) { alert(e.message) } }
  return <>
    <div className="card"><input placeholder="Cari email / nama / WA…" value={q} onChange={e => { setQ(e.target.value); load(e.target.value) }} />{err && <p style={{ color: 'var(--bad)' }}>{err}</p>}</div>
    <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>{users.map(u => <div className="card" key={u.uid}>
      <b>{u.name}</b> <span className="tag">{u.role || 'user'}</span> {u.blocked && <span className="tag canceled">diblokir</span>} {u.saldoFrozen && <span className="tag waiting">saldo dibekukan</span>}
      <div className="mut">{u.email} • {u.wa} • Saldo <span className="mono">{rp(u.saldo)}</span></div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => { const v = prompt('Tambah saldo (negatif untuk kurangi):'); v && act(u.uid, 'addSaldo', v) }}>+/- Saldo</button>
        <button className="btn d" onClick={() => { const v = prompt('Set saldo menjadi:'); v !== null && act(u.uid, 'setSaldo', v) }}>Set Saldo</button>
        <button className="btn d" onClick={() => act(u.uid, 'freeze', !u.saldoFrozen)}>{u.saldoFrozen ? 'Buka Saldo' : 'Banned Saldo'}</button>
        <button className="btn d" onClick={() => { const v = prompt('Password baru (min 6):'); v && act(u.uid, 'password', v) }}>Ganti PW</button>
        <button className="btn r" onClick={() => act(u.uid, 'block', !u.blocked)}>{u.blocked ? 'Buka Blokir' : 'Blokir'}</button>
        <select value={u.role || 'user'} onChange={e => act(u.uid, 'role', e.target.value)} style={{ width: 'auto', margin: 0 }}><option value="user">user</option><option value="reseller">reseller</option><option value="owner">owner</option></select>
      </div></div>)}</div></>
}
function List({ type }) {
  const [l, setL] = useState(null), [e, setE] = useState('')
  useEffect(() => { setL(null); api('/api/admin/data?type=' + type).then(j => setL(j.data)).catch(x => setE(x.message)) }, [type])
  if (e) return <p style={{ color: 'var(--bad)' }} className="mono">{e}</p>
  if (!l) return <div className="sk" style={{ height: 200 }} />
  return <div className="card">{!l.length && <p className="mut">Belum ada data.</p>}
    {l.map(x => type === 'orders'
      ? <div className="item" key={x.id}><span>{x.app || x.service} <span className="mut">· {x.countryName}</span><br /><span className="mut mono" style={{ fontSize: 12 }}>{x.email} · {x.number || '-'} · {ago(x.createdAt)}</span></span>
        <span style={{ textAlign: 'right' }}><span className="mono">{rp(x.price)}</span>{x.cost != null && <span className="mut mono" style={{ fontSize: 12 }}><br />laba {rp(x.price - x.cost)}</span>}<br /><span className={'tag ' + x.status}>{x.status}</span>
          {x.status === 'waiting' && <><br /><span style={{ display: 'inline-flex', gap: 6, marginTop: 6 }}>
            <button className="btn d xs" onClick={async () => { const c = prompt('Masukkan kode OTP dari dashboard NusaOTP:'); if (!c) return; try { await api('/api/admin/order', { method: 'POST', body: JSON.stringify({ id: x.id, action: 'otp', code: c }) }); setL(l.map(y => y.id === x.id ? { ...y, status: 'success', code: c } : y)) } catch (e) { alert(e.message) } }}>Isi OTP</button>
            <button className="btn r xs" onClick={async () => { if (!confirm('Batalkan pesanan dan kembalikan saldo ke pembeli?')) return; try { await api('/api/admin/order', { method: 'POST', body: JSON.stringify({ id: x.id, action: 'cancel' }) }); setL(l.map(y => y.id === x.id ? { ...y, status: 'canceled' } : y)) } catch (e) { alert(e.message) } }}>Batalkan</button></span></>}</span></div>
      : <div className="item" key={x.id}><span>{x.email}<br /><span className="mut mono" style={{ fontSize: 12 }}>{ago(x.createdAt)} · trx {x.trxId || '-'}</span></span>
        <span style={{ textAlign: 'right' }}><span className="mono">{rp(x.amount)}</span>{x.pay && x.pay !== x.amount && <span className="mut mono" style={{ fontSize: 12 }}><br />bayar {rp(x.pay)}</span>}<br /><span className={'tag ' + (x.status === 'pending' ? 'waiting' : x.status)}>{x.status}</span>
          {x.status === 'pending' && <><br /><button className="btn d xs" style={{ marginTop: 6 }} onClick={async () => { if (!confirm('Pastikan pembayaran ' + rp(x.pay || x.amount) + ' sudah masuk di dashboard BuatQRIS. Kredit saldo ' + rp(x.amount) + ' ke ' + x.email + '?')) return; try { await api('/api/admin/deposit', { method: 'POST', body: JSON.stringify({ id: x.id }) }); setL(l.map(y => y.id === x.id ? { ...y, status: 'success' } : y)) } catch (e) { alert(e.message) } }}>Tandai lunas</button></>}</span></div>)}</div>
}
function Settings() {
  const [s, setS] = useState(null), [m, setM] = useState(''), [dbg, setDbg] = useState(null), [pp, setPp] = useState('/v2/order/'), [pr, setPr] = useState(''), [dgId, setDgId] = useState(''), [dg, setDg] = useState(null), [dgBusy, setDgBusy] = useState(false)
  useEffect(() => { api('/api/admin/data?type=settings').then(j => setS(j.settings)).catch(x => setM(x.message)) }, [])
  if (!s) return m ? <p style={{ color: 'var(--bad)' }}>{m}</p> : <div className="sk" style={{ height: 200 }} />
  const F = (k, label, hint) => <div className="fld"><label>{label}</label><input type="number" step="any" value={s[k]} onChange={e => setS({ ...s, [k]: e.target.value })} /><small>{hint}</small></div>
  async function save() { setM(''); try { setS((await api('/api/admin/settings', { method: 'POST', body: JSON.stringify(s) })).settings); setM('Tersimpan. Berlaku untuk transaksi berikutnya.') } catch (e) { setM(e.message) } }
  return <>
    <div className="card"><b>Margin harga per transaksi</b><p className="mut">Persen di atas harga modal NusaOTP. Contoh: modal Rp 2.000 dengan margin 25% dijual Rp 2.500. Pastikan margin cukup menutup biaya lain (misalnya fee BuatQRIS).</p>
      {F('marginUser', 'Margin pengguna biasa (%)', 'Dipakai untuk akun role user')}{F('marginReseller', 'Margin reseller/owner (%)', 'Lebih kecil dari margin pengguna agar reseller dapat harga lebih murah')}</div>
    <div className="card"><b>Biaya deposit</b><p className="mut">Ditambahkan ke jumlah yang harus dibayar pengguna. Saldo yang diterima tetap sesuai nominal yang dipilih.</p>
      {F('feePercent', 'Biaya admin (%)', 'Dihitung dari nominal, dibulatkan ke atas')}{F('feeFlat', 'Biaya tetap (Rp)', 'Ditambahkan di atas biaya persen')}{F('minDeposit', 'Minimal deposit (Rp)', 'Antara 1.000 dan 1.000.000')}</div>
    <div className="row"><button className="btn" onClick={save}>Simpan pengaturan</button>
      <button className="btn d" onClick={async () => { try { await api('/api/notify/test', { method: 'POST' }); alert('Notifikasi tes terkirim ke Telegram') } catch (e) { alert(e.message) } }}>Tes Telegram</button></div>
    <div className="card" style={{ marginTop: 12 }}><b>Webhook NusaOTP</b><p className="mut">Supaya OTP masuk otomatis ke halaman pesanan. Butuh env NUSA_WEBHOOK_SECRET.</p>
      <div className="row" style={{ marginTop: 0 }}>
        <button className="btn" onClick={async () => { try { const j = await api('/api/admin/webhook', { method: 'POST' }); alert('Webhook didaftarkan: ' + j.url + '\nRespon provider: ' + JSON.stringify(j.result)) } catch (e) { alert(e.message) } }}>Daftarkan webhook</button>
        <button className="btn d" onClick={async () => { try { setDbg(await api('/api/admin/data?type=debug')) } catch (e) { alert(e.message) } }}>Lihat webhook terakhir</button></div>
      {dbg && <pre className="mono" style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 10 }}>{dbg.lastWebhook ? new Date(dbg.lastWebhook.at).toLocaleString('id-ID') + '\n' + dbg.lastWebhook.body : 'Belum ada webhook yang masuk.'}{dbg.rejected ? '\n\nDitolak (key salah) terakhir: ' + new Date(dbg.rejected.at).toLocaleString('id-ID') : ''}</pre>}</div>
    <div className="card" style={{ marginTop: 12 }}><b>Diagnosa NusaOTP</b>
      <p className="mut">Mencari alamat cek status yang benar supaya OTP masuk otomatis. Isi ID order NusaOTP (angka setelah # di halaman pesanan, contoh 1021072), lalu jalankan.</p>
      <input value={dgId} onChange={e => setDgId(e.target.value)} placeholder="ID order NusaOTP" inputMode="numeric" />
      <div className="row" style={{ marginTop: 0 }}>
        <button className="btn" disabled={dgBusy || !dgId} onClick={async () => { setDgBusy(true); setDg(null); try { setDg((await api('/api/admin/diagnose', { method: 'POST', body: JSON.stringify({ orderId: dgId }) })).results) } catch (e) { alert(e.message) } setDgBusy(false) }}>{dgBusy ? 'Menguji…' : 'Jalankan diagnosa'}</button>
        <button className="btn d" onClick={async () => { try { setS((await api('/api/admin/settings', { method: 'POST', body: JSON.stringify({ nusaStatusPath: '', nusaStatusMethod: 'GET' }) })).settings); setM('Endpoint status kembali ke otomatis.') } catch (e) { setM(e.message) } }}>Pakai otomatis</button></div>
      <p className="mut" style={{ fontSize: 13 }}>Endpoint status aktif: <span className="mono">{s.nusaStatusPath ? `${s.nusaStatusMethod} ${s.nusaStatusPath}` : 'otomatis'}</span></p>
      {dg && dg.map((x, i) => <div className="item" key={i} style={{ alignItems: 'flex-start' }}>
        <span style={{ minWidth: 0 }}><span className="mono" style={{ fontSize: 12 }}>{x.method} {x.tpl || x.path}</span><br /><span className="mono mut" style={{ fontSize: 11, wordBreak: 'break-all' }}>{x.body}</span></span>
        <span style={{ textAlign: 'right' }}><span className={'tag ' + (x.status === 200 ? 'success' : x.status === 404 || !x.status ? 'canceled' : 'waiting')}>{x.status || 'ERR'}</span>
          {x.status === 200 && x.tpl && <><br /><button className="btn xs" style={{ marginTop: 6 }} onClick={async () => { try { setS((await api('/api/admin/settings', { method: 'POST', body: JSON.stringify({ nusaStatusPath: x.tpl, nusaStatusMethod: x.method }) })).settings); setM('Endpoint status disimpan: ' + x.method + ' ' + x.tpl) } catch (e) { setM(e.message) } }}>Pakai</button></>}</span></div>)}</div>
    <div className="card" style={{ marginTop: 12 }}><b>Uji endpoint NusaOTP (GET)</b><p className="mut">Untuk mencari endpoint yang benar. Hanya membaca data, tidak membuat pesanan. Contoh: /v2/order/1021072</p>
      <input value={pp} onChange={e => setPp(e.target.value)} placeholder="/v2/..." />
      <button className="btn d" onClick={async () => { setPr('…'); try { const j = await api('/api/admin/probe', { method: 'POST', body: JSON.stringify({ path: pp }) }); setPr('HTTP ' + j.status + '\n' + j.body) } catch (e) { setPr(e.message) } }}>Kirim</button>
      {pr && <pre className="mono" style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 10 }}>{pr}</pre>}</div>
    {m && <p className="mono" style={{ fontSize: 13, color: 'var(--warn)' }}>{m}</p>}</>
}
const NOTIF = [['register', 'Pengguna baru daftar'], ['login', 'Login pengguna'], ['depositNew', 'Deposit dibuat'], ['depositOk', 'Deposit berhasil'], ['orderNew', 'Pesanan baru'], ['orderOk', 'Pesanan selesai (OTP diterima)'], ['orderCancel', 'Pesanan dibatalkan'], ['admin', 'Aksi admin']]
function Recap() {
  const [s, setS] = useState(null), [m, setM] = useState(''), [img, setImg] = useState(''), [busy, setBusy] = useState('')
  useEffect(() => { api('/api/admin/data?type=settings').then(j => setS(j.settings)).catch(x => setM(x.message)) }, [])
  if (!s) return m ? <p style={{ color: 'var(--bad)' }}>{m}</p> : <div className="sk" style={{ height: 200 }} />
  const body = () => JSON.stringify({ recapFormat: s.recapFormat, recapPeriod: s.recapPeriod, recapAuto: s.recapAuto, ...Object.fromEntries(NOTIF.map(([k]) => ['n_' + k, s['n_' + k]])) })
  const run = (name, fn) => async () => { setBusy(name); setM(''); try { await fn() } catch (e) { setM(e.message) } setBusy('') }
  const save = run('save', async () => { setS((await api('/api/admin/settings', { method: 'POST', body: body() })).settings); setM('Pengaturan disimpan.') })
  const kirim = run('kirim', async () => { await api('/api/admin/recap', { method: 'POST', body: JSON.stringify({ period: s.recapPeriod, format: s.recapFormat }) }); setM('Rekap terkirim ke Telegram.') })
  const preview = run('prev', async () => {
    const tok = await auth.currentUser.getIdToken(), r = await fetch('/api/admin/recap?period=' + s.recapPeriod, { headers: { Authorization: 'Bearer ' + tok } })
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Gagal membuat gambar (HTTP ' + r.status + ')')
    setImg(URL.createObjectURL(await r.blob()))
  })
  const setup = run('setup', async () => { await api('/api/admin/telegram-setup', { method: 'POST' }); setM('Perintah bot aktif. Kirim /help ke bot di Telegram.') })
  const mail = run('mail', async () => { const j = await api('/api/admin/mail-test', { method: 'POST' }); setM('Email tes terkirim ke ' + j.to + '. Cek inbox/spam.') })
  const test = run('test', async () => { await api('/api/notify/test', { method: 'POST' }); setM('Pesan tes terkirim ke Telegram.') })
  const sel = (k, opts) => <select value={s[k]} onChange={e => setS({ ...s, [k]: e.target.value })}>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
  return <>
    <div className="card"><b>Rekap ke Telegram</b><p className="mut">Ringkasan pengguna, deposit, dan pesanan. Pilih bentuknya, lalu kirim kapan saja atau jadwalkan otomatis.</p>
      <div className="fld"><label>Bentuk rekap</label>{sel('recapFormat', [['text', 'Teks'], ['image', 'Gambar'], ['both', 'Teks + Gambar']])}</div>
      <div className="fld"><label>Periode</label>{sel('recapPeriod', [['today', 'Hari ini'], ['7d', '7 hari terakhir'], ['30d', '30 hari terakhir'], ['all', 'Semua waktu']])}</div>
      <label className="chk" style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '12px 0' }}><input type="checkbox" style={{ width: 18, margin: 0 }} checked={!!s.recapAuto} onChange={e => setS({ ...s, recapAuto: e.target.checked ? 1 : 0 })} />Kirim otomatis tiap malam pukul 22.00 WIB</label>
      <p className="mut" style={{ fontSize: 13 }}>Rekap otomatis butuh env CRON_SECRET di Vercel (string acak panjang).</p>
      <div className="row"><button className="btn" disabled={!!busy} onClick={kirim}>{busy === 'kirim' ? 'Mengirim…' : 'Kirim rekap sekarang'}</button>
        <button className="btn d" disabled={!!busy} onClick={preview}>{busy === 'prev' ? 'Membuat…' : 'Pratinjau gambar'}</button>
        <button className="btn d" disabled={!!busy} onClick={save}>Simpan</button></div>
      {img && <img src={img} alt="Pratinjau rekap" style={{ width: '100%', maxWidth: 420, marginTop: 14, borderRadius: 8, border: '1px solid var(--line)' }} />}</div>
    <div className="card" style={{ marginTop: 12 }}><b>Notifikasi bot</b><p className="mut">Pilih peristiwa yang dikirim ke Telegram.</p>
      {NOTIF.map(([k, t]) => <label key={k} className="chk" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0' }}><input type="checkbox" style={{ width: 18, margin: 0 }} checked={s['n_' + k] !== 0} onChange={e => setS({ ...s, ['n_' + k]: e.target.checked ? 1 : 0 })} />{t}</label>)}
      <div className="row"><button className="btn" disabled={!!busy} onClick={save}>Simpan pengaturan</button></div></div>
    <div className="card" style={{ marginTop: 12 }}><b>Perintah bot</b><p className="mut">Aktifkan supaya bot menjawab perintah dari chat admin: /rekap, /status, /cari email, /help.</p>
      <div className="row" style={{ marginTop: 0 }}><button className="btn d" disabled={!!busy} onClick={setup}>Aktifkan perintah bot</button><button className="btn d" disabled={!!busy} onClick={test}>Tes Telegram</button><button className="btn d" disabled={!!busy} onClick={mail}>Tes email OTP</button></div></div>
    {m && <p className="mono" style={{ fontSize: 13, color: 'var(--warn)', wordBreak: 'break-word' }}>{m}</p>}</>
}
function Panel() {
  const [tab, setTab] = useState('ringkasan'), [ok, setOk] = useState(null)
  useEffect(() => { api('/api/admin/data?type=settings').then(() => setOk(true)).catch(e => setOk(e.message === 'forbidden' ? false : true)) }, [])
  if (ok === null) return <p style={{ padding: 24 }}>Memuat…</p>
  if (ok === false) return <div className="lg"><div className="card" style={{ maxWidth: 420 }}><b>Akses ditolak</b><p className="mut">Akun ini bukan owner. Masuk dengan email yang diisi di OWNER_EMAIL.</p><button className="btn" onClick={() => signOut(auth)}>Keluar</button></div></div>
  return <div className="adm">
    <div className="ah"><div className="brand"><img src="/logo-sm.webp" alt="" width="28" height="28" />SORA<span>OTP</span> · Admin</div>
      <div className="r"><ThemeToggle /><Link className="btn d" href="/">Lihat website</Link><button className="btn r" onClick={() => signOut(auth)}>Keluar</button></div></div>
    <div className="tbs">{TABS.map(([k, t]) => <button key={k} className={'tb' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{t}</button>)}</div>
    {tab === 'ringkasan' && <Summary />}{tab === 'pengguna' && <Users />}{tab === 'pesanan' && <List type="orders" />}{tab === 'deposit' && <List type="deposits" />}{tab === 'rekap' && <Recap />}{tab === 'pengaturan' && <Settings />}
  </div>
}
export default function Admin() {
  const [u, setU] = useState(undefined)
  useEffect(() => onAuthStateChanged(auth, x => setU(x || null)), [])
  if (u === undefined) return <p style={{ padding: 24 }}>Memuat…</p>
  return u ? <Panel /> : <AdminLogin />
}
