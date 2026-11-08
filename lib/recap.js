import { rget } from '@/lib/admin'
import { tg, tgPhoto, e, rpf } from '@/lib/telegram'
import { wib, LN } from '@/lib/notify'
import { recapImage } from '@/lib/recapImage'
const DAY = 86400000, TZ = 7 * 3600000 // WIB
export const PERIODS = { today: 'Hari ini', '7d': '7 hari terakhir', '30d': '30 hari terakhir', all: 'Semua waktu' }
const dayStart = t => Math.floor((t + TZ) / DAY) * DAY - TZ
const sum = (a, f) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0)
export async function buildRecap(period = 'today') {
  const [users, orders, deps] = (await Promise.all([rget('users'), rget('orders'), rget('deposits')])).map(x => x || {})
  const now = Date.now(), t0 = dayStart(now)
  const from = period === 'today' ? t0 : period === '7d' ? t0 - 6 * DAY : period === '30d' ? t0 - 29 * DAY : 0
  const inP = x => (x.createdAt || 0) >= from
  const U = Object.values(users), O = Object.values(orders).filter(inP), D = Object.values(deps).filter(inP)
  const ok = O.filter(o => o.status === 'success'), dok = D.filter(d => d.status === 'success')
  const byS = {}, byU = {}
  ok.forEach(o => { const k = o.app || o.service || '-'; byS[k] = byS[k] || { n: 0, v: 0 }; byS[k].n++; byS[k].v += o.price || 0; byU[o.uid] = (byU[o.uid] || 0) + (o.price || 0) })
  const days = [...Array(7)].map((_, i) => {
    const s = t0 - (6 - i) * DAY, os = Object.values(orders).filter(o => o.status === 'success' && o.createdAt >= s && o.createdAt < s + DAY), iso = new Date(s + TZ).toISOString()
    return { label: iso.slice(8, 10) + '/' + iso.slice(5, 7), omzet: sum(os, o => o.price), n: os.length }
  })
  return {
    period, label: PERIODS[period], at: now,
    users: { total: U.length, baru: U.filter(inP).length, saldo: sum(U, u => u.saldo), blokir: U.filter(u => u.blocked).length },
    orders: { total: O.length, ok: ok.length, batal: O.filter(o => o.status === 'canceled').length, jalan: O.filter(o => o.status === 'waiting').length, omzet: sum(ok, o => o.price), modal: sum(ok, o => o.cost), laba: sum(ok, o => (o.cost != null ? o.price - o.cost : 0)) },
    deps: { total: D.length, ok: dok.length, pending: D.filter(d => d.status === 'pending').length, nominal: sum(dok, d => d.amount), fee: sum(dok, d => d.fee) },
    topServices: Object.entries(byS).sort((a, b) => b[1].v - a[1].v).slice(0, 5).map(([name, v]) => ({ name, ...v })),
    topUsers: Object.entries(byU).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([uid, v]) => ({ name: users[uid]?.name || uid, v })),
    days,
  }
}
export function recapText(r) {
  const o = r.orders, d = r.deps, u = r.users, md = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
  return [
    '📊 <b>REKAP SORAOTP</b>', `<i>${e(r.label)} · ${wib(r.at)}</i>`, LN,
    '👥 <b>PENGGUNA</b>', `▫️ Total  <b>${u.total}</b>  (baru ${u.baru})`, `▫️ Saldo beredar  <b>${rpf(u.saldo)}</b>`, u.blokir ? `▫️ Diblokir  <b>${u.blokir}</b>` : null, LN,
    '🛒 <b>PESANAN</b>', `▫️ Total  <b>${o.total}</b>  ✅ ${o.ok} · ⏳ ${o.jalan} · ❌ ${o.batal}`, `▫️ Omzet  <b>${rpf(o.omzet)}</b>`, `▫️ Modal  <b>${rpf(o.modal)}</b>`, `▫️ Laba  <b>${rpf(o.laba)}</b>`, LN,
    '💳 <b>DEPOSIT</b>', `▫️ Transaksi  <b>${d.total}</b>  ✅ ${d.ok} · ⏳ ${d.pending}`, `▫️ Nominal masuk  <b>${rpf(d.nominal)}</b>`, `▫️ Biaya admin terkumpul  <b>${rpf(d.fee)}</b>`,
    r.topServices.length ? LN : null, r.topServices.length ? '🏆 <b>LAYANAN TERLARIS</b>' : null, ...r.topServices.map((s, i) => `${md[i]} ${e(s.name)} — ${s.n}x · ${rpf(s.v)}`),
    r.topUsers.length ? LN : null, r.topUsers.length ? '👑 <b>PENGGUNA TERAKTIF</b>' : null, ...r.topUsers.map((s, i) => `${md[i]} ${e(s.name)} — ${rpf(s.v)}`),
  ].filter(x => x != null).join('\n')
}
// kirim rekap ke Telegram sesuai format: 'text' | 'image' | 'both'
export async function sendRecap(period, format, to) {
  const r = await buildRecap(period), out = {}
  if (format === 'image' || format === 'both') {
    const buf = Buffer.from(await recapImage(r).arrayBuffer())
    out.image = await tgPhoto(buf, `📊 <b>Rekap SoraOTP</b> · ${e(r.label)}`, to)
  }
  if (format === 'text' || format === 'both') out.text = await tg(recapText(r), to)
  return out
}
