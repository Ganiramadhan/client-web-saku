import { useState } from 'react'
import { RiBrainLine, RiChatSmile3Line, RiReceiptLine } from 'react-icons/ri'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import { SectionHeading } from '../components/SectionHeading'
import { ChatbotSection } from './how-it-works/ChatbotSection'
import { NLPSection } from './how-it-works/NLPSection'
import { ReceiptSection } from './how-it-works/ReceiptSection'

export function HowItWorksSection() {
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState<'nlp' | 'chat' | 'receipt'>('nlp')

  const tabs = [
    { id: 'nlp' as const, label: locale === 'id' ? 'Catat via Chat' : 'Record via Chat', Icon: RiChatSmile3Line },
    { id: 'chat' as const, label: locale === 'id' ? 'Tanya Insight AI' : 'Ask AI Insights', Icon: RiBrainLine },
    { id: 'receipt' as const, label: locale === 'id' ? 'Scan Struk' : 'Scan Receipt', Icon: RiReceiptLine },
  ]


  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-96 w-96 rounded-full bg-violet-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label={locale === 'id' ? 'Cara Kerja' : 'How It Works'}
          title={locale === 'id' ? 'Catat uang dengan cara yang lebih pintar' : 'Track your money in smarter ways'}
          description={locale === 'id' ? 'Gunakan chat AI, insight keuangan, atau scan struk untuk mencatat dan memahami pengeluaran lebih cepat.' : 'Use AI chat, financial insights, or receipt scanning to record and understand your spending faster.'}
        />

        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex flex-wrap justify-center gap-1.5 rounded-3xl p-1.5"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.88)',
              boxShadow:
                '0 8px 28px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/70'
                      : 'text-slate-500 hover:bg-white/80 hover:text-blue-700'
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
          {activeTab === 'nlp' && <NLPSection />}
          {activeTab === 'chat' && <ChatbotSection />}
          {activeTab === 'receipt' && <ReceiptSection />}
        </div>
      </div>
    </section>
  )
}
