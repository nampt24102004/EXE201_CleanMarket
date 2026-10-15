import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Users,
  FolderTree,
  Sliders,
  ClipboardList,
  Store,
  PackageCheck,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  LogOut,
  X,
  Shield,
} from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import { useAuth } from '../../context/useAuth'

export default function AdminSidebar({
  activeSection = '',
  summary = null,
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
      title: 'Báo cáo & Tổng quan',
      items: [
        { key: '', label: 'Bảng điều khiển', icon: LayoutDashboard },
        { key: 'revenue-reports', label: 'Báo cáo doanh thu', icon: TrendingUp },
      ],
    },
    {
      title: 'Tài chính & Thanh toán',
      items: [
        {
          key: 'payments',
          label: 'Giao dịch & Đối soát',
          icon: CreditCard,
          badge: summary?.stalePendingPayments > 0 ? `${summary.stalePendingPayments} treo` : null,
          badgeVariant: 'danger',
        },
      ],
    },
    {
      title: 'Hệ thống & Người dùng',
      items: [
        { key: 'users', label: 'Tài khoản & Nhân sự', icon: Users },
        { key: 'categories', label: 'Danh mục nông sản', icon: FolderTree },
        { key: 'settings', label: 'Cấu hình hệ thống', icon: Sliders },
        { key: 'audit-logs', label: 'Nhật ký an toàn', icon: ClipboardList },
      ],
    },
    {
      title: 'Vận hành toàn sàn',
      items: [
        {
          key: 'suppliers',
          label: 'Duyệt nhà cung cấp',
          icon: Store,
          badge: summary?.pendingSuppliers > 0 ? summary.pendingSuppliers : null,
          badgeVariant: 'warning',
        },
        {
          key: 'products',
          label: 'Danh sách & Duyệt sản phẩm',
          icon: PackageCheck,
          badge: summary?.pendingProducts > 0 ? summary.pendingProducts : null,
          badgeVariant: 'primary',
        },
        { key: 'orders', label: 'Tất cả đơn hàng', icon: ShoppingBag },
        {
          key: 'complaints',
          label: 'Khiếu nại khách hàng',
          icon: AlertTriangle,
          badge: summary?.pendingComplaints > 0 ? summary.pendingComplaints : null,
          badgeVariant: 'warning',
        },
        {
          key: 'refunds',
          label: 'Yêu cầu hoàn tiền',
          icon: RotateCcw,
          badge: summary?.requestedRefunds > 0 ? summary.requestedRefunds : null,
          badgeVariant: 'danger',
        },
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
          <BrandLogo size="sm" theme="dark" to="/admin" />
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
                    to={item.key ? `/admin/${item.key}` : '/admin'}
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

        {/* Footer with User info & Exit store link */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold small text-white text-truncate">
                {user?.name || user?.email}
              </div>
              <span className="badge bg-success bg-opacity-75" style={{ fontSize: '0.65rem' }}>
                <Shield size={10} className="me-1 inline-block" /> ADMIN CẤP CAO
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
