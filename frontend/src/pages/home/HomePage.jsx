import { useState, useMemo } from 'react'
import { Button, Card, Col, Container, Row, Badge } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import HeroSection from './HeroSection'
import ProductCard from '../../components/product/ProductCard'
import RealProductSpotlight from '../../components/home/RealProductSpotlight'
import {
  ShieldCheck,
  Truck,
  Leaf,
  RotateCcw,
  Sparkles,
  ArrowRight,
  QrCode,
  CheckCircle2,
  Store,
  MapPin,
  CreditCard,
  Search,
  ExternalLink,
  Award,
} from 'lucide-react'

const COMMITMENTS = [
  {
    icon: ShieldCheck,
    title: 'Chứng nhận VietGAP',
    desc: '100% nông sản từ các nhà vườn đối tác có chứng nhận kiểm định an toàn và giấy phép kinh doanh hợp lệ.',
  },
  {
    icon: QrCode,
    title: 'Minh bạch từng lô hàng',
    desc: 'Mỗi sản phẩm đều liên kết với mã QR chứa thông tin mã lô, trang trại, ngày thu hoạch và xuất xưởng.',
  },
  {
    icon: CreditCard,
    title: 'Thanh toán VietQR & COD',
    desc: 'Hỗ trợ chuyển khoản ngân hàng tự động qua mã VietQR (payOS) và thanh toán tiền mặt khi nhận hàng (COD).',
  },
  {
    icon: RotateCcw,
    title: 'Hỗ trợ khiếu nại 24/7',
    desc: 'Bộ phận vận hành CleanMarket tiếp nhận và xử lý nhanh chóng mọi phản hồi về độ tươi và chất lượng nông sản.',
  },
]

const JOURNEY_STEPS = [
  {
    step: '01',
    icon: Leaf,
    title: 'Thẩm định nhà vườn',
    desc: 'Kiểm duyệt hồ sơ nhà cung cấp, chứng chỉ VietGAP và kiểm tra thực địa quy trình canh tác an toàn.',
  },
  {
    step: '02',
    icon: Store,
    title: 'Đăng ký lô thu hoạch',
    desc: 'Nhà cung cấp cập nhật thông tin ngày thu hoạch, sản lượng và thông số kỹ thuật trực tiếp trên hệ thống.',
  },
  {
    step: '03',
    icon: QrCode,
    title: 'Cấp mã QR số hoá',
    desc: 'Hệ thống tự động liên kết mã QR độc nhất với nhật ký xuất xưởng của từng kiện hàng nông sản.',
  },
  {
    step: '04',
    icon: Truck,
    title: 'Giao hàng lạnh < 24h',
    desc: 'Vận chuyển nhanh chóng đến tay khách hàng, đảm bảo kiểm tra sản phẩm tươi ngon trước khi thanh toán.',
  },
]

