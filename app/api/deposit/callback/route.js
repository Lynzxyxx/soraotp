import { settle } from '@/lib/credit'
// Webhook buatqris: isi payload tidak dipercaya, status selalu dicek ulang ke provider.
export async function POST(req) {
  const b = await req.json().catch(() => ({}))
  const id = b.order_id || b.id
  if (id) await settle(String(id))
  return Response.json({ ok: true })
}
