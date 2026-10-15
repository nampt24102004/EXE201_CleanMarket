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
} from 'react-bootstrap'
import {
  ClipboardList,
  Search,
  RefreshCw,
  User,
  Clock,
} from 'lucide-react'
import { api } from '../../../services/apiClient'

const auditActionLabels = {
  USER_ENABLE: { text: 'Mở khóa tài khoản', color: 'success' },
  USER_UNLOCK: { text: 'Mở khóa tài khoản', color: 'success' },
  USER_DISABLE: { text: 'Khóa tài khoản', color: 'danger' },
  USER_LOCK: { text: 'Khóa tài khoản', color: 'danger' },
  USER_ROLE_CHANGE: { text: 'Thay đổi quyền', color: 'primary' },
  STAFF_CREATE: { text: 'Tạo tài khoản nhân sự', color: 'primary' },
  CATEGORY_CREATE: { text: 'Tạo danh mục', color: 'success' },
  CATEGORY_UPDATE: { text: 'Đổi tên danh mục', color: 'info' },
  CATEGORY_STATUS: { text: 'Cập nhật trạng thái danh mục', color: 'warning' },
  SETTING_UPDATE: { text: 'Cập nhật cấu hình', color: 'secondary' },
  PAYMENT_RECONCILE: { text: 'Đối soát thanh toán', color: 'success' },
  COMPLAINT_RESOLVE: { text: 'Xử lý khiếu nại', color: 'info' },
  REFUND_REQUEST: { text: 'Yêu cầu hoàn tiền', color: 'warning' },
  REFUND_MANUAL_COMPLETE: { text: 'Hoàn tiền thủ công', color: 'danger' },
  PRODUCT_APPROVED: { text: 'Duyệt sản phẩm', color: 'success' },
  PRODUCT_REJECTED: { text: 'Từ chối sản phẩm', color: 'danger' },
  SUPPLIER_APPROVED: { text: 'Duyệt nhà cung cấp', color: 'success' },
  SUPPLIER_REJECTED: { text: 'Từ chối nhà cung cấp', color: 'danger' },
}

export default function AdminAuditView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [page, setPage] = useState(0)
  const [size] = useState(20)

  // Data
  const [auditData, setAuditData] = useState({
    items: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
  })

  const loadAuditLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (actor.trim()) params.append('actor', actor.trim())
      if (action.trim()) params.append('action', action.trim())
      if (entityType.trim()) params.append('entityType', entityType.trim())
      if (dateRange.from) params.append('from', dateRange.from)
      if (dateRange.to) params.append('to', dateRange.to)
      params.append('page', String(page))
      params.append('size', String(size))

      const data = await api.get(`/api/admin/audit-logs?${params.toString()}`)
      setAuditData(data || { items: [], totalElements: 0, totalPages: 0, page: 0 })
    } catch (err) {
      setError(err.message || 'Lỗi tải nhật ký thao tác.')
    } finally {
      setLoading(false)
    }
  }, [actor, action, entityType, dateRange, page, size])

  useEffect(() => {
    void Promise.resolve().then(loadAuditLogs)
  }, [loadAuditLogs])

  return (
    <div className="admin-audit-view">
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Card */}
      <div className="admin-card mb-4">
        <Row className="g-2 g-md-3 align-items-center">
          <Col md={3}>
            <div className="position-relative">
              <Form.Control
                type="text"
                size="sm"
                placeholder="Người thực hiện (Email)..."
                value={actor}
                onChange={(e) => {
                  setActor(e.target.value)
                  setPage(0)
                }}
              />
              <Search
                size={14}
                className="position-absolute top-50 end-0 translate-middle-y me-2 text-secondary"
              />
            </div>
          </Col>
          <Col sm={6} md={2}>
            <Form.Select
              size="sm"
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Tất cả hành động</option>
              <option value="USER">Thao tác tài khoản</option>
              <option value="STAFF">Tạo nhân viên</option>
              <option value="CATEGORY">Danh mục</option>
              <option value="SETTING">Cấu hình hệ thống</option>
              <option value="PAYMENT">Thanh toán & Đối soát</option>
              <option value="SUPPLIER">Duyệt nhà vườn</option>
              <option value="PRODUCT">Duyệt nông sản</option>
              <option value="REFUND">Hoàn tiền</option>
              <option value="COMPLAINT">Khiếu nại</option>
            </Form.Select>
          </Col>
          <Col sm={6} md={2}>
            <Form.Select
              size="sm"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Tất cả đối tượng</option>
              <option value="UserAccount">UserAccount</option>
              <option value="Category">Category</option>
              <option value="SystemSetting">SystemSetting</option>
              <option value="Payment">Payment</option>
              <option value="Supplier">Supplier</option>
              <option value="Product">Product</option>
              <option value="Complaint">Complaint</option>
              <option value="Refund">Refund</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <div className="d-flex align-items-center gap-1">
              <Form.Control
                type="date"
                size="sm"
                value={dateRange.from}
                onChange={(e) => {
                  setDateRange({ ...dateRange, from: e.target.value })
                  setPage(0)
                }}
                title="Từ ngày"
              />
              <span className="text-secondary">-</span>
              <Form.Control
                type="date"
                size="sm"
                value={dateRange.to}
                onChange={(e) => {
                  setDateRange({ ...dateRange, to: e.target.value })
                  setPage(0)
                }}
                title="Đến ngày"
              />
            </div>
          </Col>
          <Col md={2}>
            <Button
              variant="outline-secondary"
              size="sm"
              className="w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={loadAuditLogs}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Lọc dữ liệu</span>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Main Audit Table */}
      <div className="admin-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Nhật ký kiểm toán an toàn (Audit Trail)</h5>
            <p className="text-secondary small mb-0">
              Ghi lại mọi thay đổi quyền, khóa tài khoản, duyệt nông sản và cấu hình sàn
            </p>
          </div>
          <Badge bg="secondary" pill className="px-3 py-2">
            {auditData.totalElements} bản ghi
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="mt-2 text-secondary small">Đang tải nhật ký...</div>
          </div>
        ) : auditData.items.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <ClipboardList size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Chưa có bản ghi nhật ký nào thỏa mãn điều kiện lọc.</p>
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th>Chi tiết thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {auditData.items.map((item) => {
                const actionMeta = auditActionLabels[item.action] || {
                  text: item.action,
                  color: 'secondary',
                }

                return (
                  <tr key={item.id}>
                    <td className="small text-secondary" style={{ whiteSpace: 'nowrap' }}>
                      <Clock size={12} className="me-1 inline-block" />
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <User size={13} className="text-secondary" />
                        <strong className="text-dark small">
                          {item.actorEmail || 'Hệ thống (System)'}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <Badge bg={actionMeta.color} className="px-2 py-1">
                        {actionMeta.text}
                      </Badge>
                    </td>
                    <td>
                      <code className="text-primary small">
                        {item.entityType} #{item.entityId}
                      </code>
                    </td>
                    <td className="small text-secondary">
                      {item.detail || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}

        {/* Pagination Bar */}
        {auditData.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <span className="small text-secondary">
              Hiển thị trang {page + 1} trên {auditData.totalPages}
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
                disabled={page >= auditData.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
