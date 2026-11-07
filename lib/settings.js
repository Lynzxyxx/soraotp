import { rget } from '@/lib/admin'
// Pengaturan yang bisa diubah admin (node 'settings' di Realtime Database); bawaan dari env
let cache = null, at = 0
const num = (v, d) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d)
export async function getSettings(force) {
  if (!force && cache && Date.now() - at < 15000) return cache
  const s = (await rget('settings')) || {}
  cache = { marginUser: num(s.marginUser, num(process.env.MARKUP_PERCENT, 20)), marginReseller: num(s.marginReseller, num(process.env.RESELLER_MARKUP_PERCENT, 8)),
    feePercent: num(s.feePercent, 0), feeFlat: num(s.feeFlat, 0), minDeposit: num(s.minDeposit, 5000) }
  at = Date.now(); return cache
}
export const resetSettingsCache = () => { cache = null }
export const marginFor = (st, role) => (role === 'reseller' || role === 'owner' ? st.marginReseller : st.marginUser)
