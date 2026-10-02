import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { coverUrl } from '../api.js'
import Icon from '../components/Icons.jsx'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const COVERS = [
  ['wings of fire.jpg', 'Wings of Fire'],
  ['pom.jpg', 'The Psychology of Money'],
  ['zero to one.jpg', 'Zero to One'],
]

/** Only allow in-app paths as redirect targets. */
function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export default function SignIn({ mode }) {
  const { user, loading, login, register } = useAuth()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const isSignup = mode === 'signup'

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setError(null)
    document.title = `${isSignup ? 'Create account' : 'Sign in'} · Second Shelf`
  }, [isSignup])

  if (!loading && user && !busy) return <Navigate to={next} replace />

  function onChange(event) {
    const { name, value, type, checked } = event.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignup) await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      else await login(form.email, form.password, form.remember)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const query = params.toString() ? `?${params}` : ''

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="dots" />
        <div><Logo onDark /></div>
        <div className="auth-copy">
          <div className="display">Old books,<br /><span>new beginnings</span></div>
          <p>Sign in to track your orders, keep your cart on any device and check out faster.</p>
        </div>
        <div className="auth-covers">
          {COVERS.map(([image, title]) => <img key={image} src={coverUrl(image)} alt={`${title} cover`} />)}
        </div>
      </div>

      <div className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mobile-logo"><Logo /></div>

          <nav className="tabs" aria-label="Account">
            <Link to={`/signin${query}`} className={isSignup ? '' : 'active'} aria-current={isSignup ? undefined : 'page'}>Sign in</Link>
            <Link to={`/signup${query}`} className={isSignup ? 'active' : ''} aria-current={isSignup ? 'page' : undefined}>Create account</Link>
          </nav>

          <div>
            <h1 className="serif">{isSignup ? 'Join the shelf' : 'Welcome back'}</h1>
            <div className="muted" style={{ fontSize: 16, marginTop: 6 }}>
              {isSignup ? 'Create an account to buy books and track your orders.' : 'Good to see you on the shelf again.'}
            </div>
          </div>

          {location.state?.reason && !error && <div className="alert alert-info">{location.state.reason}</div>}
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          {isSignup && (
            <div className="field">
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" className="input" autoComplete="name" value={form.name} onChange={onChange} required />
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
          </div>

          {isSignup && (
            <div className="field">
              <label className="label" htmlFor="phone">Phone number <span className="muted" style={{ fontWeight: 500 }}>(optional)</span></label>
              <div className="input">
                <span className="input-prefix">+91</span>
                <input id="phone" name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={form.phone} onChange={onChange} />
              </div>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <div className="input">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={isSignup ? 8 : undefined}
                value={form.password}
                onChange={onChange}
                required
              />
              <button type="button" className="icon-btn" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
              </button>
            </div>
            {isSignup && <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>At least 8 characters.</div>}
          </div>

          {!isSignup && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label className="checkbox">
                <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
                <span className="box"><Icon name="check" size={14} strokeWidth={2.6} /></span>
                <span className="text">Keep me signed in</span>
              </label>
              <Link to="/reset-password" style={{ fontWeight: 700, fontSize: 14 }}>Forgot password?</Link>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          <div className="muted" style={{ textAlign: 'center' }}>
            {isSignup ? (
              <>Already have an account? <Link to={`/signin${query}`} style={{ fontWeight: 700 }}>Sign in</Link></>
            ) : (
              <>New to Second Shelf? <Link to={`/signup${query}`} style={{ fontWeight: 700 }}>Create an account</Link></>
            )}
          </div>
          <Link to="/" className="link-arrow" style={{ justifyContent: 'center', fontWeight: 500 }}>
            <Icon name="arrowLeft" size={16} />Back to the shop
          </Link>
        </form>
      </div>
    </div>
  )
}
