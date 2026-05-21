import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  HiOutlineHome,
  HiOutlineCreditCard,
  HiOutlineTag,
  HiOutlineQueueList,
  HiOutlineTrophy,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineChevronDown,
  HiOutlineCamera,
  HiOutlinePencilSquare,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineCalendarDays,
} from 'react-icons/hi2'
import { LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, isAdminUser } from '@/stores/authStore'
import { getMe } from '@/features/auth/api'
import { notificationApi, type NotificationItem } from '@/features/notifications/api'
import { Logo } from '@/components/Logo'
import { useT } from '@/i18n'
import { cn, formatCurrency } from '@/lib/utils'

type IconCmp = ComponentType<{ className?: string }>
type Tier = 'pro' | 'business'

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: IconCmp
  tier?: Tier
}

interface NavSection {
  label: string
  items: NavItem[]
}

const SIDEBAR_COLLAPSED_KEY = 'saku_sidebar_collapsed'

export function AppLayout() {
  const t = useT()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const token = useAuthStore((s) => s.token)
  const clear = useAuthStore((s) => s.clear)
  const qc = useQueryClient()


  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: Boolean(token),
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  })
  const notificationsQ = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(20),
    enabled: Boolean(token),
    refetchInterval: 5 * 60 * 1000,
  })
  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data)
  }, [meQuery.data, setUser])
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  })
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null
        const tag = target?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
        e.preventDefault()
        setCollapsed((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = isAdminUser(user)

  const userItems: NavItem[] = [
    { to: '/app', label: t.nav.dashboard, end: true, icon: HiOutlineHome },
    { to: '/app/transactions', label: t.nav.transactions, icon: HiOutlineQueueList },
    { to: '/app/scan-receipt', label: t.nav.scanReceipt, icon: HiOutlineCamera, tier: 'pro' },
    { to: '/app/free-text', label: t.nav.freeText, icon: HiOutlinePencilSquare, tier: 'pro' },
    { to: '/app/wallets', label: t.nav.wallets, icon: HiOutlineCreditCard },
    { to: '/app/targets', label: t.nav.targets, icon: HiOutlineTrophy, tier: 'pro' },
    { to: '/app/upcoming-billings', label: 'Upcoming Billing', icon: HiOutlineCalendarDays },
    { to: '/app/split-bills', label: t.nav.splitBill, icon: HiOutlineUserGroup },
  ]

  const adminItems: NavItem[] = [
    { to: '/admin/users', label: t.nav.adminUsers, icon: HiOutlineUsers },
    { to: '/admin/categories', label: t.nav.categories, icon: HiOutlineTag },
    { to: '/admin/subscriptions', label: t.nav.subscribers, icon: HiOutlineSparkles },
  ]

  const superAdminItems: NavItem[] = [
    { to: '/super-admin/ai-logs', label: t.nav.aiLogs, icon: HiOutlineSparkles },
  ]

  // Build sections based on user role
  const sections: NavSection[] = [
    { label: 'Workspace', items: userItems },
    ...(isAdmin ? [{ label: 'Admin', items: adminItems }] : []),
    ...(isSuperAdmin ? [{ label: 'Super Admin', items: superAdminItems }] : []),
  ]

  const onLogout = () => {
    clear()
    navigate('/', { replace: true })
  }

  return (
    <div
      className="app-surface relative flex min-h-screen items-stretch"
    >
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(239,246,255,0.92) 0%, rgba(248,250,252,0.96) 38%, rgba(240,253,250,0.90) 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Sidebar - desktop */}
      <aside
        className={cn(
          'sticky top-0 z-10 hidden min-h-dvh shrink-0 self-stretch flex-col py-4 transition-all duration-300 ease-out lg:flex',
          collapsed ? 'w-16 px-2' : 'w-64 px-3',
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,252,255,0.62))',
          backdropFilter: 'blur(36px) saturate(180%)',
          WebkitBackdropFilter: 'blur(36px) saturate(180%)',
          borderRight: '1px solid rgba(226,232,240,0.52)',
          boxShadow: '12px 0 36px rgba(15,23,42,0.035), inset -1px 0 0 rgba(255,255,255,0.62)',
        }}
      >
        <div
          className={cn(
            'mb-5 flex items-center gap-2 px-1',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <Logo size="sm" withText={!collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              'group inline-flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-slate-500 transition-all duration-300 active:scale-95',
              collapsed && 'mt-1',
            )}
            style={{
              background: 'rgba(255, 255, 255, 0.60)',
              border: '1px solid rgba(255, 255, 255, 0.80)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
          >
            {collapsed ? (
              <LuPanelLeftOpen className="h-4 w-4 text-slate-600" />
            ) : (
              <LuPanelLeftClose className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
        <NavSections sections={sections} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" onClick={() => setOpen(false)} />
          <aside
            className="absolute left-0 top-0 flex h-dvh w-72 flex-col p-4 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.80)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.80)',
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 active:scale-95"
                aria-label="Close menu"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
            <NavSections sections={sections} collapsed={false} onItemClick={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 px-3 lg:px-6"
          style={{
            background: 'rgba(248,250,252,0.64)',
            backdropFilter: 'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            borderBottom: '1px solid rgba(226,232,240,0.52)',
            boxShadow: '0 8px 28px rgba(15,23,42,0.035), inset 0 1px 0 rgba(255,255,255,0.72)',
          }}
        >
          <div className="flex items-center gap-1.5">
            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/60 active:scale-95 lg:hidden"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.50)',
              }}
              aria-label="Open menu"
            >
              <HiOutlineBars3 className="h-5 w-5" />
            </button>

          </div>

          <GlobalNavSearch sections={sections} onNavigate={navigate} />

          <div className="flex items-center gap-2">
            <NotificationsBell
              items={notificationsQ.data ?? []}
              onMarkAllRead={() => markAllRead.mutate()}
            />
            <UserDropdown user={user} onLogout={onLogout} t={t} />
          </div>
        </header>
        <main className="min-h-[calc(100vh-64px)] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function NotificationsBell({
  items,
  onMarkAllRead,
}: {
  items: NotificationItem[]
  onMarkAllRead: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = items.filter((item) => !item.read_at).length

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/65 text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-white"
        aria-label="Notifikasi"
      >
        <HiOutlineBell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between px-2 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Notifikasi</p>
            {unread > 0 ? (
              <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-brand-700">
                Tandai dibaca
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">Belum ada notifikasi.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl px-3 py-2 hover:bg-slate-50">
                  <div className="flex gap-2">
                    {!item.read_at ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" /> : null}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{formatNotificationMessage(item.message)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function formatNotificationMessage(message: string): string {
  return message.replace(/\bnominal\s+(\d+(?:[.,]\d+)?)\s+IDR\b/gi, (_match, amount: string) => {
    const parsed = Number(String(amount).replace(/\./g, '').replace(',', '.'))
    return `nominal ${formatCurrency(parsed, 'IDR')}`
  })
}

function NavSections({
  sections,
  collapsed,
  onItemClick,
}: {
  sections: NavSection[]
  collapsed: boolean
  onItemClick?: () => void
}) {
  return (
    <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4 pr-0.5">
      {sections.map((section, idx) => (
        <div key={section.label}>
          {!collapsed ? (
            <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.label}
            </div>
          ) : idx > 0 ? (
            <div className="mx-2 mb-2 h-px bg-slate-200" />
          ) : null}
          <NavList items={section.items} collapsed={collapsed} onItemClick={onItemClick} />
        </div>
      ))}
    </nav>
  )
}

function GlobalNavSearch({
  sections,
  onNavigate,
}: {
  sections: NavSection[]
  onNavigate: (to: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const items = useMemo(
    () => sections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.label }))),
    [sections],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 6)
    return items
      .filter((item) => `${item.label} ${item.section}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [items, query])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} className="relative hidden min-w-0 flex-1 justify-center md:flex">
      <div className="relative w-full max-w-md">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          placeholder="Search menu..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-16 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-500/15"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
          ⌘K
        </span>

        {open ? (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm font-medium text-slate-400">No menu found</div>
            ) : (
              <div className="space-y-1">
                {results.map(({ to, label, icon: Icon, section }) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setQuery('')
                      onNavigate(to)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-brand-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-800">{label}</span>
                      <span className="block text-[11px] font-medium text-slate-400">{section}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TierBadge({ tier }: { tier: Tier }) {
  const tone =
    tier === 'pro'
      ? 'bg-violet-50 text-violet-700 ring-violet-200'
      : 'bg-amber-50 text-amber-700 ring-amber-200'
  return (
    <span
      className={cn(
        'ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-inset',
        tone,
      )}
    >
      {tier}
    </span>
  )
}

function NavList({
  items,
  collapsed,
  onItemClick,
}: {
  items: NavItem[]
  collapsed?: boolean
  onItemClick?: () => void
}) {
  return (
    <div className="space-y-1">
      {items.map(({ to, label, end, icon: Icon, tier }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onItemClick}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-2xl text-sm font-semibold transition-all duration-300 border border-transparent',
              collapsed ? 'justify-center p-2.5' : 'px-4 py-2.5',
              isActive
                ? 'bg-brand-600 text-white border-brand-500/20 shadow-lg shadow-brand-500/18'
                : 'text-slate-600 hover:bg-white/50 hover:text-slate-950 hover:border-white/60',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-105',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {tier ? <TierBadge tier={tier} /> : null}
                </>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

function UserDropdown({
  user,
  onLogout,
  t,
}: {
  user: { name: string; email: string; role: string } | null
  onLogout: () => void
  t: ReturnType<typeof useT>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3 transition duration-300',
          open
            ? 'bg-slate-100 border-slate-200 shadow-sm'
            : 'border-transparent hover:bg-slate-50 hover:border-slate-200',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar user={user} />
        <div className="hidden flex-col text-left md:flex">
          <span className="text-sm font-semibold leading-tight text-slate-900">
            {user?.name}
          </span>
          <span className="text-[11px] text-slate-500">{user?.email}</span>
        </div>
        <HiOutlineChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform duration-300',
            open && 'rotate-180 text-slate-600',
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <Avatar user={user} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-900">
                {user?.name ?? 'User'}
              </div>
              <div className="truncate text-xs text-slate-500">{user?.email ?? ''}</div>
            </div>
          </div>

          <div className="p-1 space-y-0.5">
            <DropdownItem
              to="/app/profile"
              icon={HiOutlineUser}
              label="Profile"
              onClick={() => setOpen(false)}
            />
            <DropdownItem
              to="/app/settings"
              icon={HiOutlineCog6Tooth}
              label="Settings"
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="border-t border-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout() }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-[0.98]"
              role="menuitem"
            >
              <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
              {t.common.logout}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DropdownItem({
  to, icon: Icon, label, onClick,
}: {
  to: string
  icon: IconCmp
  label: string
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-300 border border-transparent',
          isActive
            ? 'bg-brand-600/10 text-brand-700 border-brand-500/10'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
        )
      }
      role="menuitem"
    >
      <Icon className="h-4 w-4 text-slate-400" />
      {label}
    </NavLink>
  )
}

function Avatar({ user }: { user: { name?: string; photo_url?: string } | null }) {
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (user?.photo_url) {
    return <img src={user.photo_url} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
      {initials || 'U'}
    </div>
  )
}
