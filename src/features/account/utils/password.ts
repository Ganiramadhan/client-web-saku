export function generateStrongPassword(): string {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789']
  const all = groups.join('')
  const chars = groups.map((group) => group[Math.floor(Math.random() * group.length)])
  while (chars.length < 14) chars.push(all[Math.floor(Math.random() * all.length)])
  return chars.sort(() => Math.random() - 0.5).join('')
}

type PasswordValidationCopy = {
  minLength: string
  uppercase: string
  lowercase: string
  number: string
  confirmRequired: string
  mismatch: string
}

const DEFAULT_PASSWORD_VALIDATION_COPY: PasswordValidationCopy = {
  minLength: 'Password baru minimal 8 karakter.',
  uppercase: 'Password baru harus mengandung huruf besar.',
  lowercase: 'Password baru harus mengandung huruf kecil.',
  number: 'Password baru harus mengandung angka.',
  confirmRequired: 'Konfirmasi password baru wajib diisi.',
  mismatch: 'Konfirmasi password tidak cocok.',
}

export function getPasswordValidationError(
  password: string,
  confirmPassword: string,
  copy: PasswordValidationCopy = DEFAULT_PASSWORD_VALIDATION_COPY,
): string | null {
  if (password.length < 8) return copy.minLength
  if (!/[A-Z]/.test(password)) return copy.uppercase
  if (!/[a-z]/.test(password)) return copy.lowercase
  if (!/\d/.test(password)) return copy.number
  if (!confirmPassword) return copy.confirmRequired
  if (password !== confirmPassword) return copy.mismatch
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
