import { useState } from 'react'
import {
  HiOutlineCog6Tooth,
  HiOutlineInformationCircle,
  HiOutlineMoon,
} from 'react-icons/hi2'
import { Card } from '@/components/ui'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

export function AppInfoCard() {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        title: 'Informasi Aplikasi',
        theme: 'Mode gelap / terang',
        about: 'Tentang SAKU',
        version: 'Versi aplikasi',
      }
    : {
        title: 'Application Info',
        theme: 'Dark / light mode',
        about: 'About SAKU',
        version: 'App version',
      }
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleDarkMode = () => {
    setDarkMode((value) => {
      const next = !value
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('saku_theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiOutlineCog6Tooth className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900">{copy.title}</h3>
      </div>
      <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-white/70 bg-white/50">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-white/80"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <HiOutlineMoon className="h-4 w-4 text-slate-500" />
            {copy.theme}
          </span>
          <span className={cn('h-5 w-9 rounded-full p-0.5 transition', darkMode ? 'bg-brand-600' : 'bg-slate-300')}>
            <span className={cn('block h-4 w-4 rounded-full bg-white shadow transition', darkMode && 'translate-x-4')} />
          </span>
        </button>
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <HiOutlineInformationCircle className="h-4 w-4 text-slate-500" />
            {copy.about}
          </span>
          <span className="text-xs font-bold text-slate-400">v1.0</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="text-xs font-semibold text-slate-700">{copy.version}</span>
          <span className="text-xs font-bold text-slate-400">2026.05</span>
        </div>
      </div>
    </Card>
  )
}
