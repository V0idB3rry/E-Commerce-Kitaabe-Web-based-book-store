import { useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { formatDate } from '../api.js'
import Icon from '../components/Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AdminTop } from './AdminLayout.jsx'
import { SELL_STATUSES, StatusSelect, capitalize, useAdminApi, useAdminData } from './AdminBits.jsx'

export default function SellRequests() {
  const { refreshStats } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const call = useAdminApi()
  const toast = useToast()
  const { data, error, loading, setData, reload } = useAdminData('admin_sell_requests.php', { params: { status } }, status)
  const [busyId, setBusyId] = useState(null)

  async function change(request, next) {
    setBusyId(request.id)
    try {
      await call('admin_sell_requests.php', { method: 'PATCH', body: { id: request.id, status: next } })
      toast(`${request.name}’s request marked ${next}`)
      setData((d) => ({ ...d, requests: d.requests.map((r) => (r.id === request.id ? { ...r, status: next } : r)) }))
      reload()
      refreshStats()
    } catch {
      // toast shown
    } finally {
      setBusyId(null)
    }
  }

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0

  return (
    <>
      <AdminTop title="Sell requests" subtitle="People who want to sell you their books" />

      <div className="filter-chips" role="group" aria-label="Filter by status">
        {['', ...SELL_STATUSES].map((s) => (
          <button key={s || 'all'} type="button" className={`chip${status === s ? ' is-active' : ''}`} aria-pressed={status === s}
            onClick={() => setParams(s ? { status: s } : {}, { replace: true })}>
            {s ? capitalize(s) : 'All'} <span className="n">{data ? (s ? data.counts[s] : total) : ''}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error.message}</div>}
      {loading && !data && <div className="loading">Loading…</div>}
      {data?.requests.length === 0 && (
        <div className="card empty">
          <Icon name="upload" size={32} stroke="#666D66" />
          <div className="muted">{status ? `No ${status} requests.` : 'No sell requests yet. They come from the “Sell your books” page.'}</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {data?.requests.map((r) => (
          <article key={r.id} className="card order-card">
            <div className="order-head">
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{r.name} <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}>· {r.city}</span></div>
                <div className="cell-sub">
                  {formatDate(r.date, true)} · <a href={`mailto:${r.email}`}>{r.email}</a> · <a href={`tel:+91${r.phone}`}>+91 {r.phone}</a>
                </div>
              </div>
              <StatusSelect value={r.status} options={SELL_STATUSES} onChange={(s) => change(r, s)} disabled={busyId === r.id} label={`Status of ${r.name}’s request`} />
            </div>
            <div>
              <div className="label">{r.book_count} {r.book_count === 1 ? 'book' : 'books'}</div>
              <div style={{ whiteSpace: 'pre-line', padding: '10px 12px', borderRadius: 6, background: 'var(--paper)' }}>{r.books}</div>
            </div>
            {r.notes && <div className="muted" style={{ whiteSpace: 'pre-line' }}><strong style={{ color: 'var(--ink)' }}>Notes:</strong> {r.notes}</div>}
          </article>
        ))}
      </div>
    </>
  )
}
