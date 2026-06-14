import { useEffect } from 'react'

export interface SEOOptions {
  title: string
  description?: string
  canonical?: string
  image?: string
  keywords?: string
  locale?: string
  noIndex?: boolean
}

const DEFAULT_DESCRIPTION =
  'SAKU adalah AI Financial Assistant untuk mencatat transaksi, scan struk, mengelola wallet, budget, tagihan, dan insight cashflow pribadi.'
const SITE_URL = 'https://saku.ganipedia.com'

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key, value]) => el?.setAttribute(key, value))
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value, window.location.origin).toString()
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = `${SITE_URL}/logo.png`,
  keywords = 'SAKU, AI Financial Assistant, aplikasi keuangan pribadi, AI finance tracker, receipt scanner, budget tracker, digital wallet, split bill',
  locale = 'id_ID',
  noIndex,
}: SEOOptions) {
  useEffect(() => {
    const fullTitle = title.includes('SAKU') ? title : `${title} | SAKU`
    const currentUrl = canonical ? absoluteUrl(canonical) : SITE_URL + window.location.pathname
    const imageUrl = absoluteUrl(image)
    document.documentElement.lang = locale.startsWith('id') ? 'id' : 'en'
    document.title = fullTitle

    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: locale })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: currentUrl })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl })
    upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url', content: imageUrl })
    upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type', content: 'image/png' })
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' })
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: '630' })
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: 'Logo SAKU' })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'SAKU' })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl })
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex,nofollow,noarchive' : 'index,follow,max-image-preview:large',
    })
    upsertLink('canonical', currentUrl)
  }, [canonical, description, image, keywords, locale, noIndex, title])
}
