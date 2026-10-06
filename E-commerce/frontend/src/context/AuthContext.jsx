import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Re-reads the signed-in customer, e.g. after a password reset or email verification
  const refresh = useCallback(
    () => api('auth.php').then((data) => setUser(data.user), () => setUser(null)),
    []
  )

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = useCallback(async (email, password, remember) => {
    const data = await api('auth.php', { method: 'POST', body: { action: 'login', email, password, remember } })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (fields) => {
    const data = await api('auth.php', { method: 'POST', body: { action: 'register', ...fields } })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api('auth.php', { method: 'POST', body: { action: 'logout' } })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
