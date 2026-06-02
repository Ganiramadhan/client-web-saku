import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react'
import { RiBrainLine, RiChatSmile3Line, RiReceiptLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import { SectionHeading } from '../components/SectionHeading'

const NLPSection = lazy(() => import('./how-it-works/NLPSection').then((module) => ({ default: module.NLPSection })))
const ChatbotSection = lazy(() => import('./how-it-works/ChatbotSection').then((module) => ({ default: module.ChatbotSection })))
const ReceiptSection = lazy(() => import('./how-it-works/ReceiptSection').then((module) => ({ default: module.ReceiptSection })))

export function HowItWorksSection() {
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState<'nlp' | 'chat' | 'receipt'>('nlp')
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  const tabs = [
    { id: 'nlp' as const, label: locale === 'id' ? 'Catat via Chat' : 'Record via Chat', Icon: RiChatSmile3Line },
    { id: 'chat' as const, label: locale === 'id' ? 'Tanya Insight AI' : 'Ask AI Insights', Icon: RiBrainLine },
    { id: 'receipt' as const, label: locale === 'id' ? 'Scan Struk' : 'Scan Receipt', Icon: RiReceiptLine },
  ]

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={locale === 'id' ? 'Cara Kerja' : 'How It Works'}
          title={locale === 'id' ? 'Catat uang dengan cara yang lebih pintar' : 'Track your money in smarter ways'}
          description={locale === 'id' ? 'Gunakan chat AI, insight keuangan, atau scan struk untuk mencatat dan memahami pengeluaran lebih cepat.' : 'Use AI chat, financial insights, or receipt scanning to record and understand your spending faster.'}
        />

        {isMobile ? (
          <MobileHowItWorks tabs={tabs} />
        ) : (
          <>
            <div className="mt-10 flex justify-center">
              <div
                className="inline-flex flex-wrap justify-center gap-1.5 rounded-3xl border border-slate-200 bg-white p-1.5 shadow-sm"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-out',
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200/70'
                          : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
                      )}
                    >
                      <tab.Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-12">
              <Suspense fallback={<div className="h-80 rounded-3xl border border-slate-200 bg-white/70" />}>
                {activeTab === 'nlp' && <NLPSection />}
                {activeTab === 'chat' && <ChatbotSection />}
                {activeTab === 'receipt' && <ReceiptSection />}
              </Suspense>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function MobileHowItWorks({
  tabs,
}: {
  tabs: Array<{ id: 'nlp' | 'chat' | 'receipt'; label: string; Icon: ComponentType<{ className?: string }> }>
}) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  const descriptions = {
    nlp: isId
      ? 'Tulis transaksi seperti chat biasa, lalu review sebelum disimpan.'
      : 'Type transactions naturally, then review before saving.',
    chat: isId
      ? 'Tanya kondisi keuangan dan dapatkan ringkasan yang mudah ditindaklanjuti.'
      : 'Ask about your finances and get actionable summaries.',
    receipt: isId
      ? 'Upload struk, cek detail hasil AI, lalu simpan sebagai transaksi.'
      : 'Upload a receipt, review AI details, then save as a transaction.',
  }

  return (
    <div className="mt-10 grid gap-2.5">
      {tabs.map((tab, index) => (
        <div key={tab.id} className="landing-mobile-hover rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-md hover:shadow-blue-100/40">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <tab.Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-300">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="text-sm font-extrabold text-slate-950">{tab.label}</h3>
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-500">{descriptions[tab.id]}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
