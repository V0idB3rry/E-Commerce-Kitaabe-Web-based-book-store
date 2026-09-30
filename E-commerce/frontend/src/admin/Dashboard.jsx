import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { coverUrl, formatDate, parseDate, rupees } from '../api.js'
import Icon from '../components/Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AdminTop } from './AdminLayout.jsx'
import AdminSearch from './AdminSearch.jsx'
import { ORDER_STATUSES, PaymentPill, StatusSelect, capitalize, relativeDays, useAdminApi, useAdminData } from './AdminBits.jsx'

const FILTERS = ['', 'processing', 'shipped', 'delivered']

export function OrdersTable({ orders, onStatusChange, busyId }) {
  const navigate = useNavigate()
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Order</th><th>Customer</th><th>Placed</th><th className="num">Items</th>
            <th className="num">Total</th><th>Payment</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="clickable" onClick={() => navigate(`/admin/orders/${o.id}`)}>
              <td><Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>#{o.id}</Link></td>
              <td><div style={{ fontWeight: 600 }}>{o.name}</div><div className="cell-sub">{o.city}</div></td>
              <td style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{formatDate(o.date, true)}</td>
              <td className="num">{o.item_count}</td>
              <td className="num" style={{ fontWeight: 600 }}>{rupees(o.total)}</td>
              <td><PaymentPill status={o.payment_status} /></td>
              <td>
                <StatusSelect
                  value={o.order_status}
                  options={ORDER_STATUSES}
                  label={`Status of order ${o.id}`}
                  disabled={busyId === o.id}
                  onChange={(status) => onStatusChange(o, status)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Shared status-change handler: updates the row in place and confirms with a toast. */
export function useOrderStatus(setOrders, after) {
  const call = useAdminApi()
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)

  async function change(order, status) {
    setBusyId(order.id)
    try {
      const data = await call('admin_orders.php', { method: 'PATCH', body: { id: order.id, order_status: status } })
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, order_status: data.order.order_status } : o)))
      toast(`Order #${order.id} marked ${status}${status === 'cancelled' ? ' — copies returned to stock' : ''}`)
      after?.()
    } catch {
      // toast already shown
    } finally {
      setBusyId(null)
    }
  }

  return { change, busyId }
}

export default function Dashboard() {
  const { refreshStats } = useOutletContext()
  const [filter, setFilter] = useState('')
  const stats = useAdminData('admin_stats.php')
  const orders = useAdminData('admin_orders.php', { params: { limit: 6, status: filter } }, filter)
  const { change, busyId } = useOrderStatus(
    (fn) => orders.setData((d) => ({ ...d, orders: fn(d.orders) })),
    () => { stats.reload(); refreshStats() }
  )

  const s = stats.data
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <AdminTop title="Dashboard" subtitle={today}>
        <AdminSearch />
        <Link to="/admin/books/new" className="btn btn-primary" style={{ height: 44 }}>
          <Icon name="plus" size={18} /><span className="btn-text">Add book</span>
        </Link>
      </AdminTop>

      {stats.error && <div className="alert alert-error">{stats.error.message}</div>}

      <div className="stat-grid">
        <div className="card stat">
          <div className="stat-label">Revenue this month</div>
          <div className="stat-value">{s ? rupees(s.revenue_this_month) : '—'}</div>
          <div className="stat-note">From paid and delivered COD orders</div>
        </div>
        <Link to="/admin/orders" className="card stat">
          <div className="stat-label">Orders this month</div>
          <div className="stat-value">{s ? s.orders_this_month : '—'}</div>
          <div className="stat-note">{s ? `${s.orders_today} placed today` : ' '}</div>
        </Link>
        <Link to="/admin/orders?status=processing" className={`card stat${s?.waiting_to_ship ? ' warn' : ''}`}>
          <div className="stat-label">Waiting to ship</div>
          <div className="stat-value">{s ? s.waiting_to_ship : '—'}</div>
          <div className="stat-note">
            {s?.oldest_waiting ? `Oldest placed ${relativeDays(parseDate(s.oldest_waiting))}` : 'Nothing waiting'}
          </div>
        </Link>
        <Link to="/admin/books?stock=low" className={`card stat${s?.low_stock_count ? ' warn' : ''}`}>
          <div className="stat-label">Low on stock</div>
          <div className="stat-value">{s ? s.low_stock_count : '—'}</div>
          <div className="stat-note">Books with {s?.low_stock_limit ?? 4} or fewer copies</div>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="card" style={{ overflow: 'hidden' }}>
          <div className="panel-head">
            <h2 className="serif">Recent orders</h2>
            <div className="filter-chips" role="group" aria-label="Filter orders">
              {FILTERS.map((f) => (
                <button key={f || 'all'} type="button" className={`chip${filter === f ? ' is-active' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f ? capitalize(f) : 'All'}
                </button>
              ))}
            </div>
          </div>
          {orders.data?.orders.length === 0 ? (
            <div className="empty" style={{ padding: '40px 20px' }}>
              <Icon name="box" size={32} stroke="#666D66" />
              <div className="muted">{filter ? `No ${filter} orders.` : 'No orders yet. They’ll show up here as soon as someone checks out.'}</div>
            </div>
          ) : orders.data ? (
            <OrdersTable orders={orders.data.orders} onStatusChange={change} busyId={busyId} />
          ) : (
            <div className="loading" style={{ padding: 40 }}>Loading orders…</div>
          )}
          <div className="panel-foot"><Link to="/admin/orders" className="link-arrow">View all orders<Icon name="arrowRight" size={16} /></Link></div>
        </section>

        <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>Low on stock</h2>
            <Link to="/admin/books?stock=low" style={{ fontSize: 14, fontWeight: 600 }}>All books</Link>
          </div>
          {s?.low_stock.length === 0 && <div className="muted" style={{ padding: '12px 0' }}>Every book has plenty of copies.</div>}
          {s?.low_stock.map((b) => (
            <div key={b.id} className="low-item">
              <div className="thumb"><img className="cover" src={coverUrl(b.image)} alt="" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{b.title}</div>
                <div className="left-count">{b.stock === 0 ? 'Sold out' : `${b.stock} left`}</div>
              </div>
              <Link to={`/admin/books/${b.id}`} className="btn btn-ghost btn-sm" style={{ height: 32 }}>Restock</Link>
            </div>
          ))}
          {s?.new_sell_requests > 0 && (
            <Link to="/admin/sell-requests?status=new" className="alert alert-info" style={{ marginTop: 12, textDecoration: 'none' }}>
              {s.new_sell_requests} new sell {s.new_sell_requests === 1 ? 'request' : 'requests'} waiting →
            </Link>
          )}
        </section>
      </div>
    </>
  )
}
