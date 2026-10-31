// Adapter NusaOTP. ENDPOINT & FIELD DI BAWAH ADALAH ASUMSI -
// samakan dengan dokumentasi API di dashboard nusa-otp.com milikmu.
const BASE = process.env.NUSA_BASE_URL
async function call(path, params = {}) {
  const qs = new URLSearchParams({ api_key: process.env.NUSA_API_KEY, ...params })
  const r = await fetch(`${BASE}${path}?${qs}`, { cache: 'no-store' })
  return r.json()
}
const mk = (p, role) => Math.ceil(p * (1 + Number((role === 'reseller' || role === 'owner' ? process.env.RESELLER_MARKUP_PERCENT : process.env.MARKUP_PERCENT) || 0) / 100))
// -> [{id, name, price(modal)}]
export async function services(role) {
  const j = await call('/api/services')
  return (j.data || []).map(s => ({ id: String(s.id), name: s.name, price: mk(Number(s.price), role) }))
}
// -> {orderId, number}
export async function order(serviceId) {
  const j = await call('/api/order', { service: serviceId })
  if (!j.success && !j.status) throw new Error(j.message || 'Order ditolak provider')
  return { orderId: String(j.data.id), number: j.data.number }
}
// -> {state: 'waiting'|'success'|'canceled', code}
export async function status(orderId) {
  const j = await call('/api/status', { id: orderId })
  const s = String(j.data?.status || '').toLowerCase()
  if (j.data?.otp || s === 'success') return { state: 'success', code: j.data.otp }
  if (['canceled', 'cancel', 'expired'].includes(s)) return { state: 'canceled' }
  return { state: 'waiting' }
}
export const cancel = id => call('/api/cancel', { id })
