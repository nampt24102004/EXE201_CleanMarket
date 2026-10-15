import { Button, Container, Nav, Navbar } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { ShoppingBag, User, LogOut, Store, ShieldCheck, PhoneCall, Sparkles } from 'lucide-react'
import BrandLogo from '../common/BrandLogo'

function Header({ cartCount }) {
  const { user, hasRole, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const dashboard = hasRole('ADMIN')
    ? '/admin'
    : hasRole('MANAGER')
    ? '/manager'
    : hasRole('PARTNER')
    ? '/partner'
    : '/orders'

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-announcement-bar d-none d-md-block">
        <Container className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="announcement-badge">
              <Sparkles size={12} className="me-1 inline-block" />
              Ưu đãi hôm nay
            </span>
            <span>Miễn phí vận chuyển cho đơn từ 200.000₫ • Cam kết 100% tươi sạch chuẩn VietGAP</span>
          </div>
          <div className="d-flex align-items-center gap-3 text-white-50 small">
            <span className="d-flex align-items-center gap-1 text-white">
              <PhoneCall size={13} /> Hotline: <strong>0358 755 719</strong>
            </span>
            <span>|</span>
            <span className="d-flex align-items-center gap-1 text-white">
              <ShieldCheck size={14} className="text-warning" /> Truy xuất QR từng lô hàng
            </span>
          </div>
        </Container>
      </div>

      {/* Main Sticky Navbar */}
      <Navbar expand="lg" sticky="top" className="site-navbar py-2 py-lg-3">
        <Container>
          <Navbar.Brand as="div" className="border-0 bg-transparent p-0">
            <BrandLogo size="md" />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="organic-navbar-nav" className="border-0 shadow-none" />

          <Navbar.Collapse id="organic-navbar-nav">
            <Nav className="mx-auto align-items-lg-center gap-lg-1 my-2 my-lg-0">
              <Nav.Link
                as={Link}
                to="/"
                className={`nav-link-custom ${location.pathname === '/' ? 'active' : ''}`}
              >
                Trang chủ
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/products"
                className={`nav-link-custom ${location.pathname.startsWith('/products') ? 'active' : ''}`}
              >
                Nông sản sạch
              </Nav.Link>
              {user && (
                <Nav.Link
                  as={Link}
                  to={dashboard}
                  className={`nav-link-custom ${location.pathname.startsWith(dashboard) ? 'active' : ''}`}
                >
                  {hasRole('PARTNER') || hasRole('MANAGER') || hasRole('ADMIN')
                    ? 'Bảng điều khiển'
                    : 'Đơn mua của tôi'}
                </Nav.Link>
              )}
              {user && hasRole('USER') && !hasRole('PARTNER') && (
                <Nav.Link as={Link} to="/partner/register" className="nav-link-custom">
                  <Store size={15} className="me-1 inline-block" />
                  Hợp tác nông trại
                </Nav.Link>
              )}
              {!user && (
                <Nav.Link as={Link} to="/register?type=supplier" className="nav-link-custom">
                  <Store size={15} className="me-1 inline-block" />
                  Mở gian hàng
                </Nav.Link>
              )}
              <Nav.Link href="#contact" className="nav-link-custom">
                Liên hệ
              </Nav.Link>
            </Nav>

            {/* Right Action Buttons */}
            <div className="d-flex align-items-center gap-2 pt-2 pt-lg-0">
              {(!user || hasRole('USER')) && (
                <Link to="/cart" className="cart-nav-btn text-decoration-none">
                  <ShoppingBag size={18} className="text-success" />
                  <span className="d-none d-sm-inline">Giỏ hàng</span>
                  {cartCount > 0 && (
                    <span className="cart-badge-bounce">{cartCount}</span>
                  )}
                </Link>
              )}

              {user ? (
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to={hasRole('USER') ? '/profile' : dashboard}
                    className="btn btn-light rounded-pill px-3 py-2 d-flex align-items-center gap-2 border fw-semibold text-dark text-decoration-none"
                  >
                    <User size={16} className="text-success" />
                    <span className="d-none d-md-inline">{user.name}</span>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="rounded-pill p-2 d-flex align-items-center justify-content-center"
                    title="Đăng xuất"
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Link to="/login" className="btn btn-outline-success rounded-pill px-3 py-2 fw-semibold">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="primary-btn py-2 px-3 fw-bold">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

export default Header
