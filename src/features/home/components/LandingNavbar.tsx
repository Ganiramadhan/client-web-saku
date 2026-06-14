import { Link } from 'react-router-dom'
import { HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2'
import { RiArrowRightLine } from 'react-icons/ri'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { useLocale, useT } from '@/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { PrimaryBtn } from './PrimaryBtn'
import { smoothScrollTo } from './landingUtils'

type NavLink = { href: string; label: string }

export function LandingNavbar({
  activeSection,
  isAuthed,
  isMobile,
  navLinks,
  navOpen,
  scrolled,
  setNavOpen,
}: {
  activeSection: string
  isAuthed: boolean
  isMobile: boolean
  navLinks: NavLink[]
  navOpen: boolean
  scrolled: boolean
  setNavOpen: (value: boolean | ((value: boolean) => boolean)) => void
}) {
  const t = useT()
  const { locale } = useLocale()
  const registerCta = t.landing.ctaPrimary
  const registerHint = locale === 'id' ? 'Tanpa kartu kredit' : 'No credit card'
  const shellStyle = isMobile
    ? {
        background: '#fffaf6',
        border: '2px solid #17120f',
        boxShadow: scrolled ? '5px 5px 0 #17120f' : '3px 3px 0 #17120f',
      }
    : {
        background: '#fffaf6',
        border: '2px solid #17120f',
        boxShadow: scrolled ? '7px 7px 0 #17120f' : '4px 4px 0 #17120f',
      }
  const mobileMenuStyle = isMobile
    ? {
        background: '#fffaf6',
        border: '2px solid #17120f',
        boxShadow: '6px 6px 0 #17120f',
      }
    : {
        background: '#fffaf6',
        border: '2px solid #17120f',
        boxShadow: '7px 7px 0 #17120f',
      }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex justify-center px-3 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto w-full max-w-6xl">
          <div
            className="flex items-center justify-between rounded-[1.35rem] px-3 py-2 sm:px-4 sm:py-2.5"
            style={shellStyle}
          >
            {/* Logo */}
            <Logo />
            <div className="ml-auto mr-2 lg:hidden">
              <LanguageSwitcher />
            </div>

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
                      'group relative cursor-pointer overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out',
                      isActive
                        ? 'bg-brand-100 text-[#17120f]'
                        : 'text-[#4f4540] hover:bg-[#fddf82] hover:text-[#17120f]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-[#17120f] transition-all duration-300 ease-out',
                        isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-75 group-hover:opacity-60',
                      )}
                      aria-hidden
                    />
                    {item.label}
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
                    className="cursor-pointer rounded-xl px-4 py-2 text-sm font-black text-[#4f4540] transition-all duration-300 hover:bg-[#fddf82] hover:text-[#17120f]"
                  >
                    {t.nav.login}
                  </Link>

                  <Link to="/register" className="cursor-pointer">
                    <PrimaryBtn className="group relative overflow-hidden px-5">
                      <span className="pointer-events-none absolute inset-y-0 -left-8 w-7 rotate-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-36" />
                      {registerCta}
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
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border-2 border-[#17120f] bg-[#fffaf6] text-[#17120f] transition-all duration-300 hover:bg-[#fddf82] sm:h-10 sm:w-10 lg:hidden"
              style={{
                boxShadow: '3px 3px 0 #17120f',
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
              style={mobileMenuStyle}
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
                        'relative flex w-full cursor-pointer items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out',
                        isActive
                          ? 'bg-brand-100 text-[#17120f]'
                          : 'text-[#4f4540] hover:bg-[#fddf82] hover:text-[#17120f]'
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          'absolute bottom-1 left-4 h-0.5 w-12 rounded-full bg-[#17120f] transition-all duration-300 ease-out',
                          isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0',
                        )}
                        aria-hidden
                      />
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
                        className="w-full cursor-pointer rounded-xl py-3 text-sm font-black text-[#4f4540] transition-all duration-300 hover:bg-[#fddf82] hover:text-[#17120f]"
                      >
                        {t.nav.login}
                      </button>
                    </Link>

                    <Link to="/register" className="cursor-pointer">
                      <PrimaryBtn className="w-full justify-center">
                        {registerCta}
                      </PrimaryBtn>
                    </Link>
                    <p className="-mt-1 text-center text-[11px] font-semibold text-slate-400">{registerHint}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
    </header>
  )
}
