import { Link, useParams } from 'react-router-dom'
import { coverUrl, rupees } from '../api.js'
import Icon from '../components/Icons.jsx'
import { CheckoutHeader } from '../components/Layouts.jsx'
import { useApi } from '../useApi.js'

export const PAYMENT_LABELS = {
  paid: ['Paid online', 'ok'],
  cod_pending: ['Cash on delivery', ''],
  pending: ['Payment pending', ''],
  failed: ['Payment failed', 'bad'],
}

export function OrderItems({ items }) {
  return items.map((item, i) => (
    <div key={i} className="mini-line">
      <div className="mini-thumb"><img className="cover" src={coverUrl(item.image)} alt="" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.book_id ? (
          <Link to={`/books/${item.book_id}`} style={{ fontWeight: 600, lineHeight: 1.3, color: 'inherit', textDecoration: 'none' }}>{item.title}</Link>
        ) : (
          <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{item.title}</div>
        )}
        <div className="muted" style={{ fontSize: 13 }}>{item.condition ? `${item.condition} · ` : ''}Qty {item.quantity}</div>
      </div>
      <div style={{ fontWeight: 600 }}>{rupees(item.line_total)}</div>
    </div>
  ))
}

export default function OrderConfirmation() {
  const { id } = useParams()
  const { data, error, loading } = useApi('orders.php', { params: { id } }, id)
  const order = data?.order

  return (
    <>
      <CheckoutHeader step={3} />
      <main className="container" style={{ paddingBottom: 96 }}>
        {loading && <div className="loading">Loading your order…</div>}
        {error && <div className="alert alert-error" style={{ marginTop: 48 }}>{error.message}</div>}

        {order && (
          <div className="narrow">
            <div className="confirm-hero">
              <div className="confirm-icon"><Icon name="check" size={36} strokeWidth={2.4} /></div>
              <div className="eyebrow muted">Order #{order.id}</div>
              <h1 className="serif page-title">Thank you, {order.name.split(' ')[0]}!</h1>
              <p className="muted" style={{ fontSize: 17, margin: 0, maxWidth: 520 }}>
                {order.payment_method === 'cod'
                  ? `Your order is confirmed. Please keep ${rupees(order.total)} ready in cash when it arrives.`
                  : 'Your payment went through and your order is confirmed.'}
              </p>
            </div>

            <div className="two-col" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
              <section className="card summary" style={{ position: 'static' }}>
                <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>Books</h2>
                <OrderItems items={order.items} />
                <div className="divider" />
                <div className="row">
                  <span>Delivery</span>
                  {order.delivery_fee === 0 ? <span className="save" style={{ fontSize: 15 }}>Free</span> : <span>{rupees(order.delivery_fee)}</span>}
                </div>
                <div className="row total"><span>Total</span><span>{rupees(order.total)}</span></div>
              </section>

              <section className="card summary" style={{ position: 'static' }}>
                <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>Delivering to</h2>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.name}</div>
                  <div className="muted" style={{ whiteSpace: 'pre-line' }}>{order.address}</div>
                  <div className="muted">{order.city} – {order.pincode}</div>
                  <div className="muted">+91 {order.phone} · {order.email}</div>
                </div>
                <div className="divider" />
                <div className="row">
                  <span>Payment</span>
                  <span className={`status ${PAYMENT_LABELS[order.payment_status]?.[1] ?? ''}`}>{PAYMENT_LABELS[order.payment_status]?.[0]}</span>
                </div>
                <div className="row">
                  <span>Status</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{order.order_status}</span>
                </div>
              </section>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
              <Link to="/shop" className="btn btn-primary">Keep browsing<Icon name="arrowRight" size={18} /></Link>
              <Link to="/account" className="btn btn-ghost">View all orders</Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