function HomePage({ products = [], suppliers = [], onSelectProduct, onAddToCart, onOpenProducts }) {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchFilter, setSearchFilter] = useState('')
  const [traceInput, setTraceInput] = useState('')

  // Derive real categories dynamically from products
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [products])

  // Real sample trace codes from products data
  const sampleTraceCodes = useMemo(() => {
    const list = []
    products.forEach((p) => {
      if (p.batch?.traceCode && !list.includes(p.batch.traceCode)) {
        list.push(p.batch.traceCode)
      } else if (p.certificateNo && !list.includes(p.certificateNo)) {
        list.push(p.certificateNo)
      }
    })
    return list.slice(0, 3)
  }, [products])

  // Real filtered products by category and optional search keyword
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory
      const matchSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (p.certificateNo && p.certificateNo.toLowerCase().includes(searchFilter.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [products, selectedCategory, searchFilter])

  const handleTraceLookup = (e) => {
    e.preventDefault()
    if (!traceInput.trim()) return
    navigate(`/trace/${encodeURIComponent(traceInput.trim())}`)
  }

  return (
    <>
      {/* 1. Hero Section with Real Dynamic Metrics and Search */}
      <HeroSection
        productsCount={products.length}
        suppliersCount={suppliers.length}
        onOpenProducts={onOpenProducts}
        onSearch={(keyword) => {
          setSearchFilter(keyword)
          const el = document.getElementById('featured-products')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }}
        onSelectCategory={(cat) => {
          if (categories.includes(cat)) {
            setSelectedCategory(cat)
          } else {
            setSearchFilter(cat)
          }
          const el = document.getElementById('featured-products')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      {/* 2. Platform Commitments Banner (High Contrast, Organic Aesthetics) */}
      <Container className="trust-banner-section">
        <Row className="g-3">
          {COMMITMENTS.map((item) => {
            const Icon = item.icon
            return (
              <Col key={item.title} md={6} lg={3}>
                <div className="trust-card">
                  <div className="trust-icon-box">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">{item.title}</h6>
                    <p className="small text-muted mb-0" style={{ lineHeight: 1.45 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      </Container>

      <Container className="pb-5">
        {/* 3. Breakthrough Bento Grid: CleanMarket Ecosystem Highlights */}
        <section className="py-4 my-2">
          <div className="text-center max-w-700 mx-auto mb-4">
            <span className="badge-chip mb-2">
              <Sparkles size={14} className="text-warning me-1" />
              Công nghệ tiên phong
            </span>
            <h2 className="section-title mb-2">
              Hệ sinh thái nông sản <span className="gradient-text">chuẩn an lành</span>
            </h2>
            <p className="text-secondary mb-0">
              CleanMarket kết hợp số hoá quy trình thu hoạch, kiểm định VietGAP và thanh toán tức thì.
            </p>
          </div>

          <div className="bento-grid">
            {/* Bento Card 1: Interactive QR Traceability Box (Span 7) */}
            <div className="bento-card" style={{ gridColumn: 'span 7' }}>
              <div className="bento-card-aura" />
              <div className="bento-badge">
                <QrCode size={14} /> Minh bạch nguồn gốc
              </div>
              <h3 className="fw-bold fs-4 text-dark mb-2">
                Tra cứu lô hàng trực tiếp qua mã QR
              </h3>
              <p className="text-secondary small mb-3">
                Mỗi sản phẩm xuất xưởng đều được định danh bằng mã truy xuất số. Quý khách có thể
                nhập mã lô hoặc mã chứng nhận để kiểm tra nhật ký thu hoạch và trang trại cung cấp.
              </p>

              {/* Real Interactive QR Code Lookup */}
              <form onSubmit={handleTraceLookup} className="mb-3">
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control rounded-pill px-3 py-2 border-success-subtle shadow-sm"
                    placeholder="Nhập mã truy xuất (vd: BATCH-..., VG-...)"
                    value={traceInput}
                    onChange={(e) => setTraceInput(e.target.value)}
                  />
                  <Button type="submit" className="primary-btn text-nowrap px-3">
                    <span>Tra cứu</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>

              {/* Sample Real Trace Codes */}
              {sampleTraceCodes.length > 0 && (
                <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                  <span className="small text-muted">Mã mẫu từ lô thực tế:</span>
                  {sampleTraceCodes.map((code) => (
                    <button
                      key={code}
                      type="button"
                      className="btn btn-sm btn-light border rounded-pill py-1 px-2 font-monospace small"
                      onClick={() => setTraceInput(code)}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted small">
                <span className="d-flex align-items-center gap-1 text-success fw-bold">
                  <CheckCircle2 size={16} /> Dữ liệu đồng bộ trực tiếp từ nông trại đối tác
                </span>
                <span className="text-dark fw-semibold">Chứng chỉ VietGAP đã kiểm duyệt</span>
              </div>
            </div>

            {/* Bento Card 2: Farm-to-Table Fast Logistics (Span 5) */}
            <div className="bento-card" style={{ gridColumn: 'span 5' }}>
              <div className="bento-card-aura" style={{ background: 'radial-gradient(circle, rgba(254, 240, 138, 0.4), transparent 70%)' }} />
              <div className="bento-badge" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                <Truck size={14} /> Giao hàng tươi nhanh
              </div>
              <h3 className="fw-bold fs-4 text-dark mb-2">
                Bảo quản lạnh khép kín &lt; 24h
              </h3>
              <p className="text-secondary small mb-3">
                Nông sản được thu hoạch từ sáng sớm, sơ chế đóng gói ngay tại vườn và vận chuyển tới
                bàn ăn gia đình bạn trong ngày để giữ trọn vẹn vị tươi ngọt và dinh dưỡng.
              </p>
              <div className="p-3 bg-light rounded-4 border mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-semibold text-dark small">Nhiệt độ bảo quản chuẩn:</span>
                  <Badge bg="success" pill>4°C - 8°C</Badge>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold text-dark small">Miễn phí giao hàng:</span>
                  <span className="text-success fw-bold small">Theo ngưỡng từng khu vực</span>
                </div>
              </div>
              <div className="mt-auto pt-2 border-top">
                <Link to="/products" className="btn btn-sm btn-outline-success rounded-pill fw-bold w-100 d-flex align-items-center justify-content-center gap-1">
                  <span>Xem thực đơn nông sản hôm nay</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Bento Card 3: Seamless VietQR Banking & COD (Span 6) */}
            <div className="bento-card" style={{ gridColumn: 'span 6' }}>
              <div className="bento-badge" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                <CreditCard size={14} /> Thanh toán tiện lợi
              </div>
              <h3 className="fw-bold fs-4 text-dark mb-2">
                VietQR PayOS tự động &amp; COD tiền mặt
              </h3>
              <p className="text-secondary small mb-3">
                Chuyển khoản liên ngân hàng 24/7 tức thì qua mã VietQR thông minh kết nối cổng PayOS,
                tự động khớp lệnh đơn hàng trong 1 giây mà không cần chụp màn hình chuyển khoản.
              </p>
              <div className="d-flex align-items-center gap-3 pt-2">
                <div className="d-flex align-items-center gap-2 p-2 px-3 bg-light rounded-pill border">
                  <CreditCard size={18} className="text-primary" />
                  <span className="small fw-bold text-dark">VietQR / PayOS</span>
                </div>
                <div className="d-flex align-items-center gap-2 p-2 px-3 bg-light rounded-pill border">
                  <Truck size={18} className="text-success" />
                  <span className="small fw-bold text-dark">Thanh toán COD khi nhận</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: Verified Farmers & Cooperatives (Span 6) */}
            <div className="bento-card" style={{ gridColumn: 'span 6' }}>
              <div className="bento-badge" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>
                <Store size={14} /> Đối tác tin cậy
              </div>
              <h3 className="fw-bold fs-4 text-dark mb-2">
                Đồng hành cùng {suppliers.length > 0 ? suppliers.length : 'các'} hợp tác xã nông sản sạch
              </h3>
              <p className="text-secondary small mb-3">
                CleanMarket trực tiếp thu mua nông sản từ các nhà vườn tại Đà Lạt, Lâm Đồng, Tiền Giang,
                đảm bảo sinh kế bền vững cho người nông dân và giá cả minh bạch tới người tiêu dùng.
              </p>
              <div className="mt-auto d-flex align-items-center justify-content-between pt-2">
                <span className="text-success fw-bold small d-flex align-items-center gap-1">
                  <Award size={16} /> 100% Tiêu chuẩn VietGAP kiểm duyệt
                </span>
                <Link to="/products" className="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold">
                  Khám phá các gian hàng →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Featured Real Products Showcase with Interactive Category Switcher */}
        <section id="featured-products" className="py-4 my-2">
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
            <div>
              <div className="hero-kicker mb-1">Gian hàng nông sản</div>
              <h2 className="section-title mb-1">
                Sản phẩm sạch <span className="gradient-text">đang mở bán hôm nay</span>
              </h2>
              <p className="text-secondary mb-0">
                Thu hoạch tươi sáng sớm từ các nhà vườn đối tác đã được thẩm định an toàn.
              </p>
            </div>

            <Button className="primary-btn" onClick={onOpenProducts}>
              <span>Xem tất cả ({products.length} sản phẩm)</span>
              <ArrowRight size={17} />
            </Button>
          </div>

          {/* Real Category Tabs Switcher */}
          {categories.length > 1 && (
            <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
              {categories.map((cat) => {
                const count =
                  cat === 'all'
                    ? products.length
                    : products.filter((p) => p.category === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(cat)
                      setSearchFilter('')
                    }}
                  >
                    <span>{cat === 'all' ? 'Tất cả nông sản' : cat}</span>
                    <span className="badge-count">{count}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Active Search Filter Badge if any */}
          {searchFilter && (
            <div className="mb-3 d-flex align-items-center gap-2">
              <span className="small text-muted">Kết quả tìm kiếm cho:</span>
              <Badge bg="success" pill className="px-3 py-2 d-inline-flex align-items-center gap-1">
                <Search size={12} /> {searchFilter}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-1"
                  style={{ fontSize: '0.65rem' }}
                  onClick={() => setSearchFilter('')}
                />
              </Badge>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <Card className="detail-card border-0 p-5 text-center my-4">
              <Leaf size={48} className="text-muted opacity-50 mx-auto mb-3" />
              <h4 className="fw-bold mb-2">Không tìm thấy sản phẩm phù hợp</h4>
              <p className="text-secondary mb-4">
                Hãy thử chọn danh mục khác hoặc đặt lại bộ lọc để khám phá các sản phẩm tươi sạch.
              </p>
              <div>
                <Button
                  className="primary-btn"
                  onClick={() => {
                    setSelectedCategory('all')
                    setSearchFilter('')
                  }}
                >
                  Đặt lại danh mục
                </Button>
              </div>
            </Card>
          ) : (
            <Row className="g-4">
              {filteredProducts.slice(0, 6).map((product) => (
                <Col key={product.id} sm={6} lg={4}>
                  <ProductCard
                    product={product}
                    onSelectProduct={onSelectProduct}
                    onAddToCart={onAddToCart}
                  />
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* 5. Real Product Spotlight (Interactive Showcase from real products) */}
        {products.length > 0 && (
          <RealProductSpotlight
            products={products}
            onSelectProduct={onSelectProduct}
            onAddToCart={onAddToCart}
          />
        )}

        {/* 6. Real Verified Suppliers / Farm Partners */}
        {suppliers.length > 0 && (
          <section className="py-5">
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
              <div>
                <span className="badge-chip mb-2">
                  <Store size={14} className="text-success me-1" />
                  Đối tác nhà vườn
                </span>
                <h2 className="section-title mb-1">
                  Nhà cung cấp <span className="gradient-text">đã xác minh tiêu chuẩn</span>
                </h2>
                <p className="text-secondary mb-0">
                  Các nông trại và hợp tác xã liên kết trực tiếp trên sàn CleanMarket.
                </p>
              </div>
            </div>

            <Row className="g-4">
              {suppliers.map((supplier) => (
                <Col key={supplier.id} md={6} lg={4}>
                  <div className="supplier-card-modern">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="bg-success-subtle text-success p-3 rounded-circle shadow-sm">
                        <Store size={22} />
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <h5 className="fw-bold mb-0 text-dark text-truncate">{supplier.name}</h5>
                        <div className="d-flex align-items-center gap-1 text-success small fw-semibold">
                          <CheckCircle2 size={13} /> Đã kiểm định VietGAP
                        </div>
                      </div>
                    </div>

                    {supplier.location && (
                      <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                        <MapPin size={14} className="text-danger flex-shrink-0" />
                        <span className="text-truncate">{supplier.location}</span>
                      </div>
                    )}

                    <p className="text-secondary small mb-3 flex-grow-1" style={{ lineHeight: 1.5 }}>
                      {supplier.description ||
                        'Nông trại đối tác cam kết tuân thủ quy trình kiểm định và cung cấp nông sản sạch.'}
                    </p>

                    <div className="pt-3 border-top mt-auto">
                      <Link
                        to={`/suppliers/${supplier.id}`}
                        className="btn btn-sm btn-outline-success rounded-pill px-3 py-2 fw-bold d-inline-flex align-items-center justify-content-between w-100"
                      >
                        <span>Xem gian hàng nhà vườn</span>
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* 7. Farm-to-Table Supply Chain Steps */}
        <section className="py-5">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="badge-chip mb-2">
              <Sparkles size={14} className="text-warning me-1" />
              Quy trình kiểm soát chất lượng
            </span>
            <h2 className="section-title mb-3">
              Chuỗi cung ứng <span className="gradient-text">từ nông trại đến bàn ăn</span>
            </h2>
            <p className="text-secondary">
              Mỗi sản phẩm trên CleanMarket đều trải qua 4 bước kiểm định nghiêm ngặt trước khi giao tới gia đình bạn.
            </p>
          </div>

          <Row className="g-4">
            {JOURNEY_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <Col key={step.title} sm={6} lg={3}>
                  <div className="step-journey-card">
                    <span className="step-number-badge">{step.step}</span>
                    <div className="step-journey-icon">
                      <Icon size={28} />
                    </div>
                    <h5 className="fw-bold mb-2">{step.title}</h5>
                    <p className="text-muted small mb-0">{step.desc}</p>
                  </div>
                </Col>
              )
            })}
          </Row>
        </section>

        {/* 8. Traceability Demonstration Banner */}
        <section id="trace-preview" className="py-4">
          <Card className="detail-card border-0 p-4 p-md-5 overflow-hidden position-relative">
            <Row className="g-4 align-items-center">
              <Col lg={7}>
                <span className="badge-chip mb-3">
                  <QrCode size={14} className="text-success me-1" />
                  Hệ thống số hóa VietGAP
                </span>
                <h3 className="display-6 fw-bold mb-3">
                  Minh bạch tuyệt đối qua <span className="gradient-text">mã truy xuất QR</span>
                </h3>
                <p className="text-secondary lead fs-6 mb-4">
                  Mỗi lô hàng đều được cấp mã QR định danh duy nhất. Khách hàng dễ dàng quét mã bằng
                  điện thoại để tra cứu nguồn gốc vùng trồng, nhật ký thu hoạch và chứng chỉ chất lượng.
                </p>

                <div className="d-flex flex-column gap-2 mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                    <span>Xem thông tin nông trại và khu vực trồng trọt kiểm định</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                    <span>Kiểm tra chứng chỉ VietGAP được liên kết theo từng lô xuất xưởng</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                    <span>Hỗ trợ gửi phản hồi và đánh giá chất lượng trực tiếp tới nhà vườn</span>
                  </div>
                </div>

                <div className="d-flex gap-3 flex-wrap">
                  <Button className="primary-btn" onClick={onOpenProducts}>
                    <span>Mua sắm nông sản ngay</span>
                    <ArrowRight size={18} />
                  </Button>
                  <Button
                    variant="outline-success"
                    className="rounded-pill px-4 py-2 fw-bold"
                    onClick={() => {
                      if (sampleTraceCodes.length > 0) {
                        navigate(`/trace/${sampleTraceCodes[0]}`)
                      } else {
                        onOpenProducts()
                      }
                    }}
                  >
                    Xem thử lô mẫu
                  </Button>
                </div>
              </Col>

              <Col lg={5} className="text-center">
                <div className="qr-panel d-inline-block p-4 rounded-4 shadow-sm bg-white border">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fcleanmarket.vn%2Fdemo"
                    alt="Mã QR Truy Xuất Nguồn Gốc CleanMarket"
                    className="qr-image mb-3 mx-auto"
                  />
                  <div className="fw-bold text-success mb-1">Mã QR truy xuất lô hàng</div>
                  <small className="text-muted d-block">Quét mã bằng điện thoại hoặc tra cứu trên web</small>
                </div>
              </Col>
            </Row>
          </Card>
        </section>
      </Container>
    </>
  )
}

export default HomePage
