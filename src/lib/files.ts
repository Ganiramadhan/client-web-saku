export interface ImageValidationOptions {
  maxSizeMb?: number
}

export function validateImageFile(
  file: File | undefined | null,
  opts: ImageValidationOptions = {},
): string | null {
  if (!file) return 'File belum dipilih.'
  if (!file.type.startsWith('image/')) return 'Hanya file gambar yang diperbolehkan'

  const maxSizeMb = opts.maxSizeMb ?? 5
  if (file.size > maxSizeMb * 1024 * 1024) return `Ukuran maksimum ${maxSizeMb} MB.`

  return null
}
