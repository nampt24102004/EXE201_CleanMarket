import { Card, Form, Stack } from 'react-bootstrap'
import { QrCode, Banknote, ShieldCheck } from 'lucide-react'

const paymentOptions = [
  {
    id: 'payos',
    label: 'Chuyển khoản VietQR / PayOS',
    description: 'Quét mã VietQR tiện lợi qua mọi ứng dụng ngân hàng, xác nhận tự động tức thì.',
    icon: QrCode,
    badge: 'Khuyên dùng · Nhanh chóng',
  },
  {
    id: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Kiểm tra độ tươi ngon của nông sản trước khi thanh toán tiền mặt cho shipper.',
    icon: Banknote,
    badge: 'Tiền mặt',
  },
]

function PaymentMethod({ value, onChange }) {
  return (
    <Card className="checkout-card border-0 p-3 p-md-4">
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-3">
          <ShieldCheck size={20} className="text-success" />
          <h4 className="fw-bold mb-0">Phương thức thanh toán</h4>
        </div>

        <Stack gap={3}>
          {paymentOptions.map((option) => {
            const Icon = option.icon
            const isSelected = value === option.id
            return (
              <div
                key={option.id}
                onClick={() => onChange(option.id)}
                className={`p-3 rounded-4 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-success bg-success-subtle bg-opacity-25 shadow-sm'
                    : 'bg-white hover-border-success'
                }`}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className={`rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 ${
                      isSelected ? 'bg-success text-white' : 'bg-light text-muted'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold text-dark">{option.label}</span>
                      <span className={`badge ${isSelected ? 'bg-success' : 'bg-light text-muted border'} rounded-pill`}>
                        {option.badge}
                      </span>
                    </div>
                    <small className="text-muted d-block">{option.description}</small>
                  </div>
                  <Form.Check
                    type="radio"
                    id={option.id}
                    name="paymentMethod"
                    checked={isSelected}
                    onChange={() => onChange(option.id)}
                    className="mt-1"
                  />
                </div>
              </div>
            )
          })}
        </Stack>
      </Card.Body>
    </Card>
  )
}

export default PaymentMethod
