import { useEffect, useState, useMemo } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import formatCurrency from '../../utils/formatCurrency'
import { api } from '../../services/apiClient'
import AddressBook from '../../components/account/AddressBook'
import ChangePasswordCard from '../../components/account/ChangePasswordCard'
import RefundBankCard from '../../components/refunds/RefundBankCard'

const roleLabel = { USER: 'Khách hàng mua sắm nông sản sạch', PARTNER: 'Đối tác nhà vườn', MANAGER: 'Quản lý vận hành', ADMIN: 'Quản trị viên' }
import {
  Package,
  ArrowLeft,
  ArrowRight,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  CreditCard,
  User,
  Phone,
  MapPin,
  Star,
  Copy,
  Check,
  Search,
  MessageSquare,
  AlertCircle,
  Store,
  ExternalLink,
} from 'lucide-react'

const statusLabel = {
  CREATED: 'Đã tạo',
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  SHIPPED: 'Đang giao hàng',
  DELIVERED: 'Đã giao thành công',
  CANCELLED: 'Đã hủy',
  PAID: 'Đã thanh toán',
  PENDING: 'Đang xử lý',
  FAILED: 'Thất bại',
}

const statusBadgeVariant = {
  CREATED: 'secondary',
  PENDING_PAYMENT: 'warning',
  CONFIRMED: 'primary',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  PAID: 'success',
}

/* ==========================================================================
   1. MyOrdersPage (Refactored with Executive Stats & Tab Filters)
   ========================================================================== */
