import RatingSummary from '../../components/product/RatingSummary'
import { useState } from 'react'
import { Badge, Button, Card, Col, Container, Image, ListGroup, Row, Stack } from 'react-bootstrap'
import QuantitySelector from '../../components/product/QuantitySelector'
import formatCurrency from '../../utils/formatCurrency'
import formatQuantity from '../../utils/formatQuantity'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  ShoppingBag,
  Zap,
  MapPin,
  Store,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

function ProductDetailPage({
  product,
  batch,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
}) {
  const [added, setAdded] = useState(false)

  if (!product) {
    return null
  }

  const subTotal = product.price * quantity
  const traceUrl = batch ? `${window.location.origin}/trace/${batch.traceCode}` : ''
  const qrCodeUrl = traceUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(traceUrl)}`
    : ''

  const handleAdd = (e) => {
    onAddToCart(product, quantity)
    const rect = e.currentTarget.getBoundingClientRect()
    confetti({
      particleCount: 40,
      spread: 70,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      colors: ['#22c55e', '#16a34a', '#84cc16', '#facc15', '#ffffff'],
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const handleBuy = () => {
    onBuyNow(quantity)
  }

  return (
    <Container className="py-4 py-md-5">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 small text-muted mb-2">
          <Link to="/" className="text-secondary text-decoration-none">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/products" className="text-secondary text-decoration-none">
            Nông sản
          </Link>
          <span>/</span>
          <span className="text-dark fw-semibold">{product.name}</span>
        </div>
        <h1 className="section-title mb-1">{product.name}</h1>
        <RatingSummary rating={product.averageRating} count={product.reviewCount} className="mb-1" />
        <p className="text-secondary mb-0">
          Nông sản tươi sạch được kiểm định và cấp mã truy xuất nguồn gốc.
        </p>
      </div>

      {/* Main Product Card */}
      <Card className="detail-card border-0 p-3 p-md-4 mb-4">
        <Card.Body>
          <Row className="g-4 align-items-center">
            <Col lg={6}>
              <div className="position-relative rounded-4 overflow-hidden shadow-sm">
                <Image className="detail-image" src={product.image} alt={product.name} fluid />
                <div className="position-absolute top-0 start-0 m-3">
                  <span className="badge-tag-organic bg-white shadow-sm">
                    <Sparkles size={13} className="text-success" />
                    {product.category || 'Nông sản sạch'}
                  </span>
                </div>
              </div>
            </Col>

            <Col lg={6}>
              <Stack gap={3}>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Badge pill className="organic-badge">
                    <Sparkles size={12} className="me-1 inline-block" />
                    Organic & VietGAP
                  </Badge>
                  {product.origin && (
                    <span className="info-chip d-inline-flex align-items-center gap-1">
                      <MapPin size={13} /> Vùng trồng: {product.origin}
                    </span>
                  )}
                </div>

                {product.supplierName && (
                  <div className="product-supplier-highlight my-1" style={{ maxWidth: '360px' }}>
                    <Link
                      to={`/suppliers/${product.supplierId}`}
                      className="supplier-brand-link"
                      title={`Xem gian hàng ${product.supplierName}`}
                    >
                      <Store size={16} className="text-success flex-shrink-0" />
                      <span className="text-truncate fw-bold">{product.supplierName}</span>
                    </Link>
                    <div
                      className="verified-v-badge"
                      title="Nhà cung cấp đã xác minh đạt chuẩn VietGAP"
                    >
                      <span className="verified-v-icon">✓</span>
                      <span className="verified-v-text">Đã xác minh</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-secondary small fw-semibold mb-1">Giá bán niêm yết</div>
                  <div className="display-6 fw-bold text-success mb-1">
                    {formatCurrency(product.price)}{' '}
                    <span className="fs-5 fw-normal text-muted">/ {product.unit}</span>
                  </div>
                  {product.stock > 0 && (
                    <small className="text-muted d-flex align-items-center gap-1">
                      <CheckCircle2 size={14} className="text-success" /> Còn {product.stock}{' '}
                      {product.unit} tại kho Hòa Lạc
                    </small>
                  )}
                </div>

                <p className="text-secondary mb-0 leading-relaxed">
                  {product.description ||
                    'Được chăm sóc theo phương pháp hữu cơ tự nhiên, không sử dụng thuốc trừ sâu hóa học, đảm bảo an toàn tuyệt đối cho cả gia đình.'}
                </p>

                {/* Quantity Selector Panel */}
                <div className="soft-panel p-3 rounded-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">Chọn số lượng mua</span>
                    <small className="text-muted">
                      {product.unit === 'kg' ? 'Mỗi bước chọn: 0.5kg' : `Đơn vị tính: ${product.unit}`}
                    </small>
                  </div>
                  <QuantitySelector
                    quantity={quantity}
                    unit={product.unit}
                    onChange={onQuantityChange}
                  />
                </div>

                {/* Subtotal & Action Buttons */}
                <div className="p-3 bg-light rounded-4 border">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <div className="text-muted small">Tạm tính:</div>
                      <div className="fs-3 fw-bold text-dark">{formatCurrency(subTotal)}</div>
                    </div>
                    <div className="text-end text-muted small">
                      Số lượng: <strong>{formatQuantity(quantity)} {product.unit}</strong>
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="outline-success"
                      size="lg"
                      className="rounded-pill flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold"
                      onClick={handleAdd}
                    >
                      <ShoppingBag size={18} />
                      {added ? 'Đã thêm vào giỏ!' : 'Thêm vào giỏ'}
                    </Button>
                    <Button
                      className="primary-btn btn-lg flex-grow-1"
                      onClick={handleBuy}
                    >
                      <Zap size={18} />
                      <span>Mua ngay</span>
                    </Button>
                  </div>
                </div>
              </Stack>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Traceability & Batch Information */}
      <Row className="g-4">
        <Col lg={7}>
          <Card className="detail-card border-0 p-3 p-md-4 h-100">
            <Card.Body>
              <Stack gap={3}>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge-chip">
                      <ShieldCheck size={14} className="text-success" />
                      Minh bạch thông tin
                    </span>
                  </div>
                  <h4 className="fw-bold mb-1">Dữ liệu nguồn gốc theo lô</h4>
                  <p className="text-secondary small mb-0">
                    Thông tin được ghi nhận điện tử từ trang trại đối tác khi đóng gói lô hàng.
                  </p>
                </div>

                <ListGroup variant="flush" className="border-top pt-2">
                  <ListGroup.Item className="px-0 py-3 bg-transparent d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Trang trại canh tác</span>
                    <strong className="text-dark">{batch?.farmName || product.supplierName || 'Nông trại liên kết'}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Vùng trồng / Địa phương</span>
                    <strong className="text-dark">{batch?.origin || product.origin || 'Đà Lạt, Lâm Đồng'}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Mã lô xuất xưởng</span>
                    <strong className="text-success">{batch?.batchCode || 'CM-BATCH-NEW'}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Chứng chỉ VietGAP</span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fw-bold">
                      {batch?.certificateNo || product.vietgapCertificate || 'Đạt chuẩn kiểm định'}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-3 bg-transparent d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Mã truy xuất hệ thống</span>
                    <span className="font-monospace small bg-light p-1 rounded border">
                      {batch?.traceCode || 'CM-TR-VERIFIED'}
                    </span>
                  </ListGroup.Item>
                </ListGroup>
              </Stack>
            </Card.Body>
          </Card>
        </Col>

        {/* QR Code Verification Panel */}
        <Col lg={5}>
          <Card className="detail-card border-0 p-3 p-md-4 h-100 text-center">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <span className="badge-chip mb-2">
                <QrCode size={14} className="text-primary" />
                Mã QR Số Hóa
              </span>
              <h5 className="fw-bold mb-2">Quét mã kiểm tra nguồn gốc</h5>
              <p className="text-secondary small mb-3">
                Dùng camera điện thoại để quét mã hoặc bấm nút bên dưới để xem trực tiếp hồ sơ nông sản.
              </p>

              <div className="qr-panel p-3 rounded-4 bg-white border shadow-sm mb-3">
                {batch ? (
                  <>
                    <Image
                      src={qrCodeUrl}
                      alt={`Mã QR của ${product.name}`}
                      className="qr-image mb-2 mx-auto"
                      fluid
                    />
                    <div className="fw-bold small text-dark">{batch.batchCode}</div>
                    <Link
                      to={`/trace/${batch.traceCode}`}
                      className="btn btn-sm btn-outline-success rounded-pill mt-2 px-3 fw-bold d-inline-flex align-items-center gap-1"
                    >
                      <span>Xem hồ sơ truy xuất</span>
                      <ArrowRight size={14} />
                    </Link>
                  </>
                ) : (
                  <div className="py-4 text-muted small">
                    <QrCode size={40} className="mb-2 opacity-50" />
                    <div>Sản phẩm sẽ có mã QR ngay khi đóng gói xuất kho.</div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ProductDetailPage
