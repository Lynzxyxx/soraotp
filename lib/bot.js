// Bot Telegram SoraOTP: toko untuk pembeli (daftar, login, beli nomor, isi saldo) + perintah admin.
import { randomBytes } from 'crypto'
import { aauth, rget, rset, rupd, rfind } from '@/lib/admin'
import { tg, tgApi, tgPhoto, e, rpf, isAdminChat } from '@/lib/telegram'
import { wib, LN, nRegister, nLogin } from '@/lib/notify'
import { getSettings, marginFor } from '@/lib/settings'
import { countries, services, products, balance } from '@/lib/provider'
import { placeOrder, makeDeposit, checkOrder, cancelOrder } from '@/lib/shop'
import { settle } from '@/lib/credit'
import { sendRecap, PERIODS } from '@/lib/recap'

const B = (text, data) => ({ text, callback_data: data })
const U = (text, url) => ({ text, url })
const KB = rows => ({ inline_keyboard: rows })
const memo = {}
const cached = async (k, ttl, fn) => { const m = memo[k]; if (m && Date.now() - m.t < ttl) return m.v; const v = await fn(); memo[k] = { t: Date.now(), v }; return v }
const getS = async chat => (await rget('tg/' + chat)) || {}
const setS = (chat, patch) => rupd('tg/' + chat, patch)
const ST = { waiting: '⏳ MENUNGGU OTP', success: '✅ BERHASIL', canceled: '❌ DIBATALKAN' }
const ICON = { success: '✅', waiting: '⏳', canceled: '❌', pending: '⏳', processing: '⏳' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function show(ctx, text, markup) {
  if (ctx.mid) {
    const r = await tgApi('editMessageText', { chat_id: ctx.chat, message_id: ctx.mid, text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: markup })
    if (r.ok || /not modified/i.test(r.error || '')) return
  }
  await tg(text, ctx.chat, markup)
}
async function me(ctx) {
  const s = await getS(ctx.chat); if (!s.uid) return null
  const u = await rget('users/' + s.uid)
  if (!u || u.blocked) { await setS(ctx.chat, { uid: null }); return null }
  return { uid: s.uid, ...u }
}
const needLogin = ctx => show(ctx, '🔒 <b>Kamu belum masuk</b>\nLogin atau daftar dulu untuk melanjutkan.', KB([[B('🔑 Login', 'a:login'), B('🆕 Daftar', 'a:reg')]]))

// ---------- beranda ----------
async function home(ctx, withPhoto) {
  const u = await me(ctx)
  const text = ['🌟 <b>SORAOTP</b>', '<i>Nomor virtual untuk terima kode OTP</i>', LN, '⚡ Pesan nomor dalam hitungan detik', '💳 Isi saldo lewat QRIS', '🔑 OTP dikirim otomatis ke chat ini', '♻️ Refund otomatis jika OTP tidak masuk', LN,
    u ? `👤 <b>${e(u.name)}</b>  ·  👛 <b>${rpf(u.saldo)}</b>` : 'Pilih menu di bawah 👇'].join('\n')
  const rows = u ? [[B('🛒 Beli Nomor', 'b:p:0'), B('💳 Isi Saldo', 'd:m')], [B('👛 Saldo', 'w:s'), B('📜 Pesanan', 'o:l')], [B('🧾 Riwayat Deposit', 'd:l'), B('🚪 Logout', 'a:out')]]
    : [[B('🛒 Beli Nomor', 'b:p:0')], [B('🔑 Login', 'a:login'), B('🆕 Daftar', 'a:reg')]]
  rows.push([U('🌐 Website', ctx.origin)]); if (ctx.admin) rows.push([B('🛠 Menu Admin', 'ad:h')])
  if (withPhoto) { const r = await tgApi('sendPhoto', { chat_id: ctx.chat, photo: ctx.origin + '/logo-bot.jpg', caption: text, parse_mode: 'HTML', reply_markup: KB(rows) }); if (r.ok) return }
  await show(ctx, text, KB(rows))
}
async function website(ctx) {
  const rows = [[U('🌐 Buka Website', ctx.origin)], [{ text: '📱 Lihat tampilan pembeli', web_app: { url: ctx.origin + '/beli' } }], [U('🔑 Login / Daftar', ctx.origin + '/login')]]
  if (ctx.admin) rows.push([U('🛠 Admin Panel', ctx.origin + '/admin/soraotp')])
  const caption = `🌐 <b>WEBSITE SORAOTP</b>\n<i>${e(ctx.origin.replace(/^https?:\/\//, ''))}</i>\n${LN}\n📱 Tombol “Lihat tampilan pembeli” membuka halaman beli langsung di dalam Telegram, persis seperti yang dilihat pembeli.`
  let r = await tgApi('sendPhoto', { chat_id: ctx.chat, photo: ctx.origin + '/logo-bot.jpg', caption, parse_mode: 'HTML', reply_markup: KB(rows) })
  if (!r.ok) { rows[1] = [U('🛒 Halaman Beli', ctx.origin + '/beli')]; r = await tgApi('sendPhoto', { chat_id: ctx.chat, photo: ctx.origin + '/logo-bot.jpg', caption, parse_mode: 'HTML', reply_markup: KB(rows) }) }
  if (!r.ok) await tg(caption, ctx.chat, KB(rows))
}

// ---------- daftar / login ----------
const regStart = async ctx => { await setS(ctx.chat, { step: 'r_name', data: null }); await show(ctx, '🆕 <b>DAFTAR AKUN</b>\n<i>Langkah 1 dari 4</i>\n' + LN + '\n✍️ Ketik <b>nama lengkap</b> kamu.\n\n<i>Ketik /batal untuk membatalkan.</i>') }
const loginStart = async ctx => { await setS(ctx.chat, { step: 'l_email', data: null }); await show(ctx, '🔑 <b>LOGIN</b>\n' + LN + '\n✉️ Ketik <b>email</b> akun SoraOTP kamu.\n\n<i>Daftar lewat Google? Buka website → Pengaturan Akun → Hubungkan Telegram, lalu kirim <code>/login KODE</code>.\nKetik /batal untuk membatalkan.</i>') }
async function logout(ctx) { await setS(ctx.chat, { uid: null, step: null, data: null, buy: null }); await show(ctx, '🚪 Kamu sudah keluar.', KB([[B('🔑 Login', 'a:login'), B('🆕 Daftar', 'a:reg')]])) }
async function linkCode(ctx, code) {
  const c = await rget('tgCodes/' + code)
  if (!c || c.exp < Date.now()) return tg('❌ Kode salah atau sudah kedaluwarsa. Buat kode baru di website (Pengaturan Akun → Hubungkan Telegram).', ctx.chat)
  await rset('tgCodes/' + code, null)
  const u = await rget('users/' + c.uid); if (!u || u.blocked) return tg('❌ Akun tidak dapat dihubungkan.', ctx.chat)
  await setS(ctx.chat, { uid: c.uid, step: null, data: null }); await rupd('users/' + c.uid, { tgId: ctx.chat })
  await nLogin(c.uid, { method: 'telegram' })
  await tg(`✅ <b>Berhasil masuk</b>\nHalo, ${e(u.name)}!`, ctx.chat); return home({ ...ctx, mid: null }, false)
}
async function verifyPassword(email, password) {
  const key = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').trim().replace(/^["']|["']$/g, '')
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: false }) })
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error('Email atau password salah.')
  return j.localId
}
async function onStep(ctx, msg, text, s) {
  const d = s.data || {}, chat = ctx.chat
  const next = (step, patch) => setS(chat, { step, data: { ...d, ...patch } })
  const dropMsg = () => tgApi('deleteMessage', { chat_id: chat, message_id: msg.message_id })
  switch (s.step) {
    case 'r_name':
      if (text.length < 2) return tg('Nama terlalu pendek. Ketik nama lengkap kamu.', chat)
      await next('r_email', { name: text.slice(0, 60) }); return tg('🆕 <b>DAFTAR AKUN</b>\n<i>Langkah 2 dari 4</i>\n' + LN + '\n✉️ Ketik <b>email</b> kamu.', chat)
    case 'r_email': {
      const email = text.toLowerCase()
      if (!EMAIL.test(email)) return tg('Format email tidak valid. Coba lagi.', chat)
      let exists = false; try { await aauth.getUserByEmail(email); exists = true } catch {}
      if (exists) return tg('⚠️ <b>Email sudah terdaftar</b> dan tidak bisa didaftarkan lagi.\nGunakan email lain, atau ketuk Login.', chat, KB([[B('🔑 Login', 'a:login')]]))
      await next('r_wa', { email }); return tg('🆕 <b>DAFTAR AKUN</b>\n<i>Langkah 3 dari 4</i>\n' + LN + '\n📱 Ketik <b>nomor WhatsApp</b> kamu (ketik - untuk lewati).', chat)
    }
    case 'r_wa':
      await next('r_pass', { wa: text === '-' ? '' : text.slice(0, 20) })
      return tg('🆕 <b>DAFTAR AKUN</b>\n<i>Langkah 4 dari 4</i>\n' + LN + '\n🔒 Ketik <b>password</b> (minimal 6 karakter), atau ketik <code>acak</code> untuk dibuatkan otomatis.\n<i>Pesan password akan langsung dihapus.</i>', chat)
    case 'r_pass': {
      await dropMsg()
      const gen = text.toLowerCase() === 'acak', pass = gen ? randomBytes(8).toString('base64url') : text
      if (pass.length < 6) return tg('Password minimal 6 karakter. Ketik lagi.', chat)
      let user
      try { user = await aauth.createUser({ email: d.email, password: pass, displayName: d.name }) }
      catch (x) { await setS(chat, { step: null, data: null }); return tg(x.code === 'auth/email-already-exists' ? '⚠️ Email sudah terdaftar dan tidak bisa didaftarkan lagi.' : '❌ Gagal mendaftar: ' + e(x.message), chat) }
      await rset('users/' + user.uid, { name: d.name, email: d.email, wa: d.wa || '', saldo: 0, deposit: 0, pembelian: 0, createdAt: Date.now(), tgId: chat, regNotified: true })
      await nRegister(user.uid); await setS(chat, { uid: user.uid, step: null, data: null })
      await tg(`🎉 <b>PENDAFTARAN BERHASIL</b>\n${LN}\n👤 ${e(d.name)}\n✉️ <code>${e(d.email)}</code>${gen ? `\n🔒 Password: <code>${e(pass)}</code>\n<i>Simpan password ini. Akun yang sama bisa dipakai di website.</i>` : ''}`, chat)
      return home({ ...ctx, mid: null }, false)
    }
    case 'l_email':
      if (!EMAIL.test(text.toLowerCase())) return tg('Format email tidak valid. Coba lagi.', chat)
      await next('l_pass', { email: text.toLowerCase() }); return tg('🔑 <b>LOGIN</b>\n' + LN + '\n🔒 Ketik <b>password</b> kamu.\n<i>Pesan password akan langsung dihapus.</i>', chat)
    case 'l_pass': {
      await dropMsg()
      if ((s.lockUntil || 0) > Date.now()) return tg('⛔ Terlalu banyak percobaan. Coba lagi beberapa menit lagi.', chat)
      try {
        const uid = await verifyPassword(d.email, text), u = await rget('users/' + uid)
        if (!u) throw new Error('Akun tidak ditemukan.'); if (u.blocked) throw new Error('Akun ini diblokir. Hubungi admin.')
        await setS(chat, { uid, step: null, data: null, fails: 0 }); await rupd('users/' + uid, { tgId: chat }); await nLogin(uid, { method: 'telegram' })
        await tg(`✅ <b>Berhasil masuk</b>\nHalo, ${e(u.name)}!`, chat); return home({ ...ctx, mid: null }, false)
      } catch (x) {
        const fails = (s.fails || 0) + 1
        await setS(chat, { step: null, data: null, fails: fails >= 5 ? 0 : fails, lockUntil: fails >= 5 ? Date.now() + 600000 : 0 })
        return tg('❌ ' + e(x.message), chat, KB([[B('🔑 Coba lagi', 'a:login'), B('🆕 Daftar', 'a:reg')]]))
      }
    }
    case 'd_amt': {
      const u = await me(ctx); if (!u) return needLogin(ctx)
      const n = Number(text.replace(/[^\d]/g, '')); await setS(chat, { step: null })
      return depCreate(ctx, u, n)
    }
    case 'b_q': { const u = await me(ctx); if (!u) return needLogin(ctx); return buyApps({ ...ctx, mid: null }, u, 0, text) }
    case 'b_cn': {
      const u = await me(ctx); if (!u) return needLogin(ctx)
      const q = text.toLowerCase(), cs = (await cached('c', 600000, countries)).filter(c => String(c.name).toLowerCase().includes(q)).slice(0, 8)
      if (!cs.length) return tg('Negara tidak ditemukan. Ketik nama lain, atau /batal.', chat)
      await setS(chat, { step: null }); return tg('🌍 <b>Pilih negara</b>', chat, KB(cs.map(c => [B(String(c.name).slice(0, 30), 'b:nc:' + c.id)])))
    }
    default: return home({ ...ctx, mid: null }, false)
  }
}

