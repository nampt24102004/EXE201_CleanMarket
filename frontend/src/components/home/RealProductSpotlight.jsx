import { useState } from 'react'
import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import { Sparkles, CheckCircle2, ShieldCheck, ShoppingBag, Eye, MapPin, Store } from 'lucide-react'
import formatCurrency from '../../utils/formatCurrency'
import confetti from 'canvas-confetti'

export default function RealProductSpotlight({ products = [], onSelectProduct, onAddToCart }) {
  const spotlightProducts = products.slice(0, 4)
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (spotlightProducts.length === 0) return null

  const current = spotlightProducts[selectedIndex] || spotlightProducts[0]

  const handleAdd = (e) => {
    e.stopPropagation()
    onAddToCart(current)
    const rect = e.currentTarget.getBoundingClientRect()
    confetti({
      particleCount: 35,
      spread: 60,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      colors: ['#22c55e', '#16a34a', '#84cc16', '#facc15', '#ffffff'],
    })
  }

  return (
    <section className="veggie-spotlight-section py-4 my-2">
      <Card className="veggie-spotlight-card border-0 p-4 p-md-5">
        <Row className="g-4 align-items-center">
          {/* Left Details */}
          <Col lg={6}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge-chip">
                <Sparkles size={14} className="text-warning me-1" />
                Sản phẩm nổi bật
              </span>
              <Badge bg="success" pill className="px-3 py-1">
                {current.category || 'Nông sản sạch'}
              </Badge>
            </div>

            <h2 className="display-6 fw-bold mb-3 text-dark">
              {current.name} <span className="gradient-text">chuẩn tươi sạch</span>
            </h2>

            <p className="text-secondary lead fs-6 mb-4">
              {current.description || 'Nông sản thu hoạch sớm, chuẩn an toàn vệ sinh thực phẩm từ các vùng trồng uy tín.'}
            </p>

            {/* Selector Pills from Real Products */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              {spotlightProducts.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`veggie-selector-pill ${selectedIndex === idx ? 'active' : ''}`}
                >
                  <span className="pill-dot bg-success" />
                  {item.name}
                </button>
              ))}
            </div>

            {/* Spec Sheet of Current Real Product */}
            <div className="veggie-spec-box p-3 p-md-4 rounded-4 mb-4">
              <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                <div>
                  <h4 className="fw-bold mb-1 text-success">{current.name}</h4>
                  <div className="product-supplier-highlight mt-2" style={{ maxWidth: '340px' }}>
                    <span className="supplier-brand-link">
                      <Store size={15} className="text-success flex-shrink-0" />
                      <span className="text-truncate">{current.supplierName || 'Nhà cung cấp đã xác minh'}</span>
                    </span>
                    <div
                      className="verified-v-badge"
                      title="Nhà cung cấp đã xác minh đạt chuẩn VietGAP"
                    >
                      <span className="verified-v-icon">✓</span>
                      <span className="verified-v-text">Đã xác minh</span>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="fs-3 fw-bold text-dark">{formatCurrency(current.price)}</span>
                  <span className="text-muted small d-block">/ {current.unit}</span>
                </div>
              </div>

              {current.origin && (
                <div className="d-flex align-items-center gap-2 text-secondary small mb-3">
                  <MapPin size={14} className="text-success" />
                  <span>Vùng trồng: {current.origin}</span>
                </div>
              )}

              <div className="row g-2 small border-top pt-3">
                <div className="col-sm-6 d-flex align-items-center gap-2">
                  <ShieldCheck size={16} className="text-success" />
                  <span className="fw-semibold text-dark">
                    Chứng nhận: {current.certificateNo || 'Đã kiểm định VietGAP'}
                  </span>
                </div>
                <div className="col-sm-6 d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span className="text-muted">
                    {current.stock > 0 ? `Còn ${current.stock} ${current.unit} tại kho` : 'Tươi trong ngày'}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <Button
                className="primary-btn btn-lg"
                onClick={() => onSelectProduct(current)}
              >
                <Eye size={18} />
                <span>Xem chi tiết sản phẩm</span>
              </Button>
              <Button
                variant="outline-success"
                className="rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2"
                onClick={handleAdd}
              >
                <ShoppingBag size={18} />
                <span>Thêm vào giỏ</span>
              </Button>
            </div>
          </Col>

          {/* Right Visual Image from Real Product */}
          <Col lg={6}>
            <div className="spotlight-image-wrapper position-relative">
              <div className="spotlight-image-frame rounded-4 overflow-hidden shadow-lg position-relative">
                <img
                  src={current.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'}
                  alt={current.name}
                  className="spotlight-main-img w-100"
                  style={{
                    height: '420px',
                    objectFit: 'cover',
                  }}
                />
                <div
                  className="position-absolute bottom-0 start-0 end-0 p-3 text-white"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold fs-5">{current.name}</div>
                      <small className="text-white-50">{current.supplierName}</small>
                    </div>
                    <span className="badge bg-success rounded-pill px-3 py-2 fw-bold">
                      {formatCurrency(current.price)} / {current.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1 */}
              <div className="floating-3d-badge badge-top-right">
                <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="fw-bold small text-dark">Sản phẩm chính hãng</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{current.category || 'Nông sản sạch'}</div>
                </div>
              </div>

              {/* Floating Badge 2 */}
              {current.certificateNo && (
                <div className="floating-3d-badge badge-bottom-left">
                  <div className="bg-warning text-white rounded-circle p-2 d-flex align-items-center justify-content-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="fw-bold small text-dark">Mã chứng nhận</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{current.certificateNo}</div>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </section>
  )
}
