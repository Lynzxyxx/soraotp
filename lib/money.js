// Dipakai server & klien: hitung biaya deposit
export const calcDeposit = (amount, st) => {
  const a = Number(amount) || 0
  const fee = Math.ceil(a * (Number(st?.feePercent) || 0) / 100) + Math.round(Number(st?.feeFlat) || 0)
  return { fee, total: a + fee }
}
