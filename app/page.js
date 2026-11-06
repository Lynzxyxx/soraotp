import Cta from '@/components/Cta'
import Stats from '@/components/Stats'
const TG = process.env.NEXT_PUBLIC_TELEGRAM_URL
const STEPS = [
  ['Isi saldo', 'Bayar lewat QRIS, minimal Rp 5.000. Saldo masuk otomatis setelah pembayaran terdeteksi.'],
  ['Pilih negara dan aplikasi', 'Cari aplikasi yang butuh verifikasi, pilih server, lalu beli. Nomor langsung tampil.'],
  ['Ambil kode OTP', 'Pakai nomornya di aplikasi tujuan. Kode muncul di halaman pesanan begitu SMS masuk.'],
]
const WHY = [
  ['Refund otomatis', 'Pesanan yang tidak menerima SMS bisa dibatalkan dan saldo kembali utuh.'],
  ['Stok dari banyak server', 'Satu aplikasi punya beberapa pilihan server dengan harga berbeda, kamu yang memilih.'],
  ['Tanpa kartu SIM', 'Semua lewat browser. Tidak perlu kartu fisik atau aplikasi tambahan.'],
]
const FAQ = [
  ['Ini layanan apa?', 'Nomor virtual sekali pakai untuk menerima kode verifikasi (OTP) dari berbagai aplikasi.'],
  ['Berapa minimal isi saldo?', 'Rp 5.000, dibayar lewat QRIS.'],
  ['Kalau OTP tidak masuk?', 'Batalkan pesanan dari halaman pesanan. Pembatalan tersedia beberapa menit setelah beli, dan saldo dikembalikan.'],
  ['Apakah aktif 24 jam?', 'Ya, sistemnya berjalan otomatis setiap hari.'],
]
export default function Landing() {
  return <div className="land">
    <header className="lh"><div className="brand"><img src="/logo-sm.webp" alt="" width="28" height="28" />Sora<span>OTP</span></div><Cta className="btn d" /></header>
    <section className="hero2">
      <div><h1>Nomor virtual untuk terima <em>OTP</em>.</h1>
        <p>Beli nomor, pakai untuk verifikasi, ambil kodenya. Bayar pakai QRIS, tanpa kartu SIM fisik.</p>
        <div className="row" style={{ marginTop: 0 }}><Cta className="btn xl" />{TG && <a className="btn d xl" href={TG}>Order via Telegram</a>}</div></div>
      <div className="lgimg"><img src="/logo.webp" alt="SoraOTP" /></div>
    </section>
    <Stats />
    <section className="sec"><h2>Cara pakai</h2><div className="steps">{STEPS.map(([t, d], i) => <div key={t}><i>0{i + 1}</i><span><b>{t}</b><p>{d}</p></span></div>)}</div></section>
    <section className="sec"><h2>Yang kamu dapat</h2><div className="why">{WHY.map(([t, d]) => <div key={t}><span><b>{t}</b><p>{d}</p></span></div>)}</div></section>
    <section className="sec"><h2>Pertanyaan</h2><div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    <div className="final"><b>Mulai dari Rp 5.000.</b><Cta className="btn" /></div>
    <footer>© 2026 SoraOTP</footer>
  </div>
}
