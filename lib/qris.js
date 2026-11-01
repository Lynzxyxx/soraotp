// Adapter buatqris. ENDPOINT & FIELD ADALAH ASUMSI - samakan dengan qris.js di proyek sorapayy.
const B = (process.env.BUATQRIS_BASE_URL || '').replace(/\/$/, '')
const auth = { account_id: process.env.BUATQRIS_ACCOUNT_ID, secret_token: process.env.BUATQRIS_SECRET_TOKEN }
const H = { 'Content-Type': 'application/json', 'x-account-id': auth.account_id || '', 'x-secret-token': auth.secret_token || '' }
export async function createQris(orderId, amount) {
  const r = await fetch(`${B}/api/create`, { method: 'POST', headers: H, body: JSON.stringify({ ...auth, order_id: orderId, amount }) })
  const j = await r.json()
  if (!j.success && !j.status) throw new Error(j.message || 'Gagal membuat QRIS')
  return { qr: j.data?.qr_image || j.data?.qris_url || null }
}
export async function isPaid(orderId) {
  const r = await fetch(`${B}/api/status`, { method: 'POST', headers: H, body: JSON.stringify({ ...auth, order_id: orderId }), cache: 'no-store' })
  const j = await r.json()
  return ['paid', 'success', 'settlement'].includes(String(j.data?.status || j.status).toLowerCase())
}
