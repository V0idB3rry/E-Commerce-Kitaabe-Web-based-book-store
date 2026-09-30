import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import Logo from '../components/Logo.jsx'
import { useAdminAuth } from './AdminAuth.jsx'

export default function AdminLogin() {
  const { admin, loading, login } = useAdminAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = params.get('next')?.startsWith('/admin') ? params.get('next') : '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Admin sign in · Second Shelf'
  }, [])

  if (!loading && admin && !busy) return <Navigate to={next} replace />

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="dots" />
      <form className="card admin-login-card" onSubmit={submit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size={30} />
          <span className="pill pill-amber">Admin</span>
        </div>
        <div>
          <h1 className="serif">Sign in to manage the shelf</h1>
          <div className="muted" style={{ marginTop: 6 }}>Books, orders and sell requests.</div>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="field">
          <label className="label" htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" className="input" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="admin-password">Password</label>
          <div className="input">
            <input id="admin-password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          <Icon name="lock" size={18} />{busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="muted" style={{ fontSize: 13 }}>
          No admin account yet? Create one on the computer running XAMPP:
          <code style={{ display: 'block', marginTop: 6, padding: '8px 10px', borderRadius: 6, background: 'var(--shelf)', color: 'var(--ink)', fontSize: 12, overflowWrap: 'anywhere' }}>
            C:\xampp\php\php.exe E-commerce\database\create_admin.php
          </code>
        </div>
        <Link to="/" className="link-arrow" style={{ justifyContent: 'center', fontWeight: 500 }}>
          <Icon name="arrowLeft" size={16} />Back to the store
        </Link>
      </form>
    </div>
  )
}
