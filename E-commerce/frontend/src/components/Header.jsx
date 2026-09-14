import { useCallback, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import Icon from './Icons.jsx'
import Logo from './Logo.jsx'
import MobileMenu from './MobileMenu.jsx'
import SearchBox from './SearchBox.jsx'

export default function Header() {
  const { user } = useAuth()
  const { totals } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <div className="topbar">
        <div>
          <Icon name="truck" size={16} stroke="#F4B942" />
          Free delivery on orders above ₹499
        </div>
        <div className="topbar-cod">
          <Icon name="cash" size={16} stroke="#F4B942" />
          Cash on delivery available
        </div>
      </div>

      <header className="site-header">
        <div className="container header-row">
          <Logo />
          <SearchBox placeholder="Search by title, author or category" />

          <nav className="nav" aria-label="Main">
            <NavLink to="/shop" className="desktop-link">Shop</NavLink>
            <NavLink to="/categories" className="desktop-link">Categories</NavLink>
            <NavLink to="/sell" className="desktop-link">Sell your books</NavLink>
            <span className="sep" />
            <NavLink to={user ? '/account' : '/signin'} className="nav-account" aria-label={user ? 'Your account' : 'Sign in'}>
              <Icon name="user" size={22} />
              <span className="nav-text">{user ? user.name.split(' ')[0] : 'Account'}</span>
            </NavLink>
            <NavLink to="/cart" aria-label={`Cart, ${totals.count} items`}>
              <Icon name="bag" size={22} />
              <span className="nav-text">Cart</span>
              {totals.count > 0 && <span className="count-badge">{totals.count}</span>}
            </NavLink>
            <button
              ref={menuButtonRef}
              type="button"
              className="menu-btn"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" size={24} />
            </button>
          </nav>
        </div>

        <div className="container mobile-search mobile-only">
          <SearchBox placeholder="Search books or authors" />
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} returnFocusRef={menuButtonRef} />
    </>
  )
}
