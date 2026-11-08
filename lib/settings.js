import { rget } from '@/lib/admin'
// Pengaturan yang bisa diubah admin (node 'settings' di Realtime Database); bawaan dari env
export const NOTIFY_KEYS = ['register', 'login', 'depositNew', 'depositOk', 'orderNew', 'orderOk', 'orderCancel', 'admin']
let cache = null, at = 0
const num = (v, d) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d)
export async function getSettings(force) {
  if (!force && cache && Date.now() - at < 15000) return cache
  const s = (await rget('settings')) || {}
  cache = { marginUser: num(s.marginUser, num(process.env.MARKUP_PERCENT, 20)), marginReseller: num(s.marginReseller, num(process.env.RESELLER_MARKUP_PERCENT, 8)),
    feePercent: num(s.feePercent, 0), feeFlat: num(s.feeFlat, 0), minDeposit: num(s.minDeposit, 5000),
    recapFormat: ['text', 'image', 'both'].includes(s.recapFormat) ? s.recapFormat : 'both',
    recapPeriod: ['today', '7d', '30d', 'all'].includes(s.recapPeriod) ? s.recapPeriod : 'today', recapAuto: num(s.recapAuto, 0) }
  for (const k of NOTIFY_KEYS) cache['n_' + k] = num(s['n_' + k], 1)
  at = Date.now(); return cache
}
export const resetSettingsCache = () => { cache = null }
export const marginFor = (st, role) => (role === 'reseller' || role === 'owner' ? st.marginReseller : st.marginUser)
