import { userFrom } from '@/lib/admin'
import { countries, services, products } from '@/lib/provider'
export const dynamic = 'force-dynamic'
export async function GET(req) {
  try {
    const me = await userFrom(req), p = new URL(req.url).searchParams
    const t = p.get('type')
    const data = t === 'country' ? await countries() : t === 'services' ? await services(p.get('country')) : await products(p.get('country'), p.get('service'), me.role)
    return Response.json({ data })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
