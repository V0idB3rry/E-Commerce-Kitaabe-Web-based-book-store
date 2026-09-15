import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { api } from '../api.js'
import './admin.css'

const AdminAuthContext = createContext(null)

/** Wraps every /admin route: knows which admin (if any) is signed in. */
export function AdminAuthProvider() {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('admin_auth.php')
      .then((data) => setAdmin(data.admin))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api('admin_auth.php', { method: 'POST', body: { action: 'login', email, password } })
    setAdmin(data.admin)
  }, [])

  const logout = useCallback(async () => {
    await api('admin_auth.php', { method: 'POST', body: { action: 'logout' } })
    setAdmin(null)
  }, [])

  // Any admin call answering 401 (e.g. the session expired) signs the panel out
  const expired = useCallback(() => setAdmin(null), [])

  const value = useMemo(() => ({ admin, loading, login, logout, expired }), [admin, loading, login, logout, expired])

  return (
    <AdminAuthContext.Provider value={value}>
      <Outlet />
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export function RequireAdmin({ children }) {
  const { admin, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) return <div className="loading">Loading…</div>
  if (!admin) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return children
}
