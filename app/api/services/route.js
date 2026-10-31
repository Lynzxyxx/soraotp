import { services } from '@/lib/provider'
export const dynamic = 'force-dynamic'
export async function GET() {
  try { return Response.json({ data: await services() }) }
  catch (e) { return Response.json({ error: 'Gagal memuat layanan' }, { status: 502 }) }
}
