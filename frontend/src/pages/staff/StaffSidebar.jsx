import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  PackageCheck,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  Tag,
  Truck,
  ExternalLink,
  LogOut,
  X,
  UserCheck,
} from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import { useAuth } from '../../context/useAuth'

export default function StaffSidebar({
  activeSection = '',
  pendingCounts = {},
  isOpen = false,
  onClose = () => {},
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  const navGroups = [
    {
      title: 'Tổng quan vận hành',
      items: [
        { key: '', label: 'Bảng điều khiển', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Kiểm định đối tác & Nông sản',
      items: [
        {
          key: 'suppliers',
          label: 'Duyệt nhà cung cấp',
          icon: Store,
          badge: pendingCounts.suppliers > 0 ? pendingCounts.suppliers : null,
          badgeVariant: 'warning',
        },
        {
          key: 'products',
          label: 'Danh sách & Duyệt sản phẩm',
          icon: PackageCheck,
          badge: pendingCounts.products > 0 ? pendingCounts.products : null,
          badgeVariant: 'primary',
        },
      ],
    },
    {
      title: 'Đơn hàng & Chăm sóc khách',
      items: [
        { key: 'orders', label: 'Tất cả đơn hàng', icon: ShoppingBag },
        {
          key: 'complaints',
          label: 'Khiếu nại khách hàng',
          icon: AlertTriangle,
          badge: pendingCounts.complaints > 0 ? pendingCounts.complaints : null,
          badgeVariant: 'warning',
        },
        {
          key: 'refunds',
          label: 'Yêu cầu hoàn tiền',
          icon: RotateCcw,
          badge: pendingCounts.refunds > 0 ? pendingCounts.refunds : null,
          badgeVariant: 'danger',
        },
      ],
    },
    {
      title: 'Khuyến mãi & Vận chuyển',
      items: [
        { key: 'vouchers', label: 'Voucher khuyến mãi sàn', icon: Tag },
        { key: 'shipping-zones', label: 'Biểu phí giao hàng', icon: Truck },
      ],
    },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
      />

      <aside className={`admin-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <BrandLogo size="sm" theme="dark" to="/manager" />
          <button
            className="btn btn-link text-white-50 p-0 d-lg-none"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="admin-sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-2">
              <div className="admin-nav-group-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.key

                return (
                  <Link
                    key={item.key}
                    to={item.key ? `/manager/${item.key}` : '/manager'}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth < 992) onClose()
                    }}
                  >
                    <div className="admin-nav-item-left">
                      <Icon className="admin-nav-icon" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`admin-nav-badge bg-${item.badgeVariant || 'danger'} text-white`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer with Staff User info */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'M'}
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold small text-white text-truncate">
                {user?.name || user?.email}
              </div>
              <span className="badge bg-primary bg-opacity-75" style={{ fontSize: '0.65rem' }}>
                <UserCheck size={10} className="me-1 inline-block" /> STAFF VẬN HÀNH
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link
              to="/"
              className="btn btn-sm btn-outline-light w-100 d-flex align-items-center justify-content-center gap-1"
              style={{ fontSize: '0.78rem' }}
            >
              <ExternalLink size={13} />
              <span>Về sàn mua hàng</span>
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center px-2"
              title="Đăng xuất"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
