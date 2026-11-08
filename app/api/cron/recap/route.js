import { getSettings } from '@/lib/settings'
import { sendRecap } from '@/lib/recap'
export const dynamic = 'force-dynamic'
// Dipanggil Vercel Cron (lihat vercel.json). Wajib env CRON_SECRET; hanya jalan bila "rekap otomatis" aktif di admin.
export async function GET(req) {
  const sec = process.env.CRON_SECRET
  if (!sec || req.headers.get('authorization') !== 'Bearer ' + sec) return Response.json({ error: 'forbidden' }, { status: 403 })
  const st = await getSettings(true)
  if (!st.recapAuto) return Response.json({ ok: true, skipped: true })
  return Response.json({ ok: true, sent: await sendRecap(st.recapPeriod, st.recapFormat) })
}
