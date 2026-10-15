import { Badge, Col, Container, Row, Card } from 'react-bootstrap'
import { useParams, Link } from 'react-router-dom'
import ProductCard from '../../components/product/ProductCard'
import { Store, MapPin, ArrowLeft } from 'lucide-react'

export default function SupplierPage({ products, suppliers, onSelectProduct, onAddToCart }) {
  const { id } = useParams()
  const supplier = suppliers.find((item) => String(item.id) === id)

  if (!supplier)
    return (
      <Container className="py-5 text-center">
        <h2 className="section-title mb-3">Không tìm thấy nhà cung cấp</h2>
        <Link to="/products" className="btn btn-outline-success rounded-pill px-4">
          Khám phá danh mục nông sản
        </Link>
      </Container>
    )

  const supplierProducts = products.filter((item) => String(item.supplierId) === id)

  return (
    <Container className="py-4 py-md-5">
      <Link to="/products" className="btn btn-sm btn-light border rounded-pill mb-3 d-inline-flex align-items-center gap-1">
        <ArrowLeft size={14} /> Tất cả sản phẩm
      </Link>

      {/* Supplier Profile Banner */}
      <Card className="detail-card border-0 p-4 p-md-5 mb-5 shadow-sm">
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="badge-chip">
            <Store size={14} className="text-success" />
            Nông trại thành viên CleanMarket
          </span>
          <Badge bg="success" pill className="px-3 py-1">
            ✓ Đã xác minh VietGAP
          </Badge>
        </div>

        <h1 className="display-6 fw-bold mb-2 text-dark">{supplier.name}</h1>

        <div className="d-flex align-items-center gap-2 text-success fw-semibold mb-3">
          <MapPin size={16} />
          <span>{supplier.location || 'Khu vực canh tác chuẩn an toàn'}</span>
        </div>

        <p className="text-secondary lead fs-6 mb-0 max-w-700">
          {supplier.description ||
            'Nông trại chuyên canh theo tiêu chuẩn thực hành nông nghiệp tốt VietGAP, áp dụng công nghệ tưới nhỏ giọt và kiểm soát sâu bệnh sinh học.'}
        </p>
      </Card>

      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
        <div>
          <div className="hero-kicker mb-1">Nông sản thu hoạch</div>
          <h2 className="section-title mb-0">
            Sản phẩm từ <span className="gradient-text">{supplier.name}</span>
          </h2>
        </div>
        <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
          {supplierProducts.length} mặt hàng đang mở bán
        </span>
      </div>

      <Row className="g-4">
        {supplierProducts.map((item) => (
          <Col md={6} xl={4} key={item.id}>
            <ProductCard
              product={item}
              onSelectProduct={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          </Col>
        ))}
      </Row>
    </Container>
  )
}