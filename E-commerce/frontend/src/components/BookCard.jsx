import { useState } from 'react'
import { Link } from 'react-router-dom'
import { coverUrl } from '../api.js'
import { useAddToCart, useCart } from '../context/CartContext.jsx'
import { ConditionBadge, PriceLine } from './BookBits.jsx'
import Icon from './Icons.jsx'

export default function BookCard({ book }) {
  const addToCart = useAddToCart()
  const { items } = useCart()
  const [busy, setBusy] = useState(false)

  const inCart = items.find((line) => line.book.id === book.id)?.quantity ?? 0
  const soldOut = book.stock === 0
  const allInCart = !soldOut && inCart >= book.stock

  async function handleAdd() {
    setBusy(true)
    await addToCart(book)
    setBusy(false)
  }

  return (
    <article className="book">
      <Link to={`/books/${book.id}`} className="book-link">
        <div className={`shelf${soldOut ? ' is-out' : ''}`}>
          <img className="cover" src={coverUrl(book.image)} alt={`${book.title} cover`} loading="lazy" />
          {soldOut && <span className="badge b-out out-label">Sold out</span>}
        </div>
        <div className="book-info">
          <div><ConditionBadge condition={book.condition} /></div>
          <div className="book-title">{book.title}</div>
          <div className="muted" style={{ fontSize: 14 }}>{book.author}</div>
          <PriceLine price={book.price} mrp={book.mrp} />
        </div>
      </Link>

      {soldOut ? (
        <button type="button" className="btn btn-ghost btn-sm" disabled>Sold out</button>
      ) : allInCart ? (
        <Link to="/cart" className="btn btn-sm btn-added">
          <Icon name="check" size={16} />In your cart
        </Link>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleAdd} disabled={busy}>
          <Icon name="plus" size={16} />
          {busy ? 'Adding…' : inCart ? 'Add another' : 'Add to cart'}
        </button>
      )}
    </article>
  )
}

export function BookGridSkeleton({ count = 5, className = 'book-grid' }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="book">
          <div className="shelf skeleton" />
          <div className="skeleton" style={{ height: 18, width: '40%' }} />
          <div className="skeleton" style={{ height: 22, width: '85%' }} />
          <div className="skeleton" style={{ height: 16, width: '55%' }} />
        </div>
      ))}
    </div>
  )
}
