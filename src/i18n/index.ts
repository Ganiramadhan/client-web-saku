import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dictionaries, type Locale, type Dict } from './dictionaries'

interface I18nState {
  locale: Locale
  setLocale: (l: Locale) => void
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'id',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'saku-locale' },
  ),
)

export function useT(): Dict {
  const locale = useI18nStore((s) => s.locale)
  return dictionaries[locale] as Dict
}

export function useLocale() {
  const locale = useI18nStore((s) => s.locale)
  const setLocale = useI18nStore((s) => s.setLocale)
  return { locale, setLocale }
}
