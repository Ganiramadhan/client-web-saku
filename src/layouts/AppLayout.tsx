import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  HiOutlineHome,
  HiOutlineCreditCard,
  HiOutlineTag,
  HiOutlineQueueList,
  HiOutlineTrophy,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowRight,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineChevronDown,
  HiOutlineCamera,
  HiOutlinePencilSquare,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineReceiptPercent,
  HiOutlineEllipsisHorizontal,
} from 'react-icons/hi2'
import { LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, isAdminUser } from '@/stores/authStore'
import { getMe, logout } from '@/features/auth/api'
import { notificationApi, type NotificationItem } from '@/features/notifications/api'
import { subscriptionApi } from '@/features/subscription/api'
import { Logo } from '@/components/Logo'
import { useLocale, useT } from '@/i18n'
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
  const location = useLocation()
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
  const activeSubscriptionQ = useQuery({
    queryKey: ['subscription', 'active'],
    queryFn: subscriptionApi.active,
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  })
  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data)
  }, [meQuery.data, setUser])
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
  const hasPro =
    activeSubscriptionQ.data?.status === 'active' ||
    activeSubscriptionQ.data?.status === 'trialing'

  const userItems: NavItem[] = [
    { to: '/app', label: t.nav.dashboard, end: true, icon: HiOutlineHome },
    { to: '/app/transactions', label: t.nav.transactions, icon: HiOutlineQueueList },
    { to: '/app/scan-receipt', label: t.nav.scanReceipt, icon: HiOutlineCamera },
    { to: '/app/free-text', label: t.nav.freeText, icon: HiOutlinePencilSquare },
    { to: '/app/wallets', label: t.nav.wallets, icon: HiOutlineCreditCard },
    { to: '/app/targets', label: t.nav.targets, icon: HiOutlineTrophy },
    { to: '/app/upcoming-billings', label: t.nav.upcomingBillings, icon: HiOutlineCalendarDays },
    { to: '/app/split-bills', label: t.nav.splitBill, icon: HiOutlineUserGroup },
    ...(hasPro ? [{ to: '/app/customer-service', label: 'Customer Service', icon: HiOutlineChatBubbleLeftRight }] : []),
  ]

  const adminItems: NavItem[] = [
    { to: '/admin/users', label: t.nav.adminUsers, icon: HiOutlineUsers },
    { to: '/admin/categories', label: t.nav.categories, icon: HiOutlineTag },
    { to: '/admin/subscriptions', label: t.nav.subscribers, icon: HiOutlineSparkles },
    { to: '/admin/vouchers', label: 'Vouchers', icon: HiOutlineReceiptPercent },
    { to: '/admin/customer-service', label: 'Customer Service', icon: HiOutlineChatBubbleLeftRight },
  ]

  const superAdminItems: NavItem[] = [
    { to: '/super-admin', label: t.nav.dashboard, end: true, icon: HiOutlineHome },
    { to: '/super-admin/users', label: t.nav.adminUsers, icon: HiOutlineUsers },
    { to: '/super-admin/subscriptions', label: t.nav.subscribers, icon: HiOutlineSparkles },
    { to: '/super-admin/vouchers', label: 'Vouchers', icon: HiOutlineReceiptPercent },
    { to: '/super-admin/ai-logs', label: t.nav.aiLogs, icon: HiOutlineSparkles },
    { to: '/super-admin/customer-service', label: 'Customer Service', icon: HiOutlineChatBubbleLeftRight },
  ]

  // Build sections based on user role
  const sections: NavSection[] = isSuperAdmin
    ? [{ label: 'Super Admin', items: superAdminItems }]
    : [
        { label: 'Workspace', items: userItems },
        ...(isAdmin ? [{ label: 'Admin', items: adminItems }] : []),
      ]

  useEffect(() => {
    if (!isSuperAdmin) return
    if (location.pathname === '/app' || location.pathname.startsWith('/app/transactions') || location.pathname.startsWith('/app/scan-receipt') || location.pathname.startsWith('/app/free-text') || location.pathname.startsWith('/app/wallets') || location.pathname.startsWith('/app/targets') || location.pathname.startsWith('/app/upcoming-billings') || location.pathname.startsWith('/app/split-bills')) {
      navigate('/super-admin', { replace: true })
    }
  }, [isSuperAdmin, location.pathname, navigate])

  const onLogout = () => {
    logout().catch(() => undefined).finally(() => {
      qc.clear()
      clear()
      navigate('/', { replace: true })
    })
  }

  return (
    <div
      className="app-surface relative flex min-h-screen items-stretch bg-[#f6eee8]"
    >
      {/* Ambient background */}
      <div className="app-ambient-bg pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(246,238,232,0.98) 0%, rgba(255,250,246,0.96) 45%, rgba(236,253,245,0.82) 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, #17120f 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-[45%_55%_35%_65%] border border-[#17120f]/10 bg-brand-100/35" />
        <div className="absolute right-10 top-28 h-48 w-48 rounded-[62%_38%_55%_45%] border border-[#17120f]/10 bg-[#fddf82]/35" />
      </div>

      {/* Sidebar - desktop */}
      <aside
        className={cn(
          'sticky top-0 z-10 hidden min-h-dvh shrink-0 self-stretch flex-col py-4 transition-all duration-300 ease-out lg:flex',
          collapsed ? 'w-16 px-2' : 'w-64 px-3',
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(255,250,246,0.82), rgba(255,255,255,0.66))',
          backdropFilter: 'blur(36px) saturate(180%)',
          WebkitBackdropFilter: 'blur(36px) saturate(180%)',
          borderRight: '1px solid rgba(23,18,15,0.10)',
          boxShadow: '12px 0 36px rgba(23,18,15,0.045), inset -1px 0 0 rgba(255,255,255,0.62)',
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
        <NavSections sections={sections} collapsed={collapsed} hasPro={hasPro} />
      </aside>

      {/* Main */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 px-3 lg:px-6"
          style={{
            background: 'rgba(255,250,246,0.76)',
            backdropFilter: 'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            borderBottom: '1px solid rgba(23,18,15,0.10)',
            boxShadow: '0 8px 28px rgba(23,18,15,0.045), inset 0 1px 0 rgba(255,255,255,0.72)',
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <Logo size="sm" withText={false} />
              <span className="truncate text-sm font-black tracking-tight text-slate-950">SAKU</span>
            </div>
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
        <main className="min-h-[calc(100vh-64px)] flex-1 overflow-x-hidden px-3 py-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNavigation
        isSuperAdmin={isSuperAdmin}
        isAdmin={isAdmin}
        pathname={location.pathname}
        t={t}
      />
    </div>
  )
}

function BottomNavigation({
  isSuperAdmin,
  isAdmin,
  pathname,
  t,
}: {
  isSuperAdmin: boolean
  isAdmin: boolean
  pathname: string
  t: ReturnType<typeof useT>
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const inAdminArea = isAdmin && pathname.startsWith('/admin')
  const primaryItems: NavItem[] = isSuperAdmin
    ? [
        { to: '/super-admin', label: t.nav.dashboard, end: true, icon: HiOutlineHome },
        { to: '/super-admin/users', label: 'Users', icon: HiOutlineUsers },
        { to: '/super-admin/subscriptions', label: 'Subs', icon: HiOutlineSparkles },
        { to: '/super-admin/ai-logs', label: 'AI Logs', icon: HiOutlineSparkles },
      ]
    : inAdminArea
      ? [
          { to: '/admin/users', label: 'Users', icon: HiOutlineUsers },
          { to: '/admin/subscriptions', label: 'Subs', icon: HiOutlineSparkles },
          { to: '/admin/vouchers', label: 'Voucher', icon: HiOutlineReceiptPercent },
          { to: '/admin/customer-service', label: 'Support', icon: HiOutlineChatBubbleLeftRight },
        ]
      : [
          { to: '/app', label: t.nav.dashboard, end: true, icon: HiOutlineHome },
          { to: '/app/transactions', label: t.nav.transactions, icon: HiOutlineQueueList },
          { to: '/app/free-text', label: 'Chat AI', icon: HiOutlineSparkles },
          { to: '/app/wallets', label: t.nav.wallets, icon: HiOutlineCreditCard },
        ]
  const moreItems: NavItem[] = isSuperAdmin
    ? [
        { to: '/super-admin/vouchers', label: 'Vouchers', icon: HiOutlineReceiptPercent },
        { to: '/super-admin/customer-service', label: 'Customer Service', icon: HiOutlineChatBubbleLeftRight },
        { to: '/app/profile', label: 'Profile', icon: HiOutlineUser },
      ]
    : inAdminArea
      ? [
          { to: '/admin/categories', label: t.nav.categories, icon: HiOutlineTag },
          { to: '/app/profile', label: 'Profile', icon: HiOutlineUser },
        ]
      : [
          { to: '/app/scan-receipt', label: t.nav.scanReceipt, icon: HiOutlineCamera },
          { to: '/app/targets', label: t.nav.targets, icon: HiOutlineTrophy },
          { to: '/app/upcoming-billings', label: t.nav.upcomingBillings, icon: HiOutlineCalendarDays },
          { to: '/app/split-bills', label: t.nav.splitBill, icon: HiOutlineUserGroup },
          { to: '/app/customer-service', label: 'Customer Service', icon: HiOutlineChatBubbleLeftRight },
          { to: '/app/profile', label: 'Profile', icon: HiOutlineUser },
        ]
  const moreActive = moreItems.some((item) => isNavItemActive(item, pathname))

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[2px] lg:hidden" onClick={() => setMoreOpen(false)} />
      ) : null}
      {moreOpen ? <MobileMoreSheet items={moreItems} pathname={pathname} onClose={() => setMoreOpen(false)} /> : null}

      <nav className="saku-mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 rounded-t-[1.65rem] border border-b-0 border-[#17120f]/10 bg-[#fffaf6]/95 shadow-[0_-12px_30px_rgba(23,18,15,0.08)] backdrop-blur-2xl transition-all duration-300 ease-out lg:hidden" aria-label="Primary mobile navigation">
        <div className="mx-auto max-w-md px-2 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-1.5">
          <div className="grid grid-cols-5 gap-1">
            {primaryItems.map((item) => (
              <BottomNavItem key={item.to} item={item} pathname={pathname} />
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
              className={cn(
                'group relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-1.5 py-2 text-[10px] font-extrabold leading-none transition-all duration-300 ease-out active:scale-95',
                moreOpen || moreActive
                  ? 'text-brand-700'
                  : 'text-[#4f4540] hover:bg-white/70 hover:text-[#17120f]',
              )}
            >
              <span
                className={cn(
                  'absolute inset-0 rounded-2xl bg-brand-50 shadow-sm ring-1 ring-brand-100 transition-all duration-300 ease-out',
                  moreOpen || moreActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
                )}
              />
              <HiOutlineEllipsisHorizontal
                className={cn(
                  'relative z-10 h-5 w-5 transition-all duration-300 ease-out group-hover:-translate-y-0.5',
                  moreOpen || moreActive ? 'text-brand-700' : 'text-[#4f4540]/55',
                )}
              />
              <span className="relative z-10 block max-w-full truncate transition-colors duration-300">More</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

function BottomNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon
  const isActive = isNavItemActive(item, pathname)

  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-1.5 py-2 text-[10px] font-extrabold leading-none transition-all duration-300 ease-out active:scale-95',
        isActive
          ? 'text-brand-700'
          : 'text-[#4f4540] hover:bg-white/70 hover:text-[#17120f]',
      )}
    >
      <span
        className={cn(
          'absolute inset-0 rounded-2xl bg-brand-50 shadow-sm ring-1 ring-brand-100 transition-all duration-300 ease-out',
          isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
        )}
      />
      <Icon
        className={cn(
          'relative z-10 h-5 w-5 transition-all duration-300 ease-out group-hover:-translate-y-0.5',
          isActive ? 'text-brand-700' : 'text-[#4f4540]/55',
        )}
      />
      <span className="relative z-10 block max-w-full truncate transition-colors duration-300">{item.label}</span>
    </NavLink>
  )
}

function MobileMoreSheet({
  items,
  pathname,
  onClose,
}: {
  items: NavItem[]
  pathname: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-40 px-3 lg:hidden">
      <div className="mx-auto max-w-md overflow-hidden rounded-[1.5rem] border border-[#17120f]/10 bg-[#fffaf6] p-2 shadow-2xl shadow-[#17120f]/12 backdrop-blur-2xl">
        <div className="px-3 pb-2 pt-2">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">More menu</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = isNavItemActive(item, pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={cn(
                  'flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left text-xs font-bold transition active:scale-[0.98]',
                  isActive
                    ? 'border-brand-100 bg-brand-50 text-brand-700'
                    : 'border-[#17120f]/8 bg-white/65 text-[#4f4540] hover:border-brand-100 hover:bg-white',
                )}
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', isActive ? 'bg-white text-brand-700' : 'bg-white text-[#4f4540]/65')}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function isNavItemActive(item: NavItem, pathname: string) {
  if (item.to === '/app/free-text') {
    return pathname.startsWith('/app/free-text')
  }
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function NotificationsBell({
  items,
  onMarkAllRead,
}: {
  items: NotificationItem[]
  onMarkAllRead: () => void
}) {
  const { locale } = useLocale()
  const copy = locale === 'id'
    ? {
        notifications: 'Notifikasi',
        markRead: 'Tandai dibaca',
        empty: 'Belum ada notifikasi.',
      }
    : {
        notifications: 'Notifications',
        markRead: 'Mark as read',
        empty: 'No notifications yet.',
      }
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
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#17120f]/10 bg-white/65 text-[#4f4540] shadow-sm shadow-[#17120f]/5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        aria-label={copy.notifications}
      >
        <HiOutlineBell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-400 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-[#17120f]/10 bg-[#fffaf6] p-2 shadow-xl shadow-[#17120f]/10">
          <div className="flex items-center justify-between px-2 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{copy.notifications}</p>
            {unread > 0 ? (
              <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-brand-700">
                {copy.markRead}
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">{copy.empty}</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl px-3 py-2 hover:bg-white/70">
                  <div className="flex gap-2">
                    {!item.read_at ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" /> : null}
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
  hasPro,
  onItemClick,
}: {
  sections: NavSection[]
  collapsed: boolean
  hasPro: boolean
  onItemClick?: () => void
}) {
  return (
    <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4 pr-0.5">
      {sections.map((section, idx) => (
        <div key={section.label}>
          {!collapsed ? (
            <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#4f4540]/50">
              {section.label}
            </div>
          ) : idx > 0 ? (
            <div className="mx-2 mb-2 h-px bg-[#17120f]/10" />
          ) : null}
          <NavList items={section.items} collapsed={collapsed} hasPro={hasPro} onItemClick={onItemClick} />
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
  const { locale } = useLocale()
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
      <div className="relative w-full max-w-xl">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          placeholder={locale === 'id' ? 'Cari menu dan fitur SAKU...' : 'Search SAKU menus and features...'}
          className="h-11 w-full rounded-2xl border border-[#17120f]/12 bg-[#fffaf6]/88 pl-11 pr-20 text-sm font-bold text-[#17120f] shadow-[0_8px_24px_rgba(23,18,15,0.06)] outline-none transition placeholder:font-medium placeholder:text-[#6f625b]/60 hover:border-[#17120f]/20 hover:bg-white focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-[#17120f]/10 bg-[#f6eee8] px-2 py-1 text-[10px] font-black text-[#6f625b]">
          ⌘K
        </span>

        {open ? (
          <div className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-[1.35rem] border border-[#17120f]/14 bg-[#fffaf6]/98 p-2 shadow-[0_24px_60px_rgba(23,18,15,0.16)] backdrop-blur-2xl">
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">
                  {locale === 'id' ? 'Navigasi cepat' : 'Quick navigation'}
                </p>
                <p className="mt-0.5 text-xs text-[#6f625b]">
                  {query.trim()
                    ? locale === 'id' ? `${results.length} hasil ditemukan` : `${results.length} results found`
                    : locale === 'id' ? 'Menu yang sering digunakan' : 'Frequently used menus'}
                </p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-black text-brand-800">
                SAKU
              </span>
            </div>
            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#17120f]/14 bg-[#f6eee8]/60 px-4 py-7 text-center">
                <HiOutlineMagnifyingGlass className="mx-auto h-6 w-6 text-[#6f625b]/35" />
                <p className="mt-2 text-sm font-bold text-[#6f625b]">
                  {locale === 'id' ? 'Menu tidak ditemukan' : 'No menu found'}
                </p>
                <p className="mt-1 text-xs text-[#6f625b]/65">
                  {locale === 'id'
                    ? 'Coba kata seperti transaksi, dompet, target, atau tagihan.'
                    : 'Try words such as transactions, wallets, goals, or bills.'}
                </p>
              </div>
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
                    className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-100/70"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-100 text-brand-800 transition group-hover:-rotate-3 group-hover:scale-105">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-[#17120f]">{label}</span>
                      <span className="block text-[11px] font-semibold text-[#6f625b]/70">{section}</span>
                    </span>
                    <HiOutlineArrowRight className="h-4 w-4 text-[#6f625b]/30 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
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
  hasPro,
  onItemClick,
}: {
  items: NavItem[]
  collapsed?: boolean
  hasPro: boolean
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
                ? 'border-brand-200 bg-brand-50 text-[#17120f] shadow-sm shadow-[#17120f]/5'
                : 'text-[#4f4540] hover:bg-white/62 hover:text-[#17120f] hover:border-[#17120f]/8',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-105',
                  isActive ? 'text-brand-700' : 'text-[#4f4540]/55 group-hover:text-[#17120f]',
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {tier && !hasPro ? <TierBadge tier={tier} /> : null}
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
            ? 'border-[#17120f]/10 bg-white/72 shadow-sm'
            : 'border-transparent hover:border-[#17120f]/10 hover:bg-white/62',
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
          className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[#17120f]/10 bg-[#fffaf6] shadow-xl shadow-[#17120f]/10"
        >
          <div className="flex items-center gap-3 border-b border-[#17120f]/10 bg-white/62 px-4 py-3">
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

          <div className="border-t border-[#17120f]/10 p-1">
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
            ? 'border-brand-200 bg-brand-50 text-brand-700'
            : 'text-[#4f4540] hover:bg-white/70 hover:text-[#17120f]',
        )
      }
      role="menuitem"
    >
      <Icon className="h-4 w-4 text-[#4f4540]/55" />
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
    return <img src={user.photo_url} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover ring-1 ring-[#17120f]/10" />
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#17120f]/10 bg-brand-200 text-xs font-black text-[#17120f]">
      {initials || 'U'}
    </div>
  )
}
