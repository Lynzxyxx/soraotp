import Shell from '@/components/Shell'
import { CONTACT as C, igUrl, ttUrl } from '@/lib/contact'
export default function P() { return <Shell><div className="card"><b>Tutorial</b><ol>
  <li>Isi saldo lewat menu <b>Isi Saldo</b>, scan QRIS, saldo masuk otomatis.</li>
  <li>Buka menu <b>Beli</b>, cari aplikasi yang ingin diverifikasi, tekan <b>Beli</b>.</li>
  <li>Pakai nomor yang muncul untuk meminta kode OTP di aplikasi tujuan.</li>
  <li>Kode OTP tampil otomatis. Jika tidak masuk, tekan <b>Batalkan</b> dan saldo dikembalikan.</li></ol></div><div className="card"><b>Butuh bantuan?</b><p>Instagram admin: <a href={igUrl(C.igAdmin)}>@{C.igAdmin}</a></p><p>Instagram CS: <a href={igUrl(C.igCs)}>@{C.igCs}</a></p><p>TikTok: <a href={ttUrl(C.tiktok)}>@{C.tiktok}</a></p></div></Shell> }
