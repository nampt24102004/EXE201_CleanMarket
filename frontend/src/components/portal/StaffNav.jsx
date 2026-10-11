import { Nav } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const menus = {
  MANAGER: [
    ['', 'Tổng quan'], ['suppliers', 'Duyệt nhà cung cấp'], ['products', 'Duyệt sản phẩm'],
    ['certifications', 'Chứng nhận'], ['orders', 'Đơn hàng'], ['complaints', 'Khiếu nại'], ['refunds', 'Hoàn tiền'],
  ],
  ADMIN: [
    ['', 'Tổng quan'], ['suppliers', 'Duyệt nhà cung cấp'], ['products', 'Duyệt sản phẩm'],
    ['users', 'Tài khoản'], ['categories', 'Danh mục'], ['audit-logs', 'Nhật ký'],
  ],
}

export default function StaffNav({ role, active = '' }) {
  const base = `/${role.toLowerCase()}`
  return <Nav variant="pills" className="portal-nav gap-2 mb-4">
    {menus[role].map(([path, label]) => <Nav.Item key={path}>
      <Nav.Link as={Link} to={`${base}${path ? `/${path}` : ''}`} active={active === path}>{label}</Nav.Link>
    </Nav.Item>)}
  </Nav>
}
