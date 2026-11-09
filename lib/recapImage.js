import { ImageResponse } from 'next/og'
import { wib } from '@/lib/notify'
import LOGO from '@/lib/logoData'
// Gambar rekap 1200x1600. Satori: elemen berisi banyak anak harus display:flex.
const G = '#22c55e', BG = '#080b09', S1 = '#101612', LN = '#1d2a22', TX = '#ecf3ee', MUT = '#8b9b91', RED = '#f87171', AMB = '#fbbf24'
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const k = n => (n >= 1000000 ? (n / 1000000).toFixed(1) + 'jt' : n >= 1000 ? Math.round(n / 1000) + 'rb' : String(n))
const card = { display: 'flex', flexDirection: 'column', background: S1, border: `2px solid ${LN}`, borderRadius: 26 }
const Kpi = ({ l, v, sub, c }) => <div style={{ ...card, width: 360, height: 176, padding: 26 }}>
  <div style={{ display: 'flex', fontSize: 24, color: MUT }}>{l}</div>
  <div style={{ display: 'flex', fontSize: 48, marginTop: 10, color: c || TX }}>{v}</div>
  <div style={{ display: 'flex', fontSize: 22, marginTop: 'auto', color: MUT }}>{sub || ' '}</div></div>
const Pill = ({ t, c }) => <div style={{ display: 'flex', padding: '12px 22px', borderRadius: 999, background: S1, border: `2px solid ${LN}`, fontSize: 24, color: c || TX }}>{t}</div>
const Row = ({ i, name, val, pct }) => <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 25 }}>
    <div style={{ display: 'flex' }}>{`${i + 1}. ${String(name).slice(0, 20)}`}</div><div style={{ display: 'flex', color: G }}>{val}</div></div>
  <div style={{ display: 'flex', width: '100%', height: 10, background: LN, borderRadius: 6, marginTop: 8 }}>
    <div style={{ display: 'flex', width: `${Math.max(3, pct)}%`, height: 10, background: G, borderRadius: 6 }} /></div></div>
export function recapImage(r) {
  const o = r.orders, d = r.deps, u = r.users, max = Math.max(1, ...r.days.map(x => x.omzet))
  const sv = [...r.topServices, ...Array(5).fill(null)].slice(0, 5), us = [...r.topUsers, ...Array(5).fill(null)].slice(0, 5)
  const smax = Math.max(1, ...r.topServices.map(x => x.v)), umax = Math.max(1, ...r.topUsers.map(x => x.v))
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: 1200, height: 1600, background: BG, color: TX, padding: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 34px', borderRadius: 28, border: `2px solid #14532d`, background: 'linear-gradient(135deg, #052e16, #0b1f13 55%, #14532d)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={LOGO} width={88} height={88} style={{ borderRadius: 44, border: `3px solid ${G}` }} />
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 22 }}>
            <div style={{ display: 'flex', fontSize: 52 }}><span>Sora</span><span style={{ color: G }}>OTP</span></div>
            <div style={{ display: 'flex', fontSize: 24, color: MUT }}>Laporan rekap transaksi</div></div></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: 34, color: G }}>{r.label}</div>
          <div style={{ display: 'flex', fontSize: 22, color: MUT, marginTop: 6 }}>{wib(r.at)}</div></div></div>
      <div style={{ display: 'flex', gap: 24, marginTop: 26 }}>
        <Kpi l="Omzet pesanan" v={rp(o.omzet)} sub={`modal ${rp(o.modal)}`} c={G} />
        <Kpi l="Laba" v={rp(o.laba)} sub={o.omzet ? `margin ${Math.round((o.laba / o.omzet) * 100)}%` : 'belum ada penjualan'} c={G} />
        <Kpi l="Pesanan selesai" v={String(o.ok)} sub={`dari ${o.total} pesanan`} /></div>
      <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
        <Kpi l="Pengguna" v={String(u.total)} sub={`+${u.baru} baru${u.blokir ? ` · ${u.blokir} diblokir` : ''}`} />
        <Kpi l="Deposit masuk" v={rp(d.nominal)} sub={`${d.ok} transaksi sukses`} />
        <Kpi l="Saldo beredar" v={rp(u.saldo)} sub="total saldo pengguna" /></div>
      <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
        <Pill t={`Selesai ${o.ok}`} c={G} /><Pill t={`Berjalan ${o.jalan}`} c={AMB} /><Pill t={`Batal ${o.batal}`} c={RED} /><Pill t={`Deposit pending ${d.pending}`} c={AMB} /><Pill t={`Biaya admin ${rp(d.fee)}`} /></div>
      <div style={{ ...card, marginTop: 26, padding: '26px 30px', height: 372 }}>
        <div style={{ display: 'flex', fontSize: 28 }}>Omzet 7 hari terakhir</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 260, marginTop: 14 }}>
          {r.days.map(x => <div key={x.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: 140 }}>
            <div style={{ display: 'flex', fontSize: 21, color: MUT, marginBottom: 8 }}>{x.omzet ? k(x.omzet) : '-'}</div>
            <div style={{ display: 'flex', width: 72, height: Math.max(8, Math.round((x.omzet / max) * 170)), background: x.omzet ? G : LN, borderRadius: 12 }} />
            <div style={{ display: 'flex', fontSize: 21, color: MUT, marginTop: 10 }}>{x.label}</div></div>)}</div></div>
      <div style={{ display: 'flex', gap: 24, marginTop: 26 }}>
        <div style={{ ...card, width: 552, height: 430, padding: '26px 30px' }}>
          <div style={{ display: 'flex', fontSize: 28 }}>Layanan terlaris</div>
          {sv.map((s, i) => s ? <Row key={i} i={i} name={s.name} val={`${s.n}x`} pct={(s.v / smax) * 100} /> : <Row key={i} i={i} name="—" val="" pct={0} />)}</div>
        <div style={{ ...card, width: 552, height: 430, padding: '26px 30px' }}>
          <div style={{ display: 'flex', fontSize: 28 }}>Pengguna teraktif</div>
          {us.map((s, i) => s ? <Row key={i} i={i} name={s.name} val={k(s.v)} pct={(s.v / umax) * 100} /> : <Row key={i} i={i} name="—" val="" pct={0} />)}</div></div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', fontSize: 22, color: MUT }}>Dibuat otomatis oleh SoraOTP</div>
    </div>,
    { width: 1200, height: 1600 })
}
