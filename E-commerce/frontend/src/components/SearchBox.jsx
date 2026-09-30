import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api, coverUrl, rupees } from '../api.js'
import Icon from './Icons.jsx'

const MAX_BOOKS = 6
const DEBOUNCE_MS = 180

// Categories rarely change, so every search box on the page shares one request
let categoriesRequest = null
function loadCategories() {
  categoriesRequest ??= api('categories.php')
    .then((data) => data.categories)
    .catch(() => {
      categoriesRequest = null
      return []
    })
  return categoriesRequest
}

function wordsOf(text) {
  return text.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** Wrap the parts of `text` that match any typed word in <mark>. */
function Highlight({ text, words }) {
  if (!words.length) return text
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? <mark key={i} className="hl">{part}</mark> : <Fragment key={i}>{part}</Fragment>
  )
}

export default function SearchBox({ placeholder }) {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const id = useId()
  const rootRef = useRef(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchedFor, setSearchedFor] = useState('')

  const trimmed = query.trim()
  const words = wordsOf(query)

  // Keep the box in sync with the catalog's ?q= when browsing results
  useEffect(() => {
    setQuery(pathname === '/shop' ? params.get('q') ?? '' : '')
    setOpen(false)
  }, [pathname, params])

  // Fetch suggestions a moment after the user stops typing
  useEffect(() => {
    if (!trimmed) {
      setBooks([])
      setCategories([])
      setSearchedFor('')
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const [bookData, allCategories] = await Promise.all([
          api('books.php', { params: { q: trimmed, sort: 'relevance', limit: MAX_BOOKS } }),
          loadCategories(),
        ])
        if (cancelled) return
        const typed = wordsOf(trimmed)
        setBooks(bookData.books)
        setCategories(allCategories.filter((c) => typed.every((w) => c.name.toLowerCase().includes(w))))
        setSearchedFor(trimmed)
        setActive(-1)
      } catch {
        if (!cancelled) setBooks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed])

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // One flat list so arrow keys move through categories, books and "see all" in order
  const options = [
    ...categories.map((c) => ({ key: `c-${c.name}`, to: `/shop?category=${encodeURIComponent(c.name)}`, kind: 'category', category: c })),
    ...books.map((b) => ({ key: `b-${b.id}`, to: `/books/${b.id}`, kind: 'book', book: b })),
    ...(trimmed ? [{ key: 'all', to: `/shop?q=${encodeURIComponent(trimmed)}`, kind: 'all' }] : []),
  ]

  const showPanel = open && trimmed !== ''
  const optionId = (i) => `${id}-option-${i}`

  function go(to) {
    setOpen(false)
    setActive(-1)
    navigate(to)
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!options.length) return
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      // -1 means "nothing highlighted" (back in the text box); wrap around at both ends
      setActive((i) => {
        const next = i + step
        if (next >= options.length) return -1
        if (next < -1) return options.length - 1
        return next
      })
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        setOpen(false)
        setActive(-1)
      }
    }
  }

  function submit(event) {
    event.preventDefault()
    if (active >= 0 && options[active]) {
      go(options[active].to)
    } else {
      go(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop')
    }
    event.currentTarget.querySelector('input')?.blur()
  }

  const bookStart = categories.length
  const stale = loading || searchedFor !== trimmed

  return (
    <div className="search" ref={rootRef}>
      <form role="search" className="input header-search" onSubmit={submit}>
        <Icon name="search" size={18} stroke="#666D66" />
        <label className="sr-only" htmlFor={id}>Search books</label>
        <input
          id={id}
          type="search"
          role="combobox"
          autoComplete="off"
          spellCheck="false"
          aria-expanded={showPanel}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
        {query && (
          <button
            type="button"
            className="icon-btn search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              rootRef.current?.querySelector('input')?.focus()
            }}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </form>

      {showPanel && (
        <div className="suggest" id={`${id}-listbox`} role="listbox" aria-label="Search suggestions">
          {categories.length > 0 && (
            <div role="group" aria-labelledby={`${id}-cats`}>
              <div className="suggest-label" id={`${id}-cats`}>Shelves</div>
              {categories.map((cat, i) => (
                <div
                  key={cat.name}
                  id={optionId(i)}
                  role="option"
                  aria-selected={active === i}
                  className={`suggest-item suggest-category${active === i ? ' is-active' : ''}`}
                  onPointerMove={() => setActive(i)}
                  onClick={() => go(options[i].to)}
                >
                  <span className="suggest-icon"><Icon name="book" size={18} /></span>
                  <span className="suggest-main">
                    <span className="suggest-title"><Highlight text={cat.name} words={words} /></span>
                  </span>
                  <span className="muted suggest-meta">{cat.count} {cat.count === 1 ? 'book' : 'books'}</span>
                </div>
              ))}
            </div>
          )}

          {books.length > 0 && (
            <div role="group" aria-labelledby={`${id}-books`} style={{ opacity: stale ? 0.6 : 1 }}>
              <div className="suggest-label" id={`${id}-books`}>Books</div>
              {books.map((book, j) => {
                const i = bookStart + j
                return (
                  <div
                    key={book.id}
                    id={optionId(i)}
                    role="option"
                    aria-selected={active === i}
                    className={`suggest-item${active === i ? ' is-active' : ''}`}
                    onPointerMove={() => setActive(i)}
                    onClick={() => go(options[i].to)}
                  >
                    <span className="suggest-thumb"><img className="cover" src={coverUrl(book.image)} alt="" /></span>
                    <span className="suggest-main">
                      <span className="suggest-title"><Highlight text={book.title} words={words} /></span>
                      <span className="muted suggest-sub">
                        <Highlight text={book.author} words={words} /> · {book.condition}
                      </span>
                    </span>
                    <span className="suggest-price">
                      {book.stock > 0 ? rupees(book.price) : <span className="muted">Sold out</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {!stale && books.length === 0 && categories.length === 0 && (
            <div className="suggest-empty">
              No books match “{trimmed}”. Try fewer words or check the spelling.
            </div>
          )}
          {stale && books.length === 0 && categories.length === 0 && (
            <div className="suggest-empty">Searching…</div>
          )}

          <div
            id={optionId(options.length - 1)}
            role="option"
            aria-selected={active === options.length - 1}
            className={`suggest-item suggest-all${active === options.length - 1 ? ' is-active' : ''}`}
            onPointerMove={() => setActive(options.length - 1)}
            onClick={() => go(options[options.length - 1].to)}
          >
            <Icon name="search" size={16} />
            <span>See all results for “{trimmed}”</span>
            <Icon name="arrowRight" size={16} style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        </div>
      )}
    </div>
  )
}
