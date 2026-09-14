import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col" style={{ gap: 16 }}>
            <Logo onDark />
            <div className="display" style={{ fontSize: 30, lineHeight: 1.08, color: '#F4B942' }}>
              Old books,<br />new beginnings
            </div>
            <span style={{ maxWidth: 320 }}>Pre-loved books, checked by hand and honestly graded.</span>
          </div>
          <div className="footer-col">
            <div className="eyebrow">Shop</div>
            <Link to="/shop">All books</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/shop?sort=newest">New arrivals</Link>
          </div>
          <div className="footer-col">
            <div className="eyebrow">Help</div>
            <Link to="/account">Track your order</Link>
            <Link to="/#condition-guide">Condition guide</Link>
          </div>
          <div className="footer-col">
            <div className="eyebrow">Get in touch</div>
            <Link to="/sell">Sell your books</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Second Shelf. A college project.</div>
        </div>
      </div>
    </footer>
  )
}
