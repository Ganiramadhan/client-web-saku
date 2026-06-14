import { Link } from 'react-router-dom'
import {
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineNewspaper,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { Logo } from '@/components/Logo'
import { useLocale } from '@/i18n'

const SUPPORT_EMAIL = 'hello@ganipedia.com'

export function BlogPage() {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const posts = getPosts(isId)
  const [featured, ...rest] = posts

  return (
    <div className="min-h-screen bg-[#f6eee8] text-[#17120f]">
      <header className="sticky top-0 z-40 border-b border-[#17120f]/10 bg-[#fffaf6]/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-full px-4 py-2 text-sm font-bold text-[#4f4540] transition hover:bg-white/70 hover:text-brand-700">
              {isId ? 'Beranda' : 'Home'}
            </Link>
            <Link to="/register" className="rounded-full border border-[#17120f]/20 bg-brand-300 px-4 py-2 text-sm font-extrabold text-[#17120f] shadow-sm shadow-[#17120f]/10 transition hover:-translate-y-0.5 hover:bg-brand-200">
              {isId ? 'Mulai Gratis' : 'Start Free'}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#17120f]/10 bg-[#fffaf6]">
          <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-[45%_55%_35%_65%] border border-[#17120f]/12 bg-brand-100/50" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#17120f]/12 bg-[#ffe4dc] px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                <HiOutlineNewspaper className="h-4 w-4" />
                SAKU Journal
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                {isId ? 'Cerita singkat untuk uang harian yang lebih kebaca.' : 'Short reads for clearer daily money.'}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#4f4540]">
                {isId
                  ? 'Panduan ringan tentang cashflow, wallet, budget, dan cara memakai AI tanpa kehilangan kontrol atas keputusan finansial.'
                  : 'Friendly guides on cashflow, wallets, budgets, and using AI without losing control of financial decisions.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Cashflow', 'AI Finance', 'Wallet', 'Budget'].map((category) => (
                  <span key={category} className="rounded-full border border-[#17120f]/10 bg-white/78 px-3 py-1.5 text-xs font-black text-[#4f4540]">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative rounded-[1.75rem] border border-[#17120f]/14 bg-white/75 p-4 shadow-[0_20px_55px_rgba(23,18,15,0.1)]">
              <label className="flex items-center gap-3 rounded-2xl border border-[#17120f]/10 bg-[#fffaf6] px-4 py-3 text-sm font-bold text-[#4f4540]">
                <HiOutlineMagnifyingGlass className="h-5 w-5 text-brand-700" />
                {isId ? 'Cari topik: budget, cashflow, AI...' : 'Search: budget, cashflow, AI...'}
              </label>
              <div className="mt-4 rounded-2xl border border-[#17120f]/10 bg-[#ecfdf5] p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                  <HiOutlineSparkles className="h-4 w-4" />
                  {isId ? 'Artikel populer' : 'Popular article'}
                </p>
                <h2 className="mt-3 text-lg font-black leading-7">{featured.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#4f4540]">{featured.desc}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <article className="grid gap-5 rounded-[1.75rem] border border-[#17120f]/14 bg-[#fffaf6]/92 p-5 shadow-sm shadow-[#17120f]/5 md:grid-cols-[0.8fr_1.2fr] md:items-center">
              <BlogDoodle />
              <div>
                <span className="inline-flex rounded-full bg-[#ffe4dc] px-3 py-1 text-xs font-black text-brand-800">{featured.tag}</span>
                <h2 className="mt-4 text-2xl font-black leading-tight tracking-[-0.03em]">{featured.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#4f4540]">{featured.desc}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold text-[#4f4540]/70">
                  <span className="inline-flex items-center gap-1.5"><HiOutlineClock className="h-4 w-4" /> {featured.read}</span>
                  <span>{isId ? 'Oleh Tim SAKU' : 'By SAKU Team'}</span>
                </div>
              </div>
            </article>

            <div className="grid gap-5 md:grid-cols-2">
              {rest.map((post) => (
                <article key={post.title} className="flex min-h-full flex-col rounded-[1.5rem] border border-[#17120f]/12 bg-[#fffaf6]/92 p-5 shadow-sm shadow-[#17120f]/5 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md">
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-brand-700">
                    <HiOutlineSparkles className="h-3.5 w-3.5" />
                    {post.tag}
                  </div>
                  <h2 className="mt-4 text-lg font-black leading-7">{post.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-7 text-[#4f4540]">{post.desc}</p>
                  <div className="mt-5 flex items-center justify-between text-xs font-bold text-[#4f4540]/70">
                    <span>{post.read}</span>
                    <Link to="/register" className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-800">
                      {isId ? 'Coba' : 'Try'}
                      <HiOutlineArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.5rem] border border-[#17120f]/12 bg-[#fddf82]/55 p-5">
              <HiOutlineBookOpen className="h-6 w-6" />
              <h2 className="mt-3 text-lg font-black">{isId ? 'Newsletter ringan' : 'Friendly newsletter'}</h2>
              <p className="mt-2 text-sm leading-6 text-[#4f4540]">
                {isId ? 'Ringkasan tips uang harian, tanpa bahasa rumit.' : 'Simple daily-money ideas, without jargon.'}
              </p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-4 inline-flex rounded-2xl border border-[#17120f]/15 bg-white px-4 py-2.5 text-sm font-black text-[#17120f] transition hover:-translate-y-0.5 hover:bg-[#fffaf6]">
                {isId ? 'Hubungi Tim SAKU' : 'Contact SAKU'}
              </a>
            </div>

            <div className="rounded-[1.5rem] border border-[#17120f]/12 bg-[#fffaf6]/92 p-5 shadow-sm shadow-[#17120f]/5">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#4f4540]/70">{isId ? 'Bacaan terkait' : 'Related reads'}</h2>
              <div className="mt-4 space-y-3">
                {posts.slice(0, 3).map((post) => (
                  <div key={post.title} className="rounded-2xl border border-[#17120f]/8 bg-white/70 p-3">
                    <p className="text-sm font-black leading-5">{post.title}</p>
                    <p className="mt-1 text-xs font-bold text-[#4f4540]/60">{post.read}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="border-t border-[#17120f]/10 bg-[#fffaf6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-[#4f4540] sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} SAKU · {SUPPORT_EMAIL}</p>
          <div className="flex flex-wrap gap-4 font-bold">
            <Link to="/about" className="hover:text-brand-700">About</Link>
            <Link to="/privacy" className="hover:text-brand-700">Privacy</Link>
            <Link to="/terms" className="hover:text-brand-700">Terms</Link>
            <Link to="/contact" className="hover:text-brand-700">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function getPosts(isId: boolean) {
  return isId
    ? [
        {
          title: 'Cara membaca cashflow pribadi tanpa spreadsheet rumit',
          desc: 'Mulai dari saldo, pengeluaran mingguan, budget yang menipis, dan tagihan terdekat agar keputusan harian lebih jelas.',
          tag: 'Cashflow',
          read: '4 menit baca',
        },
        {
          title: 'Kenapa AI membantu kebiasaan mencatat transaksi',
          desc: 'AI mempercepat input, memberi preview yang bisa dicek, dan membantu kebiasaan finansial lebih konsisten.',
          tag: 'AI Finance',
          read: '5 menit baca',
        },
        {
          title: 'Checklist dompet digital yang sehat untuk pengguna Indonesia',
          desc: 'Pisahkan cash, rekening utama, e-wallet, savings, dan dana darurat agar arus uang lebih kebaca.',
          tag: 'Wallet',
          read: '3 menit baca',
        },
        {
          title: 'Budget kecil yang tetap realistis untuk mahasiswa dan pekerja baru',
          desc: 'Gunakan batas sederhana per kategori, lalu cek sinyal saat pengeluaran mulai keluar jalur.',
          tag: 'Budget',
          read: '4 menit baca',
        },
      ]
    : [
        {
          title: 'How to read personal cashflow without complex spreadsheets',
          desc: 'Start from balances, weekly spending, tight budgets, and upcoming bills to make daily decisions clearer.',
          tag: 'Cashflow',
          read: '4 min read',
        },
        {
          title: 'Why AI can improve transaction tracking habits',
          desc: 'AI speeds up input, gives review-ready previews, and helps financial habits become more consistent.',
          tag: 'AI Finance',
          read: '5 min read',
        },
        {
          title: 'A healthy wallet checklist for Indonesian users',
          desc: 'Separate cash, main bank, e-wallet, savings, and emergency funds so money movement is clearer.',
          tag: 'Wallet',
          read: '3 min read',
        },
        {
          title: 'Small budgets that still feel realistic',
          desc: 'Use simple category limits, then watch for signals when spending starts drifting.',
          tag: 'Budget',
          read: '4 min read',
        },
      ]
}

function BlogDoodle() {
  return (
    <svg viewBox="0 0 360 260" className="mx-auto h-auto w-full max-w-xs" role="img" aria-label="Ilustrasi artikel SAKU">
      <path d="M46 203c36-43 82-57 138-43 52 13 88 17 134-20" fill="none" stroke="#ffe4dc" strokeWidth="24" strokeLinecap="round" />
      <rect x="84" y="50" width="160" height="128" rx="30" fill="#fffaf6" stroke="#17120f" strokeOpacity=".55" strokeWidth="3" />
      <path d="M116 85h88M116 115h102M116 145h64" stroke="#17120f" strokeOpacity=".45" strokeWidth="7" strokeLinecap="round" />
      <circle cx="250" cy="77" r="34" fill="#fddf82" stroke="#17120f" strokeOpacity=".5" strokeWidth="3" />
      <path d="M245 77h10M250 72v10" stroke="#17120f" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
      <path d="M65 161c22-17 43-16 61 3-22 18-43 17-61-3Z" fill="#ff9d8d" stroke="#17120f" strokeOpacity=".5" strokeWidth="2.5" />
      <path d="M275 178l5 10 11 4-11 5-5 10-5-10-11-5 11-4 5-10Z" fill="#ecfdf5" stroke="#17120f" strokeOpacity=".5" strokeWidth="2.5" />
    </svg>
  )
}

export default BlogPage
