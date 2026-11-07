import { uidFrom } from '@/lib/admin'
import { getSettings } from '@/lib/settings'
export async function GET(req) {
  try { await uidFrom(req); const { feePercent, feeFlat, minDeposit } = await getSettings(); return Response.json({ feePercent, feeFlat, minDeposit }) }
  catch (e) { return Response.json({ error: e.message }, { status: 400 }) }
}
