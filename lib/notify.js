import { rget } from '@/lib/admin'
import { tg, e, rpf } from '@/lib/telegram'
import { getSettings } from '@/lib/settings'
export const wib = (t = Date.now()) => new Date(t).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·') + ' WIB'
export const LN = '━━━━━━━━━━━━━━━'
const code = s => `<code>${e(s)}</code>`
// kartu pesan rapi: judul, subjudul, baris "ikon label  nilai", footer waktu
const card = (icon, title, sub, rows, foot) => [`${icon} <b>${title}</b>`, sub && `<i>${sub}</i>`, LN, ...rows.filter(Boolean).map(([k, v]) => `${k}  <b>${v}</b>`), LN, foot || `🕒 ${wib()}`].filter(Boolean).join('\n')
async function send(key, text) { const st = await getSettings(); if (st['n_' + key] === 0) return { ok: true, skipped: true }; return tg(text) }
const who = async uid => { const u = (await rget('users/' + uid)) || {}; return { name: e(u.name || uid), email: u.email || '-', u } }
const rowsUser = async uid => { const w = await who(uid); return [['👤 Pengguna', w.name], ['✉️ Email', code(w.email)]] }
const rowsOrder = (o, withProfit) => [['📦 Layanan', e(o.app || o.service)], ['🌍 Negara', `${e(o.countryName)} · ${e(o.serverName)}`], ['📞 Nomor', code(o.number)], ['💰 Harga', rpf(o.price)],
  withProfit && o.cost != null ? ['📈 Laba', `${rpf(o.price - o.cost)} <i>(modal ${rpf(o.cost)})</i>`] : null]
export async function nRegister(uid) {
  const { u } = await who(uid), total = Object.keys((await rget('users')) || {}).length
  return send('register', card('🆕', 'PENGGUNA BARU', 'Akun baru berhasil terdaftar', [['👤 Nama', e(u.name)], ['✉️ Email', code(u.email)], ['📱 WhatsApp', e(u.wa || '-')], ['👥 Total pengguna', total]]))
}
const device = ua => { const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : '-'; const br = /Edg\//i.test(ua) ? 'Edge' : /Firefox/i.test(ua) ? 'Firefox' : /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : '-'; return `${os} · ${br}` }
export async function nLogin(uid, { method, ip, ua }) {
  const tgm = method === 'telegram'
  return send('login', card('🔑', 'LOGIN PENGGUNA', null, [...(await rowsUser(uid)), ['🔐 Metode', method === 'google' ? 'Google' : tgm ? 'Telegram' : 'Email & password'], tgm ? null : ['📱 Perangkat', e(device(ua || ''))], ip ? ['🌐 IP', code(ip)] : null]))
}
export async function nDepositNew(uid, amount, pay) {
  return send('depositNew', card('💳', 'DEPOSIT DIBUAT', 'Menunggu pembayaran QRIS', [...(await rowsUser(uid)), ['💵 Nominal saldo', rpf(amount)], ['🧾 Total bayar', rpf(pay)]]))
}
export async function nDepositOk(d, id, how) {
  const { u } = await who(d.uid)
  return send('depositOk', card('✅', 'DEPOSIT BERHASIL', how === 'manual' ? 'Dikonfirmasi manual oleh admin' : 'Pembayaran QRIS diterima', [['👤 Pengguna', e(u.name)], ['✉️ Email', code(u.email)], ['💵 Saldo masuk', rpf(d.amount)], ['🧾 Dibayar', rpf(d.pay || d.amount)], ['👛 Saldo sekarang', rpf(u.saldo)], ['🔖 ID', code('#' + String(id).slice(-8))]]))
}
export async function nOrderNew(o) { return send('orderNew', card('🛒', 'PESANAN BARU', 'Nomor virtual dipesan', [...(await rowsUser(o.uid)), ...rowsOrder(o, true)])) }
export async function nOrderOk(o) {
  const s = Math.max(0, Math.round((Date.now() - (o.createdAt || Date.now())) / 1000))
  return send('orderOk', card('🎉', 'PESANAN SELESAI', 'OTP berhasil diterima', [...(await rowsUser(o.uid)), ...rowsOrder(o, true), ['⏱ Durasi', `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`]]))
}
export async function nOrderCancel(o) { return send('orderCancel', card('♻️', 'PESANAN DIBATALKAN', 'Saldo dikembalikan ke pengguna', [...(await rowsUser(o.uid)), ...rowsOrder(o, false)])) }
const ACT = { addSaldo: ['Ubah saldo', v => `${Number(v) >= 0 ? '+' : ''}${rpf(v)}`], setSaldo: ['Set saldo', rpf], freeze: ['Banned saldo', v => (v ? 'Dibekukan' : 'Dibuka')],
  block: ['Blokir akun', v => (v ? 'Diblokir' : 'Dibuka')], password: ['Ganti password', () => '••••••'], role: ['Ubah role', v => e(v)] }
export async function nAdmin(adminUid, action, uid, value) {
  const a = ACT[action]; if (!a) return
  return send('admin', card('🛠', 'AKSI ADMIN', a[0], [['🧑‍💼 Admin', String(adminUid).startsWith('tg:') ? 'Admin Telegram' : (await who(adminUid)).name], ...(await rowsUser(uid)), ['📝 Detail', a[1](value)]]))
}

// ---- pesan untuk pembeli lewat bot Telegram (hanya bila order/deposit dibuat dari Telegram) ----
const MENU = { inline_keyboard: [[{ text: '🛒 Beli lagi', callback_data: 'b:p:0' }, { text: '📜 Pesanan', callback_data: 'o:l' }], [{ text: '🏠 Menu', callback_data: 'm:home' }]] }
export async function uOrderOk(o, otp) {
  if (!o.tgChat) return
  await tg(card('🎉', 'OTP DITERIMA', `${e(o.app || o.service)} · ${e(o.countryName)}`, [['📞 Nomor', code(o.number)], ['🔑 Kode OTP', code(otp || '—')], ['💰 Harga', rpf(o.price)]], '👆 Ketuk kode untuk menyalin'), o.tgChat, MENU)
}
export async function uOrderCancel(o) {
  if (!o.tgChat) return
  await tg(card('♻️', 'PESANAN DIBATALKAN', 'Saldo sudah dikembalikan', [['📦 Layanan', e(o.app || o.service)], ['📞 Nomor', code(o.number)], ['💰 Dikembalikan', rpf(o.price)]]), o.tgChat, MENU)
}
export async function uDepositOk(d, id, saldo) {
  if (!d.tgChat) return
  await tg(card('✅', 'DEPOSIT BERHASIL', 'Pembayaran QRIS diterima', [['💵 Saldo masuk', rpf(d.amount)], ['👛 Saldo sekarang', rpf(saldo)], ['🔖 ID', code('#' + String(id).slice(-8))]]), d.tgChat, MENU)
}
