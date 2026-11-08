import { ImageResponse } from 'next/og'
import { wib } from '@/lib/notify'
// Gambar rekap 1080x1350 (Satori: semua elemen berisi banyak anak harus display:flex)
const G = '#22c55e', BG = '#0b0e0c', S1 = '#121815', LN = '#1f2a24', TX = '#e7ede9', MUT = '#8b9890'
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const k = n => (n >= 1000000 ? (n / 1000000).toFixed(1) + 'jt' : n >= 1000 ? Math.round(n / 1000) + 'rb' : String(n))
const Tile = ({ l, v, sub, c }) => <div style={{ display: 'flex', flexDirection: 'column', width: 486, padding: 26, background: S1, border: `2px solid ${LN}`, borderRadius: 20 }}>
  <div style={{ display: 'flex', fontSize: 24, color: MUT }}>{l}</div>
  <div style={{ display: 'flex', fontSize: 46, marginTop: 8, color: c || TX }}>{v}</div>
  <div style={{ display: 'flex', fontSize: 22, marginTop: 6, color: MUT }}>{sub || ' '}</div></div>
const Row = ({ i, name, val }) => <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 23, marginTop: 12 }}>
  <div style={{ display: 'flex', maxWidth: 270, overflow: 'hidden' }}>{`${i + 1}. ${String(name).slice(0, 18)}`}</div><div style={{ display: 'flex', color: G }}>{val}</div></div>
export function recapImage(r) {
  const o = r.orders, d = r.deps, u = r.users, max = Math.max(1, ...r.days.map(x => x.omzet))
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: 1080, height: 1350, background: BG, color: TX, padding: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontSize: 56 }}><span>Sora</span><span style={{ color: G }}>OTP</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: 30, color: G }}>{`Rekap · ${r.label}`}</div>
          <div style={{ display: 'flex', fontSize: 20, color: MUT }}>{wib(r.at)}</div></div></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 32 }}>
        <Tile l="Pengguna" v={String(u.total)} sub={`+${u.baru} baru`} />
        <Tile l="Saldo beredar" v={rp(u.saldo)} sub="total saldo pengguna" />
        <Tile l="Pesanan selesai" v={String(o.ok)} sub={`dari ${o.total} pesanan · ${o.batal} batal`} />
        <Tile l="Omzet pesanan" v={rp(o.omzet)} sub={`Laba ${rp(o.laba)}`} c={G} />
        <Tile l="Deposit masuk" v={rp(d.nominal)} sub={`${d.ok} transaksi sukses`} />
        <Tile l="Menunggu" v={String(o.jalan + d.pending)} sub={`${o.jalan} pesanan · ${d.pending} deposit`} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32, padding: 26, background: S1, border: `2px solid ${LN}`, borderRadius: 20 }}>
        <div style={{ display: 'flex', fontSize: 26, color: MUT }}>Omzet 7 hari terakhir</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 250, marginTop: 14 }}>
          {r.days.map(x => <div key={x.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: 124 }}>
            <div style={{ display: 'flex', fontSize: 20, color: MUT, marginBottom: 6 }}>{k(x.omzet)}</div>
            <div style={{ display: 'flex', width: 64, height: Math.max(6, Math.round((x.omzet / max) * 170)), background: G, borderRadius: 10 }} />
            <div style={{ display: 'flex', fontSize: 20, color: MUT, marginTop: 8 }}>{x.label}</div></div>)}</div></div>
      <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 486, padding: 26, background: S1, border: `2px solid ${LN}`, borderRadius: 20 }}>
          <div style={{ display: 'flex', fontSize: 26, color: MUT }}>Layanan terlaris</div>
          {r.topServices.length ? r.topServices.map((s, i) => <Row key={s.name} i={i} name={s.name} val={`${s.n}x`} />) : <div style={{ display: 'flex', fontSize: 22, color: MUT, marginTop: 12 }}>Belum ada data</div>}</div>
        <div style={{ display: 'flex', flexDirection: 'column', width: 486, padding: 26, background: S1, border: `2px solid ${LN}`, borderRadius: 20 }}>
          <div style={{ display: 'flex', fontSize: 26, color: MUT }}>Pengguna teraktif</div>
          {r.topUsers.length ? r.topUsers.map((s, i) => <Row key={s.name + i} i={i} name={s.name} val={k(s.v)} />) : <div style={{ display: 'flex', fontSize: 22, color: MUT, marginTop: 12 }}>Belum ada data</div>}</div></div>
    </div>,
    { width: 1080, height: 1350 })
}
