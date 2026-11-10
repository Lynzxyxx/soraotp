// Adapter NusaOTP v2 (base https://nusaotp.site/api, Authorization: Bearer API_KEY).
// Endpoint dari dokumentasi: /v2/country, /v2/services, /v2/products, /v2/order, /v2/cancel, /v2/set-webhook.
// NAMA PARAMETER & FIELD RESPONSE di bawah adalah tebakan - samakan dengan tab Params/cURL di dokumentasi.
import { getSettings } from '@/lib/settings'
const BASE = (process.env.NUSA_BASE_URL || 'https://nusaotp.site/api').replace(/\/$/, '')
async function call(path, { method = 'GET', params, body } = {}) {
  const r = await fetch(BASE + path + (params ? '?' + new URLSearchParams(params) : ''), {
    method, cache: 'no-store', body: body ? JSON.stringify(body) : undefined,
    headers: { Authorization: 'Bearer ' + process.env.NUSA_API_KEY, 'Content-Type': 'application/json' },
  })
  const t = await r.text(); let j = {}
  try { j = JSON.parse(t) } catch {}
  if (j.success === false || !r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}${t ? ': ' + t.replace(/\s+/g, ' ').slice(0, 80) : ''}`)
  return j.data ?? j
}
const arr = d => (Array.isArray(d) ? d : d?.items || d?.list || [])
const pick = (o, ...k) => { for (const x of k) if (o?.[x] != null) return o[x] }
export const countries = async () => arr(await call('/v2/country')).map(c => ({ id: String(pick(c, 'id', 'code', 'country_id')), name: pick(c, 'name', 'country', 'title'), stock: pick(c, 'stock', 'available') ?? null }))
export const services = async country => arr(await call('/v2/services', { params: { country, country_id: country } }))
  .map(s => ({ id: String(pick(s, 'id', 'code', 'service_id')), name: pick(s, 'name', 'title'), icon: pick(s, 'icon', 'logo', 'image', 'img') || null }))
export const products = async (country, service, pct = 0) => arr(await call('/v2/products', { params: { country, country_id: country, service, service_id: service } }))
  .map(p => ({ id: String(pick(p, 'id', 'product_id', 'code')), name: pick(p, 'name', 'title', 'server') || 'Server', stock: pick(p, 'stock', 'available'), cost: Number(pick(p, 'price', 'harga')) || 0, price: Math.ceil((Number(pick(p, 'price', 'harga')) || 0) * (1 + pct / 100)) }))
export async function order(country, service, product) {
  const d = await call('/v2/order', { method: 'POST', body: { country, country_id: country, service, service_id: service, product, product_id: product } })
  return { orderId: String(pick(d, 'id', 'order_id')), number: pick(d, 'number', 'phone', 'phone_number') }
}
export const cancel = id => call('/v2/cancel', { method: 'POST', body: { id, order_id: id } })
// ---- ekstraksi OTP & status yang toleran terhadap berbagai bentuk respon ----
const SKIP = /(^|_)(id|order|phone|number|price|harga|stock|balance|time|date|created|updated|amount|total)(_|$)/i
export function extractOtp(d, depth = 0) {
  if (d == null || typeof d !== 'object' || depth > 4) return null
  if (Array.isArray(d)) { for (const x of d) { const r = extractOtp(x, depth + 1); if (r) return r } return null }
  for (const [k, v] of Object.entries(d)) {
    if (SKIP.test(k) || (typeof v !== 'string' && typeof v !== 'number')) continue
    if (/^(otp|otp_code|sms_code|pin)$/i.test(k)) { const m = String(v).replace(/\D/g, ''); if (m.length >= 3 && m.length <= 8) return m }
    if (/^(code|sms|text|sms_text|message_text)$/i.test(k)) { const m = String(v).match(/(?<!\d)(\d{3}[- ]\d{3}|\d{4,8})(?!\d)/); if (m) return m[1].replace(/\D/g, '') }
  }
  for (const v of Object.values(d)) { const r = extractOtp(v, depth + 1); if (r) return r }
  return null
}
const OKW = ['success', 'completed', 'complete', 'received', 'done', 'finish', 'finished', 'ok', 'sukses', 'berhasil', 'sms_received']
const CANW = ['cancel', 'expire', 'fail', 'refund', 'timeout', 'batal', 'gagal', 'reject']
export function classify(d) {
  const code = extractOtp(d)
  const st = String(pick(d, 'status', 'state', 'order_status', 'status_text') ?? '').toLowerCase()
  if (code) return { state: 'success', code }
  if (CANW.some(w => st.includes(w))) return { state: 'canceled' }
  if (OKW.includes(st)) return { state: 'success', code: null }
  return { state: 'waiting' }
}
const unwrap = (d, id) => { if (Array.isArray(d)) d = d.find(x => String(pick(x, 'id', 'order_id', 'orderId')) === String(id)); return d && typeof d === 'object' ? d : null }
// dipakai webhook: isi kiriman NusaOTP -> { id, state, code }
export function parseOrderPayload(b) {
  const d = b && typeof b.data === 'object' && b.data ? b.data : b || {}
  const id = pick(d, 'order_id', 'orderId', 'id', 'order', 'trx_id')
  return { id: id != null ? String(id) : null, ...classify(d) }
}
// Cek status order. Endpoint bisa dipilih admin (Pengaturan > Diagnosa NusaOTP); bila kosong dicoba beberapa kemungkinan.
const CAND = [id => ['/v2/order/' + id, null], id => ['/v2/order', { id, order_id: id }], id => ['/v2/status', { id, order_id: id }], id => ['/v2/order/status', { id, order_id: id }], id => ['/v2/check', { id, order_id: id }]]
let okIdx = -1
export async function status(id) {
  const st = await getSettings()
  if (st.nusaStatusPath) {
    const post = st.nusaStatusMethod === 'POST', path = st.nusaStatusPath.replace(/\{id\}/g, encodeURIComponent(id))
    const d = unwrap(await call(path, post ? { method: 'POST', body: { id, order_id: id } } : {}), id)
    if (!d) throw new Error('Respon endpoint status tidak dikenali: ' + path)
    return classify(d)
  }
  const errs = []
  for (const i of okIdx >= 0 ? [okIdx] : CAND.map((_, k) => k)) {
    const [path, params] = CAND[i](id)
    try {
      const d = unwrap(await call(path, params ? { params } : {}), id)
      if (d) { okIdx = i; return classify(d) }
      errs.push(path + ': data tidak dikenali')
    } catch (e) { errs.push(path + ': ' + e.message) }
  }
  okIdx = -1
  throw new Error('Cek status ke NusaOTP gagal -> ' + errs.join(' | ').slice(0, 300))
}
export const setWebhook = url => call('/v2/set-webhook', { method: 'POST', body: { url, webhook_url: url, webhook: url } })
export async function balance() { const d = await call('/balance'); return pick(d, 'balance', 'saldo', 'amount') ?? d }
