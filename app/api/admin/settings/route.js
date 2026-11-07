import { ownerFrom, rupd, rpush } from '@/lib/admin'
import { getSettings, resetSettingsCache } from '@/lib/settings'
const R = { marginUser: [0, 500], marginReseller: [0, 500], feePercent: [0, 50], feeFlat: [0, 100000], minDeposit: [1000, 1000000] }
export async function POST(req) {
  try {
    const admin = await ownerFrom(req), b = await req.json(), out = {}
    for (const [k, [lo, hi]] of Object.entries(R)) {
      if (b[k] === undefined) continue
      const n = Number(b[k]); if (!Number.isFinite(n) || n < lo || n > hi) throw new Error(`${k} harus antara ${lo} dan ${hi}`)
      out[k] = n
    }
    await rupd('settings', out); resetSettingsCache()
    await rpush('adminLogs', { admin, action: 'settings', value: JSON.stringify(out), at: Date.now() })
    return Response.json({ settings: await getSettings(true) })
  } catch (e) { return Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 }) }
}
