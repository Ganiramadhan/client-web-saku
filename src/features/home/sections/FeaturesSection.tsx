import { RiArrowRightLine, RiBrainLine, RiCalendarEventLine, RiChatSmile3Line, RiLockLine, RiScanLine, RiScales3Line } from 'react-icons/ri'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { SectionHeading } from '../components/SectionHeading'

export function FeaturesSection() {
  const t = useT()
  const features = [
    {
      Icon: RiChatSmile3Line,
      title: 'AI Transaction Assistant',
      desc: 'Record transactions naturally with AI-powered chat automation.',
      color: 'text-blue-600',
      bg: 'rgba(239,246,255,0.90)',
      border: 'rgba(191,219,254,0.70)',
      hoverBorder: 'rgba(59,130,246,0.28)',
    },
    {
      Icon: RiScanLine,
      title: 'Smart Receipt Scanner',
      desc: 'Scan receipts instantly and review extracted transaction data.',
      color: 'text-violet-600',
      bg: 'rgba(245,243,255,0.90)',
      border: 'rgba(221,214,254,0.70)',
      hoverBorder: 'rgba(139,92,246,0.28)',
    },
    {
      Icon: RiBrainLine,
      title: 'AI Financial Insights',
      desc: 'Get personalized spending insights and smarter budgeting.',
      color: 'text-indigo-600',
      bg: 'rgba(238,242,255,0.90)',
      border: 'rgba(199,210,254,0.70)',
      hoverBorder: 'rgba(99,102,241,0.28)',
    },
    {
      Icon: RiScales3Line,
      title: 'Split Bills',
      desc: 'Split expenses fairly and track shared payments easily.',
      color: 'text-pink-600',
      bg: 'rgba(255,241,246,0.90)',
      border: 'rgba(251,207,232,0.70)',
      hoverBorder: 'rgba(236,72,153,0.28)',
    },
    {
      Icon: RiCalendarEventLine,
      title: 'Bill Reminders',
      desc: 'Stay ahead of subscriptions and recurring payments.',
      color: 'text-amber-600',
      bg: 'rgba(255,251,235,0.90)',
      border: 'rgba(253,230,138,0.70)',
      hoverBorder: 'rgba(245,158,11,0.28)',
    },
    {
      Icon: RiLockLine,
      title: 'Privacy First',
      desc: 'Secure infrastructure and encrypted financial data protection.',
      color: 'text-rose-500',
      bg: 'rgba(255,241,242,0.90)',
      border: 'rgba(254,205,211,0.70)',
      hoverBorder: 'rgba(244,63,94,0.28)',
    },
  ]

  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      {/* Background SVG */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute left-1/2 top-0 -translate-x-1/2 opacity-40"
          width="1200"
          height="800"
          viewBox="0 0 1200 800"
          fill="none"
        >
          <circle cx="200" cy="180" r="180" fill="url(#blueGradient)" />
          <circle cx="980" cy="260" r="220" fill="url(#purpleGradient)" />
          <circle cx="600" cy="700" r="260" fill="url(#pinkGradient)" />

          <defs>
            <radialGradient id="blueGradient">
              <stop stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="purpleGradient">
              <stop stopColor="#8B5CF6" stopOpacity="0.16" />
              <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="pinkGradient">
              <stop stopColor="#EC4899" stopOpacity="0.14" />
              <stop offset="1" stopColor="#EC4899" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={t.nav.features}
          title={t.landing.featuresTitle}
          description={t.landing.featuresSubtitle}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, i) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2"
              style={{
                background: 'rgba(255,255,255,0.68)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow:
                  '0 6px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.95)',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* Hover Border */}
              <div
                className="absolute inset-0 rounded-3xl opacity-0 transition-all duration-500 group-hover:opacity-100"
                style={{
                  border: `1px solid ${item.hoverBorder}`,
                  boxShadow:
                    '0 24px 60px rgba(15,23,42,0.10)',
                }}
              />

              {/* Animated SVG Glow */}
              <svg
                className="absolute -right-10 -top-10 h-32 w-32 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                viewBox="0 0 200 200"
                fill="none"
              >
                <path
                  d="M42.7,-73.5C56.4,-66.4,69.1,-56.5,76.2,-43.2C83.2,-29.9,84.5,-13.2,82.1,2.3C79.8,17.9,73.8,32.3,64.5,44.6C55.2,56.9,42.7,67,28.4,73.2C14.2,79.4,-1.8,81.7,-17.2,78.7C-32.5,75.7,-47.3,67.5,-59.1,56.2C-70.8,44.9,-79.5,30.5,-82.4,14.6C-85.3,-1.2,-82.4,-18.5,-74.4,-32.8C-66.3,-47.2,-53.1,-58.5,-39,-65.7C-24.9,-72.8,-10,-75.8,4.7,-83.1C19.4,-90.4,38.9,-102.1,42.7,-73.5Z"
                  transform="translate(100 100)"
                  fill={item.hoverBorder}
                />
              </svg>

              <div
                className={cn(
                  'relative inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3',
                  item.color
                )}
                style={{
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <item.Icon className="h-5 w-5" />
              </div>

              <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-slate-900">
                {item.title}
              </h3>

              <p className="relative mt-3 text-sm leading-6 text-slate-600">
                {item.desc}
              </p>

              <div className="relative mt-6 flex items-center gap-2 text-sm font-medium text-slate-400 transition-all duration-300 group-hover:text-slate-700">
                Explore feature
                <RiArrowRightLine className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
