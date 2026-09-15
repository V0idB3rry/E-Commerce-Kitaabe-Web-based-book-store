import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import Logo from '../components/Logo.jsx'
import { useAdminAuth } from './AdminAuth.jsx'
import { useAdminData } from './AdminBits.jsx'

const NAV = [
  ['/admin', 'Dashboard', 'grid', true],
  ['/admin/books', 'Books', 'book'],
  ['/admin/orders', 'Orders', 'box'],
  ['/admin/categories', 'Categories', 'filter'],
  ['/admin/sell-requests', 'Sell requests', 'upload'],
]

/** Page heading row used by every admin page: title, optional subtitle, search and actions. */
export function AdminTop({ title, subtitle, children }) {
  const { admin } = useAdminAuth()
  return (
    <div className="admin-top">
      <div>
        <h1 className="serif">{title}</h1>
        {subtitle && <div className="muted">{subtitle}</div>}
      </div>
      <div className="admin-top-actions">
        {children}
        <span className="admin-avatar" title={`${admin.name} · ${admin.email}`}>{admin.name.trim().charAt(0).toUpperCase()}</span>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const stats = useAdminData('admin_stats.php', undefined, pathname)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    document.title = 'Admin · Second Shelf'
  }, [pathname])

  async function signOut() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const newRequests = stats.data?.new_sell_requests ?? 0

  return (
    <div className="admin">
      <div className="admin-mobile-bar">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="admin-sidebar">
          <Icon name="menu" size={24} />
        </button>
        <Logo onDark size={28} />
      </div>

      {open && <div className="admin-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside id="admin-sidebar" className={`admin-sidebar${open ? ' open' : ''}`} aria-label="Admin">
        <div className="admin-brand">
          <Logo onDark size={30} />
          <span className="tag">Admin</span>
        </div>
        <div className="admin-nav-label">Manage</div>
        <nav className="admin-nav">
          {NAV.map(([to, label, icon, end]) => (
            <NavLink key={to} to={to} end={end}>
              <Icon name={icon} size={20} />{label}
              {to === '/admin/sell-requests' && newRequests > 0 && <span className="nav-count" aria-label={`${newRequests} new`}>{newRequests}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin-nav admin-sidebar-foot">
          <div className="admin-nav-label" style={{ paddingTop: 4 }}>{admin.name}</div>
          <Link to="/"><Icon name="home" size={20} />View store</Link>
          <button type="button" onClick={signOut}><Icon name="logout" size={20} />Log out</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet context={{ refreshStats: stats.reload }} />
      </main>
    </div>
  )
}
