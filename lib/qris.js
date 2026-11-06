// Adapter buatqris sesuai dokumentasi "Buat QRIS": POST application/x-www-form-urlencoded ke base URL (root),
// parameter action=api_create_qris, account_id, secret_token, amount, description, qris_method, fee_by, callback_url, test.
// Nama field RESPONSE dan action "cek status" di bawah masih tebakan - samakan dengan tab Cek Status / contoh respon.
import QRCode from 'qrcode'
const B = (process.env.BUATQRIS_BASE_URL || 'https://api.buatqris.site').replace(/\/$/, '')
const pick = (o, ...k) => { for (const x of k) if (o?.[x] != null && o[x] !== '') return o[x] }
async function call(params) {
  const body = new URLSearchParams({ account_id: process.env.BUATQRIS_ACCOUNT_ID || '', secret_token: process.env.BUATQRIS_SECRET_TOKEN || '', ...params })
  const r = await fetch(B, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store' })
  const t = await r.text()
  let j; try { j = JSON.parse(t) } catch { throw new Error(`buatqris HTTP ${r.status}: ${t.slice(0, 160) || 'respon kosong'}`) }
  if (j.success === false || j.status === 'error' || j.error) throw new Error('buatqris: ' + (j.message || j.error || JSON.stringify(j).slice(0, 160)))
  return j
}
export async function createQris(orderId, amount, callbackUrl) {
  const p = { action: 'api_create_qris', amount: String(amount), description: 'Deposit SoraOTP ' + orderId,
    qris_method: process.env.BUATQRIS_METHOD || 'qris_two', fee_by: process.env.BUATQRIS_FEE_BY || 'user', callback_url: callbackUrl }
  if (process.env.BUATQRIS_TEST === '1') p.test = '1'
  const j = await call(p), d = j.data || j
  let qr = pick(d, 'qr_image', 'qris_image', 'qr_url', 'image_url', 'qr')
  const str = pick(d, 'qr_string', 'qris_string', 'qr_content', 'qris', 'emv')
  if (!qr && str) qr = await QRCode.toDataURL(String(str), { width: 340, margin: 2 })
  if (qr && !/^(https?:|data:)/.test(qr)) qr = 'data:image/png;base64,' + qr
  if (!qr) throw new Error('buatqris: respon tidak berisi QR -> ' + JSON.stringify(j).slice(0, 220))
  const id = pick(d, 'id', 'trx_id', 'transaction_id', 'invoice')
  return { qr, id: id != null ? String(id) : null }
}
export async function isPaid(id) {
  const j = await call({ action: 'api_check_status', id }), d = j.data || j
  return ['paid', 'success', 'settlement', 'lunas', 'completed'].includes(String(pick(d, 'status', 'payment_status') || '').toLowerCase())
}
