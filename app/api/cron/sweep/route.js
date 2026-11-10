import { rget } from '@/lib/admin'
import { checkOrder } from '@/lib/shop'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
// Memeriksa semua pesanan yang masih menunggu OTP. Panggil tiap menit dari layanan cron gratis (mis. cron-job.org):
// https://DOMAIN/api/cron/sweep?key=CRON_SECRET
export async function GET(req) {
  const sec = process.env.CRON_SECRET, u = new URL(req.url)
  if (!sec || (u.searchParams.get('key') !== sec && req.headers.get('authorization') !== 'Bearer ' + sec)) return Response.json({ error: 'forbidden' }, { status: 403 })
  const waiting = Object.entries((await rget('orders')) || {}).filter(([, o]) => o.status === 'waiting').slice(0, 40)
  let done = 0, warn = ''
  for (let i = 0; i < waiting.length; i += 5) {
    const rs = await Promise.all(waiting.slice(i, i + 5).map(([id, o]) => checkOrder(id, o).catch(e => ({ warn: e.message }))))
    rs.forEach(r => { if (r.order && r.order.status !== 'waiting') done++; if (r.warn) warn = r.warn })
  }
  return Response.json({ ok: true, checked: waiting.length, finished: done, warn: warn.slice(0, 200) })
}
