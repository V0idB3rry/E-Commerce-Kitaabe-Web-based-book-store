import { Link } from 'react-router-dom'
import Icon from '../components/Icons.jsx'

export default function NotFound({ what = 'page' }) {
  return (
    <div className="container" style={{ paddingBlock: '64px 96px' }}>
      <div className="empty">
        <div className="display" style={{ fontSize: 96, color: 'var(--mustard)' }}>404</div>
        <div className="serif">We couldn’t find that {what}</div>
        <div className="muted">It may have been sold or moved to another shelf.</div>
        <Link to="/shop" className="btn btn-primary">Browse the shelf<Icon name="arrowRight" size={18} /></Link>
      </div>
    </div>
  )
}
