import { settle } from '@/lib/credit'
// Webhook buatqris (callback_url dikirim saat membuat QRIS, id tagihan ada di query).
// Isi kiriman tidak dipercaya: status selalu dicek ulang ke buatqris sebelum saldo ditambah.
export async function POST(req) {
  const id = new URL(req.url).searchParams.get('id')
  if (id) { try { await settle(id) } catch {} }
  return Response.json({ ok: true })
}
export const GET = POST
