// Kirim email lewat Resend (https://resend.com). Env: RESEND_API_KEY, RESEND_FROM (domain pengirim harus sudah diverifikasi di Resend).
export async function sendMail({ to, subject, html, text }) {
  const key = (process.env.RESEND_API_KEY || '').trim()
  if (!key) throw new Error('Pengiriman email belum dikonfigurasi (env RESEND_API_KEY)')
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ from: process.env.RESEND_FROM || 'SoraOTP <onboarding@resend.dev>', to: [to], subject, html, text }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error('Resend: ' + (j.message || j.error?.message || 'HTTP ' + r.status))
}
export const mailHint = m => /only send testing emails|own email address/i.test(m) ? 'Akun Resend masih mode uji: hanya bisa kirim ke email pemilik akun. Verifikasi domain di resend.com/domains, lalu set RESEND_FROM memakai domain itu.'
  : /domain.*(not|isn.t).*verified|verify.*domain/i.test(m) ? 'Domain pengirim belum diverifikasi di Resend (tambahkan record DNS lalu Verify), atau RESEND_FROM memakai domain lain.'
  : /api key|unauthorized|401|403/i.test(m) ? 'RESEND_API_KEY salah atau belum di-Redeploy.' : /RESEND_API_KEY/.test(m) ? 'Isi env RESEND_API_KEY lalu Redeploy.' : ''
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
export const otpMail = (code, name) => ({
  subject: `${code} adalah kode verifikasi SoraOTP`,
  text: `Halo ${name}, kode verifikasi SoraOTP kamu: ${code}\nBerlaku 10 menit. Jangan bagikan kode ini ke siapa pun.\nJika bukan kamu yang mendaftar, abaikan email ini.`,
  html: `<div style="background:#0b0e0c;padding:24px;font-family:Arial,Helvetica,sans-serif"><div style="max-width:420px;margin:0 auto;background:#111613;border:1px solid #222c26;border-radius:14px;padding:28px;color:#e7ede9">
<div style="font-size:22px;font-weight:700">Sora<span style="color:#22c55e">OTP</span></div>
<p style="color:#b9c5bd;line-height:1.5">Halo ${esc(name)}, gunakan kode berikut untuk menyelesaikan pendaftaran akunmu:</p>
<div style="font-size:36px;letter-spacing:10px;font-weight:700;color:#22c55e;background:#0b0e0c;border:1px solid #222c26;border-radius:10px;padding:16px;text-align:center">${esc(code)}</div>
<p style="color:#8b9890;font-size:13px;line-height:1.5">Berlaku 10 menit. Jangan bagikan kode ini ke siapa pun. Jika bukan kamu yang mendaftar, abaikan email ini.</p></div></div>`,
})
