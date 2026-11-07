import { ownerFrom, rget } from '@/lib/admin'
import { balance } from '@/lib/provider'
import { getSettings } from '@/lib/settings'
const err = e => Response.json({ error: e.message }, { status: e.message === 'forbidden' ? 403 : 400 })
export const dynamic = 'force-dynamic'
export async function GET(req) {
  try {
    await ownerFrom(req)
    const type = new URL(req.url).searchParams.get('type')
    if (type === 'settings') return Response.json({ settings: await getSettings(true) })
    const [users, orders, deps] = (await Promise.all([rget('users'), rget('orders'), rget('deposits')])).map(x => x || {})
    if (type === 'orders' || type === 'deposits') {
      const src = type === 'orders' ? orders : deps
      const data = Object.entries(src).map(([id, v]) => ({ id, ...v, email: users[v.uid]?.email || v.uid })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 80)
      return Response.json({ data })
    }
    const U = Object.values(users), O = Object.values(orders), D = Object.values(deps), ok = O.filter(o => o.status === 'success')
    let provider
    try { provider = { ok: true, saldo: await balance() } } catch (e) { provider = { ok: false, error: e.message } }
    return Response.json({
      pengguna: U.length, pesanan: O.length, berjalan: O.filter(o => o.status === 'waiting').length,
      omzet: ok.reduce((s, o) => s + (o.price || 0), 0), laba: ok.reduce((s, o) => s + (o.cost != null ? o.price - o.cost : 0), 0),
      deposit: D.filter(d => d.status === 'success').reduce((s, d) => s + (d.amount || 0), 0), saldoUser: U.reduce((s, u) => s + (u.saldo || 0), 0),
      conn: { qris: !!(process.env.BUATQRIS_ACCOUNT_ID && process.env.BUATQRIS_SECRET_TOKEN), provider, telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_ID) },
    })
  } catch (e) { return err(e) }
}
