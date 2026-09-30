import { useEffect, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import { AdminTop } from './AdminLayout.jsx'
import { ORDER_STATUSES, capitalize, useAdminData } from './AdminBits.jsx'
import { OrdersTable, useOrderStatus } from './Dashboard.jsx'

export default function Orders() {
  const { refreshStats } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 1)
  const [search, setSearch] = useState(q)

  useEffect(() => setSearch(q), [q])

  const orders = useAdminData('admin_orders.php', { params: { status, q, page, limit: 20 } }, params.toString())
  const { change, busyId } = useOrderStatus((fn) => orders.setData((d) => ({ ...d, orders: fn(d.orders) })), refreshStats)

  function update(changes) {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in changes)) next.delete('page')
    setParams(next, { replace: true })
  }

  const d = orders.data

  return (
    <>
      <AdminTop title="Orders" subtitle={d ? `${d.total} ${d.total === 1 ? 'order' : 'orders'}${status ? ` · ${status}` : ''}` : ' '} />

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="panel-head toolbar">
          <div className="filter-chips" role="group" aria-label="Filter by status">
            {['', ...ORDER_STATUSES].map((s) => (
              <button key={s || 'all'} type="button" className={`chip${status === s ? ' is-active' : ''}`} aria-pressed={status === s} onClick={() => update({ status: s })}>
                {s ? capitalize(s) : 'All'}
              </button>
            ))}
          </div>
          <form role="search" className="input" onSubmit={(e) => { e.preventDefault(); update({ q: search.trim() }) }}>
            <Icon name="search" size={18} stroke="#666D66" />
            <label className="sr-only" htmlFor="order-search">Search orders</label>
            <input id="order-search" type="search" placeholder="Order #, name, email, phone, city" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
        </div>

        {q && (
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 14 }}>Results for</span>
            <button type="button" className="chip chip-removable" onClick={() => update({ q: '' })} aria-label="Clear search">
              “{q}”<Icon name="close" size={14} />
            </button>
          </div>
        )}

        {orders.error && <div className="alert alert-error" style={{ margin: 20 }}>{orders.error.message}</div>}
        {!d && orders.loading && <div className="loading" style={{ padding: 48 }}>Loading orders…</div>}
        {d && d.orders.length === 0 && (
          <div className="empty" style={{ padding: '48px 20px' }}>
            <Icon name="box" size={32} stroke="#666D66" />
            <div className="muted">No orders match. {(q || status) && <button type="button" className="link" onClick={() => setParams({}, { replace: true })}>Show all orders</button>}</div>
          </div>
        )}
        {d && d.orders.length > 0 && (
          <div style={{ opacity: orders.loading ? 0.6 : 1 }}>
            <OrdersTable orders={d.orders} onStatusChange={change} busyId={busyId} />
          </div>
        )}

        {d && d.pages > 1 && (
          <div className="pager">
            <span className="muted">Page {d.page} of {d.pages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" disabled={d.page <= 1} onClick={() => update({ page: String(d.page - 1) })}>
                <Icon name="arrowLeft" size={16} />Newer
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={d.page >= d.pages} onClick={() => update({ page: String(d.page + 1) })}>
                Older<Icon name="arrowRight" size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Online payments that were started but never completed are hidden. Cancelling an order puts its copies back in stock.{' '}
        <Link to="/admin">Back to dashboard</Link>
      </p>
    </>
  )
}
