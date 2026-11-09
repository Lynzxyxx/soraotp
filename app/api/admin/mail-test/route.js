import { ownerFrom, rget } from '@/lib/admin'
import { sendMail, otpMail } from '@/lib/mailer'
// Kirim email tes ke alamat email akun admin yang sedang login
export async function POST(req) {
  try {
    const uid = await ownerFrom(req), u = await rget('users/' + uid)
    await sendMail({ to: u.email, ...otpMail('123456', u.name || 'Admin') })
    return Response.json({ ok: true, to: u.email })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
