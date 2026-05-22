import { Link } from 'react-router-dom'
import { HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2'
import { RiArrowRightLine } from 'react-icons/ri'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { PrimaryBtn } from './PrimaryBtn'
import { smoothScrollTo } from './landingUtils'

type NavLink = { href: string; label: string }

export function LandingNavbar({
  activeSection,
  isAuthed,
  navLinks,
  navOpen,
  scrolled,
  setNavOpen,
}: {
  activeSection: string
  isAuthed: boolean
  navLinks: NavLink[]
  navOpen: boolean
  scrolled: boolean
  setNavOpen: (value: boolean | ((value: boolean) => boolean)) => void
}) {
  const t = useT()

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex justify-center px-4 py-4">
        <div className="mx-auto w-full max-w-5xl transition-all duration-500">
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500"
            style={{
              background: scrolled
                ? 'rgba(255,255,255,0.88)'
                : 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: scrolled
                ? '0 12px 40px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.95)'
                : '0 8px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((item) => {
                const isActive = activeSection === item.href

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => smoothScrollTo(item.href)}
                    className={cn(
                      'group relative cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/60'
                        : 'text-slate-600 hover:bg-white/80 hover:text-blue-700'
                    )}
                  >
                    {item.label}

                    {!isActive && (
                      <span className="absolute inset-x-4 -bottom-0.5 h-px scale-x-0 rounded-full bg-blue-500 transition-transform duration-300 group-hover:scale-x-100" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-2 lg:flex">
              <LanguageSwitcher />

              {isAuthed ? (
                <Link to="/app" className="cursor-pointer">
                  <PrimaryBtn>
                    Dashboard
                    <RiArrowRightLine className="h-3.5 w-3.5" />
                  </PrimaryBtn>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-blue-700"
                  >
                    {t.nav.login}
                  </Link>

                  <Link to="/register" className="cursor-pointer">
                    <PrimaryBtn>
                      {t.auth.submitRegister}
                      <RiArrowRightLine className="h-3.5 w-3.5" />
                    </PrimaryBtn>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-blue-700 lg:hidden"
              style={{
                border: '1px solid rgba(226,232,240,0.80)',
              }}
            >
              {navOpen ? (
                <HiOutlineXMark className="h-5 w-5" />
              ) : (
                <HiOutlineBars3 className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {navOpen && (
            <div
              className="mt-2 overflow-hidden rounded-2xl p-3 lg:hidden"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.92)',
                boxShadow:
                  '0 20px 60px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
              }}
            >
              <div className="space-y-1">
                {navLinks.map((item) => {
                  const isActive = activeSection === item.href

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        smoothScrollTo(item.href)
                        setNavOpen(false)
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/60'
                          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 grid gap-2 border-t border-slate-200/70 pt-3">
                {isAuthed ? (
                  <Link to="/app" className="cursor-pointer">
                    <PrimaryBtn className="w-full justify-center">
                      Dashboard
                    </PrimaryBtn>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="cursor-pointer">
                      <button
                        type="button"
                        className="w-full cursor-pointer rounded-xl py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700"
                        style={{
                          border: '1px solid rgba(226,232,240,0.80)',
                          background: 'rgba(255,255,255,0.80)',
                        }}
                      >
                        {t.nav.login}
                      </button>
                    </Link>

                    <Link to="/register" className="cursor-pointer">
                      <PrimaryBtn className="w-full justify-center">
                        {t.auth.submitRegister}
                      </PrimaryBtn>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
    </header>
  )
}
