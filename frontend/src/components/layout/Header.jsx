import { Badge, Button, Container, Nav, Navbar } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

function Header({ cartCount }) {
  const { user, hasRole, logout } = useAuth()
  const navigate = useNavigate()
  const dashboard = hasRole('ADMIN') ? '/admin' : hasRole('MANAGER') ? '/manager' : hasRole('PARTNER') ? '/partner' : '/orders'
  return <Navbar expand="lg" sticky="top" className="site-navbar py-3"><Container>
    <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-3 fw-bold border-0 bg-transparent p-0"><span className="brand-mark">CM</span><span>Clean Market</span></Navbar.Brand>
    <Navbar.Toggle aria-controls="organic-navbar-nav" /><Navbar.Collapse id="organic-navbar-nav"><Nav className="ms-auto align-items-lg-center gap-lg-3">
      <Nav.Link as={Link} to="/" className="nav-link-custom">Trang chủ</Nav.Link>
      <Nav.Link as={Link} to="/products" className="nav-link-custom">Sản phẩm</Nav.Link>
      {user && <Nav.Link as={Link} to={dashboard} className="nav-link-custom">{hasRole('PARTNER')||hasRole('MANAGER')||hasRole('ADMIN')?'Bảng điều khiển':'Đơn hàng'}</Nav.Link>}
      {user && hasRole('USER') && !hasRole('PARTNER') && <Nav.Link as={Link} to="/partner/register" className="nav-link-custom">Đăng ký nhà cung cấp</Nav.Link>}
      {!user && <Nav.Link as={Link} to="/register?type=supplier" className="nav-link-custom">Đăng ký nhà cung cấp</Nav.Link>}
      <Nav.Link href="#contact" className="nav-link-custom">Liên hệ</Nav.Link>
      {(!user||hasRole('USER'))&&<Nav.Link as={Link} to="/cart" className="nav-link-custom d-flex align-items-center gap-2">Giỏ hàng<Badge pill bg="success">{cartCount}</Badge></Nav.Link>}
      {user?<><Nav.Link as={Link} to={hasRole('USER')?'/profile':dashboard} className="nav-link-custom">{user.name}</Nav.Link><Button size="sm" variant="outline-success" className="rounded-pill" onClick={()=>{logout();navigate('/')}}>Đăng xuất</Button></>:<Nav.Link as={Link} to="/login" className="nav-link-custom">Đăng nhập</Nav.Link>}
    </Nav></Navbar.Collapse>
  </Container></Navbar>
}
export default Header
