import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
} from 'react-bootstrap'
import {
  ShoppingBag,
  CheckCircle,
  Truck,
  Package,
  Eye,
} from 'lucide-react'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

const orderStatusBadge = {
  CREATED: { label: 'Mới tạo', bg: 'warning', next: 'CONFIRMED', nextLabel: 'Xác nhận đơn' },
  CONFIRMED: { label: 'Đã xác nhận', bg: 'info', next: 'SHIPPED', nextLabel: 'Giao cho vận chuyển' },
  SHIPPED: { label: 'Đang giao hàng', bg: 'primary', next: 'DELIVERED', nextLabel: 'Xác nhận đã giao' },
  DELIVERED: { label: 'Đã giao thành công', bg: 'success', next: null, nextLabel: null },
  CANCELLED: { label: 'Đã hủy', bg: 'secondary', next: null, nextLabel: null },
}

export default function PartnerOrdersView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingId, setUpdatingId] = useState(null)
  const [viewOrderDetail, setViewOrderDetail] = useState(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/partner/orders')
      setOrders(data || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải đơn hàng của nhà cung cấp.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadOrders)
  }, [loadOrders])

  const handleUpdateStatus = async (orderId, nextStatus, nextLabel) => {
    setUpdatingId(orderId)
    setError('')
    setNotice('')
    try {
      await api.put(`/api/partner/orders/${orderId}/status`, { status: nextStatus })
      setNotice(`Đã cập nhật trạng thái đơn sang "${nextLabel}" thành công!`)
      await loadOrders()
    } catch (err) {
      setError(`Không thể cập nhật trạng thái: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true
    return o.status === statusFilter
  })

  return (
    <div className="partner-orders-view">
      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Top Header Card */}
      <div className="admin-card mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h5 className="fw-bold mb-1 text-dark">Quản lý Đơn hàng cung ứng nông sản</h5>
          <p className="text-secondary small mb-0">
            Theo dõi đơn đặt hàng nông sản của khách hàng, đóng gói và bàn giao đối tác giao vận
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="success" pill className="px-3 py-2">
            {orders.length} tổng đơn hàng
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key: 'ALL', label: 'Tất cả đơn' },
          { key: 'CREATED', label: 'Mới tạo (Cần chuẩn bị)' },
          { key: 'CONFIRMED', label: 'Đã xác nhận' },
          { key: 'SHIPPED', label: 'Đang vận chuyển' },
          { key: 'DELIVERED', label: 'Đã giao thành công' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={statusFilter === tab.key ? 'success' : 'outline-secondary'}
            className="rounded-pill px-3"
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="admin-card">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="mt-2 text-secondary small">Đang tải danh sách đơn hàng...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <ShoppingBag size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Chưa có đơn hàng nào theo bộ lọc.</p>
          </div>
        ) : (
          <Table responsive className="admin-table align-middle">
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Sản phẩm trong đơn</th>
                <th>Tổng tiền hàng</th>
                <th>Trạng thái</th>
                <th>Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const config = orderStatusBadge[order.status] || {
                  label: order.status,
                  bg: 'secondary',
                  next: null,
                  nextLabel: null,
                }
                const isUpdating = updatingId === order.id

                return (
                  <tr key={order.id}>
                    <td>
                      <code className="fw-bold fs-6 text-dark">{order.orderCode}</code>
                      <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                        ID phần đơn: #{order.id}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1" style={{ maxWidth: '320px' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="small d-flex justify-content-between gap-2 border-bottom pb-1">
                            <span className="text-dark fw-semibold text-truncate">
                              {item.productName}
                            </span>
                            <span className="text-secondary text-nowrap">
                              {item.quantity} {item.unit || 'kg'} × {formatCurrency(Number(item.unitPrice || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong className="text-success fs-6">
                        {formatCurrency(Number(order.totalAmount || 0))}
                      </strong>
                    </td>
                    <td>
                      <Badge bg={config.bg} className="px-2 py-1">
                        {config.label}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {config.next && (
                          <Button
                            variant={order.status === 'CREATED' ? 'success' : 'outline-success'}
                            size="sm"
                            className="d-flex align-items-center gap-1 shadow-xs"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateStatus(order.id, config.next, config.nextLabel)
                            }
                          >
                            {isUpdating ? (
                              <Spinner animation="border" size="sm" />
                            ) : order.status === 'CREATED' ? (
                              <CheckCircle size={14} />
                            ) : (
                              <Truck size={14} />
                            )}
                            <span style={{ fontSize: '0.78rem' }}>{config.nextLabel}</span>
                          </Button>
                        )}
                        <Button
                          variant="light"
                          size="sm"
                          className="border px-2 py-1 text-secondary"
                          title="Xem chi tiết đơn"
                          onClick={() => setViewOrderDetail(order)}
                        >
                          <Eye size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal show={Boolean(viewOrderDetail)} onHide={() => setViewOrderDetail(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">
            Chi tiết đơn hàng: {viewOrderDetail?.orderCode}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewOrderDetail && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-secondary small">Trạng thái:</span>
                <Badge
                  bg={orderStatusBadge[viewOrderDetail.status]?.bg || 'secondary'}
                  className="px-2 py-1"
                >
                  {orderStatusBadge[viewOrderDetail.status]?.label || viewOrderDetail.status}
                </Badge>
              </div>

              <div>
                <h6 className="small fw-bold text-dark mb-2 d-flex align-items-center gap-1">
                  <Package size={15} />
                  <span>Danh sách nông sản cung ứng:</span>
                </h6>
                <div className="border rounded p-2 bg-light">
                  {viewOrderDetail.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="d-flex justify-content-between align-items-center py-2 border-bottom last-border-0"
                    >
                      <div>
                        <div className="fw-bold small text-dark">{item.productName}</div>
                        <div className="small text-secondary" style={{ fontSize: '0.75rem' }}>
                          Số lượng: {item.quantity} {item.unit || 'kg'}
                        </div>
                      </div>
                      <div className="text-end">
                        <strong className="text-primary small">
                          {formatCurrency(Number(item.totalAmount || item.unitPrice * item.quantity || 0))}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center border-top pt-2">
                <span className="fw-bold text-dark">Tổng tiền nông sản:</span>
                <strong className="text-success fs-5">
                  {formatCurrency(Number(viewOrderDetail.totalAmount || 0))}
                </strong>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setViewOrderDetail(null)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
