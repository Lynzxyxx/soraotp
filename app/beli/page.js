'use client'
import { useRouter } from 'next/navigation'
import Shell, { useMe } from '@/components/Shell'
import BuyFlow from '@/components/BuyFlow'
import { api, rp } from '@/lib/firebase'
function Body() {
  const me = useMe(), r = useRouter()
  async function buy(x) { const { id } = await api('/api/order', { method: 'POST', body: JSON.stringify(x) }); r.push('/pembelian/' + id) }
  return <>
    <h1 className="pt">Beli Nomor</h1><div className="mut">Pilih aplikasi, pilih negara, dapatkan nomor. Saldo <span className="mono">{rp(me.saldo)}</span></div>
    <BuyFlow onBuy={buy} />
  </>
}
export default function P() { return <Shell><Body /></Shell> }
