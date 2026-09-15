import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { coverUrl, formatDate, rupees } from '../api.js'
import Icon from '../components/Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AdminTop } from './AdminLayout.jsx'
import { ORDER_STATUSES, PaymentPill, StatusSelect, useAdminApi, useAdminData } from './AdminBits.jsx'

export default function OrderDetail() {
  const { id } = useParams()
  const { refreshStats } = useOutletContext()
  const call = useAdminApi()
  const toast = useToast()
  const { data, error, loading, setData } = useAdminData('admin_orders.php', { params: { id } }, id)
  const [busy, setBusy] = useState(false)

  async function changeStatus(status) {
    setBusy(true)
    try {
      const res = await call('admin_orders.php', { method: 'PATCH', body: { id: Number(id), order_status: status } })
      setData((d) => ({ order: { ...d.order, order_status: res.order.order_status } }))
      toast(`Order #${id} marked ${status}`)
      refreshStats()
    } catch {
      // toast shown by useAdminApi
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) return <div className="loading">Loading order…</div>
  if (error) {
    return (
      <>
        <Link to="/admin/orders" className="link-arrow"><Icon name="arrowLeft" size={16} />All orders</Link>
        <div className="alert alert-error">{error.message}</div>
      </>
    )
  }

  const o = data.order
  const subtotal = o.total - o.delivery_fee

  return (
    <>
      <Link to="/admin/orders" className="link-arrow" style={{ marginBottom: -12 }}><Icon name="arrowLeft" size={16} />All orders</Link>
      <AdminTop title={`Order #${o.id}`} subtitle={`Placed ${formatDate(o.date, true)}`}>
        <StatusSelect value={o.order_status} options={ORDER_STATUSES} onChange={changeStatus} disabled={busy} label="Order status" />
      </AdminTop>

      <div className="dash-grid">
        <section className="card" style={{ overflow: 'hidden' }}>
          <div className="panel-head"><h2 className="serif">Books</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Book</th><th className="num">Price</th><th className="num">Qty</th><th className="num">Total</th></tr></thead>
              <tbody>
                {o.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div className="cell-book">
                        <div className="cell-thumb"><img className="cover" src={coverUrl(item.image)} alt="" /></div>
                        <div>
                          {item.book_id ? <Link to={`/admin/books/${item.book_id}`} style={{ fontWeight: 600, color: 'inherit' }}>{item.title}</Link> : <div style={{ fontWeight: 600 }}>{item.title}</div>}
                          <div className="cell-sub">
                            {item.condition ?? 'Removed from catalog'}
                            {item.stock_now !== null && ` · ${item.stock_now} in stock now`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="num">{rupees(item.price)}</td>
                    <td className="num">{item.quantity}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{rupees(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary" style={{ position: 'static', borderTop: '1px solid var(--line)' }}>
            <div className="row"><span>Subtotal</span><span>{rupees(subtotal)}</span></div>
            <div className="row"><span>Delivery</span><span>{o.delivery_fee ? rupees(o.delivery_fee) : 'Free'}</span></div>
            <div className="row total"><span>Total</span><span>{rupees(o.total)}</span></div>
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="card summary" style={{ position: 'static' }}>
            <h2 className="serif" style={{ fontSize: 22, margin: 0 }}>Customer</h2>
            <div>
              <div style={{ fontWeight: 600 }}>{o.name}</div>
              <div><a href={`mailto:${o.email}`}>{o.email}</a></div>
              <div><a href={`tel:+91${o.phone}`}>+91 {o.phone}</a></div>
            </div>
            <div className="divider" />
            <h3 style={{ fontSize: 15, margin: 0 }}>Deliver to</h3>
            <div className="muted" style={{ whiteSpace: 'pre-line' }}>{o.address}</div>
            <div className="muted">{o.city} – {o.pincode}</div>
          </section>

          <section className="card summary" style={{ position: 'static' }}>
            <h2 className="serif" style={{ fontSize: 22, margin: 0 }}>Payment</h2>
            <div className="row"><span>Method</span><span>{o.payment_method === 'cod' ? 'Cash on delivery' : 'Razorpay'}</span></div>
            <div className="row"><span>Status</span><PaymentPill status={o.payment_status} /></div>
            {o.razorpay_id && <div className="row"><span>Payment ID</span><code style={{ fontSize: 13 }}>{o.razorpay_id}</code></div>}
            {o.payment_method === 'cod' && o.order_status !== 'delivered' && o.order_status !== 'cancelled' && (
              <div className="alert alert-info">Collect {rupees(o.total)} in cash on delivery.</div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
