import { Badge, Button, Card, Col, Container, Row, Stack } from 'react-bootstrap'
import HeroSection from './HeroSection'
import ProductCard from '../../components/product/ProductCard'
import PageTitle from '../../components/common/PageTitle'

const categoryHighlights = [
  {
    title: 'Rau lá tươi mỗi ngày',
    description:
      'Các loại rau cải, xà lách và rau ăn lá được thu hoạch trong ngày, phù hợp cho bữa ăn gia đình.',
    tag: 'Danh mục nổi bật',
  },
  {
    title: 'Củ quả chuẩn hữu cơ',
    description:
      'Cà rốt, bí đỏ, cà chua và nhiều nông sản sạch được chọn lọc từ nông trại uy tín.',
    tag: 'Được ưa chuộng',
  },
  {
    title: 'Truy xuất nguồn gốc rõ ràng',
    description:
      'Mỗi sản phẩm đều có thông tin trang trại, mã lô và QR để người dùng kiểm tra trước khi mua.',
    tag: 'Minh bạch',
  },
]

const promotions = [
  'Tìm sản phẩm từ các nhà cung cấp đã xác minh.',
  'Xem thông tin nguồn gốc theo từng lô hàng.',
  'Theo dõi đơn và gửi đánh giá sau khi nhận hàng.',
]

function HomePage({ products, onSelectProduct, onAddToCart, onOpenProducts }) {
  const featuredProducts = products.slice(0, 3)

  return (
    <>
      <HeroSection onOpenProducts={onOpenProducts} />

      <Container className="pb-5">
        <section className="py-4">
          <PageTitle
            eyebrow="Giới thiệu nhanh"
            title="Clean Market mang nông sản sạch đến gần hơn với gia đình Việt"
            description="Khám phá nông sản, nhà cung cấp và thông tin truy xuất trong một trải nghiệm dễ dùng."
          />
          <Row className="g-4">
            {categoryHighlights.map((item) => (
              <Col key={item.title} md={6} xl={4}>
                <Card className="home-feature-card border-0 h-100 p-3">
                  <Card.Body>
                    <Badge pill className="organic-badge mb-3">
                      {item.tag}
                    </Badge>
                    <h4 className="mb-3">{item.title}</h4>
                    <p className="text-secondary mb-0">{item.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="py-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <PageTitle
              eyebrow="Sản phẩm nổi bật"
              title="Gợi ý nhanh cho khách ghé thăm lần đầu"
              description="Khám phá lựa chọn nổi bật, rồi tìm kiếm thêm trong danh sách sản phẩm."
            />
            <Button className="primary-btn" onClick={onOpenProducts}>
              Xem tất cả sản phẩm
            </Button>
          </div>
          <Row className="g-4">
            {featuredProducts.map((product) => (
              <Col key={product.id} md={6} xl={4}>
                <ProductCard
                  product={product}
                  onSelectProduct={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              </Col>
            ))}
          </Row>
        </section>

        <section className="py-4">
          <div className="promo-banner p-4 p-md-5">
            <Row className="g-4 align-items-center">
              <Col lg={7}>
                <Badge pill className="organic-badge mb-3">
                  CleanMarket demo
                </Badge>
                <h3 className="mb-3">Mua sắm minh bạch hơn</h3>
                <Stack gap={3}>
                  {promotions.map((promotion) => (
                    <div key={promotion} className="promo-item">
                      {promotion}
                    </div>
                  ))}
                </Stack>
              </Col>
              <Col lg={5}>
                <div className="soft-panel p-4">
                  <h5 className="mb-3">Khi nào nên vào trang Sản phẩm?</h5>
                  <p className="text-secondary mb-4">
                    Khi bạn muốn xem toàn bộ danh mục, đọc kỹ thông tin từng món, tra
                    cứu nguồn gốc và bắt đầu mua hàng.
                  </p>
                  <Button className="primary-btn" onClick={onOpenProducts}>
                    Đi đến trang Sản phẩm
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </section>
      </Container>
    </>
  )
}

export default HomePage