export function MyOrdersPage({ orders = [] }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  // Compute status metrics dynamically from real orders
  const metrics = useMemo(() => {
    const total = orders.length
    const pendingPayment = orders.filter((o) => o.status === 'PENDING_PAYMENT').length
    const shipping = orders.filter((o) => ['CREATED', 'CONFIRMED', 'SHIPPED'].includes(o.status)).length
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length
    return { total, pendingPayment, shipping, delivered, cancelled }
  }, [orders])

  // Filtered list based on active tab and search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      let matchesTab = true
      if (activeTab === 'pending_payment') {
        matchesTab = order.status === 'PENDING_PAYMENT'
      } else if (activeTab === 'shipping') {
        matchesTab = ['CREATED', 'CONFIRMED', 'SHIPPED'].includes(order.status)
      } else if (activeTab === 'delivered') {
        matchesTab = order.status === 'DELIVERED'
      } else if (activeTab === 'cancelled') {
        matchesTab = order.status === 'CANCELLED'
      }

      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !term ||
        order.orderCode?.toLowerCase().includes(term) ||
        order.customerInfo?.fullName?.toLowerCase().includes(term) ||
        (order.items || []).some((i) => i.product?.name?.toLowerCase().includes(term))

      return matchesTab && matchesSearch
    })
  }, [orders, activeTab, searchTerm])

  const copyOrderCode = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  return (
    <Container className="py-4 py-md-5">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
        <div>
          <div className="hero-kicker mb-1">Tài khoản khách hàng</div>
          <h1 className="section-title mb-1">
            Đơn hàng <span className="gradient-text">của tôi</span>
          </h1>
          <p className="text-secondary mb-0">
            Theo dõi hành trình nông sản từ vườn và lịch sử các bữa ăn an lành của gia đình.
          </p>
        </div>
        <Link to="/products" className="primary-btn">
          <span>Mua thêm nông sản</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* 4 Summary Metric Cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <div className="order-stat-card">
            <div className="order-stat-icon bg-success-subtle text-success">
              <Package size={24} />
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark">{metrics.total}</div>
              <div className="small text-muted">Tổng số đơn hàng</div>
            </div>
          </div>
        </Col>

        <Col sm={6} lg={3}>
          <div className="order-stat-card">
            <div className="order-stat-icon bg-info-subtle text-info">
              <Truck size={24} />
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark">{metrics.shipping}</div>
              <div className="small text-muted">Đang vận chuyển</div>
            </div>
          </div>
        </Col>

        <Col sm={6} lg={3}>
          <div className="order-stat-card">
            <div className="order-stat-icon bg-warning-subtle text-warning">
              <Clock size={24} />
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark">{metrics.pendingPayment}</div>
              <div className="small text-muted">Chờ thanh toán</div>
            </div>
          </div>
        </Col>

        <Col sm={6} lg={3}>
          <div className="order-stat-card">
            <div className="order-stat-icon bg-success text-white">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark">{metrics.delivered}</div>
              <div className="small text-muted">Đã nhận thành công</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Status Filter Tabs & Search Bar */}
      <Card className="detail-card border-0 p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="order-filter-nav">
            <button
              type="button"
              className={`order-filter-pill ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>Tất cả</span>
              <span className="pill-counter">{metrics.total}</span>
            </button>
            <button
              type="button"
              className={`order-filter-pill ${activeTab === 'pending_payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending_payment')}
            >
              <span>Chờ thanh toán</span>
              <span className="pill-counter">{metrics.pendingPayment}</span>
            </button>
            <button
              type="button"
              className={`order-filter-pill ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              <span>Đang giao hàng</span>
              <span className="pill-counter">{metrics.shipping}</span>
            </button>
            <button
              type="button"
              className={`order-filter-pill ${activeTab === 'delivered' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivered')}
            >
              <span>Đã hoàn tất</span>
              <span className="pill-counter">{metrics.delivered}</span>
            </button>
            <button
              type="button"
              className={`order-filter-pill ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              <span>Đã hủy</span>
              <span className="pill-counter">{metrics.cancelled}</span>
            </button>
          </div>

          {/* Search Order by Code */}
          <div className="d-flex align-items-center gap-2" style={{ minWidth: '240px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <Form.Control
                type="text"
                placeholder="Tìm mã đơn hàng..."
                className="border-start-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Order Cards List */}
      {filteredOrders.length === 0 ? (
        <Card className="detail-card border-0 p-5 text-center my-4">
          <Package size={52} className="text-muted opacity-50 mx-auto mb-3" />
          <h4 className="fw-bold mb-2">Không tìm thấy đơn hàng nào</h4>
          <p className="text-secondary mb-4 max-w-500 mx-auto">
            {searchTerm
              ? 'Không có đơn hàng nào khớp với từ khóa tìm kiếm. Hãy thử kiểm tra lại mã đơn.'
              : 'Hãy khám phá các loại rau củ tươi ngon đạt chuẩn VietGAP ngay hôm nay.'}
          </p>
          <div>
            <Link to="/products" className="primary-btn btn-lg">
              <span>Khám phá nông sản sạch</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </Card>
      ) : (
        <Row className="g-4">
          {filteredOrders.map((order) => {
            const isPendingPayment = order.status === 'PENDING_PAYMENT'
            const isPayOS = order.paymentMethod === 'payos'

            return (
              <Col xs={12} key={order.orderCode}>
                <div className="order-card-modern">
                  {/* Order Card Header */}
                  <div className="order-card-header">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-bold font-monospace text-dark fs-6">
                        #{order.orderCode}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-muted d-inline-flex align-items-center"
                        title="Sao chép mã đơn"
                        onClick={() => copyOrderCode(order.orderCode)}
                      >
                        {copiedCode === order.orderCode ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <span className="text-muted small">·</span>
                      <span className="text-muted small d-inline-flex align-items-center gap-1">
                        <Clock size={13} /> {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Badge
                        bg={statusBadgeVariant[order.status] || 'secondary'}
                        pill
                        className="px-3 py-1 fw-bold"
                      >
                        {statusLabel[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Order Card Body */}
                  <div className="order-card-body">
                    {/* Items Preview */}
                    <div className="d-flex flex-column gap-3 mb-3">
                      {(order.items || []).slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="d-flex align-items-center justify-content-between gap-3 p-2 rounded-3 bg-light"
                        >
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            {item.product?.image && (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                }}
                              />
                            )}
                            <div className="overflow-hidden">
                              <h6 className="fw-bold text-dark mb-0 text-truncate">
                                {item.product?.name}
                              </h6>
                              <small className="text-muted d-block text-truncate">
                                Nhà vườn: {item.product?.supplierName || 'Đối tác CleanMarket'}
                              </small>
                            </div>
                          </div>

                          <div className="text-end text-nowrap">
                            <span className="fw-semibold text-dark">
                              {item.quantity} {item.product?.unit || 'phần'}
                            </span>
                            <div className="text-success fw-bold small">
                              {formatCurrency(item.totalAmount || item.product?.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      ))}

                      {order.items?.length > 3 && (
                        <div className="text-muted small ps-1">
                          + và {order.items.length - 3} mặt hàng nông sản khác...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Card Footer */}
                  <div className="order-card-footer">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">Thanh toán:</span>
                      <span className="badge bg-light text-dark border rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1">
                        <CreditCard size={13} className="text-success" />
                        {order.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : 'VietQR (PayOS)'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div>
                        <span className="small text-muted me-2">Tổng tiền:</span>
                        <span className="fs-4 fw-bold text-success">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      {isPendingPayment && isPayOS && (
                        <Button
                          className="primary-btn py-1 px-3"
                          onClick={() => navigate(`/payment/payos?orderId=${order.id}`)}
                        >
                          <span>Thanh toán ngay</span>
                          <ArrowRight size={14} />
                        </Button>
                      )}

                      <Link
                        to={`/orders/${order.orderCode}`}
                        className="btn btn-outline-success rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      )}
    </Container>
  )
}

/* ==========================================================================
   2. OrderDetailPage (Visual Progress Stepper & Supplier Breakdowns)
   ========================================================================== */
export function OrderDetailPage({ orders = [], onOrdersChanged }) {
  const { orderCode } = useParams()
  const navigate = useNavigate()
  const order = orders.find((item) => item.orderCode === orderCode)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewItemId, setReviewItemId] = useState('')
  const [reason, setReason] = useState('Chất lượng sản phẩm')
  const [description, setDescription] = useState('')
  const [complaintPartId, setComplaintPartId] = useState('')
  const [reviews, setReviews] = useState([])
  const [complaints, setComplaints] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submittingComplaint, setSubmittingComplaint] = useState(false)

  const deliveredItems =
    order?.supplierOrders?.filter((part) => part.status === 'DELIVERED').flatMap((part) => part.items) || []
  const selectedReviewItemId = reviewItemId || String(deliveredItems[0]?.id || '')

  useEffect(() => {
    if (!order) return
    const productIds = [...new Set((order.items || []).map((item) => item.product?.id).filter(Boolean))]
    Promise.all([
      Promise.all(productIds.map((id) => api.get(`/api/products/${id}/reviews`))),
      api.get('/api/complaints/my'),
    ])
      .then(([reviewGroups, complaintData]) => {
        setReviews(reviewGroups.flat())
        setComplaints(complaintData.filter((item) => item.orderCode === orderCode))
      })
      .catch((caught) => setError(caught.message))
  }, [order, orderCode])

  if (!order) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="rounded-4 max-w-600 mx-auto">
          Không tìm thấy thông tin đơn hàng này trong tài khoản.
        </Alert>
        <Link to="/orders" className="primary-btn mt-3">
          <ArrowLeft size={16} /> Quay lại danh sách đơn hàng
        </Link>
      </Container>
    )
  }

  // Group items by supplier farm
  const supplierGroups = Object.groupBy
    ? Object.groupBy(order.items || [], (item) => item.product?.supplierName || 'Nhà cung cấp đối tác')
    : (order.items || []).reduce((groups, item) => {
        const key = item.product?.supplierName || 'Nhà cung cấp đối tác'
        return { ...groups, [key]: [...(groups[key] || []), item] }
      }, {})

  // Compute active step in stepper
  const getStepIndex = (status) => {
    switch (status) {
      case 'CREATED':
      case 'PENDING_PAYMENT':
        return 1
      case 'CONFIRMED':
        return 2
      case 'SHIPPED':
        return 3
      case 'DELIVERED':
        return 4
      default:
        return 1
    }
  }

  const currentStep = getStepIndex(order.status)

  const submitReview = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmittingReview(true)
    try {
      const created = await api.post('/api/reviews', {
        orderItemId: Number(selectedReviewItemId),
        rating: Number(rating),
        comment,
      })
      setReviews((current) => [...current, created])
      setComment('')
      setNotice('Cảm ơn bạn! Đã gửi đánh giá thành công tới nhà vườn.')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  const submitComplaint = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmittingComplaint(true)
    try {
      const created = await api.post('/api/complaints', {
        orderId: order.id,
        reason,
        description,
        supplierOrderId: complaintPartId ? Number(complaintPartId) : null,
      })
      setComplaints((current) => [created, ...current])
      setDescription('')
      setNotice('Đã tiếp nhận phản hồi. Bộ phận hỗ trợ khách hàng sẽ liên hệ với bạn trong 24h.')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSubmittingComplaint(false)
    }
  }

  const cancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng nông sản này?')) return
    try {
      await api.post(`/api/orders/${order.id}/cancel`)
      if (onOrdersChanged) await onOrdersChanged()
      setNotice('Đã hủy đơn hàng thành công.')
    } catch (caught) {
      setError(caught.message)
    }
  }

  return (
    <Container className="py-4 py-md-5">
      {/* Breadcrumb Navigation */}
      <Link
        to="/orders"
        className="btn btn-sm btn-light border rounded-pill px-3 py-2 mb-3 d-inline-flex align-items-center gap-1 fw-semibold text-secondary"
      >
        <ArrowLeft size={15} /> Quay lại danh sách đơn hàng
      </Link>

      {/* Order Header Title */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="section-title mb-1">Đơn hàng #{orderCode}</h1>
            <Badge
              bg={statusBadgeVariant[order.status] || 'secondary'}
              pill
              className="px-3 py-1 fs-6"
            >
              {statusLabel[order.status] || order.status}
            </Badge>
          </div>
          <p className="text-secondary small mb-0">
            Đặt ngày {new Date(order.createdAt).toLocaleString('vi-VN')} · Giao bởi đội xe vận tải chuyên dụng
          </p>
        </div>

        <div className="d-flex gap-2">
          {order.status === 'PENDING_PAYMENT' && order.paymentMethod === 'payos' && (
            <Button
              className="primary-btn"
              onClick={() => navigate(`/payment/payos?orderId=${order.id}`)}
            >
              <CreditCard size={16} />
              <span>Thanh toán VietQR PayOS</span>
            </Button>
          )}
          {['CREATED', 'PENDING_PAYMENT'].includes(order.status) && (
            <Button variant="outline-danger" className="rounded-pill px-3 fw-bold" onClick={cancelOrder}>
              <XCircle size={15} className="me-1" />
              Hủy đơn
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <Alert variant="success" className="rounded-4 d-flex align-items-center gap-2 mb-4" dismissible onClose={() => setNotice('')}>
          <CheckCircle2 size={18} /> {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="rounded-4 d-flex align-items-center gap-2 mb-4" dismissible onClose={() => setError('')}>
          <AlertCircle size={18} /> {error}
        </Alert>
      )}

      {/* Visual Order Progress Stepper (Only for active or delivered orders) */}
      {order.status !== 'CANCELLED' && (
        <Card className="detail-card border-0 p-4 mb-4">
          <div className="order-stepper">
            <div className={`order-step ${currentStep >= 1 ? 'completed' : ''}`}>
              <div className="order-step-circle">
                {currentStep > 1 ? <Check size={18} /> : 1}
              </div>
              <div className="order-step-label">Đã tạo đơn</div>
              <small className="text-muted d-none d-sm-block">Hệ thống ghi nhận</small>
            </div>

            <div className={`order-step ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}`}>
              <div className="order-step-circle">
                {currentStep > 2 ? <Check size={18} /> : 2}
              </div>
              <div className="order-step-label">Nhà vườn xác nhận</div>
              <small className="text-muted d-none d-sm-block">Thu hoạch & đóng gói</small>
            </div>

            <div className={`order-step ${currentStep >= 3 ? (currentStep > 3 ? 'completed' : 'active') : ''}`}>
              <div className="order-step-circle">
                {currentStep > 3 ? <Check size={18} /> : 3}
              </div>
              <div className="order-step-label">Đang vận chuyển</div>
              <small className="text-muted d-none d-sm-block">Xe lạnh giao tận nơi</small>
            </div>

            <div className={`order-step ${currentStep >= 4 ? 'completed' : ''}`}>
              <div className="order-step-circle">
                {currentStep >= 4 ? <Check size={18} /> : 4}
              </div>
              <div className="order-step-label">Giao thành công</div>
              <small className="text-muted d-none d-sm-block">Đã nhận hàng</small>
            </div>
          </div>
        </Card>
      )}

      <Row className="g-4">
        {/* Left Column: Products grouped by farm & pricing breakdown */}
        <Col lg={7}>
          <Card className="detail-card border-0 p-3 p-md-4 mb-4">
            <h4 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <Package size={20} className="text-success" />
              Nông sản theo nhà vườn đối tác
            </h4>

            {Object.entries(supplierGroups).map(([supplier, items]) => (
              <div key={supplier} className="mb-4 p-3 bg-light rounded-4 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Store size={18} className="text-success" />
                    <h6 className="fw-bold text-success mb-0">{supplier}</h6>
                    <span className="badge bg-success-subtle text-success small rounded-pill px-2">
                      VietGAP
                    </span>
                  </div>
                </div>

                <Table borderless responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="border-bottom small text-muted">
                      <th className="ps-0">Sản phẩm</th>
                      <th>Số lượng</th>
                      <th className="text-end pe-0">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="ps-0 py-2">
                          <div className="d-flex align-items-center gap-2">
                            {item.product?.image && (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                              />
                            )}
                            <div>
                              <Link
                                to={`/products/${item.product.id}`}
                                className="fw-bold text-dark text-decoration-none d-block"
                              >
                                {item.product.name}
                              </Link>
                              {item.product?.batch?.traceCode && (
                                <Link
                                  to={`/trace/${item.product.batch.traceCode}`}
                                  className="text-success small d-inline-flex align-items-center gap-1"
                                >
                                  QR Lô: {item.product.batch.traceCode} <ExternalLink size={11} />
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 text-dark font-monospace fw-semibold">
                          {item.quantity} {item.product.unit}
                        </td>
                        <td className="pe-0 py-2 text-end fw-bold text-dark font-monospace">
                          {formatCurrency(item.totalAmount || item.product.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}

            {/* Price Calculation Box */}
            <div className="pt-3 border-top">
              <div className="d-flex justify-content-between align-items-center mb-2 text-secondary small">
                <span>Tạm tính tiền hàng:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2 text-secondary small">
                <span>Phí vận chuyển giao nhanh:</span>
                <span className="text-success fw-bold">Miễn phí</span>
              </div>
              <div className="d-flex justify-content-between align-items-baseline pt-2 border-top">
                <span className="fs-5 fw-bold text-dark">Tổng thanh toán:</span>
                <span className="fs-3 fw-bold text-success font-monospace">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </Card>

          {/* Product Quality Review Section */}
          <Card className="detail-card border-0 p-3 p-md-4 mb-4">
            <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Star size={20} className="text-warning fill-warning" />
              Đánh giá chất lượng nông sản
            </h4>

            {deliveredItems.length > 0 ? (
              <Form onSubmit={submitReview}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Chọn sản phẩm cần đánh giá</Form.Label>
                    <Form.Select
                      required
                      value={selectedReviewItemId}
                      onChange={(e) => setReviewItemId(e.target.value)}
                      className="rounded-3"
                    >
                      {deliveredItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.productName}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Mức độ hài lòng</Form.Label>
                    <Form.Select
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="rounded-3"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 sao - Tươi ngon tuyệt vời)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 sao - Rất tốt)</option>
                      <option value={3}>⭐⭐⭐ (3 sao - Tạm được)</option>
                      <option value={2}>⭐⭐ (2 sao - Chưa tươi như kỳ vọng)</option>
                      <option value={1}>⭐ (1 sao - Không hài lòng)</option>
                    </Form.Select>
                  </Col>

                  <Col xs={12}>
                    <Form.Label className="small fw-semibold">Cảm nhận của bạn</Form.Label>
                    <Form.Control
                      as="textarea"
                      required
                      rows={2}
                      placeholder="Chia sẻ về độ tươi sạch, bao bì đóng gói và thời gian giao nhận..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="rounded-3"
                    />
                  </Col>

                  <Col xs={12}>
                    <Button className="primary-btn" type="submit" disabled={submittingReview}>
                      {submittingReview ? <Spinner size="sm" /> : <MessageSquare size={16} />}
                      <span>Gửi đánh giá cho nhà vườn</span>
                    </Button>
                  </Col>
                </Row>
              </Form>
            ) : (
              <Alert variant="light" className="mb-0 border rounded-4 d-flex align-items-center gap-2">
                <Clock size={18} className="text-muted" />
                <span>
                  Bạn có thể gửi đánh giá khi đơn hàng được chuyển sang trạng thái <strong>Đã giao thành công</strong>.
                </span>
              </Alert>
            )}

            {/* List of Sent Reviews */}
            {reviews.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-bold mb-3">Đánh giá về sản phẩm trong đơn:</h6>
                {reviews.map((item) => (
                  <div key={item.id} className="small mb-2 p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-warning fw-bold">
                        {'★'.repeat(item.rating)} ({item.rating}/5)
                      </span>
                      <span className="text-muted">{item.author}</span>
                    </div>
                    <div className="text-dark fw-semibold">{item.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Right Column: Customer Details, Payment, and Complaints */}
        <Col lg={5}>
          {/* Shipping & Customer Details Card */}
          <Card className="detail-card border-0 p-3 p-md-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <MapPin size={18} className="text-danger" />
              Thông tin nhận hàng
            </h5>
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <User size={16} className="text-muted" />
                <strong>{order.customerInfo.fullName}</strong>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <Phone size={16} className="text-muted" />
                <span>{order.customerInfo.phone}</span>
              </div>
              <div className="d-flex align-items-start gap-2">
                <MapPin size={16} className="text-muted flex-shrink-0 mt-1" />
                <span className="text-secondary">{order.customerInfo.address}</span>
              </div>
              {order.customerInfo.note && (
                <div className="mt-2 pt-2 border-top small text-muted">
                  <em>Ghi chú: {order.customerInfo.note}</em>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <h5 className="fw-bold mb-2 d-flex align-items-center gap-2">
              <CreditCard size={18} className="text-success" />
              Phương thức thanh toán
            </h5>
            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted small">Hình thức:</span>
                <Badge bg={order.paymentMethod === 'cod' ? 'secondary' : 'success'} pill>
                  {order.paymentMethod === 'cod' ? 'Thanh toán COD khi nhận' : 'VietQR / PayOS'}
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Trạng thái:</span>
                <span className="fw-bold text-dark small">
                  {statusLabel[order.status] || order.status}
                </span>
              </div>
            </div>
          </Card>

          {/* Support & Complaints Ticket Card */}
          <Card className="detail-card border-0 p-3 p-md-4">
            <h5 className="fw-bold mb-2 d-flex align-items-center gap-2">
              <AlertCircle size={18} className="text-warning" />
              Hỗ trợ &amp; Khiếu nại chất lượng
            </h5>
            <p className="text-muted small mb-3">
              Nếu nông sản bị dập nát, giao sai món hoặc không hài lòng về độ tươi, CleanMarket cam kết đổi trả hoặc hoàn tiền nhanh chóng.
            </p>
            <Form onSubmit={submitComplaint}>
              {order.supplierOrders?.length > 1 && (
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Nhà cung cấp liên quan</Form.Label>
                  <Form.Select className="rounded-3" value={complaintPartId} onChange={(e) => setComplaintPartId(e.target.value)}>
                    <option value="">Cả đơn hàng</option>
                    {order.supplierOrders.map((part) => (
                      <option key={part.id} value={part.id}>{part.supplierName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Vấn đề gặp phải</Form.Label>
                <Form.Select
                  className="rounded-3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option>Chất lượng sản phẩm (dập nát, héo)</option>
                  <option>Giao hàng chậm / sai số lượng</option>
                  <option>Vấn đề thanh toán / hóa đơn</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Mô tả chi tiết</Form.Label>
                <Form.Control
                  as="textarea"
                  required
                  rows={2}
                  className="rounded-3"
                  placeholder="Mô tả cụ thể để nhân viên hỗ trợ nhanh nhất..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>

              <Button
                type="submit"
                variant="outline-success"
                className="rounded-pill w-100 fw-bold py-2"
                disabled={submittingComplaint}
              >
                {submittingComplaint ? <Spinner size="sm" /> : <MessageSquare size={16} className="me-1" />}
                Gửi phản hồi khiếu nại
              </Button>
            </Form>

            {/* List of complaints */}
            {complaints.length > 0 && (
              <div className="mt-3 pt-3 border-top">
                <div className="small fw-bold text-muted mb-2">Lịch sử hỗ trợ:</div>
                {complaints.map((item) => (
                  <div className="small p-2 bg-light rounded-3 border mb-2" key={item.id}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark">{item.reason}</span>
                      <Badge bg={item.status === 'RESOLVED' ? 'success' : 'warning'} pill>
                        {item.status === 'RESOLVED' ? 'Đã xử lý' : 'Đang xử lý'}
                      </Badge>
                    </div>
                    {item.supplierName && <div className="text-secondary">Nhà cung cấp: {item.supplierName}</div>}
                    <div className="text-muted">{item.description}</div>
                    {item.resolution && <div className="text-success mt-1">Phương án: {item.resolution}</div>}
                  </div>
                ))}
              </div>
            )}
          </Card>
          <RefundBankCard orderCode={order.orderCode} />
        </Col>
      </Row>
    </Container>
  )
}

/* ==========================================================================
   3. ProfilePage (Executive User Center & Saved Preferences)
   ========================================================================== */
export function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/users/me')
      .then((data) => {
        setProfile(data)
        setFullName(data.fullName || '')
        setPhone(data.phone || '')
      })
      .catch((caught) => setError(caught.message))
  }, [])

  const save = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const data = await api.put('/api/users/me', {
        fullName,
        phone,
      })
      setProfile(data)
      setNotice('Đã cập nhật hồ sơ cá nhân thành công.')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  if (!profile && !error) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <div className="mt-2 text-muted">Đang tải thông tin tài khoản...</div>
      </Container>
    )
  }

  const userInitial = (fullName || profile?.email || 'U').charAt(0).toUpperCase()

  return (
    <Container className="py-4 py-md-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Header Card */}
          <div className="profile-card-modern mb-4">
            <div className="d-flex align-items-center gap-4 flex-wrap">
              <div className="profile-avatar-circle">{userInitial}</div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <h3 className="fw-bold mb-0 text-dark">{profile?.fullName || 'Khách hàng'}</h3>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-bold">
                    ✓ Thành viên CleanMarket
                  </span>
                </div>
                <div className="text-secondary small">{profile?.email}</div>
                <div className="text-muted small mt-1">Vai trò: {roleLabel[profile?.role] || 'Khách hàng mua sắm nông sản sạch'}</div>
              </div>
            </div>
          </div>

          {notice && (
            <Alert variant="success" className="rounded-4 mb-4 d-flex align-items-center gap-2" dismissible onClose={() => setNotice('')}>
              <CheckCircle2 size={18} /> {notice}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" className="rounded-4 mb-4 d-flex align-items-center gap-2" dismissible onClose={() => setError('')}>
              <AlertCircle size={18} /> {error}
            </Alert>
          )}

          {/* Profile Form */}
          <Card className="detail-card border-0 p-4 shadow-sm">
            <h4 className="fw-bold mb-3 text-dark">Thông tin tài khoản</h4>
            <Form onSubmit={save}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Họ và tên</Form.Label>
                    <Form.Control
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Nguyễn Văn A"
                      className="py-2 rounded-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Số điện thoại liên hệ</Form.Label>
                    <Form.Control
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="py-2 rounded-3"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="small text-muted mb-1">Email đăng nhập (Không thay đổi):</div>
                    <strong className="text-dark font-monospace">{profile?.email}</strong>
                  </div>
                </Col>

                <Col xs={12} className="pt-2">
                  <Button
                    className="primary-btn w-100 py-2 fw-bold"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? <Spinner size="sm" /> : <CheckCircle2 size={18} />}
                    <span>Lưu thông tin hồ sơ</span>
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
          {profile?.role === 'USER' || profile?.role === 'PARTNER' ? <AddressBook /> : null}
          <ChangePasswordCard />
        </Col>
      </Row>
    </Container>
  )
}

/* ==========================================================================
   4. PaymentResultPage (Celebratory Success & PayOS Transaction Feedback)
   ========================================================================== */
export function PaymentResultPage({ orders = [] }) {
  const [params] = useSearchParams()
  const orderCode = params.get('orderCode')
  const order = orders.find((item) => item.orderCode === orderCode)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Uses the payOS status API, which also re-checks with payOS when the webhook has not arrived yet.
  const knownOrderId = order?.id
  useEffect(() => {
    if (!orderCode) return undefined
    let active = true
    const resolveId = knownOrderId
      ? Promise.resolve(knownOrderId)
      : api.get(`/api/orders/code/${encodeURIComponent(orderCode)}`).then((o) => o.id)
    resolveId
      .then((id) => api.get(`/api/payments/order/${id}/status`))
      .then((s) => { if (active) setPayment({ orderCode: s.orderCode, amount: s.amount, status: s.paymentStatus, orderStatus: s.orderStatus }) })
      .catch((caught) => { if (active) setError(caught.message) })
    return () => { active = false }
  }, [orderCode, knownOrderId])

  const copyCode = () => {
    if (!orderCode) return
    navigator.clipboard?.writeText(orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isSuccess = payment?.status === 'PAID'

  return (
    <Container className="py-5">
      <Card className="detail-card border-0 p-4 p-md-5 max-w-600 mx-auto text-center shadow-lg">
        {/* Animated Celebration Icon */}
        <div className="mb-4">
          <div className={isSuccess ? 'success-icon mx-auto' : 'order-stat-icon bg-warning text-white mx-auto'}>
            {isSuccess ? <Check size={42} /> : <AlertCircle size={42} />}
          </div>
        </div>

        <h2 className="section-title mb-2">
          {isSuccess ? 'Thanh toán thành công!' : 'Trạng thái giao dịch'}
        </h2>
        <p className="text-secondary mb-4">
          {isSuccess
            ? 'Cảm ơn bạn đã tin chọn nông sản sạch CleanMarket. Đơn hàng đang được nhà vườn chuẩn bị thu hoạch.'
            : 'Hệ thống đang đồng bộ dữ liệu thanh toán từ cổng VietQR PayOS.'}
        </p>

        {error && <Alert variant="warning" className="rounded-4 mb-4">{error}</Alert>}

        {payment ? (
          <div className="p-3 bg-light rounded-4 border mb-4 text-start">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Mã đơn hàng:</span>
              <div className="d-flex align-items-center gap-1">
                <strong className="font-monospace text-dark">{payment.orderCode}</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-muted"
                  onClick={copyCode}
                  title="Sao chép"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Số tiền giao dịch:</span>
              <span className="fs-5 fw-bold text-success font-monospace">
                {formatCurrency(Number(payment.amount))}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
              <span className="text-muted small">Trạng thái:</span>
              <Badge bg={isSuccess ? 'success' : 'warning'} pill className="px-3 py-1">
                {statusLabel[payment.status] || payment.status}
              </Badge>
            </div>
          </div>
        ) : (
          !error && (
            <div className="py-4">
              <Spinner animation="border" variant="success" />
              <div className="mt-2 text-muted small">Đang đối soát giao dịch với ngân hàng...</div>
            </div>
          )
        )}

        <div className="d-flex justify-content-center gap-3 flex-wrap">
          {order && (
            <Link to={`/orders/${order.orderCode}`} className="primary-btn">
              <span>Xem chi tiết đơn hàng</span>
              <ArrowRight size={16} />
            </Link>
          )}
          <Link to="/products" className="btn btn-outline-success rounded-pill px-4 py-2 fw-bold">
            Tiếp tục mua sắm
          </Link>
        </div>
      </Card>
    </Container>
  )
}
