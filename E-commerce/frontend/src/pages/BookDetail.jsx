import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CONDITIONS, coverUrl, percentOff, rupees } from '../api.js'
import BookCard from '../components/BookCard.jsx'
import { ConditionBadge, QtyStepper } from '../components/BookBits.jsx'
import Icon from '../components/Icons.jsx'
import { useAddToCart, useCart } from '../context/CartContext.jsx'
import { useApi } from '../useApi.js'
import NotFound from './NotFound.jsx'

export default function BookDetail() {
  const { id } = useParams()
  const { data, error, loading } = useApi('books.php', { params: { id } }, id)
  const { items } = useCart()
  const addToCart = useAddToCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(null)

  const book = data?.book

  useEffect(() => {
    setQty(1)
    if (book) document.title = `${book.title} · Second Shelf`
  }, [book])

  if (error?.status === 404) return <NotFound what="book" />
  if (loading) return <div className="loading">Loading book…</div>
  if (error) return <div className="container" style={{ paddingBlock: 48 }}><div className="alert alert-error">{error.message}</div></div>

  const inCart = items.find((line) => line.book.id === book.id)?.quantity ?? 0
  const canAdd = Math.max(book.stock - inCart, 0)
  const soldOut = book.stock === 0

  async function handle(action) {
    setBusy(action)
    const ok = await addToCart(book, qty, { quiet: action === 'buy' })
    setBusy(null)
    if (ok && action === 'buy') navigate('/checkout')
    if (ok) setQty(1)
  }

  return (
    <>
      <div className="container" style={{ paddingTop: 28 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <Icon name="chevronRight" size={14} />
          <Link to={`/shop?category=${encodeURIComponent(book.category)}`}>{book.category}</Link>
          <Icon name="chevronRight" size={14} />
          <span aria-current="page">{book.title}</span>
        </nav>
      </div>

      <div className="container detail">
        <div className="detail-cover">
          <img src={coverUrl(book.image)} alt={`${book.title} cover`} />
        </div>

        <div className="detail-info">
          <div style={{ display: 'flex', gap: 10 }}>
            <ConditionBadge condition={book.condition} />
            <Link to={`/shop?category=${encodeURIComponent(book.category)}`} className="chip" style={{ height: 24, fontSize: 12, padding: '0 10px' }}>
              {book.category}
            </Link>
          </div>

          <div>
            <h1 className="serif detail-title">{book.title}</h1>
            <div style={{ fontSize: 18, marginTop: 10 }}>
              by <Link to={`/shop?q=${encodeURIComponent(book.author)}`} style={{ fontWeight: 600 }}>{book.author}</Link>
            </div>
          </div>

          <div className="detail-price">
            <span className="now">{rupees(book.price)}</span>
            {book.mrp && (
              <>
                <span className="mrp" style={{ fontSize: 20 }}>{rupees(book.mrp)}</span>
                <span className="you-save">You save {rupees(book.mrp - book.price)} ({percentOff(book.price, book.mrp)}%)</span>
              </>
            )}
          </div>

          <div className="condition-box">
            <div style={{ color: 'var(--mint-ink)' }}><Icon name="book" size={24} /></div>
            <div>
              <div style={{ fontWeight: 700 }}>Condition: {book.condition}</div>
              <div className="muted">{CONDITIONS[book.condition]?.text}</div>
              <Link to="/#condition-guide" style={{ display: 'inline-block', fontSize: 14, fontWeight: 600, marginTop: 6 }}>How we grade</Link>
            </div>
          </div>

          <div className="divider" />

          {soldOut ? (
            <div className="alert alert-info">This copy has found a new home. Check back soon, or browse similar books below.</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {canAdd > 0 && <QtyStepper value={qty} max={canAdd} onChange={setQty} />}
                <span className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                  {book.stock} {book.stock === 1 ? 'copy' : 'copies'} in stock
                  {inCart > 0 && ` · ${inCart} in your cart`}
                </span>
              </div>

              <div className="buy-row">
                {canAdd > 0 ? (
                  <button type="button" className="btn btn-primary btn-lg" onClick={() => handle('add')} disabled={busy !== null}>
                    <Icon name="bag" size={20} />{busy === 'add' ? 'Adding…' : 'Add to cart'}
                  </button>
                ) : (
                  <Link to="/cart" className="btn btn-lg btn-added"><Icon name="check" size={20} />All copies in cart</Link>
                )}
                {canAdd > 0 ? (
                  <button type="button" className="btn btn-accent btn-lg" onClick={() => handle('buy')} disabled={busy !== null}>
                    {busy === 'buy' ? 'One moment…' : 'Buy now'}
                  </button>
                ) : (
                  <Link to="/checkout" className="btn btn-accent btn-lg">Go to checkout</Link>
                )}
              </div>
            </>
          )}

          <div className="assurances">
            <div><Icon name="truck" size={20} stroke="#2F4538" />Free delivery on orders above ₹499, otherwise ₹40</div>
            <div><Icon name="cash" size={20} stroke="#2F4538" />Cash on delivery available</div>
            <div><Icon name="shield" size={20} stroke="#2F4538" />Secure online payments by Razorpay</div>
          </div>
        </div>
      </div>

      <div className="container about">
        <div>
          <h2 className="serif" style={{ fontSize: 30, margin: '0 0 14px' }}>About this book</h2>
          <p>{book.description || 'No description yet.'}</p>
        </div>
        <dl className="card spec" style={{ margin: 0 }}>
          <div><dt>Author</dt><dd>{book.author}</dd></div>
          <div><dt>Category</dt><dd>{book.category}</dd></div>
          <div><dt>Condition</dt><dd>{book.condition}</dd></div>
          {book.mrp && <div><dt>Cover price (new)</dt><dd>{rupees(book.mrp)}</dd></div>}
          <div><dt>In stock</dt><dd>{book.stock} {book.stock === 1 ? 'copy' : 'copies'}</dd></div>
        </dl>
      </div>

      {data.related.length > 0 && (
        <section className="container section" style={{ paddingBottom: 88 }}>
          <div className="section-head">
            <h2 className="serif section-title">You might also like</h2>
            <Link to="/shop" className="link-arrow">View all<Icon name="arrowRight" size={18} /></Link>
          </div>
          <div className="book-grid">
            {data.related.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}
    </>
  )
}
