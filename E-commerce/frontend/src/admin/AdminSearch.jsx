import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons.jsx'

/** "Search orders or books": order numbers (#12, 12) and customer details go to Orders, anything else to Books. */
export default function AdminSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  function submit(event) {
    event.preventDefault()
    const value = q.trim()
    if (!value) return
    const looksLikeOrder = /^#?\d+$/.test(value) || value.includes('@')
    navigate(`/admin/${looksLikeOrder ? 'orders' : 'books'}?q=${encodeURIComponent(value.replace(/^#/, ''))}`)
    setQ('')
  }

  return (
    <form role="search" className="input admin-search" onSubmit={submit}>
      <Icon name="search" size={18} stroke="#666D66" />
      <label className="sr-only" htmlFor="admin-search">Search orders or books</label>
      <input id="admin-search" type="search" placeholder="Search orders or books" value={q} onChange={(e) => setQ(e.target.value)} />
    </form>
  )
}
