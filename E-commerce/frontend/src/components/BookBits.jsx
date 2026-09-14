import { CONDITIONS, percentOff, rupees } from '../api.js'
import Icon from './Icons.jsx'

export function ConditionBadge({ condition }) {
  return <span className={`badge ${CONDITIONS[condition]?.className ?? 'b-good'}`}>{condition}</span>
}

export function PriceLine({ price, mrp }) {
  return (
    <div className="price-line">
      <span className="price">{rupees(price)}</span>
      {mrp && (
        <>
          <span className="mrp"><span className="sr-only">Cover price </span>{rupees(mrp)}</span>
          <span className="save">{percentOff(price, mrp)}% off</span>
        </>
      )}
    </div>
  )
}

export function QtyStepper({ value, max, onChange, disabled }) {
  return (
    <div className="qty">
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="One fewer">
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="One more">
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
