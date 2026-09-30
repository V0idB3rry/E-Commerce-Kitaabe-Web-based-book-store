import { Link, useNavigate } from 'react-router-dom'
import { rupees } from '../api.js'
import Icon from '../components/Icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useApi } from '../useApi.js'
import { OrderItems, PAYMENT_LABELS } from './OrderConfirmation.jsx'

function formatDate(value) {
  return new Date(value.replace(' ', 'T')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data, error, loading } = useApi('orders.php')

  async function signOut() {
    await logout()
    navigate('/')
  }

  return (
    <div className="container" style={{ paddingBlock: '44px 96px' }}>
      <div className="narrow" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="serif page-title">Hi, {user.name.split(' ')[0]}</h1>
            <div className="muted" style={{ marginTop: 6 }}>{user.email}{user.phone ? ` · +91 ${user.phone}` : ''}</div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={signOut}><Icon name="logout" size={18} />Sign out</button>
        </div>

        <h2 className="serif" style={{ fontSize: 30, margin: 0 }}>Your orders</h2>

        {loading && <div className="loading" style={{ padding: 32 }}>Loading orders…</div>}
        {error && <div className="alert alert-error">{error.message}</div>}

        {data && data.orders.length === 0 && (
          <div className="empty card">
            <Icon name="book" size={36} stroke="#666D66" />
            <div className="serif">No orders yet</div>
            <div className="muted">When you buy a book, you’ll be able to track it here.</div>
            <Link to="/shop" className="btn btn-primary">Browse the shelf</Link>
          </div>
        )}

        {data?.orders.map((order) => (
          <article key={order.id} className="card order-card">
            <div className="order-head">
              <div>
                <Link to={`/orders/${order.id}`} style={{ fontWeight: 700, fontSize: 17 }}>Order #{order.id}</Link>
                <div className="muted" style={{ fontSize: 14 }}>
                  Placed {formatDate(order.date)} · {order.city}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`status ${PAYMENT_LABELS[order.payment_status]?.[1] ?? ''}`}>{PAYMENT_LABELS[order.payment_status]?.[0]}</span>
                <span className={`status ${order.order_status === 'delivered' ? 'ok' : order.order_status === 'cancelled' ? 'bad' : ''}`} style={{ textTransform: 'capitalize' }}>
                  {order.order_status}
                </span>
              </div>
            </div>
            <OrderItems items={order.items} />
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span><span>{rupees(order.total)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
