import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AdminTop } from './AdminLayout.jsx'
import { ConfirmDialog, useAdminApi, useAdminData } from './AdminBits.jsx'

export default function Categories() {
  const call = useAdminApi()
  const toast = useToast()
  const { data, error, loading, setData } = useAdminData('admin_categories.php')
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null)   // { name, value }
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run(request, success) {
    setBusy(true)
    try {
      const res = await call('admin_categories.php', request)
      setData(() => res)
      toast(success)
      return true
    } catch {
      return false
    } finally {
      setBusy(false)
    }
  }

  async function add(event) {
    event.preventDefault()
    const name = newName.trim()
    if (!name) return
    if (await run({ method: 'POST', body: { name } }, `Added “${name}”`)) setNewName('')
  }

  async function rename(event) {
    event.preventDefault()
    const value = editing.value.trim()
    if (!value || value === editing.name) {
      setEditing(null)
      return
    }
    if (await run({ method: 'PATCH', body: { name: editing.name, new_name: value } }, `Renamed to “${value}”`)) setEditing(null)
  }

  async function remove() {
    if (await run({ method: 'DELETE', params: { name: deleting.name } }, `Deleted “${deleting.name}”`)) setDeleting(null)
  }

  return (
    <>
      <AdminTop title="Categories" subtitle="The shelves customers browse by" />

      <div className="dash-grid">
        <section className="card" style={{ overflow: 'hidden' }}>
          {error && <div className="alert alert-error" style={{ margin: 20 }}>{error.message}</div>}
          {loading && !data && <div className="loading" style={{ padding: 48 }}>Loading…</div>}
          {data && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Name</th><th className="num">Books</th><th className="num">Copies</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {data.categories.map((c) => (
                    <tr key={c.name}>
                      <td>
                        {editing?.name === c.name ? (
                          <form onSubmit={rename} style={{ display: 'flex', gap: 8 }}>
                            <label className="sr-only" htmlFor="rename">New name for {c.name}</label>
                            <input id="rename" className="input" style={{ height: 36 }} autoFocus value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              onKeyDown={(e) => e.key === 'Escape' && setEditing(null)} />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>Save</button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                          </form>
                        ) : (
                          <Link to={`/admin/books?category=${encodeURIComponent(c.name)}`} style={{ fontWeight: 600, color: 'inherit' }}>{c.name}</Link>
                        )}
                      </td>
                      <td className="num">{c.count}</td>
                      <td className="num">{c.copies}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {editing?.name !== c.name && (
                          <>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing({ name: c.name, value: c.name })}>Rename</button>{' '}
                            <button
                              type="button"
                              className="icon-btn"
                              style={{ width: 36, height: 36, opacity: c.count ? 0.4 : 1 }}
                              onClick={() => (c.count ? toast(`Move or delete the ${c.count} ${c.count === 1 ? 'book' : 'books'} on “${c.name}” first`, { type: 'error' }) : setDeleting(c))}
                              aria-label={`Delete ${c.name}`}
                              title={c.count ? 'Only empty categories can be deleted' : 'Delete'}
                            >
                              <Icon name="trash" size={18} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="card form-card" style={{ padding: 20 }} onSubmit={add}>
          <h2 className="serif" style={{ fontSize: 22, marginBottom: 14 }}>Add a category</h2>
          <div className="field">
            <label className="label" htmlFor="new-category">Name</label>
            <input id="new-category" className="input" maxLength={60} placeholder="e.g. Fiction" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy || !newName.trim()}>
            <Icon name="plus" size={18} />Add category
          </button>
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Renaming moves every book on that shelf to the new name.</p>
        </form>
      </div>

      {deleting && (
        <ConfirmDialog title={`Delete “${deleting.name}”?`} onCancel={() => setDeleting(null)} onConfirm={remove} busy={busy}>
          This shelf is empty, so no books are affected.
        </ConfirmDialog>
      )}
    </>
  )
}
