import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

/** /verify-email?token=… — the link from the "Confirm your email" message. */
export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { refresh } = useAuth()
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    // Safe to run twice (React dev mode does): the link stays valid until it expires
    api('auth.php', { method: 'POST', body: { action: 'verify', token } })
      .then(() => refresh())
      .then(() => setState({ status: 'done' }))
      .catch((err) => setState({ status: 'error', message: err.message }))
  }, [token, refresh])

  return (
    <div className="container" style={{ paddingBlock: '64px 96px' }}>
      <div className="empty">
        {state.status === 'loading' && <div className="loading">Confirming your email…</div>}
        {state.status === 'done' && (
          <>
            <div className="serif">Your email is confirmed</div>
            <div className="muted">You’re all set to place orders.</div>
            <Link to="/shop" className="btn btn-primary">Browse the shelf</Link>
          </>
        )}
        {state.status === 'error' && (
          <>
            <div className="serif">We couldn’t confirm your email</div>
            <div className="muted">{state.message} Sign in and use “Resend email” on your account page.</div>
            <Link to="/account" className="btn btn-primary">Go to your account</Link>
          </>
        )}
      </div>
    </div>
  )
}
