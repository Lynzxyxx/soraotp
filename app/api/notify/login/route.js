import { uidFrom, rtx } from '@/lib/admin'
import { nLogin } from '@/lib/notify'
// Notifikasi login, dibatasi sekali per 5 menit per pengguna supaya tidak berisik
export async function POST(req) {
  try {
    const uid = await uidFrom(req), b = await req.json().catch(() => ({}))
    const r = await rtx('users/' + uid + '/lastLoginNotif', v => (!v || Date.now() - v > 300000 ? Date.now() : undefined))
    if (r.committed) await nLogin(uid, { method: b.method, ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim(), ua: req.headers.get('user-agent') || '' })
    return Response.json({ ok: true })
  } catch (x) { return Response.json({ error: x.message }, { status: 400 }) }
}
