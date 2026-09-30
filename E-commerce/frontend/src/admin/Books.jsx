import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { coverUrl, rupees } from '../api.js'
import { ConditionBadge } from '../components/BookBits.jsx'
import Icon from '../components/Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AdminTop } from './AdminLayout.jsx'
import { ConfirmDialog, useAdminApi, useAdminData } from './AdminBits.jsx'

function StockCell({ book, onSaved }) {
  const call = useAdminApi()
  const toast = useToast()
  const [value, setValue] = useState(String(book.stock))
  const [busy, setBusy] = useState(false)

  useEffect(() => setValue(String(book.stock)), [book.stock])

  const dirty = value !== String(book.stock)

  async function save(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!dirty) return
    setBusy(true)
    try {
      const data = await call('admin_books.php', { method: 'PATCH', body: { id: book.id, stock: value === '' ? -1 : Number(value) } })
      onSaved(data.book)
      toast(`“${book.title}” now has ${data.book.stock} ${data.book.stock === 1 ? 'copy' : 'copies'}`)
    } catch {
      setValue(String(book.stock))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stock-edit" onSubmit={save} onClick={(e) => e.stopPropagation()}>
      <label className="sr-only" htmlFor={`stock-${book.id}`}>Copies of {book.title}</label>
      <input
        id={`stock-${book.id}`}
        className={`input${book.stock === 0 ? ' has-error' : ''}`}
        type="number"
        min="0"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setValue(String(book.stock))}
        disabled={busy}
      />
      {dirty && <button type="submit" className="btn btn-primary btn-sm" style={{ height: 32, padding: '0 10px' }} disabled={busy}>Save</button>}
    </form>
  )
}

export default function Books() {
  const { refreshStats } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const call = useAdminApi()
  const toast = useToast()

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const stock = params.get('stock') ?? ''
  const [search, setSearch] = useState(q)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => setSearch(q), [q])

  const books = useAdminData('admin_books.php', { params: { q, category, stock } }, params.toString())
  const categories = useAdminData('admin_categories.php')

  function update(changes) {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  function replaceBook(book) {
    books.setData((d) => ({ books: d.books.map((b) => (b.id === book.id ? { ...b, ...book } : b)) }))
    refreshStats()
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await call('admin_books.php', { method: 'DELETE', params: { id: deleting.id } })
      books.setData((d) => ({ books: d.books.filter((b) => b.id !== deleting.id) }))
      toast(`“${deleting.title}” deleted`)
      setDeleting(null)
      refreshStats()
    } catch {
      // toast shown
    } finally {
      setBusy(false)
    }
  }

  const list = books.data?.books ?? []

  return (
    <>
      <AdminTop title="Books" subtitle={books.data ? `${list.length} ${list.length === 1 ? 'book' : 'books'}` : ' '}>
        <Link to="/admin/books/new" className="btn btn-primary" style={{ height: 44 }}>
          <Icon name="plus" size={18} /><span className="btn-text">Add book</span>
        </Link>
      </AdminTop>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="panel-head toolbar">
          <form role="search" className="input" onSubmit={(e) => { e.preventDefault(); update({ q: search.trim() }) }}>
            <Icon name="search" size={18} stroke="#666D66" />
            <label className="sr-only" htmlFor="book-search">Search books</label>
            <input id="book-search" type="search" placeholder="Title or author" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label className="sr-only" htmlFor="book-category">Category</label>
            <select id="book-category" className="input" value={category} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {categories.data?.categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <div className="filter-chips" role="group" aria-label="Stock">
              {[['', 'Any stock'], ['low', 'Low (1–4)'], ['out', 'Sold out']].map(([value, label]) => (
                <button key={label} type="button" className={`chip${stock === value ? ' is-active' : ''}`} aria-pressed={stock === value} onClick={() => update({ stock: value })} style={{ height: 42 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {books.error && <div className="alert alert-error" style={{ margin: 20 }}>{books.error.message}</div>}
        {!books.data && books.loading && <div className="loading" style={{ padding: 48 }}>Loading books…</div>}
        {books.data && list.length === 0 && (
          <div className="empty" style={{ padding: '48px 20px' }}>
            <Icon name="book" size={32} stroke="#666D66" />
            <div className="muted">No books match these filters.</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}>Show all books</button>
          </div>
        )}

        {list.length > 0 && (
          <div className="table-wrap" style={{ opacity: books.loading ? 0.6 : 1 }}>
            <table className="table">
              <thead>
                <tr><th>Book</th><th>Category</th><th>Condition</th><th className="num">Price</th><th>Stock</th><th className="num">Sold</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id} className="clickable" onClick={() => navigate(`/admin/books/${b.id}`)}>
                    <td>
                      <div className="cell-book">
                        <div className="cell-thumb"><img className="cover" src={coverUrl(b.image)} alt="" loading="lazy" /></div>
                        <div style={{ minWidth: 0 }}>
                          <Link to={`/admin/books/${b.id}`} onClick={(e) => e.stopPropagation()} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>{b.title}</Link>
                          <div className="cell-sub">{b.author}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{b.category}</td>
                    <td><ConditionBadge condition={b.condition} /></td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{rupees(b.price)}</div>
                      {b.mrp && <div className="cell-sub" style={{ textDecoration: 'line-through' }}>{rupees(b.mrp)}</div>}
                    </td>
                    <td><StockCell book={b} onSaved={replaceBook} /></td>
                    <td className="num">{b.sold}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <Link to={`/books/${b.id}`} target="_blank" rel="noreferrer" className="icon-btn" style={{ width: 36, height: 36 }} aria-label={`View ${b.title} in store`} title="View in store">
                        <Icon name="eye" size={18} />
                      </Link>
                      <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setDeleting(b)} aria-label={`Delete ${b.title}`} title="Delete">
                        <Icon name="trash" size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleting && (
        <ConfirmDialog title="Delete this book?" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} busy={busy}>
          “{deleting.title}” will be removed from the store and from any customer carts. Past orders keep their record of it.
          {deleting.stock > 0 && ` If you just ran out of copies, set stock to 0 instead.`}
        </ConfirmDialog>
      )}
    </>
  )
}
