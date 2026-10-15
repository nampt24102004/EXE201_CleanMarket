import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sprout,
  QrCode,
  ShoppingBag,
  Tag,
  Store,
  ExternalLink,
  LogOut,
  X,
  PlusCircle,
} from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import { useAuth } from '../../context/useAuth'

export default function PartnerSidebar({
  activeSection = '',
  stats = {},
  profile = null,
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
      title: 'Tổng quan nhà vườn',
      items: [
        { key: '', label: 'Bảng điều khiển', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Nông sản & Truy xuất',
      items: [
        {
          key: 'products',
          label: 'Nông sản của tôi',
          icon: Sprout,
          badge: stats.pendingProducts > 0 ? `${stats.pendingProducts} chờ` : null,
          badgeVariant: 'warning',
        },
        {
          key: 'batches',
          label: 'Lô hàng & Mã QR',
          icon: QrCode,
          badge: stats.totalBatches > 0 ? stats.totalBatches : null,
          badgeVariant: 'primary',
        },
      ],
    },
    {
      title: 'Đơn hàng & Bán hàng',
      items: [
        {
          key: 'orders',
          label: 'Đơn hàng cung ứng',
          icon: ShoppingBag,
          badge: stats.pendingOrders > 0 ? stats.pendingOrders : null,
          badgeVariant: 'danger',
        },
        {
          key: 'vouchers',
          label: 'Voucher nhà vườn',
          icon: Tag,
        },
      ],
    },
    {
      title: 'Hồ sơ & Pháp lý',
      items: [
        {
          key: 'profile',
          label: 'Hồ sơ & Giấy tờ',
          icon: Store,
          badge: profile?.status === 'APPROVED' ? 'Đã duyệt' : 'Đang xử lý',
          badgeVariant: profile?.status === 'APPROVED' ? 'success' : 'warning',
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
          <BrandLogo size="sm" theme="dark" to="/partner" />
          <button
            className="btn btn-link text-white-50 p-0 d-lg-none"
            onClick={onClose}
            aria-label="Đóng thanh điều hướng"
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
                    to={item.key ? `/partner/${item.key}` : '/partner'}
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
                      <span className={`admin-nav-badge bg-${item.badgeVariant || 'primary'} text-white`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer with Partner User & Farm info */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'P'}
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold small text-white text-truncate">
                {profile?.name || user?.name || user?.email}
              </div>
              <span className="badge bg-success bg-opacity-75" style={{ fontSize: '0.65rem' }}>
                <PlusCircle size={10} className="me-1 inline-block" /> ĐỐI TÁC NÔNG SẢN
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
