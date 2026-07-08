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

export interface WebPImageOptions {
  maxSide?: number
  quality?: number
  filename?: string
}

export function imageFileToWebP(file: File, opts: WebPImageOptions = {}): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxSide = opts.maxSide ?? 1800
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas tidak tersedia'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal mengoptimalkan gambar'))
            return
          }
          const rawName = opts.filename || file.name.replace(/\.[^.]+$/, '') || 'image'
          resolve(new File([blob], `${rawName}.webp`, { type: 'image/webp', lastModified: Date.now() }))
        },
        'image/webp',
        opts.quality ?? 0.86,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar'))
    }
    img.src = url
  })
}

export async function imageFileToWebPBase64(file: File, opts: WebPImageOptions = {}): Promise<string> {
  const webp = await imageFileToWebP(file, opts)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const [, base64 = ''] = result.split(',')
      if (!base64) reject(new Error('Gagal membaca hasil optimasi gambar'))
      else resolve(base64)
    }
    reader.onerror = () => reject(new Error('Gagal membaca hasil optimasi gambar'))
    reader.readAsDataURL(webp)
  })
}
