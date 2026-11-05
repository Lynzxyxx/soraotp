import Cta from '@/components/Cta'
import Stats from '@/components/Stats'
const TG = process.env.NEXT_PUBLIC_TELEGRAM_URL
const WHY = [
  ['24/7', 'Sistem otomatis aktif nonstop selama 24 jam tanpa gangguan.'],
  ['Rp', 'Harga kompetitif dengan kualitas premium dan proses super cepat.'],
  ['Stok', 'Ribuan stok aktif dengan backup otomatis jika stok habis.'],
  ['Chat', 'Tim support responsif siap membantu kapan saja kamu membutuhkan.'],
  ['QRIS', 'Isi saldo instan lewat QRIS, saldo masuk otomatis tanpa konfirmasi manual.'],
  ['SMS', 'Sistem real-time, kode OTP tampil langsung di dashboard begitu masuk.'],
]
const STEPS = [
  ['Daftar & Isi Saldo', 'Buat akun gratis pakai email. Top up saldo minimum Rp 5.000 lewat QRIS.'],
  ['Pilih Layanan & Negara', 'Cari aplikasi yang kamu butuhkan (WhatsApp, Telegram, dll), klik beli dan nomor langsung muncul.'],
  ['Terima OTP & Selesai', 'Pakai nomor itu di aplikasi kamu. Kode OTP otomatis masuk dalam hitungan detik.'],
]
const FAQ = [
  ['SoraOTP itu apa sih?', 'Platform penyedia nomor virtual untuk menerima kode verifikasi (OTP) berbagai aplikasi tanpa kartu SIM fisik.'],
  ['Bagaimana cara isi saldo?', 'Buka menu Isi Saldo, masukkan nominal (minimal Rp 5.000), scan QRIS, dan saldo masuk otomatis.'],
  ['Bagaimana cara membeli nomor?', 'Buka menu Beli, pilih negara dan aplikasi, lalu pilih server dan tekan Beli. Nomor tampil di layar.'],
  ['Bagaimana jika OTP tidak masuk?', 'Batalkan pesanan dari halaman Beli. Saldo untuk pesanan yang dibatalkan dikembalikan otomatis.'],
  ['Apakah layanan aktif 24 jam?', 'Ya, sistem berjalan otomatis 24 jam setiap hari.'],
]
export default function Landing() {
  return <div className="land">
    <header className="lh"><div className="brand"><img src="/logo-sm.webp" alt="" width="34" height="34" />Sora<span>OTP</span></div></header>
    <section className="hero2">
      <div className="lgimg"><img src="/logo.webp" alt="SoraOTP" /></div>
      <h1>SORA <span>OTP</span></h1>
      <p className="pill">Platform penyedia nomor virtual untuk berbagai kebutuhan verifikasi akun. Instan, otomatis, aman, dan aktif 24 jam tanpa perlu kartu fisik.</p>
      <Stats />
      <div className="cta"><Cta className="lgbtn" />{TG && <a className="lgbtn alt" href={TG}>Akses Cepat? Order Via Telegram</a>}</div>
    </section>
    <section><h2>Kenapa Memilih <span>SoraOTP?</span></h2><p className="pill">Kami menyediakan layanan otomatis tercepat.</p>
      <div className="grid">{WHY.map(([i, t]) => <div className="card" key={i}><div className="ic">{i}</div><p>{t}</p></div>)}</div></section>
    <section><h2>Cara <span>Kerjanya</span></h2>
      <div className="grid">{STEPS.map(([t, d], i) => <div className="card" key={t}><div className="ic">{i + 1}</div><b>{t}</b><p>{d}</p></div>)}</div></section>
    <section><h2>Pertanyaan Umum <span>(FAQ)</span></h2>
      <div className="faq">{FAQ.map(([q, a]) => <details className="card" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    <section className="final"><h2>Siap Verifikasi <span>Lebih Cepat?</span></h2><Cta className="lgbtn" /></section>
    <footer>© 2026 <b>SoraOTP</b>. All Rights Reserved.</footer>
  </div>
}
