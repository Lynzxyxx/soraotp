import { ownerFrom } from '@/lib/admin'
import { getSettings } from '@/lib/settings'
import { buildRecap, sendRecap, PERIODS } from '@/lib/recap'
import { recapImage } from '@/lib/recapImage'
export const dynamic = 'force-dynamic'
const bad = e => Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 })
// GET = pratinjau gambar (PNG), POST = kirim rekap ke Telegram
export async function GET(req) {
  try {
    await ownerFrom(req)
    const p = new URL(req.url).searchParams.get('period'), period = PERIODS[p] ? p : (await getSettings()).recapPeriod
    return recapImage(await buildRecap(period))
  } catch (e) { return bad(e) }
}
export async function POST(req) {
  try {
    await ownerFrom(req)
    const b = await req.json().catch(() => ({})), st = await getSettings()
    const period = PERIODS[b.period] ? b.period : st.recapPeriod, format = ['text', 'image', 'both'].includes(b.format) ? b.format : st.recapFormat
    const out = await sendRecap(period, format)
    const fail = Object.entries(out).filter(([, v]) => !v.ok).map(([k, v]) => `${k}: ${v.error}`)
    if (fail.length) throw new Error('Telegram gagal -> ' + fail.join(' | '))
    return Response.json({ ok: true })
  } catch (e) { return bad(e) }
}
