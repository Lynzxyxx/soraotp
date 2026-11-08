import { ownerFrom } from '@/lib/admin'
// Alat uji untuk owner: GET ke base URL NusaOTP dengan API key (hanya baca, path dibatasi)
export async function POST(req) {
  try {
    await ownerFrom(req)
    const { path } = await req.json()
    if (!/^\/[A-Za-z0-9_\-\/.?=&%]*$/.test(String(path)) || String(path).includes('..')) throw new Error('Path tidak valid')
    const base = (process.env.NUSA_BASE_URL || 'https://nusaotp.site/api').replace(/\/$/, '')
    const r = await fetch(base + path, { headers: { Authorization: 'Bearer ' + process.env.NUSA_API_KEY }, cache: 'no-store', signal: AbortSignal.timeout(8000) })
    const t = await r.text()
    return Response.json({ status: r.status, body: t.slice(0, 1500) })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
