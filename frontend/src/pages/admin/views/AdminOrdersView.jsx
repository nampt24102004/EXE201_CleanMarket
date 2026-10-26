import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table,
  Button,
  Badge,
  Form,
  Spinner,
  Alert,
  Modal,
  Row,
  Col,
  InputGroup,
  Pagination,
} from 'react-bootstrap'
import {
  ShoppingBag,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  CreditCard,
  Tag,
  MapPin,
  Phone,
  User,
  Mail,
  AlertTriangle,
  Copy,
  Check,
  Search,
  RefreshCw,
  Store,
  Package,
  Calendar,
  X,
  History,
} from 'lucide-react'
import { api } from '../../../services/apiClient'
import { useAuth } from '../../../context/useAuth'
import formatCurrency from '../../../utils/formatCurrency'

const orderStatusBadge = {
  CREATED: { label: 'Mới tạo', bg: 'warning', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận', bg: 'info', icon: CheckCircle2 },
  SHIPPED: { label: 'Đang giao hàng', bg: 'primary', icon: Truck },
  DELIVERED: { label: 'Đã giao thành công', bg: 'success', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', bg: 'secondary', icon: XCircle },
}

const paymentMethodLabel = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  PAYOS: 'Thanh toán trực tuyến PayOS',
}

// Presentation-only dates: one day per order, preserving the true order sequence.
// Never send these dates to the API or use them for filtering/accounting.
function spreadDemoOrderDates(allOrders) {
  const datedOrders = allOrders
    .filter((order) => order.createdAt && !Number.isNaN(new Date(order.createdAt).getTime()))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id - b.id)
  if (!datedOrders.length) return {}

  const anchor = new Date(datedOrders[datedOrders.length - 1].createdAt)
  return Object.fromEntries(datedOrders.map((order, index) => {
    const displayDate = new Date(anchor)
    displayDate.setUTCDate(displayDate.getUTCDate() - (datedOrders.length - 1 - index))
    return [order.id, displayDate.toISOString()]
  }))
}

