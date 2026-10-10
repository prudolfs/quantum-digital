import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Menu, MessageSquare, X } from 'lucide-react'
import { ActionIcon } from '@/components/action-icon'

function NavigationLinks() {
  return (
    <>
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
      <Link to="/" hash="work">
        Work
      </Link>
      <Link to="/" hash="services">
        Services
      </Link>
      <Link className="nav-conversation" to="/chat">
        Let’s talk <ActionIcon icon={MessageSquare} />
      </Link>
    </>
  )
}

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export function HeaderNavigation() {
  const enhanced = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  )
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    dialog.current?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    const desktop = matchMedia('(min-width: 851px)')
    const resize = () => {
      if (desktop.matches) setOpen(false)
    }
    desktop.addEventListener('change', resize)
    return () => desktop.removeEventListener('change', resize)
  }, [])

  return (
    <>
      <nav className="desktop-navigation" aria-label="Main navigation">
        <NavigationLinks />
      </nav>
      {!enhanced ? (
        <details className="mobile-navigation-fallback">
          <summary>Menu</summary>
          <nav aria-label="Main navigation">
            <NavigationLinks />
          </nav>
        </details>
      ) : (
        <>
          <button
            ref={toggle}
            type="button"
            className="mobile-menu-toggle"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(true)}
          >
            <Menu aria-hidden="true" size={26} />
          </button>
          {createPortal(
            <dialog
              ref={dialog}
              id="mobile-navigation"
              className="mobile-menu-dialog"
              aria-label="Mobile navigation"
              onKeyDown={(event) => {
                if (event.key !== 'Tab') return
                const controls =
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled])',
                  )
                const first = controls[0]
                const last = controls[controls.length - 1]
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault()
                  last?.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault()
                  first?.focus()
                }
              }}
              onCancel={(event) => {
                event.preventDefault()
                setOpen(false)
              }}
              onClick={(event) => {
                if (
                  event.target instanceof Element &&
                  !event.target.closest('.mobile-menu-panel')
                )
                  setOpen(false)
              }}
            >
              <AnimatePresence
                onExitComplete={() => {
                  dialog.current?.close()
                  toggle.current?.focus({ preventScroll: true })
                }}
              >
                {open && (
                  <motion.div
                    key="menu"
                    className="mobile-menu-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  >
                    <motion.div
                      className="mobile-menu-panel"
                      initial={{ y: reducedMotion ? 0 : -24 }}
                      animate={{ y: 0 }}
                      exit={{ y: reducedMotion ? 0 : -24 }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.2,
                        ease: 'easeOut',
                      }}
                    >
                      <div className="mobile-menu-heading">
                        <p>Quantum Digital</p>
                        <button
                          type="button"
                          className="mobile-menu-close"
                          aria-label="Close menu"
                          onClick={() => setOpen(false)}
                        >
                          <X aria-hidden="true" size={26} />
                        </button>
                      </div>
                      <nav
                        aria-label="Main navigation"
                        onClick={(event) => {
                          if (
                            event.target instanceof Element &&
                            event.target.closest('a')
                          )
                            setOpen(false)
                        }}
                      >
                        <NavigationLinks />
                      </nav>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </dialog>,
            document.body,
          )}
        </>
      )}
    </>
  )
}
