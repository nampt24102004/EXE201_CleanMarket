import { Alert, Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'

const paymentLabels = {
  cod: 'Thanh toán khi nhận hàng COD',
  payos: 'payOS / VietQR - đang chờ xác nhận',
}

function OrderSuccessPage({ order, onBackHome }) {
  if (!order) {
    return null
  }

  return (
    <Container className="py-4 py-md-5">
      <Card className="success-card border-0 p-3 p-md-4">
        <Card.Body>
          <Stack gap={4}>
            <div className="text-center">
              <div className="success-icon mx-auto mb-3">✓</div>
              <h2 className="section-title mb-2">Đặt hàng thành công!</h2>
              <p className="text-secondary mb-0">
                Đơn hàng của bạn đã được lưu vào hệ thống CleanMarket.
              </p>
            </div>

            <Alert variant="success" className="mb-0">
              Mã đơn hàng: <strong>{order.orderCode}</strong>
            </Alert>

            <Row className="g-4">
              <Col md={6}>
                <div className="soft-panel p-4 h-100">
                  <h5 className="mb-3">Tóm tắt đơn hàng</h5>
                  <Stack gap={2}>
                    {order.items.map((item) => (
                      <div key={item.product.id}>
                        <div>{item.product.name}</div>
                        <div className="text-secondary">
                          {formatQuantity(item.quantity)} {item.product.unit} x{' '}
                          {formatCurrency(item.product.price)}
                        </div>
                      </div>
                    ))}
                    <div className="fw-bold text-success">
                      Tổng thanh toán: {formatCurrency(order.totalAmount)}
                    </div>
                  </Stack>
                </div>
              </Col>
              <Col md={6}>
                <div className="soft-panel p-4 h-100">
                  <h5 className="mb-3">Thông tin giao hàng</h5>
                  <Stack gap={2}>
                    <div>{order.customerInfo.fullName}</div>
                    <div>{order.customerInfo.phone}</div>
                    <div>{order.customerInfo.address}</div>
                    {order.customerInfo.email ? <div>{order.customerInfo.email}</div> : null}
                    <div className="text-secondary">
                      Thanh toán: {paymentLabels[order.paymentMethod]}
                    </div>
                  </Stack>
                </div>
              </Col>
            </Row>

            <div className="text-center">
              <Button className="primary-btn" size="lg" onClick={onBackHome}>
                Xem đơn hàng của tôi
              </Button>
            </div>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default OrderSuccessPage
