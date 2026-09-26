import { Alert, Button, Card, Col, Container, Image, ListGroup, Row, Stack } from 'react-bootstrap'
import PageTitle from '../../components/common/PageTitle'
import QuantitySelector from '../../components/product/QuantitySelector'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'

function CartPage({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onOpenProducts,
}) {
  const totalAmount = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )

  return (
    <Container className="py-4 py-md-5">
      <PageTitle
        eyebrow="Giỏ hàng"
        title="Chọn nhiều sản phẩm trong cùng một đơn"
        description="Bạn có thể thêm nhiều mặt hàng, chỉnh số lượng từng món rồi mới chuyển sang bước thanh toán."
      />

      {cartItems.length === 0 ? (
        <Card className="detail-card border-0 p-4 text-center">
          <Card.Body>
            <Alert variant="light" className="mb-4">
              Giỏ hàng của bạn đang trống. Hãy thêm vài sản phẩm sạch cho bữa ăn hôm nay.
            </Alert>
            <Button className="primary-btn" onClick={onOpenProducts}>
              Đi đến trang Sản phẩm
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          <Col lg={8}>
            <Card className="detail-card border-0 p-3 p-md-4">
              <Card.Body>
                <ListGroup variant="flush">
                  {cartItems.map((item) => (
                    <ListGroup.Item
                      key={item.product.id}
                      className="px-0 py-3 bg-transparent cart-row"
                    >
                      <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          className="cart-thumb"
                          rounded
                        />
                        <div className="flex-grow-1">
                          <div className="fw-bold">{item.product.name}</div>
                          <div className="text-secondary small mb-2">
                            {item.product.origin}
                          </div>
                          <div className="text-success fw-semibold">
                            {formatCurrency(item.product.price)} / {item.product.unit}
                          </div>
                        </div>
                        <div>
                          <div className="small text-secondary mb-2">Số lượng</div>
                          <QuantitySelector
                            quantity={item.quantity}
                            unit={item.product.unit}
                            onChange={(nextQuantity) =>
                              onUpdateQuantity(item.product.id, nextQuantity)
                            }
                          />
                        </div>
                        <div className="text-md-end">
                          <div className="small text-secondary">Thành tiền</div>
                          <div className="fw-bold mb-3">
                            {formatCurrency(item.product.price * item.quantity)}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill"
                            onClick={() => onRemoveItem(item.product.id)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="summary-card border-0 p-3 p-md-4">
              <Card.Body>
                <Stack gap={3}>
                  <h4 className="mb-0">Tóm tắt giỏ hàng</h4>
                  <div className="d-flex justify-content-between">
                    <span>Số dòng sản phẩm</span>
                    <strong>{cartItems.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Tổng số lượng</span>
                    <strong>
                      {cartItems
                        .map((item) => `${formatQuantity(item.quantity)} ${item.product.unit}`)
                        .join(', ')}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Tổng thanh toán</span>
                    <strong className="text-success">{formatCurrency(totalAmount)}</strong>
                  </div>
                  <Button className="primary-btn py-3" onClick={onCheckout}>
                    Tiến hành thanh toán
                  </Button>
                  <Button variant="outline-success" className="rounded-pill" onClick={onOpenProducts}>
                    Thêm sản phẩm khác
                  </Button>
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
