import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { CONDITIONS, coverUrl, percentOff } from '../api.js'
import { ConditionBadge } from '../components/BookBits.jsx'
import Icon from '../components/Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AdminTop } from './AdminLayout.jsx'
import { ConfirmDialog, useAdminApi, useAdminData } from './AdminBits.jsx'

const EMPTY = { title: '', author: '', description: '', category: '', condition: 'Good', price: '', mrp: '', stock: '1' }
const MAX_COVER = 5 * 1024 * 1024

export default function BookForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { refreshStats } = useOutletContext()
  const navigate = useNavigate()
  const call = useAdminApi()
  const toast = useToast()

  const existing = useAdminData(editing ? 'admin_books.php' : null, { params: { id } }, id)
  const categories = useAdminData('admin_categories.php')

  const [form, setForm] = useState(EMPTY)
  const [cover, setCover] = useState(null)       // File picked in this session
  const [preview, setPreview] = useState(null)   // object URL for that file
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const book = editing ? existing.data?.book : null

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title, author: book.author, description: book.description ?? '', category: book.category,
        condition: book.condition, price: String(book.price), mrp: book.mrp ? String(book.mrp) : '', stock: String(book.stock),
      })
    }
  }, [book])

  // Default the category for new books once categories arrive
  useEffect(() => {
    if (!editing && !form.category && categories.data?.categories.length) {
      setForm((f) => ({ ...f, category: categories.data.categories[0].name }))
    }
  }, [editing, form.category, categories.data])

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  function pickCover(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((e) => ({ ...e, cover: 'Use a JPG, PNG or WebP image.' }))
      return
    }
    if (file.size > MAX_COVER) {
      setErrors((e) => ({ ...e, cover: 'Cover image must be 5 MB or smaller.' }))
      return
    }
    setCover(file)
    setPreview(URL.createObjectURL(file))
    setErrors((e) => ({ ...e, cover: undefined }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    if (editing) data.append('id', id)
    if (cover) data.append('cover', cover)

    try {
      const res = await call('admin_books.php', { method: 'POST', body: data }, { quiet: true })
      toast(editing ? `Saved “${res.book.title}”` : `Added “${res.book.title}” to the shelf`)
      refreshStats()
      navigate('/admin/books')
    } catch (error) {
      setErrors(error.fields ?? {})
      setMessage(error.message)
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    try {
      await call('admin_books.php', { method: 'DELETE', params: { id } })
      toast(`“${book.title}” deleted`)
      refreshStats()
      navigate('/admin/books')
    } catch {
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  if (editing && existing.loading && !book) return <div className="loading">Loading book…</div>
  if (editing && existing.error) {
    return <><Link to="/admin/books" className="link-arrow"><Icon name="arrowLeft" size={16} />All books</Link><div className="alert alert-error">{existing.error.message}</div></>
  }

  const coverSrc = preview ?? (book ? coverUrl(book.image) : null)
  const discount = form.mrp && form.price && Number(form.mrp) > Number(form.price) ? percentOff(Number(form.price), Number(form.mrp)) : 0

  const input = (name, label, props = {}) => (
    <div className={`field${props.span ? ' span-2' : ''}`}>
      <label className="label" htmlFor={`bf-${name}`}>{label}</label>
      <input
        id={`bf-${name}`}
        className={`input${errors[name] ? ' has-error' : ''}`}
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
        aria-invalid={errors[name] ? true : undefined}
        {...{ ...props, span: undefined }}
      />
      {errors[name] && <div className="field-error">{errors[name]}</div>}
      {props.hint && !errors[name] && <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{props.hint}</div>}
    </div>
  )

  return (
    <>
      <Link to="/admin/books" className="link-arrow" style={{ marginBottom: -12 }}><Icon name="arrowLeft" size={16} />All books</Link>
      <AdminTop title={editing ? 'Edit book' : 'Add a book'} subtitle={editing ? book?.title : 'List a new second-hand copy'}>
        {editing && <Link to={`/books/${id}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ height: 44 }}><Icon name="eye" size={18} /><span className="btn-text">View in store</span></Link>}
      </AdminTop>

      <form className="admin-form" onSubmit={submit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="card form-card">
            <h2 className="serif">Details</h2>
            <div className="form-grid">
              {input('title', 'Title', { span: true, required: true })}
              {input('author', 'Author', { required: true })}
              <div className="field">
                <label className="label" htmlFor="bf-category">Category</label>
                <select id="bf-category" className={`input${errors.category ? ' has-error' : ''}`} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {categories.data?.categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                {errors.category ? <div className="field-error">{errors.category}</div> : <Link to="/admin/categories" style={{ fontSize: 13, marginTop: 6 }}>Manage categories</Link>}
              </div>
              <div className="field span-2">
                <label className="label" htmlFor="bf-description">Description</label>
                <textarea id="bf-description" className="input" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="A sentence or two about the book" />
              </div>
            </div>
          </section>

          <section className="card form-card">
            <h2 className="serif">Condition, price & stock</h2>
            <fieldset style={{ border: 0, padding: 0, margin: '0 0 20px' }}>
              <legend className="label">Condition</legend>
              <div className="segmented">
                {Object.keys(CONDITIONS).map((c) => (
                  <label key={c}>
                    <input type="radio" name="condition" value={c} checked={form.condition === c} onChange={() => set('condition', c)} />
                    <ConditionBadge condition={c} />
                  </label>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{CONDITIONS[form.condition]?.text}</div>
            </fieldset>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {input('price', 'Selling price (₹)', { type: 'number', min: 1, step: '0.01', inputMode: 'decimal', required: true })}
              {input('mrp', 'New-copy price (₹)', { type: 'number', min: 1, step: '0.01', inputMode: 'decimal', hint: discount ? `Shows as ${discount}% off` : 'Optional' })}
              {input('stock', 'Copies in stock', { type: 'number', min: 0, step: 1, inputMode: 'numeric', required: true })}
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
          <section className="card form-card" style={{ padding: 20 }}>
            <div className="label" id="cover-label">Cover image</div>
            <div
              className={`cover-drop${dragging ? ' dragging' : ''}${errors.cover ? ' has-error' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); pickCover(e.dataTransfer.files[0]) }}
            >
              {coverSrc ? (
                <img src={coverSrc} alt="Cover preview" />
              ) : (
                <>
                  <Icon name="upload" size={28} stroke="#2F4538" />
                  <div style={{ fontWeight: 600 }}>Drop a cover here or click to choose</div>
                  <div className="muted" style={{ fontSize: 13 }}>JPG, PNG or WebP · up to 5 MB</div>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" aria-labelledby="cover-label" onChange={(e) => pickCover(e.target.files[0])} />
            </div>
            {errors.cover && <div className="field-error">{errors.cover}</div>}
            {coverSrc && <div className="muted" style={{ fontSize: 13, marginTop: 8, textAlign: 'center' }}>Click or drop to replace</div>}
          </section>

          {message && <div className="alert alert-error" role="alert">{message}</div>}

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            <Icon name="check" size={18} />{saving ? 'Saving…' : editing ? 'Save changes' : 'Add book'}
          </button>
          {editing && (
            <button type="button" className="danger-link" onClick={() => setConfirmDelete(true)} style={{ alignSelf: 'center' }}>Delete this book</button>
          )}
        </div>
      </form>

      {confirmDelete && (
        <ConfirmDialog title="Delete this book?" onCancel={() => setConfirmDelete(false)} onConfirm={remove} busy={saving}>
          “{book.title}” will be removed from the store and from customer carts. Past orders keep their record of it.
        </ConfirmDialog>
      )}
    </>
  )
}
