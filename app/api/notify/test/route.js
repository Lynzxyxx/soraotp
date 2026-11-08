import { ownerFrom } from '@/lib/admin'
import { tg } from '@/lib/telegram'
import { wib, LN } from '@/lib/notify'
export async function POST(req) {
  try {
    await ownerFrom(req)
    const r = await tg(`🤖 <b>BOT SORAOTP TERHUBUNG</b>\n<i>Notifikasi akan dikirim ke chat ini</i>\n${LN}\n✅ Pendaftaran, login, deposit, dan pesanan\n📊 Rekap bisa dikirim dari admin panel\n${LN}\n🕒 ${wib()}`)
    return r.ok ? Response.json({ ok: true }) : Response.json({ error: 'Telegram: ' + r.error }, { status: 400 })
  } catch (x) { return Response.json({ error: x.message }, { status: x.message === 'forbidden' ? 403 : 400 }) }
}