// ---------- beli nomor ----------
const getCountries = () => cached('c', 600000, countries)
const defaultCountry = async () => { const cs = await getCountries(); return cs.find(c => /^indonesia$/i.test(c.name)) || cs[0] }
const getApps = cid => cached('s' + cid, 600000, () => services(cid))
async function buyApps(ctx, u, page, q) {
  const buy = (await getS(ctx.chat)).buy || {}, c = buy.country || await defaultCountry()
  let apps = (await getApps(c.id)).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)))
  if (q) apps = apps.filter(a => String(a.name).toLowerCase().includes(q.toLowerCase()))
  const pages = q ? 1 : Math.max(1, Math.ceil(apps.length / 10)); page = Math.min(Math.max(0, page), pages - 1)
  const sl = apps.slice(page * 10, page * 10 + 10), rows = []
  for (let i = 0; i < sl.length; i += 2) rows.push(sl.slice(i, i + 2).map(a => B(String(a.name).slice(0, 22), 'b:s:' + a.id)))
  if (pages > 1) { const nav = []; if (page > 0) nav.push(B('◀️', 'b:p:' + (page - 1))); nav.push(B(`${page + 1}/${pages}`, 'b:p:' + page)); if (page < pages - 1) nav.push(B('▶️', 'b:p:' + (page + 1))); rows.push(nav) }
  rows.push([B('🔎 Cari aplikasi', 'b:q'), B('🌍 ' + String(c.name).slice(0, 18), 'b:n')], [B('🏠 Menu', 'm:home')])
  await setS(ctx.chat, { buy: { country: c }, step: null })
  await show(ctx, `🛒 <b>PILIH APLIKASI</b>\n<i>Negara: ${e(c.name)}${q ? ` · cari "${e(q)}"` : ''}</i>\n${LN}\n${apps.length ? 'Ketuk aplikasi yang ingin diverifikasi 👇' : 'Aplikasi tidak ditemukan.'}`, KB(rows))
}
async function buyProducts(ctx, u, sid) {
  const buy = (await getS(ctx.chat)).buy || {}, c = buy.country || await defaultCountry()
  const app = (await getApps(c.id)).find(a => String(a.id) === String(sid)); if (!app) return buyApps(ctx, u, 0)
  let ps
  try { ps = await products(c.id, app.id, marginFor(await getSettings(), u.role)) } catch (x) { return show(ctx, `❌ Gagal memuat server: ${e(x.message)}`, KB([[B('⬅️ Kembali', 'b:p:0')]])) }
  ps = ps.filter(p => p.stock == null || Number(p.stock) > 0)
  await setS(ctx.chat, { buy: { country: c, service: { id: app.id, name: app.name } } })
  const rows = ps.slice(0, 12).map(p => [B(`${String(p.name).slice(0, 16)} · ${rpf(p.price)}${p.stock != null ? ` · stok ${p.stock}` : ''}`, 'b:k:' + p.id)])
  rows.push([B('🌍 Ganti negara', 'b:n'), B('⬅️ Aplikasi', 'b:p:0')])
  await show(ctx, `🛒 <b>${e(app.name)}</b>\n<i>Negara: ${e(c.name)}</i>\n${LN}\n${ps.length ? 'Pilih server 👇' : 'Stok kosong untuk negara ini.'}`, KB(rows))
}
async function buyConfirm(ctx, u, pid) {
  const buy = (await getS(ctx.chat)).buy || {}; if (!buy.service || !buy.country) return buyApps(ctx, u, 0)
  const p = (await products(buy.country.id, buy.service.id, marginFor(await getSettings(), u.role))).find(x => x.id === String(pid))
  if (!p) return show(ctx, '❌ Server tidak ditemukan atau stok habis.', KB([[B('⬅️ Kembali', 'b:s:' + buy.service.id)]]))
  await setS(ctx.chat, { buy: { ...buy, product: { id: p.id, name: p.name, price: p.price } } })
  const enough = (u.saldo || 0) >= p.price
  await show(ctx, ['🧾 <b>KONFIRMASI PEMBELIAN</b>', LN, `📦 Aplikasi  <b>${e(buy.service.name)}</b>`, `🌍 Negara  <b>${e(buy.country.name)}</b>`, `🖥 Server  <b>${e(p.name)}</b>${p.stock != null ? ` (stok ${p.stock})` : ''}`, `💰 Harga  <b>${rpf(p.price)}</b>`, `👛 Saldo kamu  <b>${rpf(u.saldo)}</b>`, LN, enough ? 'Tekan tombol di bawah untuk membeli.' : '⚠️ Saldo belum cukup. Isi saldo dulu.'].join('\n'),
    KB([enough ? [B('✅ Beli — ' + rpf(p.price), 'b:c:' + p.id)] : [B('💳 Isi saldo', 'd:m')], [B('⬅️ Kembali', 'b:s:' + buy.service.id)]]))
}
const orderCard = (o, hint) => [`🛒 <b>${e(o.app || o.service)}</b>`, `<i>${e(o.countryName)} · ${e(o.serverName)}</i>`, LN, `📞 Nomor  <code>${e(o.number)}</code>`, `💰 Harga  <b>${rpf(o.price)}</b>`, `📌 Status  <b>${ST[o.status] || e(o.status)}</b>`,
  o.code ? `🔑 Kode OTP  <code>${e(o.code)}</code>` : null, `🔖 Order  <code>#${e(o.providerId)}</code>`, LN, hint && o.status === 'waiting' ? '⏳ OTP akan dikirim otomatis ke chat ini begitu masuk.' : `🕒 ${wib(o.createdAt)}`].filter(Boolean).join('\n')
