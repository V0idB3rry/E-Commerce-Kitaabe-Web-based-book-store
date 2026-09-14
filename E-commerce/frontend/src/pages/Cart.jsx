import { useState } from 'react'
import { Link } from 'react-router-dom'
import { coverUrl, percentOff, rupees } from '../api.js'
import { ConditionBadge, QtyStepper } from '../components/BookBits.jsx'
import Icon from '../components/Icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export function DeliveryMeter({ totals }) {
  const remaining = totals.free_delivery_above - totals.subtotal
  const progress = Math.min(100, (totals.subtotal / totals.free_delivery_above) * 100)

  return (
    <div className="delivery-meter" style={remaining > 0 ? { background: 'var(--sand)' } : undefined}>
      <div className="msg" style={remaining > 0 ? { color: '#6b4c0c' } : undefined}>
        <Icon name="truck" size={20} />
        {remaining > 0 ? `Add ${rupees(remaining)} more for free delivery` : 'You’ve unlocked free delivery'}
      </div>
      <div className="meter" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function CartLine({ line }) {
  const { setQuantity, remove } = useCart()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const { book, quantity } = line

  async function run(action) {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast(error.message, { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cart-line" style={{ opacity: busy ? 0.6 : 1 }}>
      <Link to={`/books/${book.id}`} className="cart-thumb">
        <img className="cover" src={coverUrl(book.image)} alt={`${book.title} cover`} />
      </Link>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div><ConditionBadge condition={book.condition} /></div>
        <Link to={`/books/${book.id}`} className="book-title">{book.title}</Link>
        <div className="muted">{book.author}</div>
        {quantity > book.stock && (
          <div className="field-error" style={{ marginTop: 0 }}>
            Only {book.stock} left — lower the quantity to check out.
          </div>
        )}
        <div className="line-actions">
          <QtyStepper
            value={quantity}
            max={Math.max(book.stock, quantity)}
            disabled={busy}
            onChange={(n) => run(() => setQuantity(book.id, n))}
          />
          <button type="button" className="remove-btn" onClick={() => run(() => remove(book.id))} disabled={busy}>
            <Icon name="trash" size={16} />Remove
          </button>
        </div>
      </div>
      <div className="line-price">
        <span className="price" style={{ fontSize: 20 }}>{rupees(book.price * quantity)}</span>
        {book.mrp && (
          <>
            <span className="mrp">{rupees(book.mrp * quantity)}</span>
            <span className="save">{percentOff(book.price, book.mrp)}% off</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function Cart() {
  const { user, loading: authLoading } = useAuth()
  const { items, totals, loading } = useCart()

  const overStock = items.some((line) => line.quantity > line.book.stock)

  if (authLoading || (loading && items.length === 0)) {
    return <div className="loading">Loading your cart…</div>
  }

  if (!user) {
    return (
      <div className="container cart-page">
        <div className="empty card narrow">
          <Icon name="bag" size={40} stroke="#666D66" />
          <div className="serif">Sign in to see your cart</div>
          <div className="muted">Your cart is saved to your account, so it’s there on any device.</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/signin?next=/cart" className="btn btn-primary">Sign in</Link>
            <Link to="/signup?next=/cart" className="btn btn-ghost">Create account</Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty card narrow">
          <Icon name="bag" size={40} stroke="#666D66" />
          <div className="serif">Your cart is empty</div>
          <div className="muted">Plenty of good books are waiting on the shelf.</div>
          <Link to="/shop" className="btn btn-primary">Browse the shelf<Icon name="arrowRight" size={18} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container cart-page">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
        <h1 className="serif page-title">Your cart</h1>
        <div className="muted" style={{ fontSize: 18 }}>{totals.count} {totals.count === 1 ? 'book' : 'books'}</div>
      </div>

      <div className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DeliveryMeter totals={totals} />
          <div className="card">
            {items.map((line) => <CartLine key={line.book.id} line={line} />)}
          </div>
          <Link to="/shop" className="link-arrow"><Icon name="arrowLeft" size={18} />Continue browsing</Link>
        </div>

        <aside className="card summary" aria-label="Order summary">
          <h2 className="serif" style={{ fontSize: 28, margin: 0 }}>Order summary</h2>
          {totals.savings > 0 && (
            <>
              <div className="row">
                <span>Cover price ({totals.count} {totals.count === 1 ? 'book' : 'books'})</span>
                <span className="mrp" style={{ fontSize: 15 }}>{rupees(totals.cover_total)}</span>
              </div>
              <div className="row">
                <span>Second-hand discount</span>
                <span className="save" style={{ fontSize: 15 }}>−{rupees(totals.savings)}</span>
              </div>
            </>
          )}
          <div className="row" style={{ fontWeight: 600 }}><span>Subtotal</span><span>{rupees(totals.subtotal)}</span></div>
          <div className="row">
            <span>Delivery</span>
            {totals.delivery_fee === 0 ? (
              <span><span className="mrp">{rupees(totals.standard_fee)}</span> <span className="save" style={{ fontSize: 15 }}>Free</span></span>
            ) : (
              <span>{rupees(totals.delivery_fee)}</span>
            )}
          </div>
          <div className="divider" />
          <div className="row total"><span>Total</span><span>{rupees(totals.total)}</span></div>
          {totals.savings > 0 && <div className="saving-note">You’re saving {rupees(totals.savings)} on this order</div>}
          {overStock ? (
            <button type="button" className="btn btn-primary btn-lg" disabled>
              <Icon name="lock" size={18} />Fix quantities to continue
            </button>
          ) : (
            <Link to="/checkout" className="btn btn-primary btn-lg"><Icon name="lock" size={18} />Proceed to checkout</Link>
          )}
          <div className="muted" style={{ fontSize: 13, textAlign: 'center' }}>UPI, cards, net banking or cash on delivery</div>
        </aside>
      </div>
    </div>
  )
}
