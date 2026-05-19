import { useEffect, useRef, useState, type ComponentType } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
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
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineChevronDown,
  HiOutlineCamera,
  HiOutlinePencilSquare,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import { LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, isAdminUser } from '@/stores/authStore'
import { getMe } from '@/features/auth/api'
import { Logo } from '@/components/Logo'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

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

  // Refresh the persisted user (especially photo_url presigned URLs that expire)
  // on every layout mount + every 5 minutes while the app is open.
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: Boolean(token),
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
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
    { to: '/app/split-bills', label: t.nav.splitBill, icon: HiOutlineUserGroup },
    // Admins don't subscribe themselves; they manage subscribers below.
    ...(!isAdmin ? [{ to: '/app/subscription', label: t.nav.subscription, icon: HiOutlineSparkles }] : []),
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - desktop */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen flex-col border-r border-slate-200/80 bg-white py-4 transition-all duration-300 ease-out lg:flex',
          collapsed ? 'w-16 px-2' : 'w-64 px-3',
        )}
      >
        <div
          className={cn(
            'mb-4 flex items-center gap-2 px-1',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <Logo size="sm" withText={!collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              'group inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95',
              collapsed && 'mt-1',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
          >
            {collapsed ? (
              <LuPanelLeftOpen className="h-4 w-4" />
            ) : (
              <LuPanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
        <NavSections sections={sections} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
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
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/60 bg-white/70 px-3 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60 lg:px-6">
          <div className="flex items-center gap-1.5">
            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:scale-95 lg:hidden"
              aria-label="Open menu"
            >
              <HiOutlineBars3 className="h-5 w-5" />
            </button>

            <Link
              to="/"
              className="group inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              title="Kembali ke landing"
            >
              <HiOutlineArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Landing</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <UserDropdown user={user} onLogout={onLogout} t={t} />
          </div>
        </header>
        <main className="min-h-[calc(100vh-64px)] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
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
    <nav className="flex-1 space-y-5 overflow-y-auto">
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
    <div className="space-y-0.5">
      {items.map(({ to, label, end, icon: Icon, tier }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onItemClick}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-md text-sm font-medium transition',
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition',
                  isActive ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-600',
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
          'flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2.5 transition hover:border-slate-200 hover:bg-slate-50',
          open && 'border-slate-200 bg-slate-50',
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
            'h-4 w-4 text-slate-400 transition',
            open && 'rotate-180 text-slate-600',
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-200/40"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <Avatar user={user} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">
                {user?.name ?? 'User'}
              </div>
              <div className="truncate text-xs text-slate-500">{user?.email ?? ''}</div>
            </div>
          </div>

          <div className="py-1">
            <DropdownItem
              to="/app/profile"
              icon={HiOutlineUser}
              label={t.nav.profile ?? 'Profil'}
              onClick={() => setOpen(false)}
            />
            <DropdownItem
              to="/app/settings"
              icon={HiOutlineCog6Tooth}
              label={t.nav.settings ?? 'Pengaturan'}
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout() }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
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
          'flex items-center gap-3 px-4 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-700 hover:bg-slate-50',
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
    return <img src={user.photo_url} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
      {initials || 'U'}
    </div>
  )
}
