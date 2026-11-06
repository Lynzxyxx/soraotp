// Adapter buatqris. PATH & FIELD adalah ASUMSI - samakan dengan qris.js di proyek sorapayy.
const B = (process.env.BUATQRIS_BASE_URL || '').replace(/\/$/, '')
const auth = { account_id: process.env.BUATQRIS_ACCOUNT_ID, secret_token: process.env.BUATQRIS_SECRET_TOKEN }
const H = { 'Content-Type': 'application/json', 'x-account-id': auth.account_id || '', 'x-secret-token': auth.secret_token || '' }
async function post(path, body) {
  if (!B) throw new Error('BUATQRIS_BASE_URL belum diisi di env')
  const r = await fetch(B + path, { method: 'POST', headers: H, body: JSON.stringify({ ...auth, ...body }), cache: 'no-store' })
  const t = await r.text()
  try { return JSON.parse(t) } catch { throw new Error(`buatqris ${path} -> HTTP ${r.status}: ${t.slice(0, 120) || 'respon kosong'}`) }
}
export async function createQris(orderId, amount) {
  const j = await post('/api/create', { order_id: orderId, amount })
  if (!j.success && !j.status) throw new Error(j.message || 'Gagal membuat QRIS')
  return { qr: j.data?.qr_image || j.data?.qris_url || null }
}
export async function isPaid(orderId) {
  const j = await post('/api/status', { order_id: orderId })
  return ['paid', 'success', 'settlement'].includes(String(j.data?.status || j.status).toLowerCase())
}
