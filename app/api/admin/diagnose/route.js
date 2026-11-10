import { ownerFrom } from '@/lib/admin'
export const maxDuration = 60
// Menguji banyak kemungkinan endpoint cek status NusaOTP dan melaporkan kode HTTP + cuplikan respon
const BASE = () => (process.env.NUSA_BASE_URL || 'https://nusaotp.site/api').replace(/\/$/, '')
async function hit(method, path, tpl, body) {
  const t0 = Date.now()
  try {
    const r = await fetch(BASE() + path, { method, cache: 'no-store', signal: AbortSignal.timeout(5000), body: body ? JSON.stringify(body) : undefined,
      headers: { Authorization: 'Bearer ' + process.env.NUSA_API_KEY, 'Content-Type': 'application/json' } })
    const t = await r.text()
    return { method, path, tpl, status: r.status, ms: Date.now() - t0, body: t.replace(/\s+/g, ' ').slice(0, 240) }
  } catch (e) { return { method, path, tpl, status: 0, body: e.message } }
}
export async function POST(req) {
  try {
    await ownerFrom(req)
    const id = String((await req.json()).orderId || '').replace(/\D/g, '')
    if (!id) throw new Error('Isi ID order NusaOTP (angka)')
    const G = ['/v2/order/{id}', '/v2/order?id={id}', '/v2/order?order_id={id}', '/v2/order/status/{id}', '/v2/order/status?id={id}', '/v2/order/detail/{id}', '/v2/order/detail?id={id}', '/v2/order/check/{id}',
      '/v2/orders/{id}', '/v2/orders?id={id}', '/v2/status/{id}', '/v2/status?id={id}', '/v2/check/{id}', '/v2/check?id={id}', '/v2/otp/{id}', '/v2/otp?id={id}', '/v2/sms/{id}', '/v2/sms?id={id}',
      '/v2/detail/{id}', '/v2/get-order?id={id}', '/v2/check-order?id={id}', '/v2/order-status?id={id}']
    const P = ['/v2/order/status', '/v2/status', '/v2/check', '/v2/order/check', '/v2/order/detail', '/v2/otp', '/v2/sms']
    const jobs = [() => hit('GET', '/balance'), () => hit('GET', '/v2/orders'), () => hit('GET', '/v2/history'),
      ...G.map(t => () => hit('GET', t.replace('{id}', id), t)), ...P.map(t => () => hit('POST', t, t, { id, order_id: id }))]
    const results = []
    for (let i = 0; i < jobs.length; i += 8) results.push(...await Promise.all(jobs.slice(i, i + 8).map(f => f())))
    return Response.json({ results })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
