import { Container, Row, Col, Stack } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react'
import BrandLogo from '../common/BrandLogo'

function Footer() {
  return (
    <footer id="contact" className="footer mt-5 pt-5 pb-4">
      <Container>
        <Row className="g-4 mb-5">
          {/* Brand Info */}
          <Col lg={4} md={6}>
            <div className="mb-3">
              <BrandLogo size="md" theme="dark" />
            </div>
            <p className="contact-block pe-lg-3 mb-4">
              Nền tảng thương mại điện tử kết nối người tiêu dùng với các nông trại hữu cơ đạt chuẩn VietGAP & GlobalGAP.
              Mỗi sản phẩm đều truy xuất nguồn gốc minh bạch theo từng lô thu hoạch.
            </p>
            <div className="d-flex align-items-center gap-2 text-white-50 small">
              <ShieldCheck size={18} className="text-success" />
              <span>Chứng nhận chuỗi nông sản an toàn vệ sinh thực phẩm</span>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} sm={6}>
            <h6 className="text-white fw-bold mb-3 text-uppercase" style={{ letterSpacing: '0.05em' }}>
              Khám phá
            </h6>
            <Stack gap={2}>
              <Link to="/" className="text-decoration-none">Trang chủ</Link>
              <Link to="/products" className="text-decoration-none">Nông sản sạch</Link>
              <Link to="/products" className="text-decoration-none">Rau ăn lá tươi</Link>
              <Link to="/products" className="text-decoration-none">Củ quả hữu cơ</Link>
              <Link to="/products" className="text-decoration-none">Trái cây nhiệt đới</Link>
            </Stack>
          </Col>

          {/* For Partners & Policies */}
          <Col lg={3} sm={6}>
            <h6 className="text-white fw-bold mb-3 text-uppercase" style={{ letterSpacing: '0.05em' }}>
              Đối tác & Hỗ trợ
            </h6>
            <Stack gap={2}>
              <Link to="/partner/register" className="text-decoration-none">Đăng ký nhà vườn đối tác</Link>
              <Link to="/login" className="text-decoration-none">Cổng thông tin nhà cung cấp</Link>
              <a href="#trace-preview" className="text-decoration-none">Tra cứu mã QR lô hàng</a>
              <a href="#contact" className="text-decoration-none">Chính sách đổi trả 24h</a>
              <a href="#contact" className="text-decoration-none">Chính sách giao hàng 2h</a>
            </Stack>
          </Col>

          {/* Contact Details */}
          <Col lg={3} md={6}>
            <h6 className="text-white fw-bold mb-3 text-uppercase" style={{ letterSpacing: '0.05em' }}>
              Thông tin liên hệ
            </h6>
            <Stack gap={3} className="contact-block">
              <div className="d-flex align-items-start gap-2">
                <MapPin size={18} className="text-warning flex-shrink-0 mt-1" />
                <span>Khu Công nghệ cao Hòa Lạc, Hà Nội</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Phone size={18} className="text-warning flex-shrink-0" />
                <span>Hotline: <strong>0358 755 719</strong></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Mail size={18} className="text-warning flex-shrink-0" />
                <span>cleanmarket101@gmail.com</span>
              </div>
            </Stack>
          </Col>
        </Row>

        {/* Bottom Bar */}
        <hr className="border-secondary opacity-25 my-4" />
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 small text-white-50">
          <div>
            © {new Date().getFullYear()} CleanMarket. Bảo lưu mọi quyền. Nông sản sạch cho gia đình Việt.
          </div>
          <div className="d-flex align-items-center gap-2">
            <span>Được thiết kế với</span>
            <Heart size={14} className="text-danger fill-danger" />
            <span>vì sức khỏe cộng đồng</span>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
