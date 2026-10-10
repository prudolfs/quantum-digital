import { HeaderNavigation } from '@/components/header-navigation'
import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'motion/react'
import { profileLinks } from '@/content/site'

export function SiteLayout({ children }: { children: ReactNode }) {
  const isHome = useLocation({
    select: (location) => location.pathname === '/',
  })
  const { scrollY } = useScroll()
  const reducedMotion = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(false)
  useMotionValueEvent(scrollY, 'change', (position) =>
    setScrolled(position > 0),
  )
  useEffect(() => {
    const frame = requestAnimationFrame(() => setScrolled(window.scrollY > 0))
    return () => cancelAnimationFrame(frame)
  }, [])
  const showHeaderBackground = scrolled || hovered
  return (
    <div className={`site-frame${isHome ? ' site-frame--home' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header section-shell">
        <motion.div
          className="navigation-surface"
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
        >
          <motion.div
            className="navigation-background"
            aria-hidden="true"
            initial={false}
            animate={{ opacity: showHeaderBackground ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
          />
          <Link to="/" className="brand-link" aria-label="Quantum Digital home">
            <img src="/hero/q-symbol.svg" width="24" height="24" alt="" />
            Quantum<span>Digital</span>
          </Link>
          <HeaderNavigation />
        </motion.div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className={
          isHome
            ? 'page-content page-content--home'
            : 'section-shell page-content'
        }
      >
        {children}
      </main>
      <footer className="site-footer">
        <div className="footer-content section-shell">
          <p>© {new Date().getFullYear()} Quantum Digital.</p>
          <p className="footer-description">Product Engineering & Applied AI</p>
          <div className="footer-links">
            {profileLinks.map((profile) => (
              <a key={profile.url} href={profile.url}>
                {profile.label}
              </a>
            ))}
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
