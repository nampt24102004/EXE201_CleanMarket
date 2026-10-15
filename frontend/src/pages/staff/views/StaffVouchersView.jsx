import { useState, useEffect, useCallback } from 'react'
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
} from 'react-bootstrap'
import { Tag, Plus, Trash2 } from 'lucide-react'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

export default function StaffVouchersView() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE', // 'PERCENTAGE' or 'FIXED'
    discountValue: '',
    maximumDiscountAmount: '',
    minimumOrderAmount: '',
    usageLimit: 100,
    perCustomerLimit: 1,
    startsAt: '',
    expiresAt: '',
    status: 'ACTIVE',
    newCustomerOnly: false,
  })
  const [creating, setCreating] = useState(false)

  const loadVouchers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/manager/vouchers')
      setVouchers(data || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách voucher.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadVouchers)
  }, [loadVouchers])

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleToggleStatus = async (item) => {
    setError('')
    setNotice('')
    try {
      const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await api.put(`/api/manager/vouchers/${item.id}/status`, { status: newStatus })
      setNotice(`Đã chuyển voucher ${item.code} sang trạng thái ${newStatus}!`)
      await loadVouchers()
    } catch (err) {
      setError(`Lỗi cập nhật: ${err.message}`)
    }
  }

  const handleDeleteVoucher = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    setError('')
    setNotice('')
    try {
      await api.delete(`/api/manager/vouchers/${deleteConfirm.id}`)
      setNotice(`Đã xóa thành công voucher "${deleteConfirm.code}"!`)
      setDeleteConfirm(null)
      await loadVouchers()
    } catch (err) {
      setError(`Lỗi xóa voucher: ${err.message}`)
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateVoucher = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        code: createForm.code.trim().toUpperCase(),
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        discountType: createForm.discountType,
        discountValue: Number(createForm.discountValue),
        maximumDiscountAmount: createForm.maximumDiscountAmount
          ? Number(createForm.maximumDiscountAmount)
          : null,
        minimumOrderAmount: createForm.minimumOrderAmount
          ? Number(createForm.minimumOrderAmount)
          : 0,
        usageLimit: createForm.usageLimit ? Number(createForm.usageLimit) : null,
        perCustomerLimit: createForm.perCustomerLimit
          ? Number(createForm.perCustomerLimit)
          : 1,
        startsAt: createForm.startsAt ? new Date(createForm.startsAt).toISOString() : null,
        expiresAt: createForm.expiresAt ? new Date(createForm.expiresAt).toISOString() : null,
        status: createForm.status,
        newCustomerOnly: createForm.newCustomerOnly,
      }

      await api.post('/api/manager/vouchers', payload)
      setNotice(`Đã tạo voucher khuyến mãi sàn "${payload.code}" thành công!`)
      setShowCreateModal(false)
      setCreateForm({
        code: '',
        name: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        maximumDiscountAmount: '',
        minimumOrderAmount: '',
        usageLimit: 100,
        perCustomerLimit: 1,
        startsAt: '',
        expiresAt: '',
        status: 'ACTIVE',
        newCustomerOnly: false,
      })
      await loadVouchers()
    } catch (err) {
      setError(`Lỗi tạo voucher: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="staff-vouchers-view">
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Top Action Bar */}
      <div className="admin-card mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="fw-bold mb-0 text-dark">Chương trình Voucher khuyến mãi sàn</h5>
          <p className="text-secondary small mb-0">
            Quản lý mã giảm giá áp dụng toàn sàn CleanMarket cho khách hàng
          </p>
        </div>
        <Button
          variant="success"
          size="sm"
          className="d-flex align-items-center gap-1"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          <span>Tạo Voucher mới</span>
        </Button>
      </div>

      {/* Vouchers Table */}
      <div className="admin-card">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Tag size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Hiện chưa có voucher khuyến mãi nào trên sàn.</p>
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Tên chương trình</th>
                <th>Mức giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Lượt sử dụng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td>
                    <code className="fw-bold fs-6 text-success bg-success bg-opacity-10 px-2 py-1 rounded">
                      {v.code}
                    </code>
                    {v.newCustomerOnly && (
                      <div className="small text-danger fw-semibold mt-1">Khách mới</div>
                    )}
                  </td>
                  <td>
                    <strong className="text-dark small">{v.name}</strong>
                    <div className="text-secondary small">{v.description || '—'}</div>
                  </td>
                  <td>
                    {v.discountType === 'PERCENTAGE' ? (
                      <span className="fw-bold text-primary">
                        {v.discountValue}% (tối đa {formatCurrency(Number(v.maximumDiscountAmount || 0))})
                      </span>
                    ) : (
                      <span className="fw-bold text-primary">
                        {formatCurrency(Number(v.discountValue))}
                      </span>
                    )}
                  </td>
                  <td>{formatCurrency(Number(v.minimumOrderAmount || 0))}</td>
                  <td>
                    <span className="fw-bold text-dark">{v.usedCount}</span>
                    <span className="text-secondary small"> / {v.usageLimit ? `${v.usageLimit}` : '∞'}</span>
                  </td>
                  <td>
                    <Badge bg={v.status === 'ACTIVE' ? 'success' : 'secondary'} className="px-2 py-1">
                      {v.status === 'ACTIVE' ? 'Đang chạy' : 'Đã dừng'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <Button
                        variant={v.status === 'ACTIVE' ? 'outline-secondary' : 'outline-success'}
                        size="sm"
                        className="px-2 py-1"
                        onClick={() => handleToggleStatus(v)}
                      >
                        {v.status === 'ACTIVE' ? 'Dừng phát' : 'Kích hoạt'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="px-2 py-1"
                        title="Xóa voucher"
                        onClick={() => setDeleteConfirm(v)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Create Voucher Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Form onSubmit={handleCreateVoucher}>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Tạo Voucher khuyến mãi sàn mới</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Mã Voucher * (In hoa, không dấu)</Form.Label>
                  <Form.Control
                    required
                    placeholder="VD: FREESHIP50, RAUSANG50K"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Tên chương trình *</Form.Label>
                  <Form.Control
                    required
                    placeholder="VD: Khuyến mãi mừng khai trương nông sản"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Hình thức giảm</Form.Label>
                  <Form.Select
                    value={createForm.discountType}
                    onChange={(e) => setCreateForm({ ...createForm, discountType: e.target.value })}
                  >
                    <option value="PERCENTAGE">Giảm theo %</option>
                    <option value="FIXED">Giảm số tiền cố định (VNĐ)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Giá trị giảm *</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    placeholder={createForm.discountType === 'PERCENTAGE' ? '10 (tức 10%)' : '50000'}
                    value={createForm.discountValue}
                    onChange={(e) => setCreateForm({ ...createForm, discountValue: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Giảm tối đa (VNĐ)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="VD: 50000"
                    value={createForm.maximumDiscountAmount}
                    onChange={(e) => setCreateForm({ ...createForm, maximumDiscountAmount: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Đơn tối thiểu (VNĐ)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="VD: 150000"
                    value={createForm.minimumOrderAmount}
                    onChange={(e) => setCreateForm({ ...createForm, minimumOrderAmount: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Tổng lượt dùng</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="100"
                    value={createForm.usageLimit}
                    onChange={(e) => setCreateForm({ ...createForm, usageLimit: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Lượt / khách hàng</Form.Label>
                  <Form.Control
                    type="number"
                    value={createForm.perCustomerLimit}
                    onChange={(e) => setCreateForm({ ...createForm, perCustomerLimit: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Ngày bắt đầu</Form.Label>
                  <Form.Control
                    type="date"
                    value={createForm.startsAt}
                    onChange={(e) => setCreateForm({ ...createForm, startsAt: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Ngày kết thúc</Form.Label>
                  <Form.Control
                    type="date"
                    value={createForm.expiresAt}
                    onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Check
                type="checkbox"
                id="new-customer-check"
                label="Chỉ áp dụng cho đơn hàng đầu tiên (Khách hàng mới)"
                checked={createForm.newCustomerOnly}
                onChange={(e) => setCreateForm({ ...createForm, newCustomerOnly: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={creating}>
              {creating ? <Spinner animation="border" size="sm" /> : 'Lưu & Kích hoạt Voucher'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={Boolean(deleteConfirm)} onHide={() => setDeleteConfirm(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-danger d-flex align-items-center gap-2">
            <Trash2 size={18} />
            <span>Xác nhận xóa Voucher</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2 text-dark">
            Bạn có chắc chắn muốn xóa vĩnh viễn voucher{' '}
            <strong className="text-danger">"{deleteConfirm?.code}"</strong>?
          </p>
          <p className="small text-secondary mb-0">
            * Lưu ý: Chỉ xóa được voucher chưa có lượt sử dụng trong đơn hàng nào. Với voucher đã có đơn hàng sử dụng, hệ thống sẽ yêu cầu bạn chuyển sang trạng thái <strong>Tạm ngừng</strong> để bảo toàn lịch sử đơn.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteVoucher} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" /> : 'Xác nhận xóa'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