const orderKb = (o, id) => KB(o.status === 'waiting' ? [[B('🔄 Cek OTP', 'o:c:' + id), B('❌ Batalkan', 'o:x:' + id)], [B('📜 Pesanan', 'o:l'), B('🏠 Menu', 'm:home')]] : [[B('🛒 Beli lagi', 'b:p:0'), B('📜 Pesanan', 'o:l')]])
async function buyNow(ctx, u, pid) {
  const buy = (await getS(ctx.chat)).buy || {}; if (!buy.service || !buy.country) return buyApps(ctx, u, 0)
  try {
    const { id, doc } = await placeOrder(u, { country: buy.country.id, service: buy.service.id, product: pid, label: `${buy.service.name} - ${buy.product?.name || ''}`, app: buy.service.name, countryName: buy.country.name, serverName: buy.product?.name }, { tgChat: ctx.chat })
    await show(ctx, orderCard(doc, true), orderKb(doc, id))
  } catch (x) { await show(ctx, `❌ <b>Gagal membeli</b>\n${e(x.message)}`, KB([[B('💳 Isi saldo', 'd:m'), B('⬅️ Kembali', 'b:p:0')]])) }
}
async function buyCb(ctx, u, a, v) {
  if (a === 'p') return buyApps(ctx, u, Number(v) || 0)
  if (a === 's') return buyProducts(ctx, u, v)
  if (a === 'k') return buyConfirm(ctx, u, v)
  if (a === 'c') return buyNow(ctx, u, v)
  if (a === 'q') { await setS(ctx.chat, { step: 'b_q' }); return tg('🔎 Ketik <b>nama aplikasi</b> yang dicari.', ctx.chat) }
  if (a === 'n') { await setS(ctx.chat, { step: 'b_cn' }); return tg('🌍 Ketik <b>nama negara</b> (contoh: Indonesia, Malaysia).', ctx.chat) }
  if (a === 'nc') { const c = (await getCountries()).find(x => String(x.id) === String(v)); if (c) await setS(ctx.chat, { buy: { country: c } }); return buyApps(ctx, u, 0) }
}
// ---------- pesanan & saldo ----------
async function myOrders(ctx, u) {
  const all = Object.entries(await rfind('orders', 'uid', u.uid)).map(([id, o]) => ({ id, ...o })).sort((a, b) => b.createdAt - a.createdAt).slice(0, 8)
  await show(ctx, `📜 <b>PESANAN SAYA</b>\n${LN}\n${all.length ? 'Ketuk untuk melihat detail & OTP 👇' : 'Belum ada pesanan.'}`,
    KB([...all.map(o => [B(`${ICON[o.status] || '•'} ${String(o.app || o.service).slice(0, 16)} · ${rpf(o.price)}`, 'o:v:' + o.id)]), [B('🛒 Beli Nomor', 'b:p:0'), B('🏠 Menu', 'm:home')]]))
}
async function orderCb(ctx, u, a, id) {
  if (a === 'l') return myOrders(ctx, u)
  const o = await rget('orders/' + id); if (!o || o.uid !== u.uid) return show(ctx, '❌ Pesanan tidak ditemukan.', KB([[B('📜 Pesanan', 'o:l')]]))
  if (a === 'v') return show(ctx, orderCard(o, true), orderKb(o, id))
  if (a === 'c') { const r = await checkOrder(id, o); return show(ctx, orderCard(r.order, true) + (r.warn && r.order.status === 'waiting' ? '\n\n<i>OTP belum masuk. Coba lagi sebentar.</i>' : ''), orderKb(r.order, id)) }
  if (a === 'x') {
    if (o.status !== 'waiting') return show(ctx, orderCard(o, false), orderKb(o, id))
    try { await cancelOrder(id, o); return show(ctx, orderCard(await rget('orders/' + id), false), orderKb({ status: 'canceled' }, id)) }
    catch (x) { return show(ctx, orderCard(o, true) + `\n\n⚠️ ${e(x.message)}\n<i>Pembatalan biasanya baru bisa setelah 3 menit.</i>`, orderKb(o, id)) }
  }
}
const saldo = (ctx, u) => show(ctx, `👛 <b>SALDO KAMU</b>\n${LN}\n💰 <b>${rpf(u.saldo)}</b>\n🛒 Pembelian  <b>${u.pembelian || 0}</b>\n💳 Total deposit  <b>${rpf(u.deposit)}</b>`, KB([[B('💳 Isi Saldo', 'd:m'), B('🏠 Menu', 'm:home')]]))
// ---------- deposit ----------
async function depMenu(ctx) {
  const st = await getSettings()
  await show(ctx, `💳 <b>ISI SALDO</b>\n<i>Bayar lewat QRIS · minimal ${rpf(st.minDeposit)}</i>\n${LN}\nPilih nominal 👇`, KB([[B('5.000', 'd:a:5000'), B('10.000', 'd:a:10000')], [B('20.000', 'd:a:20000'), B('50.000', 'd:a:50000')], [B('100.000', 'd:a:100000'), B('✏️ Nominal lain', 'd:o')], [B('🏠 Menu', 'm:home')]]))
}
async function sendQr(chat, qr, caption, markup) {
  if (!qr) return false
  if (qr.startsWith('data:')) return (await tgPhoto(Buffer.from(qr.split(',')[1], 'base64'), caption, chat, markup)).ok
  return (await tgApi('sendPhoto', { chat_id: chat, photo: qr, caption, parse_mode: 'HTML', reply_markup: markup })).ok
}
async function depCreate(ctx, u, amount) {
  let r; try { r = await makeDeposit(u.uid, amount, ctx.origin, { tgChat: ctx.chat }) } catch (x) { return tg(`❌ ${e(x.message)}`, ctx.chat, KB([[B('⬅️ Kembali', 'd:m')]])) }
  const cap = `💳 <b>DEPOSIT QRIS</b>\n<i>Scan QR lalu bayar tepat jumlah di bawah</i>\n${LN}\n💵 Saldo diterima  <b>${rpf(amount)}</b>\n🧾 Biaya admin  <b>${rpf(r.fee)}</b>\n💰 <b>Total bayar  ${rpf(r.pay)}</b>\n${LN}\n⏳ Saldo masuk otomatis setelah pembayaran terdeteksi.`
  const mk = KB([[B('🔄 Cek status', 'd:c:' + r.id)], [B('🏠 Menu', 'm:home')]])
  if (!(await sendQr(ctx.chat, r.qr, cap, mk))) await tg(cap + '\n\n⚠️ Gambar QR tidak tersedia. Buka website untuk membayar.', ctx.chat, mk)
}
const dLine = (id, d) => `${ICON[d.status] || '•'} <b>${rpf(d.amount)}</b>${d.pay && d.pay !== d.amount ? ` <i>(bayar ${rpf(d.pay)})</i>` : ''} · ${e(d.status)}\n   🔖 #${e(String(id).slice(-8))} · ${wib(d.createdAt)}`
async function myDeposits(ctx, u) {
  const all = Object.entries(await rfind('deposits', 'uid', u.uid)).sort((a, b) => b[1].createdAt - a[1].createdAt).slice(0, 8)
  await show(ctx, `🧾 <b>RIWAYAT DEPOSIT</b>\n${LN}\n${all.length ? all.map(([id, d]) => dLine(id, d)).join('\n\n') : 'Belum ada deposit.'}`, KB([[B('💳 Isi Saldo', 'd:m'), B('🏠 Menu', 'm:home')]]))
}
async function depCb(ctx, u, a, v) {
  if (a === 'm') return depMenu(ctx)
  if (a === 'a') return depCreate(ctx, u, Number(v))
  if (a === 'o') { await setS(ctx.chat, { step: 'd_amt' }); return tg('✏️ Ketik <b>nominal deposit</b> (angka, contoh: 25000).', ctx.chat) }
  if (a === 'l') return myDeposits(ctx, u)
  if (a === 'c') {
    const d0 = await rget('deposits/' + v); if (!d0 || d0.uid !== u.uid) return
    try { await settle(v) } catch {}
    const d = await rget('deposits/' + v)
    return show(ctx, d.status === 'success' ? '✅ <b>Deposit sudah berhasil</b>, saldo bertambah.' : '⏳ <b>Belum ada pembayaran terdeteksi.</b>\nSaldo masuk otomatis setelah kamu membayar.', KB([[B('🔄 Cek lagi', 'd:c:' + v), B('🏠 Menu', 'm:home')]]))
  }
}

