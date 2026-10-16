import { useState } from 'react'
import { Button, Col, Container, Row, Stack } from 'react-bootstrap'
import {
  Sparkles,
  ArrowRight,
  QrCode,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Store,
  Package,
  Search,
  Truck,
} from 'lucide-react'

function HeroSection({
  productsCount = 0,
  suppliersCount = 0,
  onOpenProducts,
  onSearch,
  onSelectCategory,
}) {
  const [keyword, setKeyword] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(keyword.trim())
    } else {
      onOpenProducts()
    }
  }

  const quickTags = ['VietGAP', 'Rau hữu cơ', 'Củ quả tươi', 'Trái cây sạch', 'Giao 2H']

  return (
    <section id="home" className="hero-section">
      <Container>
        <div className="hero-card position-relative overflow-hidden">
          <Row className="align-items-center g-4 g-xl-5">
            {/* Left Content Column */}
            <Col lg={6}>
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <span className="badge-chip">
                  <Sparkles size={14} className="text-warning me-1" />
                  Sàn Nông Sản &amp; Thực Phẩm Sạch Trực Tiếp Từ Vườn
                </span>
                <span className="organic-badge rounded-pill px-3 py-1 small">
                  100% Minh Bạch QR
                </span>
              </div>

              <div className="hero-kicker mb-2">Thực phẩm an lành cho mọi gia đình</div>

              <h1 className="hero-title mb-3">
                Nông sản tươi sạch tận vườn, <span className="gradient-text">chuẩn an lành</span> mỗi ngày
              </h1>

              <p className="lead text-secondary mb-4 fs-6 pe-lg-2">
                Kết nối trực tiếp người tiêu dùng với các nhà vườn và hợp tác xã đạt chuẩn VietGAP.
                Mỗi lô thu hoạch đều có nhật ký canh tác số hoá, minh bạch nguồn gốc và hỗ trợ giao nhanh 2 giờ.
              </p>

              {/* Interactive Quick Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hero-search-wrapper mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Search size={20} className="text-success flex-shrink-0" />
                  <input
                    type="text"
                    className="hero-search-input"
                    placeholder="Tìm kiếm rau củ, trái cây, mã chứng nhận VietGAP..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <Button type="submit" className="primary-btn py-2 px-3 flex-shrink-0 text-nowrap">
                    <span>Tìm ngay</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>

              {/* Trending Filter Pills */}
              <div className="d-flex align-items-center gap-2 flex-wrap mb-4">
                <span className="small text-muted fw-semibold">Gợi ý tìm kiếm:</span>
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="hero-quick-tag"
                    onClick={() => {
                      setKeyword(tag)
                      if (onSearch) onSearch(tag)
                      if (onSelectCategory) onSelectCategory(tag)
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <Stack direction="horizontal" gap={3} className="flex-wrap mb-4 pb-2">
                <Button className="primary-btn btn-lg" onClick={onOpenProducts}>
                  <span>Khám phá nông sản</span>
                  <ArrowRight size={18} />
                </Button>
                <a
                  href="#trace-preview"
                  className="btn btn-outline-success rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                >
                  <QrCode size={18} />
                  <span>Tra cứu mã QR lô</span>
                </a>
              </Stack>

              {/* Real Platform Dynamic Metrics */}
              <div className="d-flex align-items-center gap-3 flex-wrap pt-2 border-top">
                {productsCount > 0 && (
                  <div className="hero-stat-pill">
                    <div className="d-flex align-items-center gap-1 text-success">
                      <Package size={18} />
                      <strong>{productsCount} sản phẩm</strong>
                    </div>
                    <span>Đang mở bán từ vườn</span>
                  </div>
                )}
                {suppliersCount > 0 && (
                  <div className="hero-stat-pill">
                    <div className="d-flex align-items-center gap-1 text-success">
                      <Store size={18} />
                      <strong>{suppliersCount} nhà cung cấp</strong>
                    </div>
                    <span>Đã thẩm định hoạt động</span>
                  </div>
                )}
                <div className="hero-stat-pill">
                  <div className="d-flex align-items-center gap-1 text-success">
                    <ShieldCheck size={18} />
                    <strong>100% VietGAP</strong>
                  </div>
                  <span>Chứng nhận theo lô</span>
                </div>
              </div>
            </Col>

            {/* Right Rich Image Composition with Zero Collision */}
            <Col lg={6}>
              <div className="hero-image-composition position-relative">
                {/* Floating Badge 1: VietGAP Certification */}
                <div className="floating-3d-badge badge-top-right">
                  <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="fw-bold small text-dark d-flex align-items-center gap-1">
                      Chứng nhận VietGAP <CheckCircle2 size={14} className="text-success" />
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Kiểm định theo từng lô thu hoạch</div>
                  </div>
                </div>

                {/* Main Clean Image Frame */}
                <div className="hero-image-frame rounded-4 overflow-hidden shadow-lg position-relative border border-2 border-success-subtle">
                  <img
                    src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1000&q=80"
                    alt="Nông sản sạch CleanMarket từ nông trại đối tác"
                    className="hero-main-img w-100 d-block"
                    style={{
                      height: '430px',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* Floating Badge 2: Super Fast Delivery & VietQR */}
                <div className="floating-3d-badge badge-bottom-left">
                  <div className="bg-warning text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm">
                    <Truck size={20} fill="white" />
                  </div>
                  <div>
                    <div className="fw-bold small text-dark d-flex align-items-center gap-1">
                      Giao nhanh 2H & VietQR <Zap size={14} className="text-warning" />
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Bảo quản lạnh khép kín tới tay bạn</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  )
}

export default HeroSection
