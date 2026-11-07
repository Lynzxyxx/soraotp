import { ownerFrom } from '@/lib/admin'
import { setWebhook } from '@/lib/provider'
// Mendaftarkan URL webhook ke NusaOTP (/v2/set-webhook) dari panel admin
export async function POST(req) {
  try {
    await ownerFrom(req)
    if (!process.env.NUSA_WEBHOOK_SECRET) throw new Error('NUSA_WEBHOOK_SECRET belum diisi di env')
    const url = `${new URL(req.url).origin}/api/webhook/nusa?key=${encodeURIComponent(process.env.NUSA_WEBHOOK_SECRET)}`
    const result = await setWebhook(url)
    return Response.json({ ok: true, result: result ?? null, url: url.replace(/key=.*/, 'key=***') })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
