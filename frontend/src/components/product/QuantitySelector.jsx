import { Button, InputGroup, FormControl } from 'react-bootstrap'

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
    <InputGroup style={{ maxWidth: '220px' }}>
      <Button variant="outline-success" onClick={() => updateQuantity(quantity - step)}>
        -
      </Button>
      <FormControl
        type="number"
        min={min}
        step={step}
        value={quantity}
        className="text-center fw-semibold"
        onChange={(event) => updateQuantity(Number(event.target.value) || min)}
      />
      <Button variant="outline-success" onClick={() => updateQuantity(quantity + step)}>
        +
      </Button>
    </InputGroup>
  )
}

export default QuantitySelector
