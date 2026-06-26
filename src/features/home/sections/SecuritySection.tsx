import { Link } from 'react-router-dom'
import {
  RiArrowRightLine,
  RiBankCardLine,
  RiLockLine,
  RiShieldCheckLine,
  RiSparklingLine,
  RiUserSettingsLine,
} from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'

export function SecuritySection({ isAuthed }: { isAuthed: boolean }) {
  const { locale } = useLocale()
  const isId = locale === 'id'

  const items = isId
    ? [
        {
          Icon: RiLockLine,
          title: 'Data finansial tetap milikmu',
          desc: 'SAKU tidak meminta password rekening bank dan akses mengikuti akun pengguna.',
          bg: '#ffe4dc',
          color: 'text-brand-700',
        },
        {
          Icon: RiUserSettingsLine,
          title: 'AI tidak menyimpan sepihak',
          desc: 'Preview transaksi selalu bisa dicek, diedit, atau dibatalkan dulu.',
          bg: '#fddf82',
          color: 'text-[#17120f]',
        },
        {
          Icon: RiBankCardLine,
          title: 'Pembayaran lewat Midtrans',
          desc: 'Checkout mendukung QRIS, GoPay, kartu, virtual account, dan channel tersedia.',
          bg: '#ecfdf5',
          color: 'text-emerald-700',
        },
      ]
    : [
        {
          Icon: RiLockLine,
          title: 'Financial data stays yours',
          desc: 'SAKU does not ask for bank passwords and access follows user accounts.',
          bg: '#ffe4dc',
          color: 'text-brand-700',
        },
        {
          Icon: RiUserSettingsLine,
          title: 'AI does not force-save',
          desc: 'Transaction previews can be reviewed, edited, or cancelled first.',
          bg: '#fddf82',
          color: 'text-[#17120f]',
        },
        {
          Icon: RiBankCardLine,
          title: 'Midtrans checkout',
          desc: 'Checkout supports QRIS, GoPay, cards, virtual accounts, and available channels.',
          bg: '#ecfdf5',
          color: 'text-emerald-700',
        },
      ]

  return (
    <section id="security" className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#17120f] bg-[#fffaf6] p-5 shadow-[8px_8px_0_#17120f] sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-[45%_55%_50%_50%] border-2 border-[#17120f] bg-[#fddf82]" />
          <div className="pointer-events-none absolute -bottom-8 left-10 h-24 w-24 rotate-12 rounded-[1.5rem] border-2 border-[#17120f] bg-[#ffe4dc]" />

          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#17120f] bg-[#fddf82] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#17120f] shadow-[3px_3px_0_#17120f]">
                <RiShieldCheckLine className="h-3.5 w-3.5" />
                {isId ? 'Keamanan & kepercayaan' : 'Security & trust'}
              </span>

              <h2 className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-tight text-[#17120f] sm:text-4xl">
                {isId
                  ? 'Dibuat untuk data uang pribadi, bukan sekadar angka.'
                  : 'Built for personal money data, not just numbers.'}
              </h2>

              <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-[#4f4540] sm:text-base">
                {isId
                  ? 'Kamu tetap memegang keputusan. SAKU membantu membaca pola, menyiapkan preview, dan menjaga proses checkout tetap jelas.'
                  : 'You stay in control. SAKU helps read patterns, prepare previews, and keep checkout clear.'}
              </p>
            </div>

            <div className="grid gap-3">
              {items.map(({ Icon, title, desc, bg, color }) => (
                <div
                  key={title}
                  className="group flex items-start gap-3 rounded-3xl border-2 border-[#17120f] bg-[#f6eee8] p-4 shadow-[4px_4px_0_#17120f] transition-all duration-300 hover:-translate-y-1 hover:bg-[#fddf82]"
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#17120f] shadow-[3px_3px_0_#17120f] transition-transform duration-300 group-hover:scale-105',
                      color,
                    )}
                    style={{ background: bg }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#17120f]">
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#4f4540]">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border-2 border-[#17120f] bg-brand-100 p-6 text-[#17120f] shadow-[8px_8px_0_#17120f] sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#17120f] bg-[#fffaf6] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#17120f] shadow-[3px_3px_0_#17120f]">
                <RiSparklingLine className="h-3.5 w-3.5" />
                {isId ? 'Mulai Gratis' : 'Start Free'}
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-tight text-[#17120f] sm:text-3xl">
                {isId
                  ? 'Mulai pelan-pelan, tetap terasa manfaatnya.'
                  : 'Start small and still feel the value.'}
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4f4540]">
                {isId
                  ? 'Catat satu transaksi hari ini. Setelah beberapa hari, pola pengeluaranmu mulai lebih mudah dibaca.'
                  : 'Record one transaction today. After a few days, your spending pattern becomes easier to read.'}
              </p>
            </div>

            <Link to={isAuthed ? '/app' : '/register'}>
              <button className="saku-primary-action inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black transition sm:w-auto">
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
