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
  {
    id: 'vnpay',
    label: 'VNPAY Sandbox',
    description: 'Backend sẽ tạo URL thanh toán và xác thực kết quả từ VNPAY Sandbox.',
  },
]

function PaymentMethod({ value, onChange, availability }) {
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
                  <small className="text-secondary">{option.description}{!availability[option.id] && ' (Tạm chưa khả dụng)'}</small>
                </div>
              }
              checked={value === option.id}
              disabled={!availability[option.id]}
              onChange={() => onChange(option.id)}
            />
          ))}
        </Stack>
      </Card.Body>
    </Card>
  )
}

export default PaymentMethod
