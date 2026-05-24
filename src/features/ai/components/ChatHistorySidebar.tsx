import { useMemo } from 'react'
import { HiOutlineChatBubbleLeftRight, HiOutlinePencilSquare, HiOutlineSparkles, HiOutlineTrash, HiOutlineXMark } from 'react-icons/hi2'
import { useLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import { groupSessionsByDate, type AIMode, type ChatSession } from '../utils/freeText'

export function ChatSidebar({
  sessions,
  activeId,
  activeMode,
  onSelect,
  onNew,
  onSwitchMode,
  onDelete,
  onDeleteAll,
  onClose,
  mobileOpen,
}: {
  sessions: ChatSession[]
  activeId: string | null
  activeMode: AIMode
  onSelect: (id: string) => void
  onNew: (mode: AIMode) => void
  onSwitchMode: (mode: AIMode) => void
  onDelete: (id: string) => void
  onDeleteAll: () => void
  onClose: () => void
  mobileOpen: boolean
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        history: 'Riwayat Chat',
        close: 'Tutup',
        newChat: 'Chat baru',
        deleteAll: 'Hapus semua riwayat',
        empty: 'Belum ada percakapan. Mulai chat baru di atas.',
        delete: 'Hapus',
      }
    : {
        history: 'Chat History',
        close: 'Close',
        newChat: 'New chat',
        deleteAll: 'Delete all history',
        empty: 'No conversations yet. Start a new chat above.',
        delete: 'Delete',
      }
  const visibleSessions = useMemo(
    () => sessions.filter((session) => session.mode === activeMode),
    [sessions, activeMode],
  )
  const groups = useMemo(() => groupSessionsByDate(visibleSessions, locale), [visibleSessions, locale])

  return (
    <>
      {mobileOpen ? (
        <button
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          aria-label={copy.close}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/80 bg-white/76 shadow-xl shadow-slate-200/40 backdrop-blur-2xl transition-transform md:static md:inset-auto md:z-auto md:h-full md:translate-x-0 md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/80 px-4 py-3">
          <div className="text-sm font-semibold text-slate-700">{copy.history}</div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-200 md:hidden"
            aria-label={copy.close}
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 p-3">
          <button
            onClick={() => onNew(activeMode)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <HiOutlinePencilSquare className="h-4 w-4" /> {copy.newChat}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSwitchMode('nlp')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition',
                activeMode === 'nlp'
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              <HiOutlineSparkles className="h-4 w-4" /> NLP
            </button>
            <button
              onClick={() => onSwitchMode('chatbot')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition',
                activeMode === 'chatbot'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              <HiOutlineChatBubbleLeftRight className="h-4 w-4" /> Chatbot
            </button>
          </div>
          <button
            onClick={onDeleteAll}
            disabled={visibleSessions.length === 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-100 bg-white px-2 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineTrash className="h-4 w-4" /> {copy.deleteAll}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {visibleSessions.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-400">
              {copy.empty}
            </p>
          ) : null}

          {groups.map((g) => (
            <SessionGroup
              key={g.label}
              label={g.label}
              items={g.items}
              activeId={activeId}
              onSelect={onSelect}
              onDelete={onDelete}
              deleteLabel={copy.delete}
            />
          ))}        </div>
      </aside>
    </>
  )
}


function SessionGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
  deleteLabel,
}: {
  label: string
  items: ChatSession[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  deleteLabel: string
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-3">
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((s) => {
          const active = s.id === activeId
          return (
            <li key={s.id}>
              <div
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition',
                  active
                    ? 'bg-white shadow-sm ring-1 ring-brand-200'
                    : 'hover:bg-white',
                )}
              >
                <button
                  onClick={() => onSelect(s.id)}
                  className="flex flex-1 items-center gap-2 truncate text-left"
                >
                  {s.mode === 'nlp' ? (
                    <HiOutlineSparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  ) : (
                    <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                  <span
                    className={cn(
                      'truncate',
                      active ? 'font-semibold text-slate-900' : 'text-slate-600',
                    )}
                  >
                    {s.title === 'Chat baru' ? (deleteLabel === 'Hapus' ? 'Chat baru' : 'New chat') : s.title}
                  </span>
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  className="rounded p-1 text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100"
                  aria-label={deleteLabel}
                  title={deleteLabel}
                >
                  <HiOutlineTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
