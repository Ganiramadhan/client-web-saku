import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineHome } from 'react-icons/hi2'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  return (
    <main className="app-surface relative grid min-h-screen place-items-center overflow-hidden bg-[#f6eee8] px-4 py-10 text-[#17120f]">
      <div className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-[45%_55%_35%_65%] border border-[#17120f]/15 bg-brand-100/55" />
      <div className="pointer-events-none absolute -right-12 bottom-12 h-56 w-56 rounded-[62%_38%_55%_45%] border border-[#17120f]/15 bg-[#fddf82]/55" />

      <section className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#17120f]/18 bg-[#fffaf6]/92 p-5 shadow-[0_24px_70px_rgba(23,18,15,0.12)] backdrop-blur sm:p-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-8">
        <LostPageIllustration />
        <div className="relative mt-6 lg:mt-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#17120f]/15 bg-[#ffe4dc] px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em]">
            404
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Nyasar sedikit
          </div>
          <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
            Halaman yang kamu cari sepertinya nyasar.
          </h1>
          <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-[#4f4540] sm:text-base">
            Link ini mungkin sudah dipindahkan, kedaluwarsa, atau salah ketik. Tenang, kamu bisa balik ke beranda atau mulai mencatat keuangan dari awal.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/">
              <Button className="w-full bg-brand-300 text-[#17120f] hover:bg-brand-200 sm:w-auto" leftIcon={<HiOutlineHome className="h-4 w-4" />}>
                Kembali ke Beranda
              </Button>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#17120f]/18 bg-white px-5 py-3 text-sm font-black text-[#17120f] shadow-sm shadow-[#17120f]/5 transition hover:-translate-y-0.5 hover:bg-[#fddf82]/70"
            >
              Mulai Catat Keuangan
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function LostPageIllustration() {
  return (
    <svg viewBox="0 0 420 340" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="Ilustrasi halaman tidak ditemukan">
      <path d="M53 270c43-36 91-50 147-43 57 7 99 30 144-4" fill="none" stroke="#ffded6" strokeWidth="34" strokeLinecap="round" />
      <path d="M53 270c43-36 91-50 147-43 57 7 99 30 144-4" fill="none" stroke="#17120f" strokeOpacity=".42" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 253c15-27 35-35 58-23-9 25-28 33-58 23Z" fill="#ff9d8d" stroke="#17120f" strokeOpacity=".7" strokeWidth="2.5" />
      <path d="M88 300c-5-43 5-76 31-102" fill="none" stroke="#17120f" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
      <path d="M109 282c27-19 50-17 66 8-29 19-50 17-66-8Z" fill="#fddf82" stroke="#17120f" strokeOpacity=".7" strokeWidth="2.5" />
      <rect x="136" y="68" width="162" height="136" rx="34" fill="#fffaf6" stroke="#17120f" strokeOpacity=".65" strokeWidth="3" />
      <circle cx="180" cy="121" r="10" fill="#17120f" />
      <circle cx="254" cy="121" r="10" fill="#17120f" />
      <path d="M184 162c22-17 45-17 67 0" fill="none" stroke="#17120f" strokeOpacity=".7" strokeWidth="6" strokeLinecap="round" />
      <path d="M159 88l-22-22M279 88l21-22" stroke="#17120f" strokeOpacity=".6" strokeWidth="5" strokeLinecap="round" />
      <rect x="256" y="192" width="86" height="58" rx="18" fill="#ecfdf5" stroke="#17120f" strokeOpacity=".65" strokeWidth="3" />
      <path d="M278 216h36M278 234h20" stroke="#17120f" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" />
      <path d="M80 100l8 16 17 7-17 7-8 16-8-16-17-7 17-7 8-16Z" fill="#fddf82" stroke="#17120f" strokeOpacity=".58" strokeWidth="2.5" />
      <path d="M333 78l6 12 13 5-13 6-6 12-6-12-13-6 13-5 6-12Z" fill="#ffe4dc" stroke="#17120f" strokeOpacity=".58" strokeWidth="2.5" />
    </svg>
  )
}
