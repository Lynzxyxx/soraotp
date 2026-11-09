import { userFrom } from '@/lib/admin'
import { placeOrder } from '@/lib/shop'
export async function POST(req) {
  try {
    const me = await userFrom(req), b = await req.json()
    const { id } = await placeOrder(me, b)
    return Response.json({ id })
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
