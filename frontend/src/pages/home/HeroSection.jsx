import { Badge, Button, Col, Container, Row, Stack } from 'react-bootstrap'

function HeroSection({ onOpenProducts }) {
  return (
    <section id="home" className="hero-section">
      <Container>
        <div className="hero-card">
          <Row className="align-items-center g-4">
            <Col lg={6}>
              <Badge pill className="organic-badge mb-3">
                Tươi sạch · Truy xuất rõ ràng
              </Badge>
              <div className="hero-kicker mb-2">Sống xanh, ăn lành</div>
              <h1 className="hero-title">Nông sản sạch từ trang trại đến bàn ăn</h1>
              <p className="lead text-secondary mb-4">
                Tìm sản phẩm theo nhà cung cấp, xem từng lô thu hoạch và đặt hàng ngay trên CleanMarket.
              </p>
              <Stack direction="horizontal" gap={3} className="flex-wrap">
                <Button className="primary-btn" size="lg" onClick={onOpenProducts}>
                  Mua ngay
                </Button>
                <div className="info-chip">QR theo từng lô hàng</div>
              </Stack>
            </Col>
            <Col lg={6}>
              <div className="hero-image-wrap">
                <div className="hero-orb"></div>
                <img
                  className="hero-image"
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                  alt="Rau hữu cơ tươi sạch"
                />
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  )
}

export default HeroSection
