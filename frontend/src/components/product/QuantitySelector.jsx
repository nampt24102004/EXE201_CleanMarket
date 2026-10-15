import { Button } from 'react-bootstrap'
import { Plus, Minus } from 'lucide-react'

function QuantitySelector({ quantity, unit, onChange }) {
  const step = unit === 'kg' ? 0.5 : 1
  const min = step

  const normalizeValue = (value) => {
    const nextValue = Math.max(min, value)
    return Number(nextValue.toFixed(1))
  }

  const updateQuantity = (value) => {
    onChange(normalizeValue(value))
  }

  return (
    <div className="d-inline-flex align-items-center bg-white border rounded-pill p-1 shadow-sm">
      <Button
        variant="light"
        size="sm"
        className="rounded-circle d-flex align-items-center justify-content-center p-0 border-0 text-success"
        style={{ width: '32px', height: '32px' }}
        onClick={() => updateQuantity(quantity - step)}
      >
        <Minus size={15} />
      </Button>

      <span
        className="px-3 fw-bold text-dark text-center"
        style={{ minWidth: '60px', fontSize: '0.95rem' }}
      >
        {quantity} {unit}
      </span>

      <Button
        variant="light"
        size="sm"
        className="rounded-circle d-flex align-items-center justify-content-center p-0 border-0 text-success"
        style={{ width: '32px', height: '32px' }}
        onClick={() => updateQuantity(quantity + step)}
      >
        <Plus size={15} />
      </Button>
    </div>
  )
}

export default QuantitySelector