export default function AdminOrdersView() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const [orders, setOrders] = useState([])
  const [showDemoDates, setShowDemoDates] = useState(false)
  const [demoDates, setDemoDates] = useState({})
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')
  const [pageMeta, setPageMeta] = useState({ totalElements: 0, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 15

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Detail Modal State
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [detailModalError, setDetailModalError] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  // Cancel Order Modal State
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null, orderCode: '' })
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // Load Orders with API filters
  const loadOrders = useCallback(async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (paymentFilter !== 'ALL') params.set('paymentMethod', paymentFilter)
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      params.set('page', String(currentPage))
      params.set('size', String(pageSize))

      const res = await api.get(`/api/manager/orders?${params.toString()}`)
      setOrders(res?.items || [])
      setPageMeta({
        totalElements: res?.totalElements || 0,
        totalPages: res?.totalPages || 1,
      })
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách đơn hàng.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter, paymentFilter, searchQuery, fromDate, toDate, currentPage])

  useEffect(() => {
    void Promise.resolve().then(loadOrders)
  }, [loadOrders])

  const loadDemoDates = useCallback(async () => {
    setDemoLoading(true)
    setDemoError('')
    try {
      const first = await api.get('/api/manager/orders?page=0&size=100')
      const totalPages = first?.totalPages || 1
      if (totalPages > 50) throw new Error('Có quá nhiều đơn để tạo mốc thời gian mô phỏng.')
      const rest = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) =>
        api.get(`/api/manager/orders?page=${index + 1}&size=100`)))
      const allOrders = [first, ...rest].flatMap((page) => page?.items || [])
      setDemoDates(spreadDemoOrderDates(allOrders))
    } catch (err) {
      setDemoError(err.message || 'Không thể tải mốc thời gian mô phỏng.')
      setShowDemoDates(false)
    } finally {
      setDemoLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin && showDemoDates) void Promise.resolve().then(loadDemoDates)
  }, [isAdmin, showDemoDates, loadDemoDates])

  // Paid orders still waiting for delivery confirmation, for the manager's "approve all" button.
  const isManager = hasRole('MANAGER')
  const [awaitingDelivery, setAwaitingDelivery] = useState([])
  const [bulkDelivering, setBulkDelivering] = useState(false)
  const loadAwaitingDelivery = useCallback(async () => {
    if (!isManager) return
    try {
      setAwaitingDelivery((await api.get('/api/manager/orders/awaiting-delivery')) || [])
    } catch {
      setAwaitingDelivery([])
    }
  }, [isManager])

  useEffect(() => {
    void Promise.resolve().then(loadAwaitingDelivery)
  }, [loadAwaitingDelivery])

  const handleConfirmAllDelivered = async () => {
    const codes = awaitingDelivery.map((o) => `#${o.orderCode}${o.paymentMethod === 'COD' ? ' (COD)' : ''}`)
    const preview = codes.slice(0, 10).join(', ') + (codes.length > 10 ? `, … (+${codes.length - 10})` : '')
    const codCount = awaitingDelivery.filter((o) => o.paymentMethod === 'COD').length
    if (!window.confirm(
      `Duyệt giao hàng thành công cho ${codes.length} đơn?\n${preview}\n\n` +
      (codCount ? `${codCount} đơn COD sẽ được ghi nhận đã thu tiền (thanh toán: Đã thanh toán).\n` : '') +
      'Khách hàng và các nhà vườn của từng đơn sẽ nhận thông báo.',
    )) return
    setBulkDelivering(true)
    setError('')
    setNotice('')
    try {
      const result = await api.put('/api/manager/orders/delivered', {})
      setNotice(`Đã duyệt giao hàng thành công cho ${result.confirmed} đơn.`)
      await Promise.all([loadOrders(), loadAwaitingDelivery()])
    } catch (err) {
      setError(`Lỗi duyệt giao hàng: ${err.message}`)
    } finally {
      setBulkDelivering(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadOrders(), loadAwaitingDelivery(), ...(isAdmin && showDemoDates ? [loadDemoDates()] : [])])
  }

  // Load Order Detail
  const handleOpenDetail = async (orderId) => {
    setDetailLoading(true)
    setDetailModalError('')
    setSelectedOrderDetail(null)
    try {
      const data = await api.get(`/api/manager/orders/${orderId}`)
      setSelectedOrderDetail(data)
    } catch (err) {
      setDetailModalError(err.message || 'Không thể tải chi tiết đơn hàng.')
    } finally {
      setDetailLoading(false)
    }
  }

  // A manager can confirm an unfinished COD order, or a paid online one, as delivered for every farm at once.
  const canConfirmDelivered = (detail) =>
    hasRole('MANAGER') &&
    !!detail?.order &&
    !['DELIVERED', 'CANCELLED'].includes(detail.order.status) &&
    (detail.order.paymentMethod === 'COD' || (detail.payments || []).some((p) => p.status === 'PAID'))

  const [delivering, setDelivering] = useState(false)
  const handleConfirmDelivered = async () => {
    const { id, orderCode, paymentMethod } = selectedOrderDetail.order
    const codNote = paymentMethod === 'COD' ? '\nĐơn COD sẽ được ghi nhận đã thu tiền (Đã thanh toán).' : ''
    const note = window.prompt(
      `Duyệt giao hàng thành công cho toàn bộ đơn #${orderCode}?${codNote}\nKhách hàng và các nhà vườn sẽ nhận thông báo. Ghi chú (không bắt buộc):`,
      '',
    )
    if (note === null) return
    setDelivering(true)
    setDetailModalError('')
    try {
      await api.put(`/api/manager/orders/${id}/delivered`, { note: note.trim() || null })
      setNotice(`Đã duyệt giao hàng thành công cho đơn #${orderCode}.`)
      await handleOpenDetail(id)
      await loadAwaitingDelivery()
      await loadOrders()
    } catch (err) {
      setDetailModalError(err.message || 'Không thể duyệt giao hàng.')
    } finally {
      setDelivering(false)
    }
  }

  // Execute Cancel Order
  const handleExecuteCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy đơn hàng.')
      return
    }
    setCancelLoading(true)
    setCancelError('')
    try {
      await api.put(`/api/manager/orders/${cancelModal.orderId}/cancel`, {
        reason: cancelReason.trim(),
      })
      setNotice(`Đã hủy đơn hàng #${cancelModal.orderCode} thành công.`)
      setCancelModal({ show: false, orderId: null, orderCode: '' })
      setCancelReason('')

      // Refresh detail modal if open
      if (selectedOrderDetail?.order?.id === cancelModal.orderId) {
        await handleOpenDetail(cancelModal.orderId)
      }
      await loadOrders()
    } catch (err) {
      setCancelError(err.message || 'Không thể hủy đơn hàng.')
    } finally {
      setCancelLoading(false)
    }
  }

  // Copy code helper
  const handleCopyCode = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Format date helper
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A'
    try {
      const d = new Date(isoString)
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  // Quick stats summary
  const summaryStats = useMemo(() => {
    let subtotalSum = 0
    let totalPaidSum = 0
    orders.forEach((o) => {
      subtotalSum += Number(o.subtotal || 0)
      if (o.status !== 'CANCELLED') {
        totalPaidSum += Number(o.totalAmount || 0)
      }
    })
    return {
      subtotalSum,
      totalPaidSum,
    }
  }, [orders])

  return (
    <div className="admin-orders-view">
      {/* Toast Notice */}
      {notice && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setNotice('')}
          className="rounded-4 shadow-sm border-0 d-flex align-items-center gap-2 mb-4"
        >
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <div className="fw-medium">{notice}</div>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError('')}
          className="rounded-4 shadow-sm border-0 d-flex align-items-center gap-2 mb-4"
        >
          <AlertTriangle size={18} className="flex-shrink-0" />
          <div className="fw-medium">{error}</div>
        </Alert>
      )}

      {demoError && <Alert variant="danger" className="mb-4">{demoError}</Alert>}

      {isAdmin && showDemoDates && (
        <Alert variant="warning" className="mb-4">
          <strong>Chế độ ngày mô phỏng — chỉ để trình bày.</strong> Mỗi đơn được hiển thị cách nhau một ngày.
          Ngày tạo thật vẫn hiển thị bên dưới; bộ lọc, thanh toán, biểu đồ doanh thu và dữ liệu trong database
          không thay đổi. Không dùng ngày mô phỏng để báo cáo doanh số thực.
        </Alert>
      )}

      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <ShoppingBag size={26} className="text-success" />
            <span>Quản lý Đơn hàng & Vận hành sàn</span>
          </h4>
          <p className="text-secondary small mb-0">
            Theo dõi chi tiết các đơn đặt hàng nông sản, kiện hàng nhà vườn và tiến độ thanh toán PayOS / COD.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isAdmin && (
            <Form.Check
              type="switch"
              id="admin-demo-order-dates"
              label={demoLoading ? 'Đang tải ngày mô phỏng...' : 'Ngày mô phỏng'}
              checked={showDemoDates}
              onChange={(event) => setShowDemoDates(event.target.checked)}
              disabled={demoLoading}
              className="small text-secondary me-2"
            />
          )}
          {isManager && (
            <Button
              variant="success"
              size="sm"
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-sm"
              onClick={handleConfirmAllDelivered}
              disabled={bulkDelivering || awaitingDelivery.length === 0}
              title="Duyệt giao hàng thành công cho mọi đơn COD và đơn đã thanh toán đang chờ"
            >
              {bulkDelivering ? <Spinner animation="border" size="sm" /> : <CheckCircle2 size={15} />}
              <span className="fw-semibold">Duyệt tất cả ({awaitingDelivery.length} đơn chờ giao)</span>
            </Button>
          )}
          <Button
            variant="light"
            size="sm"
            className="border text-secondary d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-sm bg-white"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Đồng bộ lại dữ liệu đơn hàng"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span className="fw-semibold">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Executive KPI Ribbon */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3} xl={3}>
          <div
            className={`admin-kpi-card kpi-primary cursor-pointer ${
              statusFilter === 'ALL' ? 'border-primary shadow-sm' : ''
            }`}
            onClick={() => {
              setStatusFilter('ALL')
              setCurrentPage(0)
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label">Tổng đơn hàng</div>
                <div className="admin-kpi-value text-primary mt-1">
                  {pageMeta.totalElements}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Toàn bộ đơn trên hệ thống</div>
          </div>
        </Col>

        <Col xs={6} md={3} xl={3}>
          <div
            className={`admin-kpi-card kpi-warning cursor-pointer ${
              statusFilter === 'CREATED' ? 'border-warning shadow-sm' : ''
            }`}
            onClick={() => {
              setStatusFilter('CREATED')
              setCurrentPage(0)
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label d-flex align-items-center gap-1">
                  <span>Mới tạo</span>
                  <span className="status-dot warning" />
                </div>
                <div className="admin-kpi-value text-warning mt-1">
                  {orders.filter((o) => o.status === 'CREATED').length}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <Clock size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Chờ xác nhận & chuẩn bị</div>
          </div>
        </Col>

        <Col xs={6} md={3} xl={3}>
          <div
            className={`admin-kpi-card kpi-success cursor-pointer ${
              statusFilter === 'DELIVERED' ? 'border-success shadow-sm' : ''
            }`}
            onClick={() => {
              setStatusFilter('DELIVERED')
              setCurrentPage(0)
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label">Đã giao thành công</div>
                <div className="admin-kpi-value text-success mt-1">
                  {orders.filter((o) => o.status === 'DELIVERED').length}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Giao nông sản an toàn</div>
          </div>
        </Col>

        <Col xs={6} md={3} xl={3}>
          <div className="admin-kpi-card kpi-purple">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label">Doanh số trang này</div>
                <div className="admin-kpi-value text-purple mt-1" style={{ color: '#7c3aed' }}>
                  {formatCurrency(summaryStats.totalPaidSum)}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Tổng giá trị thanh toán</div>
          </div>
        </Col>
      </Row>

      {/* Control Filter Toolbar */}
      <div className="admin-card mb-4 p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Status Tabs */}
          <div className="d-flex flex-wrap align-items-center gap-1">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'CREATED', label: 'Mới tạo' },
              { key: 'CONFIRMED', label: 'Đã xác nhận' },
              { key: 'SHIPPED', label: 'Đang giao' },
              { key: 'DELIVERED', label: 'Đã giao' },
              { key: 'CANCELLED', label: 'Đã hủy' },
            ].map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={statusFilter === tab.key ? 'success' : 'light'}
                className="fw-bold px-3 py-2 rounded-3 border"
                onClick={() => {
                  setStatusFilter(tab.key)
                  setCurrentPage(0)
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <div className="d-flex align-items-center gap-2">
            <span className="small text-secondary fw-semibold">Hình thức:</span>
            <Form.Select
              size="sm"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value)
                setCurrentPage(0)
              }}
              className="rounded-3"
              style={{ width: 140 }}
            >
              <option value="ALL">Tất cả</option>
              <option value="PAYOS">PayOS Online</option>
              <option value="COD">Tiền mặt (COD)</option>
            </Form.Select>
          </div>
        </div>

        {/* Second Row: Search and Date Pickers */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
          {/* Search Box */}
          <InputGroup size="sm" style={{ minWidth: 280, maxWidth: 360 }}>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={15} className="text-secondary" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm theo mã đơn, người nhận, SĐT, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(0)
              }}
              className="border-start-0 ps-1"
            />
            {searchQuery && (
              <Button
                variant="outline-secondary"
                className="border-start-0"
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(0)
                }}
              >
                <X size={14} />
              </Button>
            )}
          </InputGroup>

          {/* Date Range Pickers */}
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center gap-1 small text-secondary">
              <Calendar size={14} />
              <span>Từ:</span>
              <Form.Control
                type="date"
                size="sm"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setCurrentPage(0)
                }}
                className="rounded-3"
                style={{ width: 135 }}
              />
            </div>
            <div className="d-flex align-items-center gap-1 small text-secondary">
              <span>Đến:</span>
              <Form.Control
                type="date"
                size="sm"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setCurrentPage(0)
                }}
                className="rounded-3"
                style={{ width: 135 }}
              />
            </div>
            {(fromDate || toDate) && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2"
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                  setCurrentPage(0)
                }}
                title="Xóa lọc ngày"
              >
                <X size={13} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Order Table Card */}
      <div className="admin-card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="text-secondary small mt-2">Đang tải danh sách đơn hàng...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 px-3">
            <ShoppingBag size={48} className="text-secondary opacity-50 mb-3" />
            <h5 className="fw-bold text-dark mb-1">
              {searchQuery || fromDate || toDate || statusFilter !== 'ALL'
                ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc.'
                : 'Chưa có đơn hàng nào trên hệ thống.'}
            </h5>
            <p className="text-secondary small mb-3">
              Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc làm mới lại trang.
            </p>
            {(searchQuery || fromDate || toDate || statusFilter !== 'ALL') && (
              <Button
                variant="outline-success"
                size="sm"
                className="rounded-3 fw-semibold"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('ALL')
                  setPaymentFilter('ALL')
                  setFromDate('')
                  setToDate('')
                  setCurrentPage(0)
                }}
              >
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table responsive className="admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Khách hàng & Nhận hàng</th>
                  <th>Kiện nông sản</th>
                  <th>Tạm tính & Giảm</th>
                  <th>Phí ship</th>
                  <th>Tổng thanh toán</th>
                  <th>Trạng thái</th>
                  <th>{isAdmin && showDemoDates ? 'Ngày mô phỏng / thật' : 'Thời gian'}</th>
                  <th className="text-end" style={{ width: 130 }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((item) => {
                  const badgeInfo = orderStatusBadge[item.status] || {
                    label: item.status,
                    bg: 'secondary',
                  }
                  const totalDiscount =
                    Number(item.partnerDiscount || 0) + Number(item.platformDiscount || 0)

                  return (
                    <tr key={item.id}>
                      {/* Order Code */}
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 fw-bold text-dark text-decoration-none d-flex align-items-center gap-1"
                          onClick={() => handleOpenDetail(item.id)}
                          title="Bấm để xem chi tiết đơn hàng"
                        >
                          <span className="text-primary">#{item.orderCode}</span>
                        </button>
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                          ID: {item.id}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td>
                        <strong className="text-dark d-block">{item.fullName}</strong>
                        <div className="small text-secondary d-flex align-items-center gap-1 mt-1">
                          <Phone size={12} className="text-success" />
                          <span>{item.phone}</span>
                        </div>
                        <div
                          className="small text-muted text-truncate mt-1"
                          style={{ maxWidth: 180, fontSize: '0.75rem' }}
                          title={item.address}
                        >
                          <MapPin size={11} className="text-danger me-1" />
                          {item.address}
                        </div>
                      </td>

                      {/* Packages count */}
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          {item.supplierOrders?.length || 1} kiện nhà vườn
                        </span>
                        <div className="small text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                          {item.supplierOrders?.map((so) => so.supplierName).join(', ')}
                        </div>
                      </td>

                      {/* Subtotal & Discount */}
                      <td>
                        <div className="text-dark fw-semibold">
                          {formatCurrency(Number(item.subtotal))}
                        </div>
                        {totalDiscount > 0 && (
                          <div className="small text-danger" style={{ fontSize: '0.75rem' }}>
                            Giảm {formatCurrency(totalDiscount)}
                          </div>
                        )}
                      </td>

                      {/* Shipping */}
                      <td>
                        <div className="small text-dark fw-medium">
                          {formatCurrency(Number(item.shippingFee || 0))}
                        </div>
                        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                          {item.shippingZone || 'Khu vực cơ bản'}
                        </div>
                      </td>

                      {/* Total Amount & Method */}
                      <td>
                        <div className="text-success fw-bold fs-6">
                          {formatCurrency(Number(item.totalAmount))}
                        </div>
                        <span
                          className={`badge ${
                            item.paymentMethod === 'PAYOS'
                              ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'
                              : 'bg-light text-secondary border'
                          } py-0 px-2`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {item.paymentMethod || 'COD'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <Badge
                          bg={badgeInfo.bg}
                          className="px-2 py-1 fw-bold text-uppercase"
                          style={{ letterSpacing: '0.02em' }}
                        >
                          {badgeInfo.label}
                        </Badge>
                      </td>

                      {/* Date */}
                      <td className="small text-secondary" style={{ fontSize: '0.78rem' }}>
                        {isAdmin && showDemoDates && demoDates[item.id] ? (
                          <>
                            <div className="fw-semibold text-warning-emphasis">
                              Mô phỏng: {formatDateTime(demoDates[item.id])}
                            </div>
                            <div>Ngày thật: {formatDateTime(item.createdAt)}</div>
                          </>
                        ) : formatDateTime(item.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-3"
                          onClick={() => handleOpenDetail(item.id)}
                          title="Xem toàn bộ kiện hàng, lịch sử và thanh toán"
                        >
                          <Eye size={14} />
                          <span>Chi tiết</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>

            {/* Pagination */}
            {pageMeta.totalPages > 1 && (
              <div className="d-flex flex-wrap align-items-center justify-content-between p-3 border-top bg-light">
                <div className="small text-secondary mb-2 mb-md-0">
                  Hiển thị trang <strong>{currentPage + 1}</strong> /{' '}
                  <strong>{pageMeta.totalPages}</strong> (Tổng cộng{' '}
                  <strong>{pageMeta.totalElements}</strong> đơn hàng)
                </div>

                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  />
                  {Array.from({ length: pageMeta.totalPages }).map((_, idx) => (
                    <Pagination.Item
                      key={idx}
                      active={idx === currentPage}
                      onClick={() => setCurrentPage(idx)}
                    >
                      {idx + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage >= pageMeta.totalPages - 1}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(pageMeta.totalPages - 1, p + 1))
                    }
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comprehensive Order Detail Modal */}
      <Modal
        show={Boolean(selectedOrderDetail) || detailLoading}
        onHide={() => {
          setSelectedOrderDetail(null)
          setDetailModalError('')
        }}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="fs-6 fw-bold text-dark d-flex align-items-center gap-2">
            <ShoppingBag size={20} className="text-success" />
            <span>
              Chi tiết đơn hàng{' '}
              {selectedOrderDetail?.order?.orderCode && (
                <code className="text-primary fs-6 bg-light px-2 py-0 rounded border">
                  #{selectedOrderDetail.order.orderCode}
                </code>
              )}
            </span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {detailLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <div className="text-secondary small mt-2">Đang tải dữ liệu chi tiết đơn...</div>
            </div>
          ) : detailModalError ? (
            <Alert variant="danger">{detailModalError}</Alert>
          ) : selectedOrderDetail ? (
            <>
              {/* Order Status Ribbon Header */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-light rounded-3 border mb-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-secondary small">Trạng thái đơn:</span>
                  <Badge
                    bg={
                      orderStatusBadge[selectedOrderDetail.order?.status]?.bg ||
                      'secondary'
                    }
                    className="px-3 py-1 fs-6 fw-bold"
                  >
                    {orderStatusBadge[selectedOrderDetail.order?.status]?.label ||
                      selectedOrderDetail.order?.status}
                  </Badge>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="small text-secondary">
                    Đặt lúc (thật): <strong>{formatDateTime(selectedOrderDetail.order?.createdAt)}</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="py-1 px-2 d-flex align-items-center gap-1"
                    onClick={() => handleCopyCode(selectedOrderDetail.order?.orderCode)}
                    title="Sao chép mã đơn"
                  >
                    {copiedCode ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span className="small">{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                  </Button>
                </div>
              </div>

              {/* Customer & Shipping Information Grid */}
              <Row className="g-3 mb-4">
                {/* Customer Info */}
                <Col md={6}>
                  <div className="p-3 border rounded-3 h-100 bg-white">
                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                      <User size={16} className="text-primary" />
                      <span>Thông tin người nhận</span>
                    </h6>
                    <div className="small mb-1">
                      <span className="text-secondary">Họ tên:</span>{' '}
                      <strong className="text-dark">{selectedOrderDetail.order?.fullName}</strong>
                    </div>
                    <div className="small mb-1">
                      <span className="text-secondary">Số điện thoại:</span>{' '}
                      <a
                        href={`tel:${selectedOrderDetail.order?.phone}`}
                        className="fw-bold text-decoration-none text-success"
                      >
                        {selectedOrderDetail.order?.phone}
                      </a>
                    </div>
                    {selectedOrderDetail.customerEmail && (
                      <div className="small mb-1 d-flex align-items-center gap-1">
                        <Mail size={13} className="text-secondary flex-shrink-0" />
                        <span className="text-secondary">Email tài khoản:</span>{' '}
                        <span>{selectedOrderDetail.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </Col>

                {/* Delivery Info */}
                <Col md={6}>
                  <div className="p-3 border rounded-3 h-100 bg-white">
                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                      <MapPin size={16} className="text-danger" />
                      <span>Địa chỉ giao hàng</span>
                    </h6>
                    <p className="small mb-2 text-dark" style={{ lineHeight: 1.6 }}>
                      {selectedOrderDetail.order?.address}
                    </p>
                    <div className="small text-secondary mb-1">
                      Khu vực: <strong>{selectedOrderDetail.order?.shippingZone || 'Cơ bản'}</strong>
                    </div>
                    {selectedOrderDetail.order?.note && (
                      <div className="small text-muted p-2 bg-light rounded mt-2">
                        <em>Ghi chú giao: {selectedOrderDetail.order?.note}</em>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Packages & Items by Farm */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <Package size={18} className="text-success" />
                  <span>
                    Danh sách kiện hàng nông sản ({selectedOrderDetail.order?.supplierOrders?.length || 0} kiện)
                  </span>
                </h6>

                {selectedOrderDetail.order?.supplierOrders?.map((pkg, idx) => (
                  <div key={pkg.id || idx} className="border rounded-3 p-3 mb-3 bg-white">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-2 mb-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <Store size={16} className="text-success" />
                        <strong className="text-dark fs-6">{pkg.supplierName}</strong>
                        <span className="badge bg-light text-secondary border">
                          Kiện #{pkg.id}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={orderStatusBadge[pkg.status]?.bg || 'secondary'}>
                          {orderStatusBadge[pkg.status]?.label || pkg.status}
                        </Badge>
                        <span className="text-success fw-bold small">
                          {formatCurrency(Number(pkg.totalAmount || 0))}
                        </span>
                      </div>
                    </div>

                    <Table responsive size="sm" className="align-middle mb-0">
                      <thead>
                        <tr className="text-secondary small">
                          <th>Nông sản</th>
                          <th>Đơn vị</th>
                          <th className="text-center">Số lượng</th>
                          <th className="text-end">Đơn giá</th>
                          <th className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pkg.items?.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong className="text-dark">{item.productName}</strong>
                              <span className="text-muted small ms-1">
                                (#{item.productId})
                              </span>
                            </td>
                            <td className="small text-secondary">{item.unit || 'kg'}</td>
                            <td className="text-center fw-semibold">{item.quantity}</td>
                            <td className="text-end small">
                              {formatCurrency(Number(item.unitPrice))}
                            </td>
                            <td className="text-end fw-bold text-success">
                              {formatCurrency(Number(item.totalAmount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))}
              </div>

              {/* Billing Breakdown & Payment Method */}
              <Row className="g-3 mb-4">
                <Col md={7}>
                  {/* Payment Details */}
                  <div className="p-3 border rounded-3 bg-white h-100">
                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                      <CreditCard size={16} className="text-primary" />
                      <span>Thông tin thanh toán & Giao dịch</span>
                    </h6>
                    <div className="small mb-2">
                      Hình thức:{' '}
                      <Badge bg="light" text="dark" className="border px-2 py-1 ms-1">
                        {paymentMethodLabel[selectedOrderDetail.order?.paymentMethod] ||
                          selectedOrderDetail.order?.paymentMethod}
                      </Badge>
                    </div>

                    {selectedOrderDetail.payments?.length > 0 ? (
                      selectedOrderDetail.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 border rounded bg-light small mb-2"
                        >
                          <div className="d-flex justify-content-between mb-1">
                            <span>
                              Cổng: <strong>{p.provider}</strong>
                            </span>
                            <Badge
                              bg={p.status === 'PAID' ? 'success' : 'warning'}
                            >
                              {p.status}
                            </Badge>
                          </div>
                          {p.providerTransactionNo && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              Mã GD: <code>{p.providerTransactionNo}</code>
                            </div>
                          )}
                          <div className="d-flex justify-content-between text-secondary mt-1" style={{ fontSize: '0.75rem' }}>
                            <span>Số tiền: {formatCurrency(Number(p.amount))}</span>
                            <span>{formatDateTime(p.paidAt || p.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="small text-muted">
                        Chưa có bản ghi giao dịch cổng trực tuyến (hoặc thu tiền mặt COD khi giao).
                      </div>
                    )}

                    {/* Vouchers Applied */}
                    {selectedOrderDetail.vouchers?.length > 0 && (
                      <div className="mt-3 pt-2 border-top">
                        <div className="small fw-semibold text-secondary mb-1 d-flex align-items-center gap-1">
                          <Tag size={13} className="text-warning" />
                          <span>Mã giảm giá áp dụng:</span>
                        </div>
                        {selectedOrderDetail.vouchers.map((v, i) => (
                          <div
                            key={i}
                            className="d-flex justify-content-between small text-secondary py-1"
                          >
                            <span>
                              Mã <code>{v.code}</code> ({v.scope}):
                            </span>
                            <span className="text-danger fw-semibold">
                              -{formatCurrency(Number(v.discountAmount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>

                <Col md={5}>
                  {/* Financial Settlement Card */}
                  <div className="p-3 border rounded-3 bg-light h-100">
                    <h6 className="fw-bold text-dark mb-3">Quyết toán đơn hàng</h6>
                    <div className="d-flex justify-content-between small text-secondary mb-2">
                      <span>Tạm tính hàng:</span>
                      <span>{formatCurrency(Number(selectedOrderDetail.order?.subtotal || 0))}</span>
                    </div>

                    {Number(selectedOrderDetail.order?.partnerDiscount || 0) > 0 && (
                      <div className="d-flex justify-content-between small text-danger mb-2">
                        <span>Giảm giá nhà vườn:</span>
                        <span>-{formatCurrency(Number(selectedOrderDetail.order.partnerDiscount))}</span>
                      </div>
                    )}

                    {Number(selectedOrderDetail.order?.platformDiscount || 0) > 0 && (
                      <div className="d-flex justify-content-between small text-danger mb-2">
                        <span>Voucher sàn CleanMarket:</span>
                        <span>-{formatCurrency(Number(selectedOrderDetail.order.platformDiscount))}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between small text-secondary mb-2">
                      <span>Phí giao hàng:</span>
                      <span>{formatCurrency(Number(selectedOrderDetail.order?.shippingFee || 0))}</span>
                    </div>

                    {Number(selectedOrderDetail.order?.shippingDiscount || 0) > 0 && (
                      <div className="d-flex justify-content-between small text-success mb-2">
                        <span>Giảm phí vận chuyển:</span>
                        <span>-{formatCurrency(Number(selectedOrderDetail.order.shippingDiscount))}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                      <strong className="text-dark">Tổng thu khách:</strong>
                      <strong className="text-success fs-5">
                        {formatCurrency(Number(selectedOrderDetail.order?.totalAmount || 0))}
                      </strong>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Status History Timeline */}
              {selectedOrderDetail.history?.length > 0 && (
                <div className="p-3 border rounded-3 bg-white">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <History size={16} className="text-secondary" />
                    <span>Nhật ký trạng thái & Thao tác</span>
                  </h6>
                  <div className="timeline-list">
                    {selectedOrderDetail.history.map((h, i) => (
                      <div
                        key={i}
                        className="d-flex align-items-start gap-3 pb-2 mb-2 border-bottom border-light"
                      >
                        <Badge
                          bg={orderStatusBadge[h.status]?.bg || 'secondary'}
                          className="mt-1"
                        >
                          {h.status}
                        </Badge>
                        <div className="flex-grow-1 small">
                          <div className="d-flex justify-content-between">
                            <strong className="text-dark">
                              {h.actorEmail || 'Hệ thống'}
                            </strong>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {formatDateTime(h.createdAt)}
                            </span>
                          </div>
                          {h.note && (
                            <div className="text-secondary mt-1">{h.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <div>
            {selectedOrderDetail?.order?.status &&
              ['CREATED', 'PENDING_PAYMENT', 'CONFIRMED'].includes(selectedOrderDetail.order.status) && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    setCancelError('')
                    setCancelReason('')
                    setCancelModal({
                      show: true,
                      orderId: selectedOrderDetail.order.id,
                      orderCode: selectedOrderDetail.order.orderCode,
                    })
                  }}
                >
                  <XCircle size={14} className="me-1" />
                  Hủy đơn hàng này
                </Button>
              )}
            {canConfirmDelivered(selectedOrderDetail) && (
              <Button variant="success" size="sm" className="ms-2" disabled={delivering} onClick={handleConfirmDelivered}>
                {delivering ? <Spinner animation="border" size="sm" className="me-1" /> : <CheckCircle2 size={14} className="me-1" />}
                Duyệt giao hàng thành công
              </Button>
            )}
          </div>

          <Button
            variant="light"
            onClick={() => {
              setSelectedOrderDetail(null)
              setDetailModalError('')
            }}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Order Reason Modal */}
      <Modal
        show={cancelModal.show}
        onHide={() => {
          if (!cancelLoading) {
            setCancelModal({ show: false, orderId: null, orderCode: '' })
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger d-flex align-items-center gap-2">
            <XCircle size={20} /> Xác nhận hủy đơn hàng #{cancelModal.orderCode}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cancelError && <Alert variant="danger">{cancelError}</Alert>}
          <p className="small text-secondary mb-2">
            Hành động này sẽ hủy toàn bộ các kiện hàng trong đơn. Vui lòng nhập lý do hủy cụ thể:
          </p>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Nhập lý do hủy đơn (bắt buộc)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="rounded-3"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            disabled={cancelLoading}
            onClick={() => setCancelModal({ show: false, orderId: null, orderCode: '' })}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            className="fw-bold"
            disabled={cancelLoading || !cancelReason.trim()}
            onClick={handleExecuteCancel}
          >
            {cancelLoading && <Spinner size="sm" className="me-1" />}
            Xác nhận hủy đơn
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
