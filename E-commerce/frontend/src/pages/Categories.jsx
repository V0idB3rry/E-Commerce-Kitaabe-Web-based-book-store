import { Link } from 'react-router-dom'
import { useApi } from '../useApi.js'
import { ShelfTiles } from './Home.jsx'

export default function Categories() {
  const { data, error, loading } = useApi('categories.php')

  return (
    <div className="container" style={{ paddingBlock: '36px 96px' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>›<span aria-current="page">Categories</span>
      </nav>
      <h1 className="serif page-title" style={{ margin: '10px 0 32px' }}>Categories</h1>

      {loading && <div className="loading">Loading shelves…</div>}
      {error && <div className="alert alert-error">{error.message}</div>}
      {data && (
        <div className="categories-page">
          <ShelfTiles categories={data.categories} />
          <div className="shelf-chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
            {data.categories.map((cat) => (
              <Link key={cat.name} to={`/shop?category=${encodeURIComponent(cat.name)}`} className="chip">
                {cat.name}<span className="muted">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
