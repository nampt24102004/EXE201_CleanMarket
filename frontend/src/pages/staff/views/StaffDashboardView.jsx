import { Row, Col, Badge, Button } from 'react-bootstrap'
import {
  Store,
  PackageCheck,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  Tag,
  Truck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export default function StaffDashboardView({
  pendingCounts = {},
  totalOrders = 0,
  vouchersCount = 0,
  onNavigateSection = () => {},
}) {
  const pendingSuppliers = pendingCounts.suppliers || 0
  const pendingProducts = pendingCounts.products || 0
  const pendingComplaints = pendingCounts.complaints || 0
  const requestedRefunds = pendingCounts.refunds || 0

  const totalPending =
    pendingSuppliers + pendingProducts + pendingComplaints + requestedRefunds

  const actionCards = [
    {
      title: 'Hồ sơ nhà cung cấp chờ duyệt',
      count: pendingSuppliers,
      desc: 'Giấy phép kinh doanh, chứng nhận VietGAP/Hữu cơ từ nhà vườn',
      icon: Store,
      variant: 'warning',
      section: 'suppliers',
    },
    {
      title: 'Nông sản mới chờ kiểm định',
      count: pendingProducts,
      desc: 'Sản phẩm mới của đối tác cần xác thực nguồn gốc & giá bán',
      icon: PackageCheck,
      variant: 'primary',
      section: 'products',
    },
    {
      title: 'Khiếu nại khách hàng cần xử lý',
      count: pendingComplaints,
      desc: 'Phản ánh về giao hàng, hư hỏng nông sản hoặc sai số lượng',
      icon: AlertTriangle,
      variant: 'danger',
      section: 'complaints',
    },
    {
      title: 'Yêu cầu hoàn tiền cần xác nhận',
      count: requestedRefunds,
      desc: 'Hoàn tiền thủ công cho các đơn hủy hoặc giao hàng lỗi',
      icon: RotateCcw,
      variant: 'danger',
      section: 'refunds',
    },
  ]

  return (
    <div className="staff-dashboard-view">
      {/* KPI Cards Row */}
      <Row className="g-3 g-xl-4 mb-4">
        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-warning">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Hồ sơ chờ duyệt</span>
              <div className="admin-kpi-icon-box">
                <Store size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-warning">{pendingSuppliers}</div>
            <div className="text-secondary small mt-2">Nhà vườn đăng ký mới</div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-primary">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Nông sản chờ duyệt</span>
              <div className="admin-kpi-icon-box">
                <PackageCheck size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-primary">{pendingProducts}</div>
            <div className="text-secondary small mt-2">Mặt hàng kèm chứng nhận</div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-success">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Đơn hàng vận hành</span>
              <div className="admin-kpi-icon-box">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-success">{totalOrders}</div>
            <div className="text-secondary small mt-2">Tổng đơn trên sàn</div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-purple">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Voucher sàn đang chạy</span>
              <div className="admin-kpi-icon-box">
                <Tag size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-dark">{vouchersCount}</div>
            <div className="text-secondary small mt-2">Chương trình khuyến mãi</div>
          </div>
        </Col>
      </Row>

      {/* Action Center Row */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <div className="admin-card h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Hàng đợi công việc vận hành (Queues)</h5>
                <p className="text-secondary small mb-0">
                  Các mục đang chờ phê duyệt và xử lý trực tiếp từ nhân viên vận hành
                </p>
              </div>
              <Badge bg={totalPending > 0 ? 'danger' : 'success'} pill className="px-3 py-2">
                {totalPending > 0 ? `${totalPending} việc cần làm` : 'Đã hoàn tất'}
              </Badge>
            </div>

            <div className="d-flex flex-column gap-2">
              {actionCards.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="admin-action-item cursor-pointer"
                    onClick={() => onNavigateSection(item.section)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className={`p-2 rounded-3 bg-${item.variant} bg-opacity-10 text-${item.variant}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark small">{item.title}</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={item.count > 0 ? item.variant : 'secondary'} pill className="px-2 py-1">
                        {item.count}
                      </Badge>
                      <Button variant="link" size="sm" className="p-0 text-secondary">
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Col>

        <Col lg={4}>
          <div className="admin-card h-100 mb-0 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-2 text-success mb-2">
                <ShieldCheck size={24} />
                <h6 className="fw-bold mb-0 text-dark">Quy chuẩn kiểm định</h6>
              </div>
              <p className="text-secondary small mb-3">
                Nhân viên vận hành chịu trách nhiệm kiểm tra tính chính xác của các giấy tờ kiểm nghiệm,
                mã VietGAP và tiêu chuẩn rau củ hữu cơ trước khi duyệt sản phẩm ra thị trường.
              </p>
              <ul className="small text-secondary ps-3 mb-0">
                <li className="mb-1">Đối chiếu giấy chứng nhận với mã QR lô hàng.</li>
                <li className="mb-1">Xác thực nguồn gốc trang trại hợp pháp.</li>
                <li className="mb-1">Kiểm tra thông tin khiếu nại khách hàng trong 24h.</li>
              </ul>
            </div>

            <div className="pt-3 border-top mt-3 d-flex gap-2">
              <Button
                variant="outline-success"
                size="sm"
                className="w-100 rounded-pill d-flex align-items-center justify-content-center gap-1"
                onClick={() => onNavigateSection('shipping-zones')}
              >
                <Truck size={14} />
                <span>Biểu phí ship</span>
              </Button>
              <Button
                variant="success"
                size="sm"
                className="w-100 rounded-pill d-flex align-items-center justify-content-center gap-1"
                onClick={() => onNavigateSection('vouchers')}
              >
                <Tag size={14} />
                <span>Voucher sàn</span>
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
