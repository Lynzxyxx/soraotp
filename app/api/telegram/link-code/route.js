import { uidFrom, rset } from '@/lib/admin'
import { tgApi } from '@/lib/telegram'
import { randomInt } from 'crypto'
// Kode 6 digit (berlaku 5 menit) untuk menghubungkan akun website ke Telegram
export async function POST(req) {
  try {
    const uid = await uidFrom(req), code = String(randomInt(100000, 1000000))
    await rset('tgCodes/' + code, { uid, exp: Date.now() + 300000 })
    let name = (process.env.TELEGRAM_BOT_USERNAME || '').replace('@', '')
    if (!name) { const r = await tgApi('getMe', {}); name = r.result?.username || '' }
    return Response.json({ code, link: name ? `https://t.me/${name}?start=link_${code}` : null })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
