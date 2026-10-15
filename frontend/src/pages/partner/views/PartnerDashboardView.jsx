import { Row, Col, Badge, Button, Table } from 'react-bootstrap'
import {
  DollarSign,
  Sprout,
  QrCode,
  ShoppingBag,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import formatCurrency from '../../../utils/formatCurrency'

const orderStatusBadge = {
  CREATED: { label: 'Mới tạo', bg: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', bg: 'info' },
  SHIPPED: { label: 'Đang giao', bg: 'primary' },
  DELIVERED: { label: 'Đã giao', bg: 'success' },
  CANCELLED: { label: 'Đã hủy', bg: 'secondary' },
}

export default function PartnerDashboardView({
  products = [],
  batches = [],
  orders = [],
  profile = null,
  onNavigateSection = () => {},
}) {
  // Estimated revenue from confirmed/shipped/delivered orders
  const estimatedRevenue = orders
    .filter((o) => ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  const pendingApprovalProducts = products.filter((p) =>
    ['PENDING', 'PENDING_APPROVAL'].includes(p.approvalStatus)
  ).length

  const activeSellingProducts = products.filter(
    (p) => p.approvalStatus === 'APPROVED' && p.status === 'ACTIVE'
  ).length

  const urgentOrders = orders.filter((o) =>
    ['CREATED', 'CONFIRMED'].includes(o.status)
  )

  const recentOrders = orders.slice(0, 5)
  const recentBatches = batches.slice(0, 4)

  return (
    <div className="partner-dashboard-view">
      {/* Welcome Banner */}
      <div className="admin-card mb-4 bg-white border-0 shadow-sm p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 small fw-bold">
                NHÀ VƯỜN ĐỐI TÁC
              </span>
              {profile?.status === 'APPROVED' ? (
                <span className="badge bg-success text-white small">
                  <CheckCircle2 size={12} className="me-1 inline-block" /> Đã xác thực
                </span>
              ) : (
                <span className="badge bg-warning text-dark small">
                  <Clock size={12} className="me-1 inline-block" /> Đang xét duyệt hồ sơ
                </span>
              )}
            </div>
            <h4 className="fw-bold mb-1 text-dark">
              Xin chào, {profile?.name || 'Đối tác Nông nghiệp Sạch'}!
            </h4>
            <p className="text-secondary small mb-0">
              {profile?.location
                ? `Vùng trồng: ${profile.location}`
                : 'Cổng quản lý nông sản, lô hàng QR và chuỗi cung ứng nông sản CleanMarket.'}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={() => onNavigateSection('products')}
            >
              <Plus size={15} />
              <span>Thêm nông sản</span>
            </Button>
            <Button
              variant="success"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={() => onNavigateSection('batches')}
            >
              <QrCode size={15} />
              <span>Tạo lô QR</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <div className="admin-kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Doanh thu cung ứng</span>
              <div className="admin-kpi-icon-wrap bg-success bg-opacity-10 text-success">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-success">
              {formatCurrency(estimatedRevenue)}
            </div>
            <div className="admin-kpi-trend text-secondary">
              Tổng giá trị đơn xác nhận & hoàn tất
            </div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Nông sản của tôi</span>
              <div className="admin-kpi-icon-wrap bg-primary bg-opacity-10 text-primary">
                <Sprout size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-dark">{products.length}</div>
            <div className="admin-kpi-trend text-secondary">
              <span className="text-success fw-bold">{activeSellingProducts} đang bán</span>
              {pendingApprovalProducts > 0 && (
                <span className="text-warning ms-1">({pendingApprovalProducts} chờ duyệt)</span>
              )}
            </div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Lô hàng & QR đã cấp</span>
              <div className="admin-kpi-icon-wrap bg-info bg-opacity-10 text-info">
                <QrCode size={20} />
              </div>
            </div>
            <div className="admin-kpi-value text-info">{batches.length}</div>
            <div className="admin-kpi-trend text-secondary">
              Chuỗi minh bạch nguồn gốc nông sản
            </div>
          </div>
        </Col>

        <Col sm={6} xl={3}>
          <div className="admin-kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="admin-kpi-label">Đơn cần chuẩn bị</span>
              <div className="admin-kpi-icon-wrap bg-danger bg-opacity-10 text-danger">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className={`admin-kpi-value ${urgentOrders.length > 0 ? 'text-danger' : 'text-dark'}`}>
              {urgentOrders.length}
            </div>
            <div className="admin-kpi-trend text-secondary">
              {urgentOrders.length > 0 ? 'Cần đóng gói & giao đi' : 'Đã xử lý hết đơn mới'}
            </div>
          </div>
        </Col>
      </Row>

      {/* Main Content Sections */}
      <Row className="g-4">
        {/* Recent Orders */}
        <Col lg={7}>
          <div className="admin-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Đơn hàng cần cung ứng gần đây</h5>
                <p className="text-secondary small mb-0">
                  Cập nhật tiến độ xử lý và bàn giao cho đơn vị vận chuyển
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-success fw-bold text-decoration-none p-0 d-flex align-items-center gap-1"
                onClick={() => onNavigateSection('orders')}
              >
                <span>Xem tất cả</span>
                <ArrowRight size={14} />
              </Button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <ShoppingBag size={36} className="mb-2 opacity-50" />
                <p className="small mb-0">Chưa có đơn hàng nào được đặt.</p>
              </div>
            ) : (
              <Table responsive className="admin-table align-middle">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Sản phẩm</th>
                    <th>Giá trị</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const st = orderStatusBadge[order.status] || {
                      label: order.status,
                      bg: 'secondary',
                    }
                    return (
                      <tr key={order.id}>
                        <td>
                          <code className="fw-bold text-dark">{order.orderCode}</code>
                        </td>
                        <td>
                          <div className="small fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                            {order.items?.map((i) => i.productName).join(', ') || 'Nông sản'}
                          </div>
                          <div className="text-secondary small">
                            {order.items?.length || 1} món hàng
                          </div>
                        </td>
                        <td>
                          <strong className="text-success small">
                            {formatCurrency(Number(order.totalAmount))}
                          </strong>
                        </td>
                        <td>
                          <Badge bg={st.bg} className="px-2 py-1">
                            {st.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </div>
        </Col>

        {/* Lô hàng & Mã QR */}
        <Col lg={5}>
          <div className="admin-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Lô nông sản & QR gần đây</h5>
                <p className="text-secondary small mb-0">Minh bạch truy xuất tem nhãn</p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-success fw-bold text-decoration-none p-0 d-flex align-items-center gap-1"
                onClick={() => onNavigateSection('batches')}
              >
                <span>Tất cả</span>
                <ArrowRight size={14} />
              </Button>
            </div>

            {recentBatches.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <QrCode size={36} className="mb-2 opacity-50" />
                <p className="small mb-0">Chưa có lô hàng nào được tạo.</p>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="mt-2"
                  onClick={() => onNavigateSection('batches')}
                >
                  Tạo lô đầu tiên
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {recentBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between gap-2"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={`/api/partner/batches/${batch.id}/qr`}
                        alt={`QR ${batch.batchCode}`}
                        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        className="bg-white p-1 rounded border shadow-xs"
                      />
                      <div>
                        <div className="fw-bold text-dark small">{batch.batchCode}</div>
                        <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                          Thu hoạch: {batch.harvestDate || '—'} · SL: {batch.quantity}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/trace/${batch.traceCode}`}
                      target="_blank"
                      className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 px-2 py-1"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <span>Tra cứu</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}
