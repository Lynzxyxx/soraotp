import { uidFrom } from '@/lib/admin'
import { makeDeposit } from '@/lib/shop'
export async function POST(req) {
  try {
    const uid = await uidFrom(req), { amount } = await req.json()
    return Response.json(await makeDeposit(uid, Number(amount), new URL(req.url).origin))
  } catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
