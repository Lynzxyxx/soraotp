import { ownerFrom } from '@/lib/admin'
import { tg } from '@/lib/telegram'
export async function POST(req) {
  try {
    await ownerFrom(req)
    const r = await tg('<b>Tes notifikasi SoraOTP</b>\nBot Telegram sudah terhubung.')
    return r.ok ? Response.json({ ok: true }) : Response.json({ error: 'Telegram: ' + r.error }, { status: 400 })
  } catch (x) { return Response.json({ error: x.message }, { status: x.message === 'forbidden' ? 403 : 400 }) }
}
