import { Link } from 'react-router-dom'
import { RiArrowRightLine, RiBankCardLine, RiLockLine, RiShieldCheckLine, RiSparklingLine, RiUserSettingsLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'

export function SecuritySection({ isAuthed }: { isAuthed: boolean }) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const items = (isId
    ? [
        { Icon: RiLockLine, title: 'Data terenkripsi', desc: 'Data finansial dikirim melalui koneksi aman dan disimpan dengan kontrol akses.', tone: 'blue' },
        { Icon: RiUserSettingsLine, title: 'Kontrol penuh', desc: 'Kamu bisa mengelola wallet, transaksi, dan integrasi dari akun sendiri.', tone: 'emerald' },
        { Icon: RiBankCardLine, title: 'Checkout terpercaya', desc: 'Pembayaran diproses melalui payment gateway production yang mendukung QRIS, GoPay, dan VA.', tone: 'violet' },
      ]
    : [
        { Icon: RiLockLine, title: 'Encrypted data', desc: 'Financial data is transmitted securely and stored with access controls.', tone: 'blue' },
        { Icon: RiUserSettingsLine, title: 'Full control', desc: 'Manage wallets, transactions, and integrations from your own account.', tone: 'emerald' },
        { Icon: RiBankCardLine, title: 'Trusted checkout', desc: 'Payments are processed through a production gateway supporting QRIS, GoPay, and VA.', tone: 'violet' },
      ]) as Array<{ Icon: typeof RiLockLine; title: string; desc: string; tone: 'blue' | 'emerald' | 'violet' }>
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
  }

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-7 rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-100/60 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              <RiShieldCheckLine className="h-3.5 w-3.5" />
              {isId ? 'Keamanan & kepercayaan' : 'Security & trust'}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
              {isId ? 'Dibangun untuk data finansial pribadi.' : 'Built for personal financial data.'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
              {isId
                ? 'SAKU menjaga proses pencatatan, AI, dan pembayaran tetap jelas, aman, dan mudah dipahami.'
                : 'SAKU keeps tracking, AI, and payments clear, secure, and easy to understand.'}
            </p>
          </div>
          <div className="grid gap-3">
            {items.map(({ Icon, title, desc, tone }) => (
              <div key={title} className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 transition-all duration-300 hover:border-blue-100 hover:bg-white hover:shadow-md hover:shadow-blue-100/40">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105 ${toneClass[tone]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-950">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] bg-[#0F172A] p-6 text-white shadow-xl shadow-slate-300/40 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-blue-100">
                <RiSparklingLine className="h-3.5 w-3.5" />
                {isId ? 'Mulai dari Free' : 'Start with Free'}
              </div>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                {isId ? 'Siap punya asisten keuangan AI sendiri?' : 'Ready for your own AI financial assistant?'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {isId
                  ? 'Catat transaksi lebih cepat, scan struk, dan pahami arus kas tanpa spreadsheet rumit.'
                  : 'Record faster, scan receipts, and understand cashflow without complex spreadsheets.'}
              </p>
            </div>
            <Link to={isAuthed ? '/app' : '/register'}>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#1D4ED8] sm:w-auto">
                {isId ? 'Mulai Gratis' : 'Start Free'}
                <RiArrowRightLine className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SecuritySection
