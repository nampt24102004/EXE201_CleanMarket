import { Button } from 'react-bootstrap'
import { Menu, RefreshCw, Plus, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'

const sectionTitles = {
  '': 'Bảng điều khiển & Hoạt động kinh doanh nhà vườn',
  'products': 'Quản lý nông sản sạch của tôi',
  'batches': 'Quản lý Lô hàng & Mã QR truy xuất nguồn gốc',
  'orders': 'Đơn hàng cung ứng nông sản',
  'vouchers': 'Mã giảm giá riêng của nhà vườn',
  'profile': 'Hồ sơ nhà cung cấp & Giấy tờ pháp lý',
}

export default function PartnerTopbar({
  activeSection = '',
  onToggleSidebar = () => {},
  onRefresh = () => {},
  refreshing = false,
  onOpenCreateProduct = () => {},
  onOpenCreateBatch = () => {},
}) {
  const currentTitle = sectionTitles[activeSection] || 'Cổng thông tin Đối tác Nông sản'

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
            Không gian làm việc đối tác cung ứng nông sản CleanMarket
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-2">
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

        {activeSection === 'products' ? (
          <Button
            variant="success"
            size="sm"
            className="d-flex align-items-center gap-1 fw-semibold shadow-sm"
            onClick={onOpenCreateProduct}
          >
            <Plus size={15} />
            <span>Thêm nông sản</span>
          </Button>
        ) : activeSection === 'batches' ? (
          <Button
            variant="success"
            size="sm"
            className="d-flex align-items-center gap-1 fw-semibold shadow-sm"
            onClick={onOpenCreateBatch}
          >
            <QrCode size={15} />
            <span>Tạo lô hàng QR</span>
          </Button>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/partner/products"
              className="btn btn-sm btn-outline-success d-none d-sm-flex align-items-center gap-1"
            >
              <Plus size={14} />
              <span>Nông sản</span>
            </Link>
            <Link
              to="/partner/batches"
              className="btn btn-sm btn-success d-none d-sm-flex align-items-center gap-1"
            >
              <QrCode size={14} />
              <span>Tạo QR</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
