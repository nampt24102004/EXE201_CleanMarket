import { Nav } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const items = [
  ['', 'Tổng quan'],
  ['profile', 'Hồ sơ'],
  ['products', 'Sản phẩm'],
  ['batches', 'Lô hàng & QR'],
  ['orders', 'Đơn của tôi'],
]

export default function PartnerNav({ active = '' }) {
  return <Nav variant="pills" className="portal-nav gap-2 mb-4">
    {items.map(([path, label]) => <Nav.Item key={path}>
      <Nav.Link as={Link} to={`/partner${path ? `/${path}` : ''}`} active={active === path}>{label}</Nav.Link>
    </Nav.Item>)}
  </Nav>
}
