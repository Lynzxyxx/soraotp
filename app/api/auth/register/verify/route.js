import { verifyRegistration } from '@/lib/regmail'
export async function POST(req) {
  try { await verifyRegistration(await req.json()); return Response.json({ ok: true }) }
  catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
