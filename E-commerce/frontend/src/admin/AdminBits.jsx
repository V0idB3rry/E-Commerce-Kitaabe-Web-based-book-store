import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useToast } from '../context/ToastContext.jsx'
import { useAdminAuth } from './AdminAuth.jsx'

export const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled']
export const SELL_STATUSES = ['new', 'contacted', 'accepted', 'rejected']

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const PAYMENT = {
  paid: ['Paid', 'pill-green'],
  cod_pending: ['COD', 'pill-blue'],
  pending: ['Unpaid', 'pill-grey'],
  failed: ['Failed', 'pill-rust'],
}

export function PaymentPill({ status }) {
  const [label, className] = PAYMENT[status] ?? [status, 'pill-grey']
  return <span className={`pill ${className}`}>{label}</span>
}

/** A <select> styled as a coloured status pill. */
export function StatusSelect({ value, options, onChange, label = 'Status', disabled }) {
  return (
    <select
      className={`status-select st-${value}`}
      value={value}
      disabled={disabled}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => <option key={o} value={o}>{capitalize(o)}</option>)}
    </select>
  )
}

/**
 * Calls the admin API; if the admin session has expired, signs the panel out
 * (RequireAdmin then sends them to the login page). Errors are shown as toasts.
 */
export function useAdminApi() {
  const { expired } = useAdminAuth()
  const toast = useToast()
  const ref = useRef({ expired, toast })
  ref.current = { expired, toast }

  return useRef(async (endpoint, options, { quiet = false } = {}) => {
    try {
      return await api(endpoint, options)
    } catch (error) {
      if (error.status === 401) ref.current.expired()
      else if (!quiet) ref.current.toast(error.message, { type: 'error' })
      throw error
    }
  }).current
}

/** Load an admin endpoint; re-runs when `key` changes. Pass `null` as the endpoint to skip. */
export function useAdminData(endpoint, options, key) {
  const call = useAdminApi()
  const [state, setState] = useState({ data: null, error: null, loading: endpoint !== null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (endpoint === null) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    call(endpoint, options, { quiet: true })
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState((s) => ({ data: s.data, error, loading: false })))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, key, version])

  return { ...state, reload: () => setVersion((v) => v + 1), setData: (fn) => setState((s) => ({ ...s, data: fn(s.data) })) }
}

export function ConfirmDialog({ title, children, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="dialog-root">
      <div className="backdrop" onClick={onCancel} />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" className="serif">{title}</h2>
        <div className="muted">{children}</div>
        <div className="actions">
          <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function relativeDays(date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
