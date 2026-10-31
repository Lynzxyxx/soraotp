// Adapter buatqris.site. ENDPOINT & FIELD ADALAH ASUMSI - samakan dengan dokumentasi/qris.js milikmu
// (sama seperti yang kamu pakai di proyek Sora Pedia).
const B = process.env.BUATQRIS_BASE_URL || 'https://api.buatqris.site'
const H = { 'Content-Type': 'application/json', 'x-api-key': process.env.BUATQRIS_API_KEY || '' }
export async function createQris(orderId, amount) {
  const r = await fetch(`${B}/api/create`, { method: 'POST', headers: H, body: JSON.stringify({ order_id: orderId, amount }) })
  const j = await r.json()
  if (!j.success && !j.status) throw new Error(j.message || 'Gagal membuat QRIS')
  return { qr: j.data?.qr_image || j.data?.qris_url || null, string: j.data?.qr_string || null }
}
export async function isPaid(orderId) {
  const r = await fetch(`${B}/api/status?order_id=${encodeURIComponent(orderId)}`, { headers: H, cache: 'no-store' })
  const j = await r.json()
  return ['paid', 'success', 'settlement'].includes(String(j.data?.status || j.status).toLowerCase())
}
