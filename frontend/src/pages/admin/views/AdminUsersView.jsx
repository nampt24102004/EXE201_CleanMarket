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
  Users,
  Search,
  UserPlus,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  Store,
} from 'lucide-react'
import { api } from '../../../services/apiClient'
import { useAuth } from '../../../context/useAuth'
import formatCurrency from '../../../utils/formatCurrency'

export default function AdminUsersView() {
  const { user: currentAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Search & Filter
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(15)

  // Data
  const [usersData, setUsersData] = useState({
    items: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
  })
  const [roles, setRoles] = useState([])

  // Create Staff Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'MANAGER',
    phone: '',
  })
  const [creating, setCreating] = useState(false)

  // User Detail Modal
  const [userDetail, setUserDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.append('q', q.trim())
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', String(page))
      params.append('size', String(size))

      const [usersRes, rolesRes] = await Promise.all([
        api.get(`/api/admin/users?${params.toString()}`),
        api.get('/api/admin/roles'),
      ])
      setUsersData(usersRes || { items: [], totalElements: 0, totalPages: 0, page: 0 })
      setRoles(rolesRes || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách tài khoản.')
    } finally {
      setLoading(false)
    }
  }, [q, roleFilter, statusFilter, page, size])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const handleToggleLock = async (targetUser) => {
    setError('')
    setNotice('')
    try {
      const newEnabled = targetUser.locked // if currently locked, enabled=true to unlock
      await api.put(`/api/admin/users/${targetUser.id}/status`, { enabled: newEnabled })
      setNotice(
        `Đã ${newEnabled ? 'mở khóa' : 'khóa'} tài khoản ${targetUser.email} thành công.`
      )
      await loadData()
    } catch (err) {
      setError(`Lỗi cập nhật trạng thái: ${err.message}`)
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole })
      setNotice(`Đã đổi vai trò người dùng sang ${newRole}.`)
      await loadData()
    } catch (err) {
      setError(`Lỗi đổi quyền: ${err.message}`)
    }
  }

  const handleViewDetail = async (userId) => {
    setLoadingDetail(true)
    setUserDetail(null)
    try {
      const detail = await api.get(`/api/admin/users/${userId}`)
      setUserDetail(detail)
    } catch (err) {
      setError(`Không thể tải thông tin chi tiết: ${err.message}`)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setNotice('')
    try {
      await api.post('/api/admin/users', createForm)
      setNotice(`Đã tạo tài khoản nhân sự mới cho ${createForm.email}!`)
      setShowCreateModal(false)
      setCreateForm({
        email: '',
        fullName: '',
        password: '',
        role: 'MANAGER',
        phone: '',
      })
      await loadData()
    } catch (err) {
      setError(`Lỗi tạo nhân sự: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="admin-users-view">
      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <AlertCircle size={16} className="me-2 inline-block text-danger" />
          {error}
        </Alert>
      )}

      {/* Toolbar & Filters */}
      <div className="admin-card mb-4">
        <Row className="g-3 align-items-center">
          <Col md={4}>
            <div className="position-relative">
              <Form.Control
                type="text"
                size="sm"
                placeholder="Tìm họ tên, email, số điện thoại..."
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
          <Col sm={6} md={3}>
            <Form.Select
              size="sm"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Tất cả vai trò</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col sm={6} md={3}>
            <Form.Select
              size="sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động bình thường</option>
              <option value="LOCKED">Bị khóa (Locked)</option>
              <option value="UNVERIFIED">Chưa xác thực email</option>
            </Form.Select>
          </Col>
          <Col md={2} className="d-flex justify-content-end">
            <Button
              variant="success"
              size="sm"
              className="w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={() => setShowCreateModal(true)}
            >
              <UserPlus size={15} />
              <span>Thêm nhân sự</span>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Users Table */}
      <div className="admin-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Danh sách người dùng & nhân sự</h5>
            <p className="text-secondary small mb-0">
              Tổng số {usersData.totalElements} tài khoản đăng ký trên hệ thống
            </p>
          </div>
          <Badge bg="success" pill className="px-3 py-2">
            Trang {usersData.page + 1} / {Math.max(usersData.totalPages, 1)}
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="mt-2 text-secondary small">Đang tải danh sách người dùng...</div>
          </div>
        ) : usersData.items.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Users size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Không tìm thấy tài khoản nào phù hợp.</p>
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {usersData.items.map((item) => {
                const isCurrent = item.id === currentAdmin?.id
                const isLocked = item.locked

                return (
                  <tr key={item.id} className={isLocked ? 'table-danger' : ''}>
                    <td>
                      <strong className="text-dark">{item.fullName}</strong>
                      {isCurrent && (
                        <Badge bg="primary" className="ms-2 small">
                          Bạn
                        </Badge>
                      )}
                    </td>
                    <td className="small text-secondary">{item.email}</td>
                    <td className="small text-secondary">{item.phone || 'Chưa cập nhật'}</td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={item.role}
                        disabled={isCurrent}
                        style={{ width: '130px', fontWeight: 600 }}
                        onChange={(e) => handleChangeRole(item.id, e.target.value)}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      {isLocked ? (
                        <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                          <Lock size={12} /> Đã khóa
                        </span>
                      ) : !item.verified ? (
                        <span className="badge bg-warning text-dark">Chưa xác thực</span>
                      ) : (
                        <span className="badge bg-success d-inline-flex align-items-center gap-1">
                          <Unlock size={12} /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="small text-secondary">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="px-2 py-1"
                          onClick={() => handleViewDetail(item.id)}
                          title="Xem hồ sơ chi tiết"
                        >
                          <Eye size={14} />
                        </Button>
                        {!isCurrent && (
                          <Button
                            variant={isLocked ? 'outline-success' : 'outline-danger'}
                            size="sm"
                            className="px-2 py-1"
                            onClick={() => handleToggleLock(item)}
                            title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
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
        {usersData.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <span className="small text-secondary">
              Hiển thị trang {page + 1} trên {usersData.totalPages}
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
                disabled={page >= usersData.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Form onSubmit={handleCreateStaff}>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Thêm tài khoản nhân sự mới</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small fw-bold">Họ và tên *</Form.Label>
              <Form.Control
                required
                placeholder="Ví dụ: Nguyễn Văn Quản Lý"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold">Email đăng nhập *</Form.Label>
              <Form.Control
                type="email"
                required
                placeholder="manager@cleanmarket.vn"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold">Mật khẩu khởi tạo * (ít nhất 8 ký tự)</Form.Label>
              <Form.Control
                type="password"
                required
                minLength={8}
                placeholder="Nhập mật khẩu an toàn"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold">Vai trò bổ nhiệm *</Form.Label>
              <Form.Select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                <option value="MANAGER">MANAGER (Quản lý vận hành)</option>
                <option value="ADMIN">ADMIN (Quản trị viên cấp cao)</option>
              </Form.Select>
              <Form.Text className="text-secondary small">
                Chỉ có thể tạo trực tiếp vai trò MANAGER hoặc ADMIN từ trang quản trị.
              </Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold">Số điện thoại liên hệ</Form.Label>
              <Form.Control
                placeholder="0912345678"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={creating}>
              {creating ? <Spinner animation="border" size="sm" /> : 'Tạo tài khoản'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        show={Boolean(userDetail) || loadingDetail}
        onHide={() => setUserDetail(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">Hồ sơ người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetail ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="success" />
            </div>
          ) : userDetail ? (
            <div>
              <div className="text-center mb-3 pb-3 border-bottom">
                <div
                  className="rounded-circle bg-success text-white mx-auto d-flex align-items-center justify-content-center fw-bold fs-4 mb-2"
                  style={{ width: '64px', height: '64px' }}
                >
                  {userDetail.user.fullName?.charAt(0) || 'U'}
                </div>
                <h5 className="fw-bold mb-1 text-dark">{userDetail.user.fullName}</h5>
                <div className="text-secondary small">{userDetail.user.email}</div>
                <Badge bg="primary" className="mt-1">
                  {userDetail.user.role}
                </Badge>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-4 text-center p-2 rounded bg-light">
                  <div className="small text-secondary">Đơn mua</div>
                  <strong className="text-dark fs-6">{userDetail.orderCount}</strong>
                </div>
                <div className="col-4 text-center p-2 rounded bg-light">
                  <div className="small text-secondary">Chi tiêu</div>
                  <strong className="text-success fs-6">
                    {formatCurrency(Number(userDetail.totalSpent || 0))}
                  </strong>
                </div>
                <div className="col-4 text-center p-2 rounded bg-light">
                  <div className="small text-secondary">Khiếu nại</div>
                  <strong className="text-danger fs-6">{userDetail.complaintCount}</strong>
                </div>
              </div>

              {userDetail.supplier && (
                <div className="p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25 mt-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Store size={18} className="text-success" />
                    <strong className="text-dark small">Hồ sơ nhà vườn liên kết</strong>
                  </div>
                  <div className="small text-secondary">
                    Tên nông trại: <strong>{userDetail.supplier.name}</strong>
                  </div>
                  <div className="small text-secondary">
                    Trạng thái: <Badge bg="success">{userDetail.supplier.status}</Badge>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setUserDetail(null)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
