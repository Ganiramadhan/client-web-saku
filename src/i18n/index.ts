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
    {
      name: 'saku-locale',
      version: 4,
      migrate: (persisted) => {
        const state = persisted as Partial<I18nState> | undefined
        const locale = state?.locale === 'en' || state?.locale === 'id' ? state.locale : 'id'
        return { ...state, locale } as I18nState
      },
    },
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
