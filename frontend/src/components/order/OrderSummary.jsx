import { Badge, Card, ListGroup, Stack } from 'react-bootstrap'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'

const paymentLabels = {
  cod: 'Thanh toán khi nhận hàng COD',
  bank: 'Chuyển khoản ngân hàng',
  wallet: 'Ví điện tử',
}

function OrderSummary({ cartItems, paymentMethod, quote }) {
  if (!cartItems || cartItems.length === 0) {
    return null
  }

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )

  return (
    <Card className="summary-card border-0 p-3 p-md-4">
      <Card.Body>
        <Stack direction="horizontal" className="justify-content-between mb-3">
          <Card.Title className="mb-0">Tóm tắt đơn hàng</Card.Title>
          <Badge pill bg="success-subtle" text="success">
            {cartItems.length} món
          </Badge>
        </Stack>
        <ListGroup variant="flush">
          {cartItems.map((item) => (
            <ListGroup.Item key={item.product.id} className="px-0 py-3 bg-transparent">
              <div className="fw-semibold">{item.product.name}</div>
              <div className="text-secondary">
                {formatCurrency(item.product.price)} x {formatQuantity(item.quantity)}{' '}
                {item.product.unit}
              </div>
            </ListGroup.Item>
          ))}
          <ListGroup.Item className="px-0 py-3 bg-transparent">
            <div className="d-flex justify-content-between"><span>Tạm tính</span><span>{formatCurrency(quote?.subtotal ?? totalPrice)}</span></div>
            {!!quote?.partnerDiscount && <div className="d-flex justify-content-between text-success"><span>Giảm từ nhà cung cấp</span><span>-{formatCurrency(quote.partnerDiscount)}</span></div>}
            {!!quote?.platformDiscount && <div className="d-flex justify-content-between text-success"><span>Voucher CleanMarket</span><span>-{formatCurrency(quote.platformDiscount)}</span></div>}
            <div className="d-flex justify-content-between"><span>Phí giao hàng{quote?.shippingZone ? ` (${quote.shippingZone})` : ''}</span><span>{quote ? formatCurrency(quote.shippingFee) : 'Nhập địa chỉ để tính'}</span></div>
            <div className="d-flex justify-content-between mt-2 pt-2 border-top"><strong>Tổng thanh toán</strong><strong className="text-success">{formatCurrency(quote?.totalAmount ?? totalPrice)}</strong></div>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 py-3 bg-transparent">
            <div className="text-secondary small">Phương thức thanh toán</div>
            <div className="fw-semibold">
              {paymentMethod ? paymentLabels[paymentMethod] : 'Chưa chọn'}
            </div>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  )
}

export default OrderSummary
