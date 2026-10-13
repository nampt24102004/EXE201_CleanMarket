import { Card, Form, Stack } from 'react-bootstrap'

const paymentOptions = [
  {
    id: 'cod',
    label: 'Thanh toán khi nhận hàng COD',
    description: 'Phù hợp khi bạn muốn thanh toán trực tiếp cho shipper.',
  },
  {
    id: 'payos',
    label: 'payOS / VietQR',
    description: 'Quét VietQR hoặc mở cổng payOS để chuyển khoản ngân hàng.',
  },
]

function PaymentMethod({ value, onChange }) {
  return (
    <Card className="checkout-card border-0 p-3 p-md-4">
      <Card.Body>
        <Card.Title className="mb-3">Phương thức thanh toán</Card.Title>
        <Stack gap={3}>
          {paymentOptions.map((option) => (
            <Form.Check
              key={option.id}
              type="radio"
              id={option.id}
              name="paymentMethod"
              label={
                <div>
                  <div className="fw-semibold">{option.label}</div>
                  <small className="text-secondary">{option.description}</small>
                </div>
              }
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
          ))}
        </Stack>
      </Card.Body>
    </Card>
  )
}

export default PaymentMethod
