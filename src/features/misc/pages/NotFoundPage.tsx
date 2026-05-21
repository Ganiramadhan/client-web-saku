import { Link } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineHome, HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { Button } from '@/components/ui'
import { Logo } from '@/components/Logo'
import { useT } from '@/i18n'

export function NotFoundPage() {
  const t = useT()
  return (
    <div className="app-surface relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-200/25 blur-3xl" />
      </div>
      <div className="relative w-full max-w-2xl px-6 py-10">
        <Logo size="lg" className="mx-auto" />
        <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200">
          <HiOutlineMagnifyingGlass className="h-8 w-8" />
        </div>
        <div className="mt-6 text-7xl font-black leading-none tracking-tight text-slate-950 sm:text-8xl">
          404
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-950">Halaman Tidak Ditemukan</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Link yang dibuka tidak tersedia, sudah dipindahkan, atau Anda tidak memiliki akses ke halaman tersebut.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/">
            <Button variant="outline" leftIcon={<HiOutlineHome className="h-4 w-4" />}>{t.common.backToHome}</Button>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Kembali
          </button>
        </div>
      </div>
    </div>
  )
}
