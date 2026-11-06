import { uidFrom, rget, rtx } from '@/lib/admin'
import { tg, e } from '@/lib/telegram'
// Dipanggil klien sekali setelah pendaftaran; flag regNotified mencegah notifikasi ganda
export async function POST(req) {
  try {
    const uid = await uidFrom(req)
    const r = await rtx('users/' + uid + '/regNotified', v => (v ? undefined : true))
    if (r.committed) { const u = await rget('users/' + uid); await tg(`<b>Pengguna baru</b>\nNama: ${e(u?.name)}\nEmail: ${e(u?.email)}\nWA: ${e(u?.wa)}`) }
    return Response.json({ ok: true })
  } catch (x) { return Response.json({ error: x.message }, { status: 400 }) }
}
