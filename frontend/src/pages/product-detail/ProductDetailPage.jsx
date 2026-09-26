import { Badge, Button, Card, Col, Container, Image, ListGroup, Row, Stack } from 'react-bootstrap'
import QuantitySelector from '../../components/product/QuantitySelector'
import PageTitle from '../../components/common/PageTitle'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'
import { Link } from 'react-router-dom'

function ProductDetailPage({ product, batch, quantity, onQuantityChange, onAddToCart, onBuyNow }) {
  if (!product) {
    return null
  }

  const subTotal = product.price * quantity
  const traceUrl = batch ? `${window.location.origin}/trace/${batch.traceCode}` : ''
  const qrCodeUrl = traceUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(traceUrl)}` : ''

  return (
    <Container className="py-4 py-md-5">
      <PageTitle
        eyebrow="Chi tiết sản phẩm"
        title={product.name}
        description="Thông tin sản phẩm và liên kết truy xuất theo từng lô hàng."
      />
      <Card className="detail-card border-0 p-3 p-md-4 mb-4">
        <Card.Body>
          <Row className="g-4 align-items-center">
            <Col lg={6}>
              <Image className="detail-image" src={product.image} alt={product.name} fluid />
            </Col>
            <Col lg={6}>
              <Stack gap={3}>
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                  <Badge pill className="organic-badge">
                    Organic
                  </Badge>
                  <span className="info-chip">Nguồn gốc: {product.origin}</span>
                  <Link to={`/suppliers/${product.supplierId}`}>{product.supplierName}</Link>
                </Stack>
                <div>
                  <div className="text-secondary mb-1">Giá bán</div>
                  <div className="fs-2 fw-bold text-success">
                    {formatCurrency(product.price)} / {product.unit}
                  </div>
                </div>
                <p className="text-secondary mb-0">{product.description}</p>
                <div className="soft-panel p-3">
                  <div className="fw-semibold mb-2">Chọn số lượng</div>
                  <QuantitySelector
                    quantity={quantity}
                    unit={product.unit}
                    onChange={onQuantityChange}
                  />
                  <small className="text-secondary d-block mt-2">
                    {product.unit === 'kg'
                      ? 'Sản phẩm theo kg có thể chọn từng mức 0.5kg.'
                      : `Sản phẩm này được tính theo ${product.unit}.`}
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <div className="text-secondary">Tạm tính</div>
                    <div className="fs-4 fw-bold">{formatCurrency(subTotal)}</div>
                    <small className="text-secondary">
                      Số lượng đã chọn: {formatQuantity(quantity)} {product.unit}
                    </small>
                  </div>
                  <Stack direction="horizontal" gap={2} className="flex-wrap">
                    <Button
                      variant="outline-success"
                      size="lg"
                      className="rounded-pill"
                      onClick={() => onAddToCart(product, quantity)}
                    >
                      Thêm vào giỏ
                    </Button>
                    <Button className="primary-btn" size="lg" onClick={() => onBuyNow(quantity)}>
                      Mua hàng
                    </Button>
                  </Stack>
                </div>
              </Stack>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="detail-card border-0 p-3 p-md-4 h-100">
            <Card.Body>
              <Stack gap={3}>
                <div>
                  <h4 className="mb-2">Thông tin truy xuất sản phẩm</h4>
                  <p className="text-secondary mb-0">
                    Dữ liệu được lấy từ lô hàng mới nhất do nhà cung cấp công bố.
                  </p>
                </div>
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0 py-3 bg-transparent">
                    <div className="text-secondary small">Trang trại</div>
                    <div className="fw-semibold">{batch?.farmName || 'Chưa có lô hàng'}</div>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent">
                    <div className="text-secondary small">Địa điểm trang trại</div>
                    <div className="fw-semibold">{batch?.origin || 'Chưa cập nhật'}</div>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent">
                    <div className="text-secondary small">Mã số xuất xưởng</div>
                    <div className="fw-semibold">{batch?.batchCode || 'Chưa cập nhật'}</div>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent">
                    <div className="text-secondary small">Chứng chỉ VIETGAP</div>
                    <div className="fw-semibold">{batch?.certificateNo || 'Chưa cập nhật'}</div>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent">
                    <div className="text-secondary small">Mã truy xuất</div>
                    <div className="fw-semibold">{batch?.traceCode || 'Chưa cập nhật'}</div>
                  </ListGroup.Item>
                </ListGroup>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="detail-card border-0 p-3 p-md-4 h-100">
            <Card.Body className="d-flex flex-column">
              <h4 className="mb-2">Quét QR để truy xuất nguồn gốc</h4>
              <p className="text-secondary">QR mở trang truy xuất nguồn gốc của lô hàng.</p>
              <div className="qr-panel text-center mt-auto">
                {batch ? <><Image
                  src={qrCodeUrl}
                  alt={`Mã QR truy xuất nguồn gốc của ${product.name}`}
                  className="qr-image mb-3"
                  fluid
                />
                <div className="fw-semibold">{batch.batchCode}</div>
                <Link to={`/trace/${batch.traceCode}`} className="d-block mt-2">Xem thông tin truy xuất →</Link></> : <div>Chưa có lô hàng được công bố.</div>}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ProductDetailPage
