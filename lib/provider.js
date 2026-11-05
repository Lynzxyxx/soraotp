// Adapter NusaOTP v2 (base https://nusaotp.site/api, Authorization: Bearer API_KEY).
// Endpoint dari dokumentasi: /v2/country, /v2/services, /v2/products, /v2/order, /v2/cancel, /v2/set-webhook.
// NAMA PARAMETER & FIELD RESPONSE di bawah adalah tebakan - samakan dengan tab Params/cURL di dokumentasi.
const BASE = (process.env.NUSA_BASE_URL || 'https://nusaotp.site/api').replace(/\/$/, '')
async function call(path, { method = 'GET', params, body } = {}) {
  const r = await fetch(BASE + path + (params ? '?' + new URLSearchParams(params) : ''), {
    method, cache: 'no-store', body: body ? JSON.stringify(body) : undefined,
    headers: { Authorization: 'Bearer ' + process.env.NUSA_API_KEY, 'Content-Type': 'application/json' },
  })
  const j = await r.json().catch(() => ({}))
  if (j.success === false || !r.ok) throw new Error(j.message || j.error || 'Provider error')
  return j.data
}
const arr = d => (Array.isArray(d) ? d : d?.items || d?.list || [])
const pick = (o, ...k) => { for (const x of k) if (o?.[x] != null) return o[x] }
const mk = (p, role) => Math.ceil(p * (1 + Number((role === 'reseller' || role === 'owner' ? process.env.RESELLER_MARKUP_PERCENT : process.env.MARKUP_PERCENT) || 0) / 100))
export const countries = async () => arr(await call('/v2/country')).map(c => ({ id: String(pick(c, 'id', 'code', 'country_id')), name: pick(c, 'name', 'country', 'title') }))
export const services = async country => arr(await call('/v2/services', { params: { country, country_id: country } }))
  .map(s => ({ id: String(pick(s, 'id', 'code', 'service_id')), name: pick(s, 'name', 'title') }))
export const products = async (country, service, role) => arr(await call('/v2/products', { params: { country, country_id: country, service, service_id: service } }))
  .map(p => ({ id: String(pick(p, 'id', 'product_id', 'code')), name: pick(p, 'name', 'title', 'server') || 'Server', stock: pick(p, 'stock', 'available'), price: mk(Number(pick(p, 'price', 'harga')), role) }))
export async function order(country, service, product) {
  const d = await call('/v2/order', { method: 'POST', body: { country, country_id: country, service, service_id: service, product, product_id: product } })
  return { orderId: String(pick(d, 'id', 'order_id')), number: pick(d, 'number', 'phone', 'phone_number') }
}
export const cancel = id => call('/v2/cancel', { method: 'POST', body: { id, order_id: id } })
// Cek status (opsional; hasil utama datang lewat webhook). Sesuaikan jika dokumentasi punya endpoint status.
export async function status(id) {
  const d = await call('/v2/status', { params: { id, order_id: id } })
  const s = String(pick(d, 'status') || '').toLowerCase(), code = pick(d, 'otp', 'code', 'sms')
  if (code || s === 'success') return { state: 'success', code }
  if (['canceled', 'cancel', 'expired'].includes(s)) return { state: 'canceled' }
  return { state: 'waiting' }
}
export const setWebhook = url => call('/v2/set-webhook', { method: 'POST', body: { url, webhook_url: url } })
