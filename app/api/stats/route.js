import { rget } from '@/lib/admin'
import { countries, services } from '@/lib/provider'
export const revalidate = 600
export async function GET() {
  const n = async f => { try { return await f() } catch { return null } }
  const cs = await n(countries)
  const [u, o, sv] = await Promise.all([n(() => rget('users')), n(() => rget('orders')), cs?.[0] ? n(() => services(cs[0].id)) : null])
  return Response.json({ layanan: sv?.length ?? null, negara: cs?.length ?? null, pengguna: u ? Object.keys(u).length : null, pembelian: o ? Object.keys(o).length : null })
}
