export function generateStrongPassword(): string {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789']
  const all = groups.join('')
  const chars = groups.map((group) => group[Math.floor(Math.random() * group.length)])
  while (chars.length < 14) chars.push(all[Math.floor(Math.random() * all.length)])
  return chars.sort(() => Math.random() - 0.5).join('')
}

export function getPasswordValidationError(password: string, confirmPassword: string): string | null {
  if (password.length < 8) return 'Password baru minimal 8 karakter.'
  if (!/[A-Z]/.test(password)) return 'Password baru harus mengandung huruf besar.'
  if (!/[a-z]/.test(password)) return 'Password baru harus mengandung huruf kecil.'
  if (!/\d/.test(password)) return 'Password baru harus mengandung angka.'
  if (!confirmPassword) return 'Konfirmasi password baru wajib diisi.'
  if (password !== confirmPassword) return 'Konfirmasi password tidak cocok.'
  return null
}

export function scoreStrength(pw: string): number {
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (pw.length >= 16) s++
  return Math.min(4, Math.max(0, s - 1))
}
