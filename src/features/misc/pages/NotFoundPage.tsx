import { Link } from 'react-router-dom'
import { HiOutlineHome } from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { Logo } from '@/components/Logo'
import { useT } from '@/i18n'

export function NotFoundPage() {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <Logo size="lg" />
      <div className="text-7xl font-bold leading-none tracking-tight text-slate-900 sm:text-8xl">
        404
      </div>
      <p className="max-w-md text-base text-slate-600">
        Halaman tidak ditemukan / Page not found.
      </p>
      <Link to="/">
        <Button leftIcon={<HiOutlineHome className="h-4 w-4" />}>{t.common.backToHome}</Button>
      </Link>
    </div>
  )
}
