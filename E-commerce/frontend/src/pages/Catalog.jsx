import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BookCard, { BookGridSkeleton } from '../components/BookCard.jsx'
import { ConditionBadge } from '../components/BookBits.jsx'
import Icon from '../components/Icons.jsx'
import { CONDITIONS } from '../api.js'
import { useApi } from '../useApi.js'

const PRICES = [
  ['under150', 'Under ₹150'],
  ['150to250', '₹150 – ₹250'],
  ['above250', 'Above ₹250'],
]

const SORTS = [
  ['newest', 'Newest first'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
]

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q = params.get('q') ?? ''
  const selectedCategories = params.getAll('category')
  const selectedConditions = params.getAll('condition')
  const price = params.get('price') ?? ''
  const inStock = params.get('in_stock') === '1'
  const sort = params.get('sort') ?? 'newest'

  const query = { q, category: selectedCategories, condition: selectedConditions, price, in_stock: inStock ? 1 : '', sort }
  const results = useApi('books.php', { params: query }, params.toString())
  const categories = useApi('categories.php')

  // With one shelf picked and extra filters on, show that shelf's other books below the results
  const onlyCategory = selectedCategories.length === 1 ? selectedCategories[0] : null
  const narrowed = selectedConditions.length > 0 || price !== '' || inStock
  const shelf = useApi(
    onlyCategory && narrowed ? 'books.php' : null,
    { params: { category: [onlyCategory], sort } },
    `${onlyCategory}|${sort}`
  )

  function update(changes) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key)
      ;[].concat(value ?? []).forEach((v) => v !== '' && next.append(key, v))
    }
    setParams(next, { replace: true })
  }

  function toggle(key, value, list) {
    update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }

  const clearAll = () => setParams(q ? { q } : {}, { replace: true })

  const books = results.data?.books ?? []
  const outside = onlyCategory && narrowed && shelf.data
    ? shelf.data.books.filter((b) => !books.some((r) => r.id === b.id))
    : []

  const title = q ? `Results for “${q}”` : onlyCategory ?? 'All books'
  const shelfCount = categories.data?.categories.find((c) => c.name === onlyCategory)?.count

  const activeChips = [
    ...selectedCategories.map((c) => [c, () => toggle('category', c, selectedCategories)]),
    ...selectedConditions.map((c) => [c, () => toggle('condition', c, selectedConditions)]),
    ...(price ? [[PRICES.find(([k]) => k === price)?.[1], () => update({ price: '' })]] : []),
    ...(inStock ? [['In stock', () => update({ in_stock: '' })]] : []),
  ]

  return (
    <div className="container">
      <div className="catalog-head">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <Icon name="chevronRight" size={14} />
          {onlyCategory || q ? <Link to="/shop">Shop</Link> : <span aria-current="page">Shop</span>}
          {onlyCategory && !q && (
            <>
              <Icon name="chevronRight" size={14} />
              <span aria-current="page">{onlyCategory}</span>
            </>
          )}
        </nav>
        <div className="catalog-head-row">
          <div>
            <h1 className="serif page-title">{title}</h1>
            <div className="muted" style={{ fontSize: 16, marginTop: 6 }}>
              {onlyCategory && !q && shelfCount !== undefined
                ? `${shelfCount} ${shelfCount === 1 ? 'book' : 'books'} on this shelf`
                : results.data
                  ? `${books.length} ${books.length === 1 ? 'book' : 'books'}`
                  : ' '}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost filters-toggle"
              style={{ height: 44 }}
              aria-expanded={filtersOpen}
              aria-controls="filters"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <Icon name="filter" size={18} />Filters{activeChips.length ? ` (${activeChips.length})` : ''}
            </button>
            <label className="sort">
              <span className="muted">Sort by</span>
              <select className="input" value={sort} onChange={(e) => update({ sort: e.target.value })}>
                {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="catalog">
        <aside id="filters" className={`filters${filtersOpen ? ' open' : ''}`} aria-label="Filters">
          <div className="filters-head">
            <div style={{ fontWeight: 700, fontSize: 17 }}>Filters</div>
            {activeChips.length > 0 && <button type="button" className="link" style={{ fontSize: 14 }} onClick={clearAll}>Clear all</button>}
          </div>

          <fieldset className="filter-group">
            <legend className="filter-title">Category</legend>
            {categories.data?.categories.map((cat) => (
              <label key={cat.name} className="checkbox">
                <input type="checkbox" checked={selectedCategories.includes(cat.name)} onChange={() => toggle('category', cat.name, selectedCategories)} />
                <span className="box"><Icon name="check" size={14} strokeWidth={2.6} /></span>
                <span className="text">{cat.name}</span>
                <span className="count">{cat.count}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-title">Condition</legend>
            {Object.keys(CONDITIONS).map((condition) => (
              <label key={condition} className="checkbox">
                <input type="checkbox" checked={selectedConditions.includes(condition)} onChange={() => toggle('condition', condition, selectedConditions)} />
                <span className="box"><Icon name="check" size={14} strokeWidth={2.6} /></span>
                <span className="text"><ConditionBadge condition={condition} /></span>
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-title">Price</legend>
            <div className="chip-row">
              {PRICES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`chip${price === value ? ' is-active' : ''}`}
                  aria-pressed={price === value}
                  onClick={() => update({ price: price === value ? '' : value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="filter-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span id="in-stock-label" style={{ fontWeight: 700 }}>In stock only</span>
              <button
                type="button"
                role="switch"
                className="switch"
                aria-checked={inStock}
                aria-labelledby="in-stock-label"
                onClick={() => update({ in_stock: inStock ? '' : '1' })}
              />
            </div>
          </div>
        </aside>

        <section className="results" aria-live="polite">
          {activeChips.length > 0 && (
            <div className="active-filters">
              {results.data && <span className="muted" style={{ fontSize: 14 }}>Showing {books.length}</span>}
              {activeChips.map(([label, remove]) => (
                <button key={label} type="button" className="chip chip-removable" onClick={remove} aria-label={`Remove filter ${label}`}>
                  {label}<Icon name="close" size={14} />
                </button>
              ))}
            </div>
          )}

          {results.error && <div className="alert alert-error">{results.error.message}</div>}

          {results.loading && !results.data ? (
            <BookGridSkeleton count={8} className="book-grid cols-4" />
          ) : books.length > 0 ? (
            <div className="book-grid cols-4" style={{ opacity: results.loading ? 0.6 : 1 }}>
              {books.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          ) : (
            results.data && (
              <div className="empty card">
                <Icon name="book" size={36} stroke="#666D66" />
                <div className="serif">No books match that</div>
                <div className="muted">Try a different search or remove a filter.</div>
                <button type="button" className="btn btn-ghost" onClick={() => setParams({}, { replace: true })}>Show all books</button>
              </div>
            )
          )}

          {outside.length > 0 && (
            <div className="outside">
              <div className="section-head" style={{ marginBottom: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div className="serif" style={{ fontSize: 26 }}>
                    {outside.length} more {onlyCategory} {outside.length === 1 ? 'book' : 'books'} outside your filters
                  </div>
                  <div className="muted">Different condition, price or availability</div>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => setParams({ category: onlyCategory }, { replace: true })}>
                  Show all {onlyCategory}
                </button>
              </div>
              <div className="book-grid cols-4" style={{ opacity: 0.9 }}>
                {outside.map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
