import { Link, NavLink } from 'react-router-dom'
import {
  HiOutlineArrowRight,
  HiOutlineChartBarSquare,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineWallet,
} from 'react-icons/hi2'
import { Logo } from '@/components/Logo'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

type LegalMode = 'privacy' | 'terms' | 'contact' | 'about'

type LegalSection = {
  title: string
  body: string
  bullets?: string[]
  icon: typeof HiOutlineShieldCheck
}

type LegalContent = {
  eyebrow: string
  title: string
  description: string
  summary: string
  primaryCta: string
  secondaryCta: string
  sections: LegalSection[]
}

const UPDATED_AT = '6 Juni 2026'
const SUPPORT_EMAIL = 'hello@ganipedia.com'

const navItems = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' },
]

export function LegalPage({ mode }: { mode: LegalMode }) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const content = getContent(mode, isId)

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-bold text-slate-600 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 transition duration-200 hover:bg-white hover:text-blue-700 hover:shadow-sm',
                    isActive && 'bg-white text-blue-700 shadow-sm',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 sm:inline-flex"
            >
              {isId ? 'Masuk' : 'Login'}
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md"
            >
              {isId ? 'Mulai Gratis' : 'Start Free'}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700">
                <HiOutlineShieldCheck className="h-4 w-4" />
                {content.eyebrow}
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {content.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{content.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {mode === 'contact' ? (
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                  >
                    {content.primaryCta}
                    <HiOutlineArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                  >
                    {content.primaryCta}
                    <HiOutlineArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm"
                >
                  {content.secondaryCta}
                </Link>
              </div>
              <p className="mt-5 text-xs font-semibold text-slate-400">
                {isId ? 'Terakhir diperbarui' : 'Last updated'}: {UPDATED_AT}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5">
                <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <HiOutlineLockClosed className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-950">
                        {isId ? 'Dibangun untuk data finansial pribadi' : 'Built for personal financial data'}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{content.summary}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {getTrustBadges(isId).map((badge) => (
                      <div key={badge.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <badge.icon className="h-5 w-5 text-blue-600" />
                        <p className="mt-2 text-xs font-black leading-5 text-slate-800">{badge.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_320px]">
          <article className="space-y-4">
            {content.sections.map((section, index) => (
              <section
                key={section.title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-xl font-black tracking-tight text-slate-950">{section.title}</h2>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
                    {section.bullets?.length ? (
                      <ul className="mt-4 grid gap-2">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2 text-sm leading-6 text-slate-600">
                            <HiOutlineCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </section>
            ))}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <HiOutlineEnvelope className="h-6 w-6 text-blue-700" />
              <h2 className="mt-3 text-sm font-black text-blue-950">
                {isId ? 'Kontak resmi SAKU' : 'Official SAKU contact'}
              </h2>
              <p className="mt-2 text-xs leading-6 text-blue-900/75">
                {isId
                  ? 'Gunakan email resmi untuk bantuan akun, pembayaran, keamanan, atau penggunaan aplikasi.'
                  : 'Use the official email for account, payment, security, or product support.'}
              </p>
              <a className="mt-3 block break-all text-sm font-black text-blue-700 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-slate-950">
                {isId ? 'Navigasi publik' : 'Public navigation'}
              </h2>
              <nav className="mt-3 grid gap-1 text-sm font-bold">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      cn(
                        'rounded-2xl px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-blue-700',
                        isActive && 'bg-blue-50 text-blue-700',
                      )
                    }
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-slate-950">
                {isId ? 'Transparansi layanan' : 'Service transparency'}
              </h2>
              <div className="mt-4 space-y-3">
                {getTransparencyItems(isId).map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-xs font-black text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              {isId
                ? 'SAKU adalah aplikasi personal finance untuk membantu pengguna Indonesia mencatat transaksi, memahami pengeluaran, dan mengelola keuangan dengan lebih percaya diri.'
                : 'SAKU is a personal finance app that helps Indonesian users track transactions, understand spending, and manage money with more confidence.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-slate-600">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="transition hover:text-blue-700">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="text-xs font-semibold text-slate-400 md:col-span-2">
            © {new Date().getFullYear()} SAKU. {isId ? 'Semua hak dilindungi.' : 'All rights reserved.'} ·{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-700 hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function getTrustBadges(isId: boolean) {
  return [
    {
      title: isId ? 'Secure Personal Finance App' : 'Secure Personal Finance App',
      icon: HiOutlineShieldCheck,
    },
    {
      title: isId ? 'Built for Indonesian Users' : 'Built for Indonesian Users',
      icon: HiOutlineUserGroup,
    },
    {
      title: isId ? 'Privacy-first Experience' : 'Privacy-first Experience',
      icon: HiOutlineLockClosed,
    },
  ]
}

function getTransparencyItems(isId: boolean) {
  return [
    {
      title: isId ? 'Data dan akses akun' : 'Data and account access',
      body: isId ? 'Dikelola melalui koneksi aman dan kontrol akses akun.' : 'Managed through secure connections and account access controls.',
      icon: HiOutlineLockClosed,
    },
    {
      title: isId ? 'AI dan OCR' : 'AI and OCR',
      body: isId ? 'Digunakan untuk membantu membaca transaksi, bukan menggantikan review pengguna.' : 'Used to assist transaction reading, not replace user review.',
      icon: HiOutlineSparkles,
    },
    {
      title: isId ? 'Payment gateway resmi' : 'Official payment gateway',
      body: isId ? 'Pembayaran langganan diproses melalui penyedia gateway production.' : 'Subscription payments are processed through a production gateway provider.',
      icon: HiOutlineCreditCard,
    },
  ]
}

function getContent(mode: LegalMode, isId: boolean): LegalContent {
  const content: Record<LegalMode, LegalContent> = {
    privacy: {
      eyebrow: isId ? 'Kebijakan resmi SAKU' : 'Official SAKU policy',
      title: isId ? 'Kebijakan Privasi SAKU' : 'SAKU Privacy Policy',
      description: isId
        ? 'Kami menjelaskan bagaimana SAKU mengumpulkan, menggunakan, melindungi, dan memproses data saat kamu memakai aplikasi personal finance, AI, OCR, dan pembayaran.'
        : 'We explain how SAKU collects, uses, protects, and processes data when you use the personal finance app, AI, OCR, and payments.',
      summary: isId
        ? 'SAKU memproses data hanya untuk menjalankan fitur keuangan, menjaga keamanan akun, mendukung pembayaran, dan meningkatkan pengalaman produk.'
        : 'SAKU processes data to operate finance features, keep accounts secure, support payments, and improve the product experience.',
      primaryCta: isId ? 'Mulai Kelola Keuangan' : 'Start Managing Money',
      secondaryCta: isId ? 'Kembali ke Beranda' : 'Back to Home',
      sections: [
        {
          title: isId ? 'Data yang dikumpulkan' : 'Data we collect',
          body: isId
            ? 'SAKU dapat memproses data akun, email, nama, preferensi bahasa, transaksi, wallet, kategori, budget, target, tagihan, split bill, voucher, status subscription, dan aktivitas aplikasi yang diperlukan untuk menjalankan layanan.'
            : 'SAKU may process account data, email, name, language preference, transactions, wallets, categories, budgets, goals, billings, split bills, vouchers, subscription status, and app activity required to operate the service.',
          bullets: isId
            ? ['Gambar struk diproses saat kamu memakai OCR Receipt Scanner.', 'Riwayat AI digunakan untuk memberi konteks dan membuat jawaban lebih relevan.', 'Data Telegram diproses jika kamu menghubungkan bot SAKU.']
            : ['Receipt images are processed when you use OCR Receipt Scanner.', 'AI history is used to provide context and improve relevance.', 'Telegram data is processed if you connect the SAKU bot.'],
          icon: HiOutlineChartBarSquare,
        },
        {
          title: isId ? 'Tujuan penggunaan data' : 'How we use data',
          body: isId
            ? 'Data digunakan untuk mencatat keuangan, menampilkan dashboard, membuat insight, menjaga keamanan akun, memulihkan akses, mengirim notifikasi penting, memproses subscription, dan membantu dukungan pelanggan.'
            : 'Data is used to track finances, display dashboards, generate insights, keep accounts secure, recover access, send important notifications, process subscriptions, and support customers.',
          bullets: isId
            ? ['Kami tidak meminta password, OTP, atau token melalui email.', 'Data finansial digunakan untuk fitur yang kamu aktifkan di SAKU.', 'Analitik produk digunakan untuk memperbaiki pengalaman, bukan menjual data pribadi.']
            : ['We do not ask for passwords, OTP, or tokens through email.', 'Financial data is used for features you enable in SAKU.', 'Product analytics improve the experience, not sell personal data.'],
          icon: HiOutlineShieldCheck,
        },
        {
          title: isId ? 'Google Login, pembayaran, AI/OCR, dan analytics' : 'Google Login, payments, AI/OCR, and analytics',
          body: isId
            ? 'SAKU dapat menggunakan layanan pihak ketiga seperti Google Login, payment gateway resmi, penyedia AI/OCR, Google Analytics, Microsoft Clarity, dan proteksi captcha untuk autentikasi, pembayaran, keamanan, analitik, dan peningkatan kualitas produk.'
            : 'SAKU may use third-party services such as Google Login, official payment gateways, AI/OCR providers, Google Analytics, Microsoft Clarity, and captcha protection for authentication, payments, security, analytics, and product improvement.',
          bullets: isId
            ? ['Pembayaran diproses oleh payment gateway production.', 'Google Login hanya digunakan untuk autentikasi akun.', 'Cookie dan analytics membantu memahami performa dan UX tanpa mengirim password, OTP, atau token.']
            : ['Payments are processed by a production payment gateway.', 'Google Login is used only for account authentication.', 'Cookies and analytics help understand performance and UX without sending passwords, OTP, or tokens.'],
          icon: HiOutlineCreditCard,
        },
        {
          title: isId ? 'Keamanan data dan kontak' : 'Data security and contact',
          body: isId
            ? 'Kami menerapkan koneksi aman, kontrol akses, validasi, proteksi abuse, dan logging aktivitas penting. Jika kamu memiliki pertanyaan privasi atau keamanan, hubungi email resmi SAKU.'
            : 'We apply secure connections, access controls, validation, abuse protection, and important activity logging. If you have privacy or security questions, contact the official SAKU email.',
          bullets: [SUPPORT_EMAIL],
          icon: HiOutlineLockClosed,
        },
      ],
    },
    terms: {
      eyebrow: isId ? 'Aturan penggunaan layanan' : 'Service usage rules',
      title: isId ? 'Syarat & Ketentuan SAKU' : 'SAKU Terms of Service',
      description: isId
        ? 'Syarat ini menjelaskan aturan penggunaan aplikasi, akun, subscription, pembayaran, fitur AI, batasan layanan, dan tanggung jawab pengguna.'
        : 'These terms explain app usage, accounts, subscriptions, payments, AI features, service limits, and user responsibilities.',
      summary: isId
        ? 'Gunakan SAKU secara wajar untuk kebutuhan personal finance. Tinjau data sebelum menyimpan transaksi atau mengambil keputusan keuangan.'
        : 'Use SAKU responsibly for personal finance. Review data before saving transactions or making financial decisions.',
      primaryCta: isId ? 'Mulai Kelola Keuangan' : 'Start Managing Money',
      secondaryCta: isId ? 'Kembali ke Beranda' : 'Back to Home',
      sections: [
        {
          title: isId ? 'Penggunaan aplikasi dan akun' : 'App and account usage',
          body: isId
            ? 'SAKU digunakan untuk mencatat pemasukan, pengeluaran, wallet, budget, target, tagihan, split bill, dan insight keuangan pribadi. Kamu bertanggung jawab menjaga akses akun dan memastikan informasi yang dimasukkan akurat.'
            : 'SAKU is used to track income, expenses, wallets, budgets, goals, billings, split bills, and personal financial insights. You are responsible for account access and data accuracy.',
          bullets: isId
            ? ['Jangan membagikan password, OTP, atau akses akun.', 'Gunakan data yang benar saat menyimpan transaksi.', 'Hubungi support jika menemukan aktivitas mencurigakan.']
            : ['Do not share passwords, OTP, or account access.', 'Use accurate data when saving transactions.', 'Contact support if you notice suspicious activity.'],
          icon: HiOutlineWallet,
        },
        {
          title: isId ? 'Subscription, voucher, dan pembayaran' : 'Subscriptions, vouchers, and payments',
          body: isId
            ? 'Paket Free, Pro, dan Premium memiliki batas serta fitur berbeda. Pembayaran subscription diproses melalui payment gateway resmi. Voucher bersifat opsional dan hanya berlaku sesuai periode, status, dan ketentuan promo.'
            : 'Free, Pro, and Premium plans have different limits and features. Subscription payments are processed through an official payment gateway. Vouchers are optional and apply based on promotion period, status, and rules.',
          bullets: isId
            ? ['Status paket aktif mengikuti hasil pembayaran terverifikasi.', 'Invoice kedaluwarsa bukan pembayaran gagal dan dapat dibuat ulang bila tersedia.', 'Perubahan paket mengikuti kebijakan yang berlaku di aplikasi.']
            : ['Active plan status follows verified payment results.', 'Expired invoices are not failed payments and may be regenerated when available.', 'Plan changes follow the policies available in the app.'],
          icon: HiOutlineCreditCard,
        },
        {
          title: isId ? 'Penggunaan AI dan OCR' : 'AI and OCR usage',
          body: isId
            ? 'AI Transaction Assistant, AI Chat, AI Insight, dan OCR Receipt Scanner membantu mempercepat pencatatan dan analisis. Hasil AI dapat salah membaca nominal, tanggal, wallet, atau kategori sehingga pengguna tetap perlu meninjau sebelum menyimpan.'
            : 'AI Transaction Assistant, AI Chat, AI Insight, and OCR Receipt Scanner help speed up tracking and analysis. AI outputs may misread amounts, dates, wallets, or categories, so users should review before saving.',
          bullets: isId
            ? ['AI bukan penasihat keuangan profesional.', 'Gunakan insight sebagai bantuan, bukan keputusan tunggal.', 'Batas penggunaan AI mengikuti paket subscription.']
            : ['AI is not a professional financial advisor.', 'Use insights as assistance, not the only decision source.', 'AI usage limits follow the subscription plan.'],
          icon: HiOutlineSparkles,
        },
        {
          title: isId ? 'Batasan layanan dan penghentian' : 'Service limits and termination',
          body: isId
            ? 'Kami dapat membatasi atau menghentikan akses jika terjadi penyalahgunaan, pelanggaran keamanan, spam, aktivitas ilegal, atau penggunaan yang mengganggu layanan. Pengguna dapat berhenti memakai layanan kapan saja.'
            : 'We may limit or terminate access for abuse, security violations, spam, illegal activity, or usage that disrupts the service. Users may stop using the service at any time.',
          bullets: isId
            ? ['Kami berupaya menjaga layanan stabil, aman, dan tersedia.', 'Beberapa fitur dapat berubah seiring peningkatan produk.', 'Pertanyaan layanan dapat dikirim ke email resmi SAKU.']
            : ['We work to keep the service stable, secure, and available.', 'Some features may change as the product improves.', 'Service questions can be sent to the official SAKU email.'],
          icon: HiOutlineShieldCheck,
        },
      ],
    },
    contact: {
      eyebrow: isId ? 'Bantuan resmi SAKU' : 'Official SAKU support',
      title: isId ? 'Kontak SAKU' : 'Contact SAKU',
      description: isId
        ? 'Hubungi tim SAKU untuk bantuan akun, pembayaran, keamanan, subscription, integrasi Telegram, atau pertanyaan penggunaan aplikasi.'
        : 'Contact the SAKU team for account, payment, security, subscription, Telegram integration, or product usage questions.',
      summary: isId
        ? 'Satu jalur kontak resmi membuat bantuan lebih mudah ditelusuri dan mengurangi risiko pesan palsu.'
        : 'One official contact channel makes support easier to trace and reduces the risk of impersonation.',
      primaryCta: isId ? 'Kirim Email' : 'Send Email',
      secondaryCta: isId ? 'Kembali ke Beranda' : 'Back to Home',
      sections: [
        {
          title: isId ? 'Email support resmi' : 'Official support email',
          body: isId
            ? `Untuk bantuan resmi, kirim pesan ke ${SUPPORT_EMAIL}. Sertakan konteks singkat seperti email akun, topik kendala, dan waktu kejadian agar tim dapat membantu lebih cepat.`
            : `For official support, email ${SUPPORT_EMAIL}. Include brief context such as account email, issue topic, and event time so the team can help faster.`,
          bullets: [SUPPORT_EMAIL],
          icon: HiOutlineEnvelope,
        },
        {
          title: isId ? 'Topik yang bisa dibantu' : 'Topics we can help with',
          body: isId
            ? 'Kamu dapat menghubungi SAKU untuk kendala login, verifikasi email, subscription, voucher, pembayaran, upload foto, scan struk, AI Chat, Telegram, atau laporan bug.'
            : 'You can contact SAKU for login issues, email verification, subscriptions, vouchers, payments, photo upload, receipt scan, AI Chat, Telegram, or bug reports.',
          bullets: isId
            ? ['Akun dan keamanan', 'Pembayaran dan langganan', 'Penggunaan aplikasi dan fitur AI']
            : ['Account and security', 'Payments and subscriptions', 'App usage and AI features'],
          icon: HiOutlineUserGroup,
        },
        {
          title: isId ? 'Keamanan saat menghubungi support' : 'Support safety',
          body: isId
            ? 'Tim SAKU tidak akan meminta password, OTP, token, atau data kartu penuh. Jika menerima pesan yang mencurigakan, jangan klik tautan dan hubungi email resmi.'
            : 'The SAKU team will not ask for passwords, OTP, tokens, or full card details. If you receive suspicious messages, do not click links and contact the official email.',
          bullets: isId
            ? ['Jangan kirim screenshot yang berisi OTP atau token.', 'Pastikan domain yang dibuka adalah website resmi SAKU.', 'Laporkan aktivitas mencurigakan sesegera mungkin.']
            : ['Do not send screenshots containing OTP or tokens.', 'Make sure you open the official SAKU website domain.', 'Report suspicious activity as soon as possible.'],
          icon: HiOutlineLockClosed,
        },
        {
          title: isId ? 'Estimasi respons' : 'Response expectation',
          body: isId
            ? 'Kami berupaya merespons pesan dukungan dalam 1-2 hari kerja. Untuk kendala pembayaran, sertakan order ID atau screenshot status pembayaran tanpa menampilkan data sensitif.'
            : 'We aim to respond within 1-2 business days. For payment issues, include the order ID or payment status screenshot without sensitive data.',
          icon: HiOutlineCheckCircle,
        },
      ],
    },
    about: {
      eyebrow: isId ? 'Tentang produk' : 'About the product',
      title: isId ? 'Tentang SAKU' : 'About SAKU',
      description: isId
        ? 'SAKU adalah aplikasi personal finance untuk membantu pengguna mencatat transaksi, memahami pengeluaran, mengelola wallet, membuat budget, dan membaca insight keuangan dengan bantuan AI.'
        : 'SAKU is a personal finance app that helps users track transactions, understand spending, manage wallets, create budgets, and read financial insights with AI assistance.',
      summary: isId
        ? 'SAKU dibuat agar pencatatan keuangan harian terasa cepat, jelas, dan mudah ditindaklanjuti oleh pengguna Indonesia.'
        : 'SAKU is built to make daily finance tracking fast, clear, and actionable for Indonesian users.',
      primaryCta: isId ? 'Mulai Gratis' : 'Start Free',
      secondaryCta: isId ? 'Lihat Beranda' : 'View Home',
      sections: [
        {
          title: isId ? 'Apa yang SAKU bantu' : 'What SAKU helps with',
          body: isId
            ? 'SAKU membantu pengguna memahami uang masuk, uang keluar, saldo per wallet, progress budget, target keuangan, tagihan mendatang, split bill, dan pola pengeluaran yang sering luput dari perhatian.'
            : 'SAKU helps users understand income, expenses, wallet balances, budget progress, financial goals, upcoming bills, split bills, and spending patterns that are easy to miss.',
          bullets: isId
            ? ['Dashboard ringkas untuk keputusan harian.', 'Wallet untuk memisahkan sumber dana.', 'Budget dan target agar rencana keuangan lebih terlihat.']
            : ['A concise dashboard for daily decisions.', 'Wallets to separate money sources.', 'Budgets and goals to make plans visible.'],
          icon: HiOutlineChartBarSquare,
        },
        {
          title: isId ? 'Fitur utama' : 'Core features',
          body: isId
            ? 'SAKU menyediakan pencatatan transaksi manual, AI Transaction Assistant, OCR Receipt Scanner, Multiple Wallet, Budget Tracking, Recurring Transaction, Upcoming Billing, Split Bill, Financial Insight, dan integrasi Telegram.'
            : 'SAKU provides manual transaction entry, AI Transaction Assistant, OCR Receipt Scanner, Multiple Wallet, Budget Tracking, Recurring Transaction, Upcoming Billing, Split Bill, Financial Insight, and Telegram integration.',
          bullets: isId
            ? ['Catat transaksi dari chat natural.', 'Scan struk untuk membaca nominal dan merchant.', 'Dapatkan insight yang lebih mudah dipahami.']
            : ['Record transactions from natural chat.', 'Scan receipts to read amounts and merchants.', 'Get insights that are easier to understand.'],
          icon: HiOutlineSparkles,
        },
        {
          title: isId ? 'Dibangun untuk pengguna Indonesia' : 'Built for Indonesian users',
          body: isId
            ? 'SAKU menggunakan format Rupiah, konteks wallet lokal, metode pembayaran populer, dan pengalaman mobile-first agar lebih dekat dengan kebiasaan pengguna Indonesia.'
            : 'SAKU uses Rupiah formatting, local wallet context, popular payment methods, and a mobile-first experience to fit Indonesian user habits.',
          bullets: isId
            ? ['Mendukung QRIS, GoPay, dan Virtual Account melalui payment gateway.', 'Bahasa dan konteks transaksi dibuat natural untuk pengguna Indonesia.', 'Telegram membantu pencatatan saat sedang tidak membuka web.']
            : ['Supports QRIS, GoPay, and Virtual Account through a payment gateway.', 'Language and transaction context are natural for Indonesian users.', 'Telegram helps tracking when the web app is not open.'],
          icon: HiOutlineWallet,
        },
        {
          title: isId ? 'Kepercayaan dan transparansi' : 'Trust and transparency',
          body: isId
            ? 'SAKU menampilkan halaman legal, kontak resmi, informasi keamanan, dan status pembayaran yang jelas agar pengguna memahami bagaimana produk bekerja.'
            : 'SAKU provides legal pages, official contact, security information, and clear payment statuses so users understand how the product works.',
          bullets: isId
            ? ['Identitas produk konsisten di halaman publik dan autentikasi.', 'Penggunaan AI, analytics, dan payment gateway dijelaskan secara transparan.', 'Support resmi tersedia melalui email SAKU.']
            : ['Product identity is consistent across public and authentication pages.', 'AI, analytics, and payment gateway usage is explained transparently.', 'Official support is available through SAKU email.'],
          icon: HiOutlineShieldCheck,
        },
      ],
    },
  }

  return content[mode]
}

export default LegalPage
