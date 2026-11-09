import { startRegistration, hashKey } from '@/lib/regmail'
export async function POST(req) {
  try {
    const b = await req.json(), ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    return Response.json(await startRegistration({ ...b, rl: 'ip_' + hashKey(ip) }))
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
