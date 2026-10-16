import { useEffect, useState } from 'react'
import { api } from '../../services/apiClient'
import { Button, Card, Col, Container, Image, ListGroup, Row, Stack } from 'react-bootstrap'
import QuantitySelector from '../../components/product/QuantitySelector'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'
import { ShoppingBag, ArrowRight, Trash2, ShieldCheck, Truck } from 'lucide-react'

function CartPage({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onOpenProducts,
}) {
  const totalAmount = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  )

  // Free-shipping thresholds are set per delivery zone by admins; show the lowest one, the exact fee comes at checkout.
  const [minThreshold, setMinThreshold] = useState(null)
  useEffect(() => {
    let active = true
    api.get('/api/checkout/shipping-zones').then((zones) => {
      const values = (zones || []).map((z) => Number(z.freeShippingThreshold)).filter((v) => v > 0)
      if (active && values.length) setMinThreshold(Math.min(...values))
    }).catch(() => {})
    return () => { active = false }
  }, [])
  const isFreeShip = minThreshold != null && totalAmount >= minThreshold

  return (
    <Container className="py-4 py-md-5">
      {/* Step Indicator */}
      <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
        <span className="badge bg-success rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1">
          <ShoppingBag size={14} /> 1. Giỏ hàng ({cartItems.length})
        </span>
        <span className="text-muted">➔</span>
        <span className="badge bg-light text-muted border rounded-pill px-3 py-2">
          2. Địa chỉ & Thanh toán
        </span>
        <span className="text-muted">➔</span>
        <span className="badge bg-light text-muted border rounded-pill px-3 py-2">
          3. Hoàn tất
        </span>
      </div>

      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
        <div>
          <div className="hero-kicker mb-2">Giỏ hàng CleanMarket</div>
          <h1 className="section-title mb-1">
            Nông sản đã chọn cho <span className="gradient-text">bữa ăn hôm nay</span>
          </h1>
          <p className="text-secondary mb-0">
            Kiểm tra số lượng và danh sách sản phẩm trước khi chuyển sang bước thanh toán.
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <Card className="detail-card border-0 p-5 text-center my-4">
          <Card.Body>
            <div className="text-center mb-4">
              <div
                className="mx-auto rounded-circle bg-light d-flex align-items-center justify-content-center text-muted mb-3"
                style={{ width: '80px', height: '80px' }}
              >
                <ShoppingBag size={38} className="opacity-50 text-success" />
              </div>
              <h4 className="fw-bold mb-2">Giỏ hàng của bạn đang trống</h4>
              <p className="text-secondary mb-4 max-w-500 mx-auto">
                Hãy ghé qua danh mục nông sản sạch chuẩn VietGAP để chọn cho gia đình những bữa ăn thơm ngon, an lành.
              </p>
              <Button className="primary-btn btn-lg" onClick={onOpenProducts}>
                <span>Khám phá nông sản ngay</span>
                <ArrowRight size={18} />
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          <Col lg={8}>
            <Card className="detail-card border-0 p-3 p-md-4">
              <Card.Body>
                {/* Free Ship Notification */}
                <div
                  className={`p-3 rounded-4 mb-3 d-flex align-items-center gap-2 ${
                    isFreeShip ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light border'
                  }`}
                >
                  <Truck size={20} className={isFreeShip ? 'text-success' : 'text-muted'} />
                  <span className="small fw-semibold">
                    {minThreshold == null
                      ? 'Phí giao hàng được tính theo khu vực ở bước thanh toán.'
                      : isFreeShip
                        ? `🎉 Đơn hàng đạt ngưỡng miễn phí giao hàng của khu vực gần nhất (từ ${formatCurrency(minThreshold)}). Phí chính xác hiển thị ở bước thanh toán.`
                        : `Mua thêm ${formatCurrency(minThreshold - totalAmount)} để được miễn phí giao hàng (áp dụng từ ${formatCurrency(minThreshold)}, tùy khu vực).`}
                  </span>
                </div>

                <ListGroup variant="flush">
                  {cartItems.map((item) => (
                    <ListGroup.Item
                      key={item.product.id}
                      className="px-0 py-3 bg-transparent cart-row"
                    >
                      <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
                        <Image
                          src={item.product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                          alt={item.product.name}
                          className="cart-thumb"
                          rounded
                        />
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-1 text-dark">{item.product.name}</h6>
                          <div className="text-muted small mb-1">
                            {item.product.origin || item.product.supplierName || 'Nông trại chuẩn VietGAP'}
                          </div>
                          <div className="text-success fw-bold">
                            {formatCurrency(item.product.price)} <span className="small text-muted fw-normal">/ {item.product.unit}</span>
                          </div>
                        </div>

                        <div>
                          <div className="small text-muted mb-1">Số lượng ({item.product.unit})</div>
                          <QuantitySelector
                            quantity={item.quantity}
                            unit={item.product.unit}
                            onChange={(nextQuantity) =>
                              onUpdateQuantity(item.product.id, nextQuantity)
                            }
                          />
                        </div>

                        <div className="text-md-end">
                          <div className="small text-muted mb-1">Thành tiền</div>
                          <div className="fw-bold fs-5 text-dark mb-2">
                            {formatCurrency(item.product.price * item.quantity)}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill px-3 d-inline-flex align-items-center gap-1"
                            onClick={() => onRemoveItem(item.product.id)}
                          >
                            <Trash2 size={13} />
                            <span>Xóa</span>
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Cart Summary */}
          <Col lg={4}>
            <Card className="summary-card border-0 p-3 p-md-4 sticky-top" style={{ top: '100px' }}>
              <Card.Body>
                <Stack gap={3}>
                  <h5 className="fw-bold mb-2">Tóm tắt đơn hàng</h5>

                  <div className="d-flex justify-content-between text-secondary">
                    <span>Số món đã chọn:</span>
                    <strong className="text-dark">{cartItems.length} mặt hàng</strong>
                  </div>

                  <div className="d-flex justify-content-between text-secondary">
                    <span>Tổng khối lượng:</span>
                    <strong className="text-dark">
                      {cartItems
                        .map((item) => `${formatQuantity(item.quantity)} ${item.product.unit}`)
                        .join(', ')}
                    </strong>
                  </div>

                  <hr className="my-2" />

                  <div className="d-flex justify-content-between align-items-baseline">
                    <span className="fs-5 fw-bold text-dark">Tổng tiền tạm tính:</span>
                    <span className="display-6 fs-3 fw-bold text-success">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  <Button className="primary-btn py-3 w-100 fs-6 fw-bold" onClick={onCheckout}>
                    <span>Tiến hành đặt hàng</span>
                    <ArrowRight size={18} />
                  </Button>

                  <Button
                    variant="outline-success"
                    className="rounded-pill py-2 w-100 fw-semibold"
                    onClick={onOpenProducts}
                  >
                    Tiếp tục chọn thêm rau củ
                  </Button>

                  <div className="small text-muted text-center pt-2 d-flex align-items-center justify-content-center gap-1">
                    <ShieldCheck size={16} className="text-success" />
                    <span>Cam kết bảo mật & kiểm định trước khi nhận hàng</span>
                  </div>
                </Stack>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default CartPage
