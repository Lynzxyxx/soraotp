import Cta from '@/components/Cta'
import Stats from '@/components/Stats'
import ThemeToggle from '@/components/ThemeToggle'
import { CONTACT as C, igUrl, ttUrl } from '@/lib/contact'
const TG = process.env.NEXT_PUBLIC_TELEGRAM_URL
const FEAT = [
  ['Pengiriman instan', 'Nomor dan kode OTP tampil dalam hitungan detik di halaman pesanan.'],
  ['Bayar pakai QRIS', 'Isi saldo lewat QRIS. Saldo masuk otomatis setelah pembayaran terdeteksi.'],
  ['Refund otomatis', 'Pesanan tanpa SMS bisa dibatalkan dan saldo kembali utuh.'],
  ['Salin sekali ketuk', 'Nomor dan kode OTP punya tombol salin, siap ditempel ke aplikasi tujuan.'],
  ['Update realtime', 'Halaman pesanan memperbarui diri sendiri, tanpa refresh berulang.'],
  ['Banyak server', 'Satu aplikasi punya beberapa server dan harga. Kamu yang memilih.'],
]
const STEPS = [
  ['Daftar & isi saldo', 'Buat akun dengan email. Isi saldo minimal Rp 5.000 lewat QRIS.'],
  ['Pilih aplikasi dan negara', 'Cari aplikasi yang butuh verifikasi, pilih negara dan server, lalu beli.'],
  ['Terima OTP', 'Pakai nomornya di aplikasi tujuan. Kode muncul otomatis di halaman pesanan.'],
]
const APPS = ['WhatsApp', 'Telegram', 'Instagram', 'TikTok', 'Facebook', 'Google']
const FAQ = [
  ['Ini layanan apa?', 'Nomor virtual sekali pakai untuk menerima kode verifikasi (OTP) dari berbagai aplikasi.'],
  ['Berapa minimal isi saldo?', 'Rp 5.000, dibayar lewat QRIS.'],
  ['Kalau OTP tidak masuk?', 'Batalkan pesanan dari halaman pesanan. Pembatalan tersedia beberapa menit setelah beli, dan saldo dikembalikan.'],
  ['Apakah aktif 24 jam?', 'Ya, sistemnya berjalan otomatis setiap hari.'],
  ['Perlu pasang aplikasi?', 'Tidak. Semua berjalan di browser HP maupun komputer.'],
  ['Bagaimana menghubungi admin dan CS?', <>Instagram admin: <a href={igUrl(C.igAdmin)}>@{C.igAdmin}</a>. Instagram CS untuk bantuan transaksi: <a href={igUrl(C.igCs)}>@{C.igCs}</a>.</>],
  ['Apakah ada akun TikTok?', <>Ada, ikuti <a href={ttUrl(C.tiktok)}>@{C.tiktok}</a> di TikTok.</>],
]
export default function Landing() {
  return <div className="land">
    <header className="lh"><div className="brand"><img src="/logo-sm.webp" alt="" width="28" height="28" />Sora<span>OTP</span></div>
      <nav><a href="#fitur">Fitur</a><a href="#cara">Cara pakai</a><a href="#faq">FAQ</a></nav>
      <div className="r"><ThemeToggle /><Cta className="btn d" /></div></header>
    <section className="hero3">
      <div><span className="badge">verifikasi nomor virtual, tanpa kartu SIM</span>
        <h1>Nomor virtual OTP yang cepat &amp; <em>praktis</em>.</h1>
        <p>Beli nomor, pakai untuk verifikasi, ambil kodenya. Semua dari satu dashboard, dibayar lewat QRIS.</p>
        <div className="row" style={{ marginTop: 0 }}><Cta className="btn xl" /><a className="btn d xl" href="#fitur">Lihat fitur</a></div>
        <div className="trust"><span>Aktif 24 jam</span><span>Bayar QRIS</span><span>Refund otomatis</span></div></div>
      <div className="mock" aria-hidden="true">
        <div className="mc a"><small>WhatsApp</small><div className="nm">+62 812 3456 7890</div><span className="ok2">Nomor berhasil dibuat</span></div>
        <div className="mc b"><small>OTP diterima</small><div className="cd">493728</div><span className="btn xs">Salin OTP</span></div>
        <div className="mc c"><small>Saldo</small><div className="nm">Rp 100.000</div></div></div>
    </section>
    <Stats />
    <section className="sec" id="fitur"><h2>Fitur</h2><p className="sub2">Yang kamu butuhkan untuk menerima OTP, tanpa tambahan yang tidak perlu.</p>
      <div className="fg">{FEAT.map(([t, d], i) => <div className="card" key={t}><span className="n">0{i + 1}</span><b>{t}</b><p>{d}</p></div>)}</div></section>
    <section className="sec" id="cara"><h2>Cara pakai</h2><div className="steps">{STEPS.map(([t, d], i) => <div key={t}><i>0{i + 1}</i><span><b>{t}</b><p>{d}</p></span></div>)}</div></section>
    <section className="sec"><h2>Contoh aplikasi</h2><p className="sub2">Dan ratusan layanan lain. Daftar lengkap ada di dashboard.</p>
      <div className="apps3">{APPS.map(a => <div key={a}><i>{a.slice(0, 2).toUpperCase()}</i>{a}</div>)}</div></section>
    <section className="sec" id="faq"><h2>Pertanyaan umum</h2><div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    <div className="final"><div><h2>Siap menerima OTP pertama?</h2><div className="mut">Mulai dari Rp 5.000.</div></div><Cta className="btn xl" /></div>
    <div className="lf"><span>© 2026 SoraOTP</span><span style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>{TG && <a href={TG}>Telegram</a>}<a href={igUrl(C.igAdmin)}>Instagram</a><a href={igUrl(C.igCs)}>CS</a><a href={ttUrl(C.tiktok)}>TikTok</a></span></div>
  </div>
}
