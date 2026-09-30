import { Link } from 'react-router-dom'

export default function Logo({ onDark = false, size = 34 }) {
  const ink = onDark ? '#F6F1E6' : '#2F4538'
  return (
    <Link to="/" className={`logo${onDark ? ' on-dark' : ''}`} aria-label="Second Shelf home">
      <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <rect x="5" y="8" width="6" height="20" rx="1" fill={ink} />
        <rect x="12.5" y="5" width="6" height="23" rx="1" fill={ink} opacity="0.72" />
        <rect x="21" y="9" width="6" height="19.5" rx="1" fill="#F4B942" transform="rotate(14 24 28)" />
        <rect x="2" y="28.5" width="30" height="2.6" rx="1.3" fill={ink} />
      </svg>
      <span>Second Shelf</span>
    </Link>
  )
}
