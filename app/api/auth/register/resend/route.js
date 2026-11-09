import { resendCode } from '@/lib/regmail'
export async function POST(req) {
  try { return Response.json(await resendCode(await req.json())) }
  catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
