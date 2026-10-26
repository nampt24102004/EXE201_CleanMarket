import { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Table,
  Button,
  Badge,
  Form,
  Spinner,
  Alert,
  Modal,
} from 'react-bootstrap'
import {
  CreditCard,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

const statusBadges = {
  PAID: { label: 'Đã thanh toán', bg: 'success', icon: CheckCircle2 },
  PENDING: { label: 'Đang chờ xử lý', bg: 'warning', icon: Clock },
  CANCELLED: { label: 'Đã hủy', bg: 'secondary', icon: XCircle },
  EXPIRED: { label: 'Hết hạn', bg: 'danger', icon: AlertTriangle },
  REFUNDED: { label: 'Đã hoàn tiền', bg: 'info', icon: RefreshCw },
}

export default function AdminPaymentsView({ showDemoDates, onToggleDemoDates, demoTimeline, demoLoading }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')
  const [reconcilingId, setReconcilingId] = useState(null)

  // Filters
  const [q, setQ] = useState('')
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('')
  const [staleOnly, setStaleOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [size] = useState(15)

  // Data
  const [paymentData, setPaymentData] = useState({
    items: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
  })

  // Detail Modal
  const [selectedPayment, setSelectedPayment] = useState(null)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.append('q', q.trim())
      if (provider) params.append('provider', provider)
      if (status) params.append('status', status)
      if (staleOnly) params.append('stale', 'true')
      params.append('page', String(page))
      params.append('size', String(size))

      const data = await api.get(`/api/admin/payments?${params.toString()}`)
      setPaymentData(data ? { ...data, totalElements: data.total ?? 0 } : { items: [], totalElements: 0, totalPages: 0, page: 0 })
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách thanh toán.')
    } finally {
      setLoading(false)
    }
  }, [q, provider, status, staleOnly, page, size])

  useEffect(() => {
    void Promise.resolve().then(loadPayments)
  }, [loadPayments])

  const handleReconcile = async (paymentId) => {
    setReconcilingId(paymentId)
    setError('')
    setSuccessNotice('')
    try {
      const res = await api.post(`/api/admin/payments/${paymentId}/reconcile`)
      setSuccessNotice(
        `Đối soát thành công giao dịch #${paymentId}! Trạng thái cập nhật: ${res.paymentStatus || 'Đã đồng bộ'}.`
      )
      await loadPayments()
    } catch (err) {
      setError(`Lỗi đối soát: ${err.message}`)
    } finally {
      setReconcilingId(null)
    }
  }

  return (
    <div className="admin-payments-view">
      {/* Top Banner Notice */}
      {successNotice && (
        <Alert variant="success" dismissible onClose={() => setSuccessNotice('')}>
          <CheckCircle2 size={16} className="me-2 inline-block text-success" />
          {successNotice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <AlertTriangle size={16} className="me-2 inline-block text-danger" />
          {error}
        </Alert>
      )}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <Form.Check
          type="switch"
          id="admin-payment-demo-dates"
          label={demoLoading ? 'Đang tải ngày mô phỏng...' : 'Ngày mô phỏng'}
          checked={showDemoDates}
          onChange={(event) => onToggleDemoDates(event.target.checked)}
          disabled={demoLoading}
        />
      </div>
      {showDemoDates && (
        <Alert variant="warning">
          <strong>Ngày mô phỏng — chỉ để trình bày.</strong> Mốc ngày được phân bổ cùng danh sách đơn hàng.
          Thời gian giao dịch thật luôn hiển thị; đối soát PayOS, trạng thái và dữ liệu gốc không thay đổi.
        </Alert>
      )}

      {/* Filter Card */}
      <div className="admin-card mb-4">
        <Row className="g-3 align-items-center">
          <Col md={4}>
            <div className="position-relative">
              <Form.Control
                type="text"
                size="sm"
                placeholder="Tìm mã đơn hàng (orderCode)..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(0)
                }}
                className="pe-4"
              />
              <Search
                size={16}
                className="position-absolute top-50 end-0 translate-middle-y me-2 text-secondary"
              />
            </div>
          </Col>
          <Col sm={6} md={2}>
            <Form.Select
              size="sm"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Tất cả cổng</option>
              <option value="PAYOS">PayOS (VietQR)</option>
              <option value="COD">Tiền mặt (COD)</option>
            </Form.Select>
          </Col>
          <Col sm={6} md={2}>
            <Form.Select
              size="sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán (PAID)</option>
              <option value="PENDING">Đang chờ (PENDING)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </Form.Select>
          </Col>
          <Col md={4} className="d-flex align-items-center justify-content-between gap-2">
            <Form.Check
              type="checkbox"
              id="stale-filter"
              label={
                <span className="small text-danger fw-bold d-flex align-items-center gap-1">
                  <AlertTriangle size={14} /> Giao dịch treo (&gt;30p)
                </span>
              }
              checked={staleOnly}
              onChange={(e) => {
                setStaleOnly(e.target.checked)
                setPage(0)
              }}
            />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={loadPayments}
              disabled={loading}
              className="d-flex align-items-center gap-1"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Tải lại</span>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Main Payments Table Card */}
      <div className="admin-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Danh sách giao dịch thanh toán</h5>
            <p className="text-secondary small mb-0">
              Tổng cộng {paymentData.totalElements} giao dịch được ghi nhận trên hệ thống
            </p>
          </div>
          <Badge bg="primary" pill className="px-3 py-2">
            Trang {paymentData.page + 1} / {Math.max(paymentData.totalPages, 1)}
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="mt-2 text-secondary small">Đang tải danh sách thanh toán...</div>
          </div>
        ) : paymentData.items.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <CreditCard size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Không tìm thấy giao dịch nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Cổng</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>{showDemoDates ? 'Ngày mô phỏng / thật' : 'Thời gian'}</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.items.map((item) => {
                const badge = statusBadges[item.status] || {
                  label: item.status,
                  bg: 'secondary',
                  icon: Clock,
                }
                const BadgeIcon = badge.icon
                const isStale = item.stale

                return (
                  <tr key={item.id} className={isStale ? 'table-warning' : ''}>
                    <td className="small text-secondary">#{item.id}</td>
                    <td>
                      <strong className="text-dark">{item.orderCode}</strong>
                      {isStale && (
                        <div className="badge bg-danger text-white rounded-pill px-2 py-0 ms-1 small">
                          Treo &gt;30p
                        </div>
                      )}
                    </td>
                    <td className="small text-secondary">{item.customerEmail}</td>
                    <td>
                      <Badge bg={item.provider === 'PAYOS' ? 'success' : 'secondary'} className="px-2 py-1">
                        {item.provider}
                      </Badge>
                    </td>
                    <td className="fw-bold text-dark">
                      {formatCurrency(Number(item.amount))}
                    </td>
                    <td>
                      <span className={`badge bg-${badge.bg} d-inline-flex align-items-center gap-1 px-2 py-1`}>
                        <BadgeIcon size={12} />
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td className="small text-secondary">
                      {showDemoDates && demoTimeline?.byOrderCode[item.orderCode] ? (
                        <>
                          <div className="fw-semibold text-warning-emphasis">
                            Mô phỏng: {demoTimeline.byOrderCode[item.orderCode].split('-').reverse().join('/')}
                          </div>
                          <div>Ngày thật: {new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                        </>
                      ) : new Date(item.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="px-2 py-1"
                          onClick={() => setSelectedPayment(item)}
                          title="Xem chi tiết"
                        >
                          Chi tiết
                        </Button>
                        {item.provider === 'PAYOS' && (item.status === 'PENDING' || isStale) && (
                          <Button
                            variant="success"
                            size="sm"
                            className="px-2 py-1 d-flex align-items-center gap-1"
                            disabled={reconcilingId === item.id}
                            onClick={() => handleReconcile(item.id)}
                            title="Kiểm tra trạng thái với PayOS"
                          >
                            {reconcilingId === item.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <RefreshCw size={12} />
                            )}
                            <span>Đối soát</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}

        {/* Pagination Bar */}
        {paymentData.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <span className="small text-secondary">
              Hiển thị trang {page + 1} trên {paymentData.totalPages}
            </span>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= paymentData.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      <Modal
        show={Boolean(selectedPayment)}
        onHide={() => setSelectedPayment(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">
            Chi tiết giao dịch #{selectedPayment?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <div className="small">
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-secondary">Mã đơn hàng:</span>
                <strong>{selectedPayment.orderCode}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-secondary">Email người mua:</span>
                <span>{selectedPayment.customerEmail}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-secondary">Cổng thanh toán:</span>
                <span className="fw-bold">{selectedPayment.provider}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-secondary">Số tiền:</span>
                <span className="fw-bold text-success fs-6">
                  {formatCurrency(Number(selectedPayment.amount))}
                </span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-secondary">Trạng thái:</span>
                <span className={`badge bg-${statusBadges[selectedPayment.status]?.bg || 'secondary'}`}>
                  {selectedPayment.status}
                </span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-secondary">Mã giao dịch đối tác:</span>
                <span className="font-monospace">{selectedPayment.providerTransactionNo || 'Chưa có'}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-secondary">Thời gian tạo thật:</span>
                <span>{new Date(selectedPayment.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              {showDemoDates && demoTimeline?.byOrderCode[selectedPayment.orderCode] && (
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary">Ngày mô phỏng:</span>
                  <strong>{demoTimeline.byOrderCode[selectedPayment.orderCode].split('-').reverse().join('/')}</strong>
                </div>
              )}
              <div className="d-flex justify-content-between py-2">
                <span className="text-secondary">Thời gian thanh toán:</span>
                <span>
                  {selectedPayment.paidAt
                    ? new Date(selectedPayment.paidAt).toLocaleString('vi-VN')
                    : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedPayment?.provider === 'PAYOS' && selectedPayment?.status === 'PENDING' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                handleReconcile(selectedPayment.id)
                setSelectedPayment(null)
              }}
            >
              Đối soát ngay với PayOS
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setSelectedPayment(null)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
