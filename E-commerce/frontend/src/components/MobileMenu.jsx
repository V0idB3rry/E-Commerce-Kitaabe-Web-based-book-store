import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useApi } from '../useApi.js'
import Icon from './Icons.jsx'
import Logo from './Logo.jsx'

/** Slide-in navigation drawer for tablet and phone widths. */
export default function MobileMenu({ open, onClose, returnFocusRef }) {
  const { user, logout } = useAuth()
  const { totals } = useCart()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const categories = useApi(open ? 'categories.php' : null, undefined, open)

  // Close after navigating somewhere
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search])

  useEffect(() => {
    if (!open) return

    const returnTo = returnFocusRef.current
    closeRef.current?.focus()
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbar}px`

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      // Keep keyboard focus inside the drawer while it is open
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll('a[href], button:not([disabled])')
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      returnTo?.focus()
    }
  }, [open, onClose, returnFocusRef])

  if (!open) return null

  async function signOut() {
    await logout()
    onClose()
    navigate('/')
  }

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        id="mobile-menu"
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onClick={(event) => {
          // Also close when a link to the page you're already on is tapped
          if (event.target.closest('a')) onClose()
        }}
      >
        <div className="drawer-head">
          <Logo size={30} />
          <button ref={closeRef} type="button" className="drawer-close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="drawer-body">
          {user ? (
            <Link to="/account" className="drawer-user">
              <span className="drawer-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
              <span style={{ minWidth: 0 }}>
                <span className="drawer-user-name">Hi, {user.name.split(' ')[0]}</span>
                <span className="muted drawer-user-email">{user.email}</span>
              </span>
              <Icon name="chevronRight" size={18} style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </Link>
          ) : (
            <div className="drawer-auth">
              <div className="muted" style={{ fontSize: 14 }}>Sign in to see your cart and orders.</div>
              <div className="drawer-auth-buttons">
                <Link to="/signin" className="btn btn-primary">Sign in</Link>
                <Link to="/signup" className="btn btn-ghost">Create account</Link>
              </div>
            </div>
          )}

          <nav aria-label="Menu">
            <ul className="drawer-links">
              <li><NavLink to="/" end><Icon name="home" size={20} />Home</NavLink></li>
              <li><NavLink to="/shop"><Icon name="book" size={20} />Shop all books</NavLink></li>
              <li>
                <NavLink to="/cart">
                  <Icon name="bag" size={20} />Your cart
                  {totals.count > 0 && <span className="count-badge" style={{ marginLeft: 'auto' }}>{totals.count}</span>}
                </NavLink>
              </li>
              {user && <li><NavLink to="/account"><Icon name="box" size={20} />Your orders</NavLink></li>}
              <li><NavLink to="/sell"><Icon name="upload" size={20} />Sell your books</NavLink></li>
            </ul>
          </nav>

          <div className="drawer-section">
            <div className="drawer-section-head">
              <span className="eyebrow muted">Shelves</span>
              <Link to="/categories" className="link-arrow" style={{ fontSize: 14 }}>All<Icon name="arrowRight" size={16} /></Link>
            </div>
            <div className="drawer-chips">
              {categories.data?.categories.map((cat) => (
                <Link key={cat.name} to={`/shop?category=${encodeURIComponent(cat.name)}`} className="chip">
                  {cat.name}<span className="muted">{cat.count}</span>
                </Link>
              ))}
              {categories.loading && <span className="muted" style={{ fontSize: 14 }}>Loading…</span>}
            </div>
          </div>

          <ul className="drawer-links drawer-links-quiet">
            <li><Link to="/#condition-guide"><Icon name="shield" size={20} />How we grade books</Link></li>
            {user && (
              <li>
                <button type="button" onClick={signOut}><Icon name="logout" size={20} />Sign out</button>
              </li>
            )}
          </ul>
        </div>

        <div className="drawer-foot">
          <div><Icon name="truck" size={16} stroke="#F4B942" />Free delivery above ₹499</div>
          <div><Icon name="cash" size={16} stroke="#F4B942" />Cash on delivery available</div>
        </div>
      </aside>
    </div>
  )
}
