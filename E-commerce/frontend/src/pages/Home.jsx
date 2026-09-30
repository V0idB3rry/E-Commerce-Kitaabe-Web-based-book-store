import { Link } from 'react-router-dom'
import { CONDITIONS, coverUrl } from '../api.js'
import BookCard, { BookGridSkeleton } from '../components/BookCard.jsx'
import { ConditionBadge } from '../components/BookBits.jsx'
import Icon from '../components/Icons.jsx'
import { useApi } from '../useApi.js'

const HERO_COVERS = [
  ['think like a monk.jpg', 'Think Like a Monk'],
  ['pom.jpg', 'The Psychology of Money'],
  ['power.jpg', 'The 48 Laws of Power'],
]

const PERKS = [
  ['shield', 'Checked by hand', 'Every book is inspected and graded before it’s listed.'],
  ['truck', 'Free delivery above ₹499', 'A flat ₹40 on smaller orders.'],
  ['cash', 'Pay your way', 'UPI, cards, net banking or cash on delivery.'],
]

export function ShelfTiles({ categories }) {
  return (
    <div className="shelf-tiles">
      {categories.map((cat, i) => (
        <Link key={cat.name} to={`/shop?category=${encodeURIComponent(cat.name)}`} className={`shelf-tile tile-${i % 6}`}>
          <div className="serif">{cat.name}</div>
          <div className="meta">
            <span>{cat.count} {cat.count === 1 ? 'book' : 'books'}</span>
            <Icon name="arrowRight" size={18} />
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function Home() {
  const categories = useApi('categories.php')
  const fresh = useApi('books.php', { params: { limit: 5, in_stock: 1, sort: 'newest' } })

  return (
    <>
      <section className="hero">
        <div className="dots" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">Pre-loved books · Honestly graded</div>
            <h1 className="display hero-title">
              Old books,<br /><span>new beginnings</span>
            </h1>
            <p className="hero-lede">
              Hand-checked second-hand books for a fraction of the cover price. Every copy is graded, so you know
              exactly what’s arriving.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-accent btn-lg">
                Browse the shelf<Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/sell" className="link">Sell your books</Link>
            </div>
          </div>
          <div className="cover-stack">
            {HERO_COVERS.map(([image, title]) => (
              <img key={image} src={coverUrl(image)} alt={`${title} cover`} />
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <div className="perks">
          {PERKS.map(([icon, title, text]) => (
            <div key={title} className="perk">
              <div className="perk-icon"><Icon name={icon} size={22} /></div>
              <div>
                <div style={{ fontWeight: 700 }}>{title}</div>
                <div className="muted" style={{ fontSize: 14 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>

        <section className="section">
          <div className="section-head">
            <h2 className="serif section-title">Browse by shelf</h2>
            <Link to="/categories" className="link-arrow">All categories<Icon name="arrowRight" size={18} /></Link>
          </div>
          {categories.data && (
            <>
              <ShelfTiles categories={categories.data.categories} />
              <div className="shelf-chips">
                {categories.data.categories.map((cat) => (
                  <Link key={cat.name} to={`/shop?category=${encodeURIComponent(cat.name)}`} className="chip">
                    {cat.name}<span className="muted">{cat.count}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="serif section-title">Fresh on the shelf</h2>
            <Link to="/shop" className="link-arrow">
              View all{fresh.data ? ` ${fresh.data.total} books` : ''}<Icon name="arrowRight" size={18} />
            </Link>
          </div>
          {fresh.error && <div className="alert alert-error">{fresh.error.message}</div>}
          {fresh.loading ? (
            <BookGridSkeleton />
          ) : (
            fresh.data && (
              <div className="book-grid">
                {fresh.data.books.map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            )
          )}
        </section>

        <section className="section" style={{ paddingTop: 88 }}>
          <div className="guide" id="condition-guide">
            <div className="guide-intro">
              <div className="eyebrow" style={{ color: 'var(--rust)' }}>Condition guide</div>
              <h2 className="serif" style={{ fontSize: 42, lineHeight: 1.08, margin: 0 }}>Know exactly what you’re getting</h2>
              <p className="muted" style={{ fontSize: 16, margin: 0 }}>
                Second-hand shouldn’t mean second-guessing. We grade every copy on one simple scale and show it on
                every listing.
              </p>
            </div>
            <div className="guide-cards">
              {Object.entries(CONDITIONS).map(([name, { text }]) => (
                <div key={name} className="card guide-card">
                  <div><ConditionBadge condition={name} /></div>
                  <div className="serif" style={{ fontSize: 26 }}>{name}</div>
                  <div className="muted">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingBlock: '88px' }}>
          <div className="sell-band">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 680 }}>
              <h2 className="display">Your shelf is full.<br />Someone else’s isn’t.</h2>
              <p style={{ fontSize: 17, margin: 0 }}>
                Send us the books you’ve finished and get paid for every copy we accept.
              </p>
            </div>
            <Link to="/sell" className="btn btn-primary btn-lg">
              <Icon name="upload" size={18} />Sell your books
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