// ---------- admin ----------
const PGU = 8, PGL = 6
const pager = (pre, page, pages) => { const r = []; if (page > 0) r.push(B('◀️', `${pre}:${page - 1}`)); r.push(B(`${page + 1}/${pages}`, `${pre}:${page}`)); if (page < pages - 1) r.push(B('▶️', `${pre}:${page + 1}`)); return r }
const clamp = (p, pages) => Math.min(Math.max(0, p | 0), pages - 1)
const aOrder = o => `${ICON[o.status] || '•'} <b>${e(o.app || o.service)}</b> · ${e(o.countryName)}\n   📞 <code>${e(o.number)}</code> · 💰 ${rpf(o.price)}${o.code ? `\n   🔑 OTP <code>${e(o.code)}</code>` : ''}\n   🔖 #${e(o.providerId)} · ${wib(o.createdAt)}`
const adminHelp = ctx => show(ctx, `🛠 <b>MENU ADMIN</b>\n${LN}\n👥 /users  <i>daftar semua pengguna</i>\n🔎 /user email  <i>detail, deposit &amp; pesanan</i>\n🛒 /orders  <i>pesanan terbaru (dengan OTP)</i>\n💳 /deposits  <i>deposit terbaru</i>\n📞 /order nomor  <i>cari pesanan</i>\n📊 /rekap [today|7d|30d|all]\n📈 /status  <i>ringkasan cepat</i>\n🌐 /website  <i>tampilan pembeli</i>`,
  KB([[B('👥 Pengguna', 'ad:u:0'), B('🛒 Pesanan', 'ad:O:0')], [B('💳 Deposit', 'ad:D:0'), B('🏠 Menu', 'm:home')]]))
