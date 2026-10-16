import { Button } from 'react-bootstrap'
import {
  Menu,
  RefreshCw,
  Bell,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const sectionTitles = {
  '': 'Bảng điều khiển & Thống kê KPI',
  'revenue-reports': 'Báo cáo doanh thu & Top nông sản',
  'payments': 'Quản lý thanh toán & Đối soát PayOS',
  'users': 'Quản lý người dùng & Phân quyền nhân sự',
  'categories': 'Danh mục nông sản & Phân loại',
  'shipping': 'Khu vực & Phí giao hàng',
  'settings': 'Cấu hình tham số hệ thống',
  'audit-logs': 'Nhật ký kiểm toán an toàn (Audit Logs)',
  'suppliers': 'Duyệt hồ sơ nhà cung cấp đối tác',
  'products': 'Danh sách & Quản lý nông sản',
  'orders': 'Quản lý toàn bộ đơn hàng sàn',
  'complaints': 'Xử lý khiếu nại khách hàng',
  'refunds': 'Quản lý hoàn tiền thủ công',
}

export default function AdminTopbar({
  activeSection = '',
  summary = null,
  onToggleSidebar = () => {},
  onRefresh = () => {},
  refreshing = false,
}) {
  const currentTitle = sectionTitles[activeSection] || 'Quản trị hệ thống CleanMarket'

  const totalPending = summary
    ? (summary.pendingSuppliers || 0) +
      (summary.pendingProducts || 0) +
      (summary.stalePendingPayments || 0) +
      (summary.pendingComplaints || 0) +
      (summary.requestedRefunds || 0)
    : 0

  return (
    <header className="admin-topbar">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-light d-lg-none p-1 border"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <span>{currentTitle}</span>
          </h5>
          <div className="text-secondary small d-none d-md-block" style={{ fontSize: '0.75rem' }}>
            Hệ thống quản lý sàn nông sản sạch CleanMarket • Đồng bộ thời gian thực
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3">
        <Button
          variant="light"
          size="sm"
          className="border d-flex align-items-center gap-1 text-secondary"
          onClick={onRefresh}
          disabled={refreshing}
          title="Làm mới dữ liệu từ máy chủ"
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          <span className="d-none d-sm-inline">Làm mới</span>
        </Button>
        <Link to="/profile" className="btn btn-sm btn-light border" title="Hồ sơ và mật khẩu">Tài khoản</Link>

        {totalPending > 0 && (
          <Link
            to="/admin"
            className="btn btn-sm btn-light border position-relative d-flex align-items-center gap-1 text-danger"
            title={`${totalPending} việc cần xử lý`}
          >
            <Bell size={15} />
            <span className="badge bg-danger rounded-pill px-2 py-1 small">
              {totalPending} việc chờ
            </span>
          </Link>
        )}

      </div>
    </header>
  )
}
