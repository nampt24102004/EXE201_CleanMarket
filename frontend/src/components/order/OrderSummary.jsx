import { Badge, Card, ListGroup, Stack } from 'react-bootstrap'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'
import { Tag } from 'lucide-react'

const paymentLabels = {
  cod: 'Thanh toán tiền mặt khi nhận hàng (COD)',
  payos: 'Chuyển khoản VietQR / PayOS',
  bank: 'Chuyển khoản ngân hàng',
  wallet: 'Ví điện tử',
}

function OrderSummary({ cartItems, paymentMethod, quote }) {
  if (!cartItems || cartItems.length === 0) {
    return null
  }

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  )

  return (
    <Card className="summary-card border-0 p-3 p-md-4 shadow-sm">
      <Card.Body>
        <Stack direction="horizontal" className="justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-dark">Tóm tắt đơn hàng</h5>
          <Badge pill bg="success-subtle" className="text-success border border-success-subtle px-3 py-1">
            {cartItems.length} mặt hàng
          </Badge>
        </Stack>

        <ListGroup variant="flush">
          {cartItems.map((item) => (
            <ListGroup.Item key={item.product.id} className="px-0 py-2 bg-transparent border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold text-dark">{item.product.name}</div>
                  <div className="text-muted small">
                    {formatQuantity(item.quantity)} {item.product.unit} x {formatCurrency(item.product.price)}
                  </div>
                </div>
                <strong className="text-dark">
                  {formatCurrency(item.product.price * item.quantity)}
                </strong>
              </div>
            </ListGroup.Item>
          ))}

          <ListGroup.Item className="px-0 py-3 bg-transparent">
            <div className="d-flex justify-content-between mb-2 text-secondary">
              <span>Tạm tính tiền hàng:</span>
              <strong className="text-dark">{formatCurrency(quote?.subtotal ?? totalPrice)}</strong>
            </div>

            {!!quote?.partnerDiscount && (
              <div className="d-flex justify-content-between mb-2 text-success fw-semibold">
                <span className="d-flex align-items-center gap-1">
                  <Tag size={14} /> Giảm từ nhà vườn:
                </span>
                <span>-{formatCurrency(quote.partnerDiscount)}</span>
              </div>
            )}

            {!!quote?.platformDiscount && (
              <div className="d-flex justify-content-between mb-2 text-success fw-semibold">
                <span className="d-flex align-items-center gap-1">
                  <Tag size={14} /> Voucher CleanMarket:
                </span>
                <span>-{formatCurrency(quote.platformDiscount)}</span>
              </div>
            )}

            <div className="d-flex justify-content-between mb-2 text-secondary">
              <span>Phí vận chuyển{quote?.shippingZone ? ` (${quote.shippingZone})` : ''}:</span>
              <span>{quote ? formatCurrency(quote.shippingFee) : 'Nhập địa chỉ để tính'}</span>
            </div>

            <div className="d-flex justify-content-between align-items-baseline mt-3 pt-3 border-top">
              <span className="fs-5 fw-bold text-dark">Tổng cộng:</span>
              <span className="fs-3 fw-bold text-success">
                {formatCurrency(quote?.totalAmount ?? totalPrice)}
              </span>
            </div>
          </ListGroup.Item>

          <ListGroup.Item className="px-0 py-2 bg-transparent">
            <div className="text-muted small mb-1">Phương thức thanh toán đã chọn:</div>
            <div className="fw-bold text-dark">
              {paymentMethod ? paymentLabels[paymentMethod] || paymentMethod : 'Chưa chọn phương thức'}
            </div>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  )
}

export default OrderSummary
