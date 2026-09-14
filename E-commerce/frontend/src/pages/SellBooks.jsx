import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import Icon from '../components/Icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const STEPS = [
  ['List your books', 'Tell us the titles and roughly what shape they’re in.'],
  ['We get in touch', 'We’ll call or email within a few days with an offer.'],
  ['Get paid', 'Hand the books over and get paid for every copy we accept.'],
]

export default function SellBooks() {
  const { user } = useAuth()
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    city: '',
    book_count: '',
    books: '',
    notes: '',
  }))
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  function onChange(event) {
    const { name, value } = event.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await api('sell_requests.php', { method: 'POST', body: { ...form, book_count: Number(form.book_count) } })
      setSent(true)
      window.scrollTo(0, 0)
    } catch (error) {
      setErrors(error.fields ?? {})
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  function field(name, label, props = {}) {
    const Tag = props.rows ? 'textarea' : 'input'
    return (
      <div className={`field${props.span ? ' span-2' : ''}`}>
        <label className="label" htmlFor={`sell-${name}`}>{label}</label>
        <Tag
          id={`sell-${name}`}
          name={name}
          value={form[name]}
          onChange={onChange}
          className={`input${errors[name] ? ' has-error' : ''}`}
          aria-invalid={errors[name] ? true : undefined}
          {...{ ...props, span: undefined }}
        />
        {errors[name] && <div className="field-error">{errors[name]}</div>}
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingBlock: '44px 96px' }}>
      <div className="two-col" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="eyebrow" style={{ color: 'var(--rust)' }}>Sell your books</div>
          <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', color: 'var(--forest)', margin: 0 }}>
            Your shelf is full.<br /><span style={{ color: 'var(--rust)' }}>Someone else’s isn’t.</span>
          </h1>
          <p className="muted" style={{ fontSize: 17, margin: 0 }}>
            Send us the books you’ve finished and get paid for every copy we accept.
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STEPS.map(([title, text], i) => (
              <li key={title} className="perk">
                <div className="perk-icon" style={{ fontWeight: 700 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{title}</div>
                  <div className="muted" style={{ fontSize: 14 }}>{text}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {sent ? (
          <div className="card empty">
            <div className="confirm-icon"><Icon name="check" size={36} strokeWidth={2.4} /></div>
            <div className="serif">Thanks, we’ve got your list</div>
            <div className="muted">We’ll get in touch at {form.email} with an offer.</div>
            <Link to="/shop" className="btn btn-primary">Browse the shelf</Link>
          </div>
        ) : (
          <form className="card form-card" onSubmit={submit} noValidate>
            <h2 className="serif">Tell us about your books</h2>
            <div className="form-grid">
              {field('name', 'Full name', { autoComplete: 'name' })}
              {field('phone', 'Phone number', { type: 'tel', inputMode: 'numeric', maxLength: 10, autoComplete: 'tel-national' })}
              {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('book_count', 'How many books?', { type: 'number', min: 1, max: 500, inputMode: 'numeric' })}
              <div className="field" />
              {field('books', 'Which books?', { rows: 4, span: true, placeholder: 'One per line: title – author' })}
              {field('notes', 'Anything else? (optional)', { rows: 3, span: true, placeholder: 'Condition, pickup times…' })}
            </div>
            {message && <div className="alert alert-error" role="alert" style={{ marginTop: 20 }}>{message}</div>}
            <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 24 }} disabled={busy}>
              <Icon name="upload" size={18} />{busy ? 'Sending…' : 'Send my list'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
