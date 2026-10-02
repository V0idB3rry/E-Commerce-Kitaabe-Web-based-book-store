import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import Icon from '../components/Icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/** /reset-password asks for an email; /reset-password?token=… (the emailed link) asks for a new password. */
export default function PasswordReset() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { refresh } = useAuth()
  const navigate = useNavigate()

  const [value, setValue] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      if (token) {
        await api('auth.php', { method: 'POST', body: { action: 'reset', token, password: value } })
        await refresh()
        navigate('/account', { replace: true })
        return
      }
      await api('auth.php', { method: 'POST', body: { action: 'forgot', email: value } })
      setMessage({ type: 'success', text: 'If an account uses that email, we’ve sent it a reset link. It works for 1 hour.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
    setBusy(false)
  }

  return (
    <div className="container" style={{ paddingBlock: '64px 96px' }}>
      <form className="auth-form" style={{ margin: '0 auto' }} onSubmit={submit}>
        <div>
          <h1 className="serif">{token ? 'Choose a new password' : 'Forgot your password?'}</h1>
          <div className="muted" style={{ fontSize: 16, marginTop: 6 }}>
            {token ? 'You’ll be signed in once it’s saved.' : 'Enter your account’s email and we’ll send you a link to reset it.'}
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>
        )}

        <div className="field">
          <label className="label" htmlFor="reset-value">{token ? 'New password' : 'Email'}</label>
          <input
            id="reset-value"
            className="input"
            type={token ? 'password' : 'email'}
            autoComplete={token ? 'new-password' : 'email'}
            minLength={token ? 8 : undefined}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required
          />
          {token && <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>At least 8 characters.</div>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? 'Please wait…' : token ? 'Save password' : 'Email me a link'}
        </button>

        <Link to={token ? '/reset-password' : '/signin'} className="link-arrow" style={{ justifyContent: 'center', fontWeight: 500 }}>
          <Icon name="arrowLeft" size={16} />{token ? 'Ask for a new link' : 'Back to sign in'}
        </Link>
      </form>
    </div>
  )
}
