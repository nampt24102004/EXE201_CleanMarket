import { Row, Col, Card, ProgressBar, Badge, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  Store,
  PackageCheck,
  RotateCcw,
  CreditCard,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import formatCurrency from '../../../utils/formatCurrency'

const orderStatusLabels = {
  CREATED: { label: 'Mới tạo', color: 'info' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'primary' },
  SHIPPED: { label: 'Đang giao', color: 'warning' },
  DELIVERED: { label: 'Đã giao thành công', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'secondary' },
}

export default function AdminDashboardView({ summary, onNavigateSection }) {
  if (!summary) return null

  const ordersByStatus = summary.ordersByStatus || {}
  const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + b, 0) || 1

  const pendingAlerts = [
    {
      title: 'Nhà cung cấp chờ duyệt hồ sơ',
      count: summary.pendingSuppliers || 0,
      icon: Store,
      variant: 'warning',
      section: 'suppliers',
      desc: 'Hồ sơ pháp lý & giấy tờ nông trại mới gửi lên',
    },
    {
      title: 'Sản phẩm mới chờ phê duyệt',
      count: summary.pendingProducts || 0,
      icon: PackageCheck,
      variant: 'primary',
      section: 'products',
      desc: 'Nông sản kèm chứng nhận VietGAP/Hữu cơ',
    },
    {
      title: 'Giao dịch PayOS treo cần đối soát',
      count: summary.stalePendingPayments || 0,
      icon: CreditCard,
      variant: 'danger',
      section: 'payments',
      desc: 'Thanh toán đang chờ quá 30 phút chưa chốt',
    },
    {
      title: 'Khiếu nại khách hàng chưa xử lý',
      count: summary.pendingComplaints || 0,
      icon: AlertTriangle,
      variant: 'warning',
      section: 'complaints',
      desc: 'Phản ánh về chất lượng hàng hoặc giao chậm',
    },
    {
      title: 'Yêu cầu hoàn tiền cần xử lý',
      count: summary.requestedRefunds || 0,
      icon: RotateCcw,
      variant: 'danger',
      section: 'refunds',
      desc: 'Cần xác nhận hoàn tiền thủ công cho khách',
    },
  ].filter((item) => item.count > 0)

  return (
    <div className="admin-dashboard-view">
      {/* KPI Cards Row */}
      <Row className="g-3 g-xl-4 mb-4">
        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-success">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Doanh thu thực thu</span>
              <div className="admin-kpi-icon-box">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-success">
              {formatCurrency(Number(summary.paidRevenue || 0))}
            </div>
            <div className="text-secondary small mt-2 d-flex align-items-center gap-1">
              <span>Thuần sau hoàn:</span>
              <strong className="text-dark">{formatCurrency(Number(summary.netRevenue || 0))}</strong>
            </div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-primary">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Tổng giá trị GMV</span>
              <div className="admin-kpi-icon-box">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-primary">
              {formatCurrency(Number(summary.grossMerchandiseValue || 0))}
            </div>
            <div className="text-secondary small mt-2">
              <span>Đã hoàn tiền: </span>
              <strong className="text-danger">{formatCurrency(Number(summary.refundedAmount || 0))}</strong>
            </div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-purple">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Khách hàng & Đối tác</span>
              <div className="admin-kpi-icon-box">
                <Users size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-dark">
              {summary.totalUsers || 0}
            </div>
            <div className="text-secondary small mt-2 d-flex align-items-center gap-2">
              <Badge bg="success" className="px-2 py-1">+{summary.newUsersLast30Days || 0} mới 30 ngày</Badge>
              {summary.lockedUsers > 0 && (
                <Badge bg="danger" className="px-2 py-1">{summary.lockedUsers} bị khóa</Badge>
              )}
            </div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card kpi-warning">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Việc cần xử lý ngay</span>
              <div className="admin-kpi-icon-box">
                <ShieldAlert size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-warning">
              {pendingAlerts.reduce((a, b) => a + b.count, 0)}
            </div>
            <div className="text-secondary small mt-2">
              {pendingAlerts.length > 0 ? 'Có danh mục cần quản trị viên duyệt' : 'Mọi hồ sơ đã được xử lý'}
            </div>
          </div>
        </Col>
      </Row>

      {/* Action Center & Order Status Row */}
      <Row className="g-4 mb-4">
        {/* Pending Action Center */}
        <Col lg={7}>
          <div className="admin-card h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Trung tâm xử lý công việc</h5>
                <p className="text-secondary small mb-0">Các tác vụ đang chờ hành động từ ban quản trị</p>
              </div>
              <Badge bg="danger" pill className="px-3 py-2">
                {pendingAlerts.reduce((a, b) => a + b.count, 0)} tác vụ
              </Badge>
            </div>

            {pendingAlerts.length === 0 ? (
              <div className="text-center py-5">
                <div className="text-success mb-2">
                  <PackageCheck size={48} />
                </div>
                <h6 className="fw-bold text-dark">Hệ thống đang hoạt động tối ưu</h6>
                <p className="text-secondary small mb-0">Không có hồ sơ, sản phẩm hay giao dịch nào bị tồn đọng.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {pendingAlerts.map((item) => {
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
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>{item.desc}</div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={item.variant} pill className="px-2 py-1 fs-6">
                          {item.count}
                        </Badge>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-secondary d-flex align-items-center"
                        >
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Col>

        {/* Order Status Distribution */}
        <Col lg={5}>
          <div className="admin-card h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Trạng thái đơn hàng</h5>
                <p className="text-secondary small mb-0">Phân bố đơn hàng trên sàn CleanMarket</p>
              </div>
              <ShoppingBag size={20} className="text-secondary" />
            </div>

            <div className="d-flex flex-column gap-3 pt-2">
              {Object.entries(orderStatusLabels).map(([key, config]) => {
                const count = ordersByStatus[key] || 0
                const percent = Math.round((count / totalOrders) * 100)
                return (
                  <div key={key}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge bg-${config.color} p-1 rounded-circle`}></span>
                        <span className="small fw-semibold text-dark">{config.label}</span>
                      </div>
                      <span className="small fw-bold text-dark">
                        {count} đơn <span className="text-secondary fw-normal">({percent}%)</span>
                      </span>
                    </div>
                    <ProgressBar
                      variant={config.color}
                      now={percent}
                      style={{ height: '6px' }}
                      className="rounded-pill"
                    />
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-3 border-top text-center">
              <Button
                variant="outline-success"
                size="sm"
                className="rounded-pill px-3"
                onClick={() => onNavigateSection('orders')}
              >
                Xem chi tiết đơn hàng
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Quick Navigation Cards */}
      <Row className="g-3">
        <Col md={4}>
          <Card
            className="admin-card mb-0 cursor-pointer text-decoration-none"
            as={Link}
            to="/admin/revenue-reports"
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">Báo cáo doanh thu</h6>
                  <p className="text-secondary small mb-0">Biểu đồ xu hướng, Top sản phẩm</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-secondary" />
            </div>
          </Card>
        </Col>

        <Col md={4}>
          <Card
            className="admin-card mb-0 cursor-pointer text-decoration-none"
            as={Link}
            to="/admin/payments"
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">Đối soát thanh toán</h6>
                  <p className="text-secondary small mb-0">Xử lý cổng PayOS & COD</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-secondary" />
            </div>
          </Card>
        </Col>

        <Col md={4}>
          <Card
            className="admin-card mb-0 cursor-pointer text-decoration-none"
            as={Link}
            to="/admin/users"
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-3 bg-purple bg-opacity-10 text-purple">
                  <Users size={22} />
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">Quản trị người dùng</h6>
                  <p className="text-secondary small mb-0">Tạo nhân viên & phân quyền</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-secondary" />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
