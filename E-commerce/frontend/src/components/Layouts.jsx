import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import Icon from './Icons.jsx'
import Logo from './Logo.jsx'

/** Scroll to the top on page changes, or to #hash targets when there is one. */
export function ScrollManager() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, search, hash])

  return null
}

export function StoreLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

const STEPS = ['Cart', 'Delivery & payment', 'Confirmation']

export function CheckoutHeader({ step }) {
  return (
    <header className="container checkout-header">
      <Logo />
      <ol className="steps" style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Checkout progress">
        {STEPS.map((label, i) => {
          const n = i + 1
          const state = n < step ? 'done' : n === step ? 'current' : ''
          return (
            <li key={label} style={{ display: 'contents' }}>
              {i > 0 && <span className={`step-line${n <= step ? ' done' : ''}`} />}
              <span className={`step ${state}`} aria-current={n === step ? 'step' : undefined}>
                <span className="dot">{n < step ? <Icon name="check" size={14} strokeWidth={2.6} /> : n}</span>
                <span className="step-label">{label}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <div className="secure-note">
        <Icon name="lock" size={18} />
        <span>Secure checkout</span>
      </div>
    </header>
  )
}

/** Only for signed-in customers; guests go to sign in and come back afterwards. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="loading">Loading…</div>
  if (!user) {
    return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return children
}
