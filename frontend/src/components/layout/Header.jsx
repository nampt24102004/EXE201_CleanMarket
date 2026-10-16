import { useState, useEffect } from 'react'
import { Container, Dropdown, Nav, Navbar } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import {
  ShoppingBag,
  User,
  LogOut,
  Store,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  Package,
  RotateCcw,
  LayoutDashboard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import NotificationBell from '../notifications/NotificationBell'
import BrandLogo from '../common/BrandLogo'
import { api } from '../../services/apiClient'

const DEFAULT_BANNERS = [
  {
    id: 'default-1',
    badgeText: 'Ưu đãi hôm nay',
    title: 'Miễn phí vận chuyển theo ngưỡng từng khu vực • Cam kết 100% tươi sạch chuẩn VietGAP',
    linkUrl: '/products',
    themeStyle: 'ORGANIC_EMERALD',
    animationEffect: 'BOUNCE_BADGE',
    hotline: '0358 755 719',
  },
  {
    id: 'default-2',
    badgeText: 'Freeship 15K',
    title: 'Nhập mã CLEANFREESHIP giảm ngay 15.000đ phí giao hàng cho đơn từ 150.000đ',
    linkUrl: '/products',
    themeStyle: 'SUNSET_ORANGE',
    animationEffect: 'PULSE_GLOW',
    hotline: '0358 755 719',
  },
  {
    id: 'default-3',
    badgeText: 'Giao 2 Giờ',
    title: 'Nông sản thu hoạch sớm trong ngày - Giao siêu tốc 2H khu vực nội thành',
    linkUrl: '/products',
    themeStyle: 'ROYAL_GOLD',
    animationEffect: 'SLIDE_HORIZONTAL',
    hotline: '0358 755 719',
  },
]

const THEME_GRADIENTS = {
  ORGANIC_EMERALD: 'linear-gradient(90deg, #14532d, #16a34a 50%, #15803d)',
  SUNSET_ORANGE: 'linear-gradient(90deg, #9a3412, #ea580c 50%, #c2410c)',
  ROYAL_GOLD: 'linear-gradient(90deg, #713f12, #ca8a04 50%, #854d0e)',
  OCEAN_BLUE: 'linear-gradient(90deg, #1e3a8a, #2563eb 50%, #1d4ed8)',
  NEON_FOREST: 'linear-gradient(90deg, #064e3b, #059669 40%, #10b981 70%, #064e3b)',
}

const EFFECT_CLASSES = {
  BOUNCE_BADGE: 'badge-bounce-anim',
  PULSE_GLOW: 'badge-glow-anim',
  FADE: 'badge-fade-anim',
  SLIDE_HORIZONTAL: 'badge-pulse-soft',
  MARQUEE: 'badge-marquee-anim',
}

function Header({ cartCount }) {
  const { user, hasRole, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Dynamic Banners State
  const [banners, setBanners] = useState(DEFAULT_BANNERS)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [isBannerHovered, setIsBannerHovered] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchBanners = async () => {
      try {
        const res = await api.get('/api/public/banners?position=TOP_BAR')
        if (isMounted && Array.isArray(res) && res.length > 0) {
          setBanners(res)
        }
      } catch {
        // Fallback to default banners
      }
    }
    void fetchBanners()
    return () => {
      isMounted = false
    }
  }, [])

  // Auto-cycle banner every 5.5 seconds
  useEffect(() => {
    if (banners.length <= 1 || isBannerHovered) return undefined
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5500)
    return () => clearInterval(interval)
  }, [banners.length, isBannerHovered])

  const currentBanner = banners[bannerIndex] || banners[0] || DEFAULT_BANNERS[0]
  const bannerGradient =
    THEME_GRADIENTS[currentBanner.themeStyle] ||
    currentBanner.bgColor ||
    THEME_GRADIENTS.ORGANIC_EMERALD
  const effectClass = EFFECT_CLASSES[currentBanner.animationEffect] || 'badge-pulse-soft'

  const dashboard = hasRole('ADMIN')
    ? '/admin'
    : hasRole('MANAGER')
    ? '/manager'
    : hasRole('PARTNER')
    ? '/partner'
    : '/orders'

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : 'U'

  return (
    <>
      {/* Top Announcement Bar (Dynamic & Eye-catching) */}
      <div
        className="top-announcement-bar d-none d-md-block"
        style={{ background: bannerGradient }}
        onMouseEnter={() => setIsBannerHovered(true)}
        onMouseLeave={() => setIsBannerHovered(false)}
      >
        <Container fluid="xxl" className="px-3 px-xl-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate pe-3">
            {banners.length > 1 && (
              <div className="d-flex align-items-center gap-1 me-1">
                <button
                  type="button"
                  className="banner-nav-arrow"
                  onClick={() =>
                    setBannerIndex((prev) => (prev > 0 ? prev - 1 : banners.length - 1))
                  }
                  title="Ưu đãi trước"
                  aria-label="Previous banner"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  className="banner-nav-arrow"
                  onClick={() =>
                    setBannerIndex((prev) => (prev + 1) % banners.length)
                  }
                  title="Ưu đãi tiếp theo"
                  aria-label="Next banner"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {currentBanner.badgeText && (
              <span className={`announcement-badge ${effectClass}`}>
                <Sparkles size={12} className="me-1 inline-block text-warning" />
                {currentBanner.badgeText}
              </span>
            )}

            {currentBanner.linkUrl ? (
              <Link
                to={currentBanner.linkUrl}
                className="top-announcement-link text-truncate"
                title={currentBanner.title}
              >
                <span className="text-truncate">{currentBanner.title}</span>
                <ExternalLink size={12} className="opacity-75 flex-shrink-0" />
              </Link>
            ) : (
              <span className="text-truncate">{currentBanner.title}</span>
            )}
          </div>

          <div className="d-flex align-items-center gap-3 text-white-50 small flex-shrink-0">
            {currentBanner.hotline && (
              <a
                href={`tel:${currentBanner.hotline.replace(/\s+/g, '')}`}
                className="d-flex align-items-center gap-1 text-white text-decoration-none"
              >
                <PhoneCall size={13} className="text-warning" />
                <span>
                  Hotline: <strong>{currentBanner.hotline}</strong>
                </span>
              </a>
            )}
            <span>|</span>
            <span className="d-flex align-items-center gap-1 text-white">
              <ShieldCheck size={14} className="text-warning" /> Truy xuất QR từng lô hàng
            </span>
          </div>
        </Container>
      </div>

      {/* Main Sticky Navbar */}
      <Navbar expand="lg" sticky="top" className="site-navbar py-2 py-lg-3">
        <Container fluid="xxl" className="px-3 px-xl-4">
          <Navbar.Brand as="div" className="border-0 bg-transparent p-0 flex-shrink-0">
            <BrandLogo size="md" />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="organic-navbar-nav" className="border-0 shadow-none" />

          <Navbar.Collapse id="organic-navbar-nav">
            <Nav className="mx-auto align-items-lg-center gap-1 gap-xl-2 my-2 my-lg-0">
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
                  {hasRole('PARTNER') || hasRole('MANAGER') || hasRole('ADMIN') ? (
                    <>
                      <LayoutDashboard size={15} className="me-1 inline-block text-success flex-shrink-0" />
                      <span>Bảng điều khiển</span>
                    </>
                  ) : (
                    <>
                      <Package size={15} className="me-1 inline-block text-success flex-shrink-0" />
                      <span>Đơn mua</span>
                    </>
                  )}
                </Nav.Link>
              )}

              {user && hasRole('USER') && !hasRole('PARTNER') && !hasRole('MANAGER') && !hasRole('ADMIN') && (
                <Nav.Link
                  as={Link}
                  to="/refunds"
                  className={`nav-link-custom ${location.pathname.startsWith('/refunds') ? 'active' : ''}`}
                >
                  <RotateCcw size={14} className="me-1 inline-block text-warning flex-shrink-0" />
                  <span>Hoàn tiền</span>
                </Nav.Link>
              )}

              {user && hasRole('USER') && !hasRole('PARTNER') && (
                <Nav.Link as={Link} to="/partner/register" className="nav-link-custom">
                  <Store size={15} className="me-1 inline-block text-success flex-shrink-0" />
                  <span>Hợp tác nông trại</span>
                </Nav.Link>
              )}

              {!user && (
                <Nav.Link as={Link} to="/register?type=supplier" className="nav-link-custom">
                  <Store size={15} className="me-1 inline-block text-success flex-shrink-0" />
                  <span>Mở gian hàng</span>
                </Nav.Link>
              )}

              <Nav.Link href="#contact" className="nav-link-custom">
                Liên hệ
              </Nav.Link>
            </Nav>

            {/* Right Action Group */}
            <div className="d-flex align-items-center gap-2 gap-sm-3 pt-2 pt-lg-0 flex-shrink-0">
              {(!user || hasRole('USER')) && (
                <Link to="/cart" className="cart-nav-btn text-decoration-none" title="Xem giỏ hàng">
                  <div className="cart-icon-wrapper position-relative d-flex align-items-center">
                    <ShoppingBag size={18} className="text-success" />
                    {cartCount > 0 && (
                      <span className="cart-badge-bounce d-inline-flex d-sm-none">{cartCount}</span>
                    )}
                  </div>
                  <span className="d-none d-sm-inline fw-bold text-dark">Giỏ hàng</span>
                  {cartCount > 0 && (
                    <span className="cart-badge-bounce d-none d-sm-inline-flex">{cartCount}</span>
                  )}
                </Link>
              )}

              {user ? (
                <div className="d-flex align-items-center gap-2">
                  <NotificationBell />

                  <Dropdown align="end">
                    <Dropdown.Toggle
                      as="button"
                      className="header-user-btn"
                      aria-label="Tài khoản cá nhân"
                    >
                      <div className="header-user-avatar">
                        {userInitial}
                      </div>
                      <span className="header-user-name d-none d-md-inline">{user.name}</span>
                      <ChevronDown size={14} className="text-secondary ms-1 header-user-chevron" />
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="header-dropdown-menu header-user-menu shadow-lg">
                      <div className="px-3 py-2 border-bottom mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="header-user-avatar" style={{ width: 36, height: 36, fontSize: '0.95rem' }}>
                            {userInitial}
                          </div>
                          <div className="overflow-hidden">
                            <div className="fw-bold text-dark text-truncate small">{user.name}</div>
                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span
                            className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                          >
                            {hasRole('ADMIN')
                              ? 'Quản trị viên'
                              : hasRole('MANAGER')
                              ? 'Quản lý vận hành'
                              : hasRole('PARTNER')
                              ? 'Đối tác nhà vườn'
                              : 'Khách hàng'}
                          </span>
                        </div>
                      </div>

                      <Dropdown.Item
                        as={Link}
                        to={hasRole('USER') ? '/profile' : dashboard}
                        className="header-menu-item"
                      >
                        <User size={16} className="text-success" />
                        <span>Hồ sơ tài khoản</span>
                      </Dropdown.Item>

                      {hasRole('USER') && (
                        <Dropdown.Item as={Link} to="/orders" className="header-menu-item">
                          <Package size={16} className="text-primary" />
                          <span>Đơn mua của tôi</span>
                        </Dropdown.Item>
                      )}

                      {user && hasRole('USER') && !hasRole('PARTNER') && !hasRole('MANAGER') && !hasRole('ADMIN') && (
                        <Dropdown.Item as={Link} to="/refunds" className="header-menu-item">
                          <RotateCcw size={16} className="text-warning" />
                          <span>Yêu cầu hoàn tiền</span>
                        </Dropdown.Item>
                      )}

                      {(hasRole('PARTNER') || hasRole('MANAGER') || hasRole('ADMIN')) && (
                        <Dropdown.Item as={Link} to={dashboard} className="header-menu-item">
                          <LayoutDashboard size={16} className="text-info" />
                          <span>Bảng điều khiển quản trị</span>
                        </Dropdown.Item>
                      )}

                      <Dropdown.Divider className="my-1" />

                      <Dropdown.Item
                        as="button"
                        className="header-menu-item text-danger"
                        onClick={() => {
                          logout()
                          navigate('/')
                        }}
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to="/login"
                    className="btn btn-outline-success rounded-pill px-3 py-2 fw-semibold text-nowrap"
                    style={{ fontSize: '0.88rem' }}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="primary-btn py-2 px-3 fw-bold rounded-pill text-decoration-none text-nowrap"
                    style={{ fontSize: '0.88rem' }}
                  >
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