async function usersList(ctx, page) {
  const all = Object.entries((await rget('users')) || {}).map(([id, u]) => ({ id, ...u })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  const pages = Math.max(1, Math.ceil(all.length / PGU)); page = clamp(page, pages)
  const sl = all.slice(page * PGU, page * PGU + PGU)
  const text = `👥 <b>PENGGUNA</b> <i>(${all.length})</i>\n${LN}\n` + sl.map((u, i) => `${page * PGU + i + 1}. <b>${e(u.name)}</b>${u.role && u.role !== 'user' ? ` · ${e(u.role)}` : ''}${u.blocked ? ' 🚫' : ''}\n    ✉️ ${e(u.email)}\n    👛 ${rpf(u.saldo)} · 🛒 ${u.pembelian || 0}`).join('\n')
  const nums = sl.map((u, i) => B(String(page * PGU + i + 1), 'ad:v:' + u.id)), rows = []
  for (let i = 0; i < nums.length; i += 4) rows.push(nums.slice(i, i + 4))
  rows.push(pager('ad:u', page, pages), [B('🛠 Admin', 'ad:h')])
  await show(ctx, text + '\n\n<i>Ketuk nomor untuk detail 👇</i>', KB(rows))
}
async function userView(ctx, uid) {
  const u = await rget('users/' + uid); if (!u) return show(ctx, '🔎 Pengguna tidak ditemukan.', KB([[B('👥 Pengguna', 'ad:u:0')]]))
  const [os, ds] = await Promise.all([rfind('orders', 'uid', uid), rfind('deposits', 'uid', uid)])
  const O = Object.values(os), D = Object.values(ds)
  await show(ctx, [`👤 <b>${e(u.name)}</b>`, LN, `✉️ <code>${e(u.email)}</code>`, `📱 ${e(u.wa || '-')}`, `🏷 Role  <b>${e(u.role || 'user')}</b>${u.blocked ? '  🚫 <b>DIBLOKIR</b>' : ''}${u.saldoFrozen ? '  🧊 <b>saldo dibekukan</b>' : ''}`,
    `👛 Saldo  <b>${rpf(u.saldo)}</b>`, `🛒 Pesanan  <b>${O.length}</b>  (✅ ${O.filter(o => o.status === 'success').length} · ⏳ ${O.filter(o => o.status === 'waiting').length} · ❌ ${O.filter(o => o.status === 'canceled').length})`,
    `💳 Deposit  <b>${D.length}</b>  (✅ ${D.filter(d => d.status === 'success').length} · total ${rpf(D.filter(d => d.status === 'success').reduce((s, d) => s + (d.amount || 0), 0))})`,
    u.tgId ? '✈️ Telegram  <b>terhubung</b>' : null, `🗓 Bergabung  ${wib(u.createdAt)}`].filter(Boolean).join('\n'),
    KB([[B('🛒 Pesanan & OTP', `ad:o:${uid}:0`), B('💳 Deposit', `ad:d:${uid}:0`)], [B('⬅️ Pengguna', 'ad:u:0')]]))
}
async function listView(ctx, title, items, fmt, pre, page, back, extra) {
  const pages = Math.max(1, Math.ceil(items.length / PGL)); page = clamp(page, pages)
  const sl = items.slice(page * PGL, page * PGL + PGL)
  await show(ctx, `${title} <i>(${items.length})</i>\n${LN}\n${sl.length ? sl.map(fmt).join('\n\n') : 'Belum ada data.'}`, KB([pager(pre, page, pages), ...(extra || []), [B(...back)]]))
}
async function userOrders(ctx, uid, page) {
  const u = (await rget('users/' + uid)) || {}, items = Object.values(await rfind('orders', 'uid', uid)).sort((a, b) => b.createdAt - a.createdAt)
  return listView(ctx, `🛒 <b>PESANAN · ${e(u.name)}</b>`, items, aOrder, `ad:o:${uid}`, page, ['⬅️ Detail pengguna', 'ad:v:' + uid])
}
async function userDeposits(ctx, uid, page) {
  const u = (await rget('users/' + uid)) || {}, items = Object.entries(await rfind('deposits', 'uid', uid)).sort((a, b) => b[1].createdAt - a[1].createdAt)
  return listView(ctx, `💳 <b>DEPOSIT · ${e(u.name)}</b>`, items, ([id, d]) => dLine(id, d), `ad:d:${uid}`, page, ['⬅️ Detail pengguna', 'ad:v:' + uid])
}
async function allOrders(ctx, page) {
  const [os, us] = await Promise.all([rget('orders'), rget('users')]); const U = us || {}
  const items = Object.values(os || {}).sort((a, b) => b.createdAt - a.createdAt)
  return listView(ctx, '🛒 <b>PESANAN TERBARU</b>', items, o => `👤 ${e(U[o.uid]?.name || '-')} · <code>${e(U[o.uid]?.email || '')}</code>\n${aOrder(o)}`, 'ad:O', page, ['🛠 Admin', 'ad:h'])
}
async function allDeposits(ctx, page) {
  const [ds, us] = await Promise.all([rget('deposits'), rget('users')]); const U = us || {}
  const items = Object.entries(ds || {}).sort((a, b) => b[1].createdAt - a[1].createdAt)
  return listView(ctx, '💳 <b>DEPOSIT TERBARU</b>', items, ([id, d]) => `👤 ${e(U[d.uid]?.name || '-')} · <code>${e(U[d.uid]?.email || '')}</code>\n${dLine(id, d)}`, 'ad:D', page, ['🛠 Admin', 'ad:h'])
}
async function findUsers(ctx, q) {
  const l = Object.entries((await rget('users')) || {}).filter(([id, u]) => id === q || ((u.email || '') + ' ' + (u.name || '') + ' ' + (u.wa || '')).toLowerCase().includes(q.toLowerCase()))
  if (!l.length) return show(ctx, '🔎 Pengguna tidak ditemukan.')
  if (l.length === 1) return userView(ctx, l[0][0])
  await show(ctx, `🔎 <b>${l.length} pengguna cocok</b>`, KB(l.slice(0, 8).map(([id, u]) => [B(`${String(u.name).slice(0, 18)} · ${String(u.email).slice(0, 22)}`, 'ad:v:' + id)])))
}
async function orderLookup(ctx, q) {
  const [os, us] = await Promise.all([rget('orders'), rget('users')]); const U = us || {}
  const l = Object.entries(os || {}).filter(([id, o]) => id === q || String(o.providerId) === q || String(o.number || '').includes(q)).slice(0, 3)
  if (!l.length) return show(ctx, '📞 Pesanan tidak ditemukan.')
  await show(ctx, l.map(([, o]) => `👤 ${e(U[o.uid]?.name || '-')} · <code>${e(U[o.uid]?.email || '')}</code>\n${aOrder(o)}`).join('\n\n'))
}
async function adminCb(ctx, a, b, c) {
  if (a === 'h') return adminHelp(ctx)
  if (a === 'u') return usersList(ctx, Number(b))
  if (a === 'v') return userView(ctx, b)
  if (a === 'o') return userOrders(ctx, b, Number(c))
  if (a === 'd') return userDeposits(ctx, b, Number(c))
  if (a === 'O') return allOrders(ctx, Number(b))
  if (a === 'D') return allDeposits(ctx, Number(b))
}
async function status(ctx) {
  const [users, orders, deps] = (await Promise.all([rget('users'), rget('orders'), rget('deposits')])).map(x => x || {})
  let prov; try { const bal = await balance(); prov = typeof bal === 'object' ? 'terhubung' : rpf(bal) } catch { prov = '⚠️ gagal terhubung' }
  await show(ctx, `📈 <b>STATUS SORAOTP</b>\n${LN}\n👥 Pengguna  <b>${Object.keys(users).length}</b>\n⏳ Pesanan berjalan  <b>${Object.values(orders).filter(o => o.status === 'waiting').length}</b>\n💳 Deposit pending  <b>${Object.values(deps).filter(d => d.status === 'pending').length}</b>\n🏦 Saldo NusaOTP  <b>${e(prov)}</b>\n${LN}\n🕒 ${wib()}`)
}

// ---------- pintu masuk ----------
async function onCommand(ctx, text, s) {
  const [raw, ...args] = text.split(/\s+/), c = raw.toLowerCase().replace(/@.*$/, ''), arg = args.join(' ')
  const adminOnly = ['/admin', '/users', '/user', '/cari', '/orders', '/deposits', '/order', '/rekap', '/status']
  if (adminOnly.includes(c) && !ctx.admin) return tg('⛔ Perintah ini khusus admin.', ctx.chat)
  if (c === '/start') { if (/^link_\d+$/.test(args[0] || '')) return linkCode(ctx, args[0].slice(5)); return home(ctx, true) }
  if (c === '/menu') return home(ctx, false)
  if (c === '/help') return ctx.admin ? adminHelp(ctx) : tg('🤖 <b>BANTUAN</b>\n' + LN + '\n/start  menu utama\n/beli  beli nomor\n/isi  isi saldo\n/saldo  cek saldo\n/pesanan  riwayat pesanan\n/riwayat  riwayat deposit\n/login  masuk\n/daftar  daftar akun\n/website  buka website', ctx.chat)
  if (c === '/batal') { await setS(ctx.chat, { step: null, data: null }); return tg('Dibatalkan.', ctx.chat, KB([[B('🏠 Menu', 'm:home')]])) }
  if (c === '/daftar') return regStart(ctx)
  if (c === '/login') { if (/^\d{6}$/.test(args[0] || '')) return linkCode(ctx, args[0]); return loginStart(ctx) }
  if (c === '/logout') return logout(ctx)
  if (c === '/website') return website(ctx)
  if (['/beli', '/isi', '/saldo', '/pesanan', '/riwayat'].includes(c)) {
    const u = await me(ctx); if (!u) return needLogin(ctx)
    return c === '/beli' ? buyApps(ctx, u, 0) : c === '/isi' ? depMenu(ctx) : c === '/saldo' ? saldo(ctx, u) : c === '/pesanan' ? myOrders(ctx, u) : myDeposits(ctx, u)
  }
  if (c === '/admin') return adminHelp(ctx)
  if (c === '/users') return usersList(ctx, (Number(args[0]) || 1) - 1)
  if (c === '/user' || c === '/cari') return arg ? findUsers(ctx, arg) : tg('Format: <code>/user email</code>', ctx.chat)
  if (c === '/orders') return allOrders(ctx, 0)
  if (c === '/deposits') return allDeposits(ctx, 0)
  if (c === '/order') return arg ? orderLookup(ctx, arg) : tg('Format: <code>/order nomor-atau-id</code>', ctx.chat)
  if (c === '/status') return status(ctx)
  if (c === '/rekap') {
    const st = await getSettings(), period = PERIODS[args[0]] ? args[0] : st.recapPeriod
    await tg(`⏳ Menyiapkan rekap <b>${e(PERIODS[period])}</b>…`, ctx.chat)
    const out = await sendRecap(period, st.recapFormat, ctx.chat), f = Object.values(out).find(v => !v.ok)
    return f ? tg('❌ Gagal mengirim rekap: ' + e(f.error), ctx.chat) : undefined
  }
  return tg('Perintah tidak dikenal. Kirim /help.', ctx.chat)
}
async function onCallback(ctx, data) {
  const [a, b, c, f] = data.split(':')
  if (a === 'm') return home(ctx, false)
  if (a === 'ad') return ctx.admin ? adminCb(ctx, b, c, f) : undefined
  if (a === 'a') return b === 'login' ? loginStart(ctx) : b === 'reg' ? regStart(ctx) : b === 'out' ? logout(ctx) : undefined
  const u = await me(ctx); if (!u) return needLogin(ctx)
  if (a === 'b') return buyCb(ctx, u, b, c)
  if (a === 'o') return orderCb(ctx, u, b, c)
  if (a === 'd') return depCb(ctx, u, b, c)
  if (a === 'w') return saldo(ctx, u)
}
export async function handleUpdate(up, origin) {
  const cb = up.callback_query, msg = cb ? cb.message : up.message
  if (!msg || msg.chat.type !== 'private') return
  const chat = msg.chat.id, ctx = { chat, origin, mid: cb ? msg.message_id : null, admin: isAdminChat(chat) }
  if (cb) tgApi('answerCallbackQuery', { callback_query_id: cb.id })
  try {
    if (cb) return await onCallback(ctx, cb.data || '')
    const text = (msg.text || '').trim(); if (!text) return
    const s = await getS(chat)
    return text.startsWith('/') ? await onCommand(ctx, text, s) : await onStep(ctx, msg, text, s)
  } catch (x) { await tg(ctx.admin ? '❌ Error: ' + e(x.message) : '❌ Terjadi kesalahan. Coba lagi atau ketik /start.', chat) }
}
