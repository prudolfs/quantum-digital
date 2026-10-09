import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-frame">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header section-shell">
        <div className="navigation-surface">
          <Link to="/" className="brand-link" aria-label="Quantum Digital home">
            Quantum<span>Digital</span>
            <span aria-hidden="true" className="brand-dot" />
          </Link>
          <nav aria-label="Main navigation">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ 'aria-current': 'page' }}
            >
              Home
            </Link>
            <Link to="/about" activeProps={{ 'aria-current': 'page' }}>
              About
            </Link>
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="section-shell page-content"
      >
        {children}
      </main>
      <footer className="site-footer section-shell">
        <p>© {new Date().getFullYear()} Quantum Digital.</p>
        <p>Product Engineering & Applied AI</p>
      </footer>
    </div>
  )
}
