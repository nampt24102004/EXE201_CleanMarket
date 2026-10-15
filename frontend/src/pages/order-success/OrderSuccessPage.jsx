import { useEffect } from 'react'
import { Alert, Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'
import confetti from 'canvas-confetti'
import { CheckCircle2, PackageCheck, Truck, ArrowRight, Sparkles } from 'lucide-react'

const paymentLabels = {
  cod: 'Thanh toán tiền mặt khi nhận hàng (COD)',
  payos: 'Chuyển khoản VietQR / PayOS',
}

function OrderSuccessPage({ order, onBackHome }) {
  useEffect(() => {
    // Big confetti celebration for successful order!
    const end = Date.now() + 1000
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#16a34a', '#84cc16', '#facc15'],
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#16a34a', '#84cc16', '#facc15'],
      })
      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }, [])

  if (!order) {
    return null
  }

  return (
    <Container className="py-4 py-md-5">
      <Card className="success-card border-0 p-3 p-md-5 shadow-lg">
        <Card.Body>
          <Stack gap={4}>
            {/* Header Success Animation */}
            <div className="text-center">
              <div className="success-icon mx-auto mb-3">
                <CheckCircle2 size={44} />
              </div>
              <div className="badge-chip mb-2">
                <Sparkles size={14} className="text-warning me-1" />
                Đơn hàng đã được tiếp nhận
              </div>
              <h2 className="display-6 fw-bold mb-2 text-dark">Đặt hàng thành công!</h2>
              <p className="text-secondary mb-0 max-w-500 mx-auto">
                Cảm ơn bạn đã lựa chọn nông sản sạch tại CleanMarket. Đội ngũ đang liên hệ nhà vườn để chuẩn bị nông sản tươi nhất cho bạn.
              </p>
            </div>

            <Alert variant="success" className="mb-0 text-center py-3 border-0 bg-success-subtle text-success-emphasis rounded-4">
              Mã đơn hàng của bạn: <strong className="fs-5 font-monospace">{order.orderCode}</strong>
            </Alert>

            <Row className="g-4">
              {/* Items Summary */}
              <Col md={6}>
                <div className="soft-panel p-4 h-100 rounded-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-success">
                    <PackageCheck size={20} />
                    <span>Nông sản trong đơn ({order.items.length})</span>
                  </h5>
                  <Stack gap={2} className="divide-y">
                    {order.items.map((item) => (
                      <div key={item.id || item.product.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <div className="fw-semibold text-dark">{item.product.name}</div>
                          <small className="text-muted">
                            {formatQuantity(item.quantity)} {item.product.unit} x {formatCurrency(item.product.price)}
                          </small>
                        </div>
                        <strong className="text-dark">
                          {formatCurrency(item.totalAmount || item.product.price * item.quantity)}
                        </strong>
                      </div>
                    ))}
                    <div className="d-flex justify-content-between align-items-baseline pt-3">
                      <span className="fw-bold">Tổng thanh toán:</span>
                      <span className="fs-4 fw-bold text-success">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </Stack>
                </div>
              </Col>

              {/* Delivery & Customer Info */}
              <Col md={6}>
                <div className="soft-panel p-4 h-100 rounded-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-success">
                    <Truck size={20} />
                    <span>Thông tin nhận hàng</span>
                  </h5>
                  <Stack gap={2}>
                    <div>
                      <span className="text-muted small">Người nhận: </span>
                      <strong className="text-dark">{order.customerInfo.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-muted small">Số điện thoại: </span>
                      <strong className="text-dark">{order.customerInfo.phone}</strong>
                    </div>
                    <div>
                      <span className="text-muted small">Địa chỉ giao: </span>
                      <span className="text-dark">{order.customerInfo.address}</span>
                    </div>
                    {order.customerInfo.email && (
                      <div>
                        <span className="text-muted small">Email nhận thông báo: </span>
                        <span>{order.customerInfo.email}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <span className="text-muted small">Phương thức thanh toán: </span>
                      <span className="badge bg-light text-dark border">
                        {paymentLabels[order.paymentMethod] || order.paymentMethod}
                      </span>
                    </div>
                  </Stack>
                </div>
              </Col>
            </Row>

            <div className="d-flex justify-content-center gap-3 flex-wrap pt-3">
              <Button className="primary-btn btn-lg" onClick={onBackHome}>
                <span>Xem danh sách đơn hàng</span>
                <ArrowRight size={18} />
              </Button>
            </div>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default OrderSuccessPage
