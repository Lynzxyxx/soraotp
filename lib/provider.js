// Adapter NusaOTP v2 (base https://nusaotp.site/api, Authorization: Bearer API_KEY).
// Endpoint dari dokumentasi: /v2/country, /v2/services, /v2/products, /v2/order, /v2/cancel, /v2/set-webhook.
// NAMA PARAMETER & FIELD RESPONSE di bawah adalah tebakan - samakan dengan tab Params/cURL di dokumentasi.
const BASE = (process.env.NUSA_BASE_URL || 'https://nusaotp.site/api').replace(/\/$/, '')
async function call(path, { method = 'GET', params, body } = {}) {
  const r = await fetch(BASE + path + (params ? '?' + new URLSearchParams(params) : ''), {
    method, cache: 'no-store', body: body ? JSON.stringify(body) : undefined,
    headers: { Authorization: 'Bearer ' + process.env.NUSA_API_KEY, 'Content-Type': 'application/json' },
  })
  const t = await r.text(); let j = {}
  try { j = JSON.parse(t) } catch {}
  if (j.success === false || !r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}${t ? ': ' + t.replace(/\s+/g, ' ').slice(0, 80) : ''}`)
  return j.data
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
// Cek status order. Dokumentasi endpoint status belum terlihat, jadi beberapa kemungkinan dicoba berurutan
// dan yang berhasil diingat. Samakan dengan dokumentasi NusaOTP bila sudah pasti.
const CAND = [
  id => ['/v2/order/' + id, null],
  id => ['/v2/order', { id, order_id: id }],
  id => ['/v2/status', { id, order_id: id }],
  id => ['/v2/order/status', { id, order_id: id }],
  id => ['/v2/check', { id, order_id: id }],
]
let okIdx = -1
function parse(d, id) {
  if (Array.isArray(d)) d = d.find(x => String(pick(x, 'id', 'order_id')) === String(id))
  if (!d || typeof d !== 'object') return null
  let code = pick(d, 'otp', 'code', 'sms', 'sms_code')
  if (Array.isArray(code)) code = pick(code[0] || {}, 'code', 'otp', 'text', 'message') ?? code[0]
  const s = String(pick(d, 'status', 'state') || '').toLowerCase()
  if (code || ['success', 'completed', 'complete', 'received', 'done', 'finish', 'finished'].includes(s)) return { state: 'success', code: code ? String(code) : null }
  if (['canceled', 'cancelled', 'cancel', 'expired', 'failed', 'refunded', 'timeout'].includes(s)) return { state: 'canceled' }
  return { state: 'waiting' }
}
export async function status(id) {
  const errs = []
  for (const i of okIdx >= 0 ? [okIdx] : CAND.map((_, k) => k)) {
    const [path, params] = CAND[i](id)
    try {
      const r = parse(await call(path, params ? { params } : {}), id)
      if (r) { okIdx = i; return r }
      errs.push(path + ': data tidak dikenali')
    } catch (e) { errs.push(path + ': ' + e.message) }
  }
  okIdx = -1
  throw new Error('Cek status ke NusaOTP gagal -> ' + errs.join(' | ').slice(0, 300))
}
export const setWebhook = url => call('/v2/set-webhook', { method: 'POST', body: { url, webhook_url: url } })
export async function balance() { const d = await call('/balance'); return pick(d, 'balance', 'saldo', 'amount') ?? d }
