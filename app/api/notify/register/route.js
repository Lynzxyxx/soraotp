import { uidFrom, rtx } from '@/lib/admin'
import { nRegister } from '@/lib/notify'
// Dipanggil klien sekali setelah pendaftaran; flag regNotified mencegah notifikasi ganda
export async function POST(req) {
  try {
    const uid = await uidFrom(req)
    const r = await rtx('users/' + uid + '/regNotified', v => (v ? undefined : true))
    if (r.committed) await nRegister(uid)
    return Response.json({ ok: true })
  } catch (x) { return Response.json({ error: x.message }, { status: 400 }) }
}
