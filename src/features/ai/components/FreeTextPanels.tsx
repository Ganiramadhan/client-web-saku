import { type RefObject } from 'react'
import {
  HiMicrophone,
  HiOutlineBars3,
  HiOutlinePaperAirplane,
  HiOutlinePencilSquare,
  HiOutlineQuestionMarkCircle,
  HiOutlineUser,
} from 'react-icons/hi2'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import { type AIMode } from '../utils/freeText'

/* ─────────────────────────── Avatar ─────────────────────────── */

export function UserAvatar({ photoUrl, name }: { photoUrl?: string; name?: string }) {
  const initial = (name?.trim()?.[0] ?? 'U').toUpperCase()
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? 'User'}
        referrerPolicy="no-referrer"
        className="h-7 w-7 shrink-0 rounded-full border border-slate-200 object-cover"
      />
    )
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
      {initial}
    </div>
  )
}

export function AIAvatar() {
  return (
    <div className="relative mt-0.5 h-8 w-8 shrink-0">
      <span className="absolute inset-0 rounded-full bg-brand-400/30 animate-ping" />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white shadow-lg shadow-slate-300/50 ring-2 ring-white">
        AI
      </span>
    </div>
  )
}

export { BatchActionsCard, TransactionReviewCard } from './TransactionReviewCard'

export { ChatSidebar } from './ChatHistorySidebar'

export function ChatHeader({
  title,
  mode,
  onOpenSidebar,
  onHelp,
  onNew,
}: {
  title: string
  mode: AIMode
  onOpenSidebar: () => void
  onHelp: () => void
  onNew: () => void
}) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/80 bg-white/40 px-4 py-3 md:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label={isId ? 'Buka riwayat chat' : 'Open chat history'}
        >
          <HiOutlineBars3 className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-400">
            {mode === 'nlp'
              ? isId ? 'NLP - pencatatan cepat' : 'NLP - quick recording'
              : isId ? 'Chatbot - analisis SAKU' : 'Chatbot - SAKU analysis'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onHelp}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/62 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-xl hover:bg-white hover:text-brand-700"
        >
          <HiOutlineQuestionMarkCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{isId ? 'Bantuan' : 'Help'}</span>
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
          <span className="hidden sm:inline">{isId ? 'Chat baru' : 'New chat'}</span>
        </button>
      </div>
    </div>
  )
}

export function EmptyChatState({
  mode,
  examples,
  onPickExample,
}: {
  mode: AIMode
  examples: string[]
  onPickExample: (value: string) => void
}) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  return (
    <div className="py-6">
      <div className="mx-auto mb-8 max-w-lg rounded-2xl border border-white/80 bg-white/62 px-6 py-8 text-center shadow-lg shadow-slate-200/35 backdrop-blur-2xl">
        <AIAvatar />
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">SAKU AI</p>
        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          {mode === 'nlp'
            ? isId ? 'Catat Transaksi Instan lewat Chat' : 'Record Transactions from Natural Text'
            : isId ? 'Analisis Keuangan dengan SAKU AI' : 'Financial Analysis with SAKU AI'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {mode === 'nlp'
            ? isId
              ? 'Tulis transaksi seperti chat biasa. AI akan membuat pratinjau sebelum disimpan.'
              : 'Write transactions naturally. AI prepares a review before saving.'
            : isId
              ? 'Tanyakan arus kas, kategori dominan, budget, dan prioritas finansial dari data SAKU.'
              : 'Ask about cashflow, spending categories, budgets, and financial priorities from your SAKU data.'}
        </p>
      </div>

      <div>
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isId ? 'Pilih contoh analisis' : 'Try an analysis prompt'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onPickExample(example)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChatComposer({
  value,
  mode,
  isPending,
  listening,
  speechSupported,
  textareaRef,
  onChange,
  onSend,
  onStartVoice,
}: {
  value: string
  mode: AIMode
  isPending: boolean
  listening: boolean
  speechSupported: boolean
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onSend: () => void
  onStartVoice: () => void
}) {
  const { locale } = useLocale()
  const isId = locale === 'id'
  return (
    <div className="shrink-0 border-t border-slate-100 px-4 py-4 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            placeholder={mode === 'nlp'
              ? isId ? 'Tulis transaksi kamu...' : 'Write your transaction...'
              : isId ? 'Ketik pesan...' : 'Type a message...'}
            rows={1}
            className="max-h-40 min-h-6 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          {speechSupported ? (
            <button
              onClick={onStartVoice}
              title={listening ? (isId ? 'Hentikan rekam' : 'Stop recording') : (isId ? 'Rekam suara' : 'Voice input')}
              aria-label={isId ? 'Input suara' : 'Voice input'}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition',
                listening
                  ? 'animate-pulse border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600',
              )}
            >
              <HiMicrophone className="h-4 w-4" />
            </button>
          ) : null}

          <button
            onClick={onSend}
            disabled={!value.trim() || isPending}
            aria-label={isId ? 'Kirim' : 'Send'}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition',
              value.trim() && !isPending
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'cursor-not-allowed bg-slate-100 text-slate-400',
            )}
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <HiOutlineUser className="h-3 w-3" />
          {isId
            ? `Enter untuk kirim - Shift+Enter baris baru - ${speechSupported ? 'mic untuk suara' : 'mic tidak didukung'}`
            : `Enter to send - Shift+Enter for new line - ${speechSupported ? 'mic for voice' : 'mic not supported'}`}
        </p>
      </div>
    </div>
  )
}
