import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, coverUrl, rupees } from '../api.js'
import Icon from '../components/Icons.jsx'
import { CheckoutHeader } from '../components/Layouts.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

const ADDRESS_KEY = 'second-shelf:address'

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Couldn’t load Razorpay. Check your internet connection.'))
    document.body.appendChild(script)
  })
}

function savedAddress() {
  try {
    return JSON.parse(localStorage.getItem(ADDRESS_KEY)) ?? {}
  } catch {
    return {}
  }
}

function Field({ label, name, form, errors, onChange, span, prefix, ...inputProps }) {
  const Tag = inputProps.rows ? 'textarea' : 'input'
  const id = `checkout-${name}`
  const control = (
    <Tag
      id={id}
      name={name}
      value={form[name]}
      onChange={onChange}
      aria-invalid={errors[name] ? true : undefined}
      aria-describedby={errors[name] ? `${id}-error` : undefined}
      className={prefix ? undefined : `input${errors[name] ? ' has-error' : ''}`}
      {...inputProps}
    />
  )

  return (
    <div className={`field${span ? ' span-2' : ''}`}>
      <label className="label" htmlFor={id}>{label}</label>
      {prefix ? (
        <div className={`input${errors[name] ? ' has-error' : ''}`}>
          <span className="input-prefix">{prefix}</span>
          {control}
        </div>
      ) : control}
      {errors[name] && <div id={`${id}-error`} className="field-error">{errors[name]}</div>}
    </div>
  )
}

export default function Checkout() {
  const { user } = useAuth()
  const { items, totals, loading, refresh } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState(() => {
    const saved = savedAddress()
    return {
      name: user.name ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      address: saved.address ?? '',
      city: saved.city ?? '',
      pincode: saved.pincode ?? '',
    }
  })
  const [method, setMethod] = useState('razorpay')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState(null)

  if (loading && items.length === 0) return <div className="loading">Loading…</div>
  if (items.length === 0 && !placing && !placedOrderId) return <Navigate to="/cart" replace />

  function onChange(event) {
    const { name, value } = event.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  async function finish(orderId) {
    setPlacedOrderId(orderId)
    await refresh().catch(() => {})
    navigate(`/orders/${orderId}`, { replace: true })
  }

  async function payOnline(order) {
    await loadRazorpay()
    return new Promise((resolve) => {
      const rzp = new window.Razorpay({
        ...order.razorpay,
        description: `Order #${order.order_id}`,
        theme: { color: '#2F4538' },
        handler: async (response) => {
          try {
            await api('verify_payment.php', { method: 'POST', body: { order_id: order.order_id, ...response } })
            await finish(order.order_id)
          } catch (error) {
            setMessage({ type: 'error', text: error.message })
          }
          resolve()
        },
        modal: {
          ondismiss: () => {
            setMessage({ type: 'info', text: 'Payment cancelled. Your cart is still saved — try again whenever you’re ready.' })
            resolve()
          },
        },
      })
      rzp.on('payment.failed', (response) => {
        setMessage({ type: 'error', text: `Payment failed: ${response.error.description}` })
      })
      rzp.open()
    })
  }

  async function submit(event) {
    event.preventDefault()
    setMessage(null)
    setErrors({})
    setPlacing(true)

    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify({ address: form.address, city: form.city, pincode: form.pincode }))
    } catch {
      // Saving the address for next time is only a convenience
    }

    try {
      const order = await api('orders.php', { method: 'POST', body: { ...form, payment_method: method } })
      if (order.payment_method === 'cod') await finish(order.order_id)
      else await payOnline(order)
    } catch (error) {
      setErrors(error.fields ?? {})
      setMessage({ type: 'error', text: error.message })
      if (error.status === 409) refresh().catch(() => {})
    } finally {
      setPlacing(false)
    }
  }

  const fieldProps = { form, errors, onChange }

  return (
    <>
      <CheckoutHeader step={2} />
      <form className="container checkout-page" onSubmit={submit} noValidate>
        <div className="two-col wide-aside">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            <section className="card form-card">
              <h2 className="serif">Delivery details</h2>
              <div className="form-grid">
                <Field label="Full name" name="name" autoComplete="name" required {...fieldProps} />
                <Field label="Phone number" name="phone" prefix="+91" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} required {...fieldProps} />
                <Field label="Email" name="email" type="email" autoComplete="email" span required {...fieldProps} />
                <Field label="Address" name="address" rows={3} autoComplete="street-address" span placeholder="Flat, building, street, area" required {...fieldProps} />
                <Field label="City" name="city" autoComplete="address-level2" required {...fieldProps} />
                <Field label="Pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} required {...fieldProps} />
              </div>
            </section>

            <section className="card form-card">
              <h2 className="serif">Payment method</h2>
              <div className="pay-options" role="radiogroup">
                <label className="pay-option">
                  <input type="radio" name="method" value="razorpay" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
                  <div style={{ flex: 1 }}>
                    <div className="title"><Icon name="card" size={20} />Pay online</div>
                    <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>UPI, credit & debit cards, net banking and wallets</div>
                    <div className="chip-row" style={{ marginTop: 12 }}>
                      {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net banking'].map((m) => (
                        <span key={m} className="chip" style={{ height: 28, fontSize: 12, fontWeight: 600 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                </label>
                <label className="pay-option">
                  <input type="radio" name="method" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                  <div style={{ flex: 1 }}>
                    <div className="title"><Icon name="cash" size={20} />Cash on delivery</div>
                    <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>Pay in cash when your books arrive</div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="card summary" aria-label="Your order">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="serif" style={{ fontSize: 26, margin: 0 }}>Your order</h2>
              <Link to="/cart" style={{ fontSize: 14, fontWeight: 600 }}>Edit cart</Link>
            </div>
            {items.map(({ book, quantity }) => (
              <div key={book.id} className="mini-line">
                <div className="mini-thumb"><img className="cover" src={coverUrl(book.image)} alt="" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{book.title}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{book.condition} · Qty {quantity}</div>
                </div>
                <div style={{ fontWeight: 600 }}>{rupees(book.price * quantity)}</div>
              </div>
            ))}
            <div className="divider" />
            <div className="row"><span>Subtotal</span><span>{rupees(totals.subtotal)}</span></div>
            <div className="row">
              <span>Delivery</span>
              {totals.delivery_fee === 0
                ? <span className="save" style={{ fontSize: 15 }}>Free</span>
                : <span>{rupees(totals.delivery_fee)}</span>}
            </div>
            {totals.savings > 0 && (
              <div className="row"><span>You save</span><span className="save" style={{ fontSize: 15 }}>{rupees(totals.savings)}</span></div>
            )}
            <div className="divider" />
            <div className="row total"><span>Total</span><span>{rupees(totals.total)}</span></div>

            {message && (
              <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-info'}`} role="alert">{message.text}</div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={placing}>
              <Icon name="lock" size={18} />
              {placing ? 'Please wait…' : method === 'cod' ? `Place order · ${rupees(totals.total)}` : `Pay ${rupees(totals.total)}`}
            </button>
            <div className="muted" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
              <Icon name="shield" size={16} />
              {method === 'cod'
                ? 'Keep the exact amount ready when your books arrive.'
                : 'Payments are processed securely by Razorpay. We never see or store your card details.'}
            </div>
          </aside>
        </div>
      </form>
    </>
  )
}
