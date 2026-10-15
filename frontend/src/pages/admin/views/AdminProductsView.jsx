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
  Package,
  PackageCheck,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Award,
  MapPin,
  Sparkles,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Clock,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

const statusColor = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const statusLabel = {
  ALL: 'Tất cả nông sản',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
}

const productPresetReasons = [
  'Ảnh nông sản bị mờ hoặc không phản ánh đúng thực tế sản phẩm.',
  'Mã số chứng nhận VietGAP chưa tra cứu được trên cổng dữ liệu quốc gia.',
  'Thông tin quy cách và xuất xứ vùng trồng chưa đầy đủ, minh bạch.',
  'Đơn vị tính hoặc giá niêm yết không phù hợp với quy định sàn.',
  'Giấy chứng nhận an toàn thực phẩm / VietGAP đã hết hạn hiệu lực.',
]

export default function AdminProductsView({
  onCatalogChanged = () => {},
  base = '/admin',
}) {
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Modals
  const [approveItem, setApproveItem] = useState(null)
  const [rejectItem, setRejectItem] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const loadProducts = useCallback(async () => {
    setError('')
    try {
      const data = await api.get('/api/manager/products?status=ALL')
      setProducts(data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadProducts)
  }, [loadProducts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadProducts()
  }

  // KPI Counts
  const counts = useMemo(() => {
    let pending = 0
    let approved = 0
    let rejected = 0
    let totalStock = 0

    products.forEach((p) => {
      const s = p.approvalStatus || 'PENDING'
      if (s === 'PENDING') pending++
      else if (s === 'APPROVED') {
        approved++
        totalStock += Number(p.stock || 0)
      } else if (s === 'REJECTED') rejected++
    })

    return {
      all: products.length,
      pending,
      approved,
      rejected,
      totalStock,
    }
  }, [products])

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Filter by status tab
    if (statusFilter !== 'ALL') {
      result = result.filter(
        (p) => (p.approvalStatus || 'PENDING') === statusFilter
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((p) => {
        const name = (p.name || '').toLowerCase()
        const supplier = (p.supplierName || '').toLowerCase()
        const origin = (p.origin || '').toLowerCase()
        const cert = (p.certificateNo || '').toLowerCase()
        const idStr = String(p.id || '')
        return (
          name.includes(q) ||
          supplier.includes(q) ||
          origin.includes(q) ||
          cert.includes(q) ||
          idStr.includes(q)
        )
      })
    }

    // Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => Number(b.id) - Number(a.id))
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => Number(a.id) - Number(b.id))
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
    }

    return result
  }, [products, statusFilter, searchQuery, sortBy])

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage])

  // Quick Approve Logic
  const handleExecuteApprove = async () => {
    if (!approveItem) return
    setActionLoading(true)
    setModalError('')
    setError('')
    try {
      // Check pending valid certificates and approve them first
      const pendingCerts = approveItem.certificates?.filter(
        (c) => c.status === 'PENDING'
      ) || []

      for (const c of pendingCerts) {
        if (!c.expiryDate || new Date(c.expiryDate) >= new Date().setHours(0, 0, 0, 0)) {
          await api.put(`/api/manager/products/${approveItem.id}/certificates/${c.id}/approve`)
        }
      }

      await api.put(`/api/manager/products/${approveItem.id}/approve`)
      setNotice(`Đã phê duyệt nông sản "${approveItem.name}" thành công! Sản phẩm hiện đã được mở bán trên sàn.`)
      setApproveItem(null)
      await loadProducts()
      await onCatalogChanged?.()
    } catch (err) {
      setModalError(err.message || 'Lỗi khi phê duyệt sản phẩm.')
    } finally {
      setActionLoading(false)
    }
  }

  // Quick Reject Logic
  const handleExecuteReject = async () => {
    if (!rejectItem) return
    if (!rejectReason.trim()) {
      setModalError('Vui lòng chọn hoặc nhập lý do từ chối để gửi cho nhà vườn.')
      return
    }
    setActionLoading(true)
    setModalError('')
    setError('')
    try {
      await api.put(`/api/manager/products/${rejectItem.id}/reject`, {
        reason: rejectReason.trim(),
      })
      setNotice(`Đã từ chối kiểm duyệt nông sản "${rejectItem.name}".`)
      setRejectItem(null)
      setRejectReason('')
      await loadProducts()
      await onCatalogChanged?.()
    } catch (err) {
      setModalError(err.message || 'Lỗi khi từ chối sản phẩm.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-products-view">
      {/* Toast Notice & Error Banners */}
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

      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <PackageCheck size={26} className="text-success" />
            <span>Danh sách & Quản lý nông sản</span>
          </h4>
          <p className="text-secondary small mb-0">
            Kiểm duyệt quy chuẩn an toàn, chứng nhận VietGAP và theo dõi trạng thái niêm yết trên toàn sàn.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="light"
            size="sm"
            className="border text-secondary d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-sm bg-white"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Tải lại danh sách từ máy chủ"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span className="fw-semibold">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Executive Stat Cards (KPI Ribbon) */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3} xl={2}>
          <div
            className={`admin-kpi-card kpi-primary cursor-pointer ${
              statusFilter === 'ALL' ? 'border-primary shadow-sm' : ''
            }`}
            onClick={() => {
              setStatusFilter('ALL')
              setCurrentPage(1)
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label">Tổng nông sản</div>
                <div className="admin-kpi-value text-primary mt-1">
                  {counts.all}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <Package size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Toàn bộ hồ sơ tạo</div>
          </div>
        </Col>

        <Col xs={6} md={3} xl={3}>
          <div
            className={`admin-kpi-card kpi-warning cursor-pointer ${
              statusFilter === 'PENDING' ? 'border-warning shadow-sm' : ''
            }`}
            onClick={() => {
              setStatusFilter('PENDING')
              setCurrentPage(1)
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label d-flex align-items-center gap-1">
                  <span>Chờ thẩm định</span>
                  {counts.pending > 0 && (
                    <span className="status-dot warning" />
                  )}
                </div>
                <div className="admin-kpi-value text-warning mt-1">
                  {counts.pending}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <Clock size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">
              {counts.pending > 0
                ? '⚠️ Cần kiểm tra chứng nhận'
                : 'Đã hoàn tất duyệt'}
            </div>
          </div>
        </Col>

        <Col xs={6} md={3} xl={3}>
          <div
            className={`admin-kpi-card kpi-success cursor-pointer ${
              statusFilter === 'APPROVED' ? 'border-success shadow-sm' : ''
            }`}
            onClick={() => {
              setStatusFilter('APPROVED')
              setCurrentPage(1)
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label">Đang mở bán</div>
                <div className="admin-kpi-value text-success mt-1">
                  {counts.approved}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Niêm yết công khai</div>
          </div>
        </Col>

        <Col xs={6} md={3} xl={2}>
          <div
            className={`admin-kpi-card kpi-danger cursor-pointer ${
              statusFilter === 'REJECTED' ? 'border-danger shadow-sm' : ''
            }`}
            onClick={() => {
              setStatusFilter('REJECTED')
              setCurrentPage(1)
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label">Đã từ chối</div>
                <div className="admin-kpi-value text-danger mt-1">
                  {counts.rejected}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <XCircle size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Cần nhà vườn sửa</div>
          </div>
        </Col>

        <Col xs={12} md={6} xl={2}>
          <div className="admin-kpi-card kpi-purple">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="admin-kpi-label">Tồn kho sẵn sàng</div>
                <div className="admin-kpi-value text-purple mt-1" style={{ color: '#7c3aed' }}>
                  {counts.totalStock.toLocaleString()}
                </div>
              </div>
              <div className="admin-kpi-icon-box">
                <Sparkles size={20} />
              </div>
            </div>
            <div className="small text-secondary mt-2">Sản lượng cung ứng</div>
          </div>
        </Col>
      </Row>

      {/* Control Filter Bar */}
      <div className="admin-card mb-4 p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Status Tabs */}
          <div className="d-flex flex-wrap align-items-center gap-1">
            <Button
              size="sm"
              variant={statusFilter === 'ALL' ? 'success' : 'light'}
              className="fw-bold px-3 py-2 rounded-3 border"
              onClick={() => {
                setStatusFilter('ALL')
                setCurrentPage(1)
              }}
            >
              Tất cả ({counts.all})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'PENDING' ? 'warning' : 'light'}
              className="fw-bold px-3 py-2 rounded-3 border d-flex align-items-center gap-1"
              onClick={() => {
                setStatusFilter('PENDING')
                setCurrentPage(1)
              }}
            >
              <span>Chờ duyệt</span>
              <span className="badge bg-dark bg-opacity-75 text-white ms-1 rounded-pill">
                {counts.pending}
              </span>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'APPROVED' ? 'success' : 'light'}
              className="fw-bold px-3 py-2 rounded-3 border d-flex align-items-center gap-1"
              onClick={() => {
                setStatusFilter('APPROVED')
                setCurrentPage(1)
              }}
            >
              <span>Đã duyệt</span>
              <span className="badge bg-white text-success border ms-1 rounded-pill">
                {counts.approved}
              </span>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'REJECTED' ? 'danger' : 'light'}
              className="fw-bold px-3 py-2 rounded-3 border d-flex align-items-center gap-1"
              onClick={() => {
                setStatusFilter('REJECTED')
                setCurrentPage(1)
              }}
            >
              <span>Đã từ chối</span>
              <span className="badge bg-white text-danger border ms-1 rounded-pill">
                {counts.rejected}
              </span>
            </Button>
          </div>

          {/* Search & Sort Controls */}
          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1 flex-md-grow-0">
            {/* Search Box */}
            <InputGroup size="sm" style={{ minWidth: 260, maxWidth: 320 }}>
              <InputGroup.Text className="bg-white border-end-0">
                <Search size={15} className="text-secondary" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Tìm tên, nhà vườn, VietGAP, #ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="border-start-0 ps-1"
              />
              {searchQuery && (
                <Button
                  variant="outline-secondary"
                  className="border-start-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </Button>
              )}
            </InputGroup>

            {/* Sort Select */}
            <div className="d-flex align-items-center gap-1">
              <SlidersHorizontal size={15} className="text-secondary d-none d-sm-block" />
              <Form.Select
                size="sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 170 }}
                className="rounded-3"
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="stock_desc">Tồn kho nhiều nhất</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="text-secondary small mt-2">
              Đang tải danh sách nông sản...
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5 px-3">
            <Package size={48} className="text-secondary opacity-50 mb-3" />
            <h5 className="fw-bold text-dark mb-1">
              {searchQuery
                ? `Không tìm thấy nông sản khớp với "${searchQuery}"`
                : 'Không có nông sản nào trong mục này.'}
            </h5>
            <p className="text-secondary small mb-3">
              {searchQuery
                ? 'Hãy thử kiểm tra lại từ khóa hoặc xóa bộ lọc tìm kiếm.'
                : 'Khi các đối tác nhà vườn đăng tải sản phẩm, dữ liệu sẽ hiển thị tại đây.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline-success"
                size="sm"
                className="rounded-3 fw-semibold"
                onClick={() => setSearchQuery('')}
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table responsive className="admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#ID</th>
                  <th>Nông sản</th>
                  <th>Nhà vườn & Vùng trồng</th>
                  <th>Giá niêm yết</th>
                  <th>Tồn kho</th>
                  <th>Chứng nhận VietGAP</th>
                  <th>Trạng thái</th>
                  <th className="text-end" style={{ width: 220 }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((item) => {
                  const s = item.approvalStatus || 'PENDING'
                  const mainImg =
                    item.images?.[0]?.imageUrl ||
                    item.image ||
                    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'
                  const certCount = item.certificates?.length || 0
                  const hasPendingCert = item.certificates?.some(
                    (c) => c.status === 'PENDING'
                  )

                  return (
                    <tr key={item.id}>
                      {/* ID */}
                      <td className="text-muted fw-bold">#{item.id}</td>

                      {/* Product Preview */}
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={mainImg}
                            alt={item.name}
                            className="rounded-3 shadow-sm flex-shrink-0"
                            style={{
                              width: 52,
                              height: 52,
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: '1px solid #e2e8f0',
                            }}
                            onClick={() => setPreviewImageUrl(mainImg)}
                            title="Bấm để phóng to ảnh"
                          />
                          <div>
                            <Link
                              to={`${base}/products/${item.id}`}
                              className="text-decoration-none text-dark"
                            >
                              <strong className="fs-6 d-block text-truncate" style={{ maxWidth: 220 }}>
                                {item.name}
                              </strong>
                            </Link>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <span className="badge bg-light text-secondary border py-0 px-2 small">
                                {item.unit || 'kg'}
                              </span>
                              {item.images?.length > 1 && (
                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                  ({item.images.length} ảnh)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Supplier & Origin */}
                      <td>
                        <div className="fw-semibold text-dark">
                          {item.supplierName || 'Nhà vườn đối tác'}
                        </div>
                        <div className="small text-secondary d-flex align-items-center gap-1 mt-1">
                          <MapPin size={13} className="text-danger flex-shrink-0" />
                          <span className="text-truncate" style={{ maxWidth: 160 }}>
                            {item.origin || 'Chưa cập nhật'}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td>
                        <div className="text-success fw-bold fs-6">
                          {formatCurrency(Number(item.price || 0))}
                        </div>
                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                          / {item.unit || 'kg'}
                        </div>
                      </td>

                      {/* Stock */}
                      <td>
                        <div
                          className={`fw-semibold ${
                            Number(item.stock) <= 10 ? 'text-danger' : 'text-dark'
                          }`}
                        >
                          {item.stock} {item.unit || 'kg'}
                        </div>
                        {Number(item.stock) <= 10 && (
                          <div className="text-danger small" style={{ fontSize: '0.72rem' }}>
                            Sắp hết hàng
                          </div>
                        )}
                      </td>

                      {/* Certificate */}
                      <td>
                        {item.certificateNo ? (
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <Award size={14} className="text-warning flex-shrink-0" />
                            <code className="bg-light px-2 py-0 rounded border text-dark small fw-bold">
                              {item.certificateNo}
                            </code>
                          </div>
                        ) : (
                          <div className="text-muted small mb-1">Chưa khai báo mã</div>
                        )}
                        <div className="small">
                          {certCount > 0 ? (
                            <span className="badge bg-light text-primary border py-0 px-2">
                              {certCount} chứng thư
                            </span>
                          ) : (
                            <span className="text-muted small">0 chứng thư</span>
                          )}
                          {hasPendingCert && (
                            <span className="badge bg-warning text-dark ms-1 py-0 px-1">
                              Chờ duyệt
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <Badge
                          bg={statusColor[s] || 'secondary'}
                          className="px-2 py-1 fw-bold text-uppercase"
                          style={{ letterSpacing: '0.02em' }}
                        >
                          {statusLabel[s] || s}
                        </Badge>
                        {s === 'REJECTED' && item.rejectionReason && (
                          <div
                            className="text-danger small text-truncate mt-1"
                            style={{ maxWidth: 140, fontSize: '0.75rem' }}
                            title={`Lý do: ${item.rejectionReason}`}
                          >
                            Lý do: {item.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          {/* Details / Review button */}
                          <Button
                            as={Link}
                            to={`${base}/products/${item.id}`}
                            variant="light"
                            size="sm"
                            className="border text-secondary d-flex align-items-center gap-1 px-2 py-1 rounded-3"
                            title="Xem chi tiết & Thẩm định"
                          >
                            <Eye size={14} />
                            <span className="d-none d-xl-inline">Thẩm định</span>
                          </Button>

                          {/* Quick Actions if PENDING */}
                          {s === 'PENDING' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                className="fw-bold d-flex align-items-center gap-1 px-2 py-1 rounded-3 shadow-sm"
                                onClick={() => {
                                  setModalError('')
                                  setApproveItem(item)
                                }}
                                title="Phê duyệt nhanh"
                              >
                                <CheckCircle2 size={14} />
                                <span>Duyệt</span>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="fw-semibold d-flex align-items-center gap-1 px-2 py-1 rounded-3"
                                onClick={() => {
                                  setModalError('')
                                  setRejectItem(item)
                                  setRejectReason('')
                                }}
                                title="Từ chối duyệt"
                              >
                                <XCircle size={14} />
                                <span>Từ chối</span>
                              </Button>
                            </>
                          )}

                          {/* View on Store if APPROVED */}
                          {s === 'APPROVED' && (
                            <Button
                              as="a"
                              href={`/products/${item.id}`}
                              target="_blank"
                              rel="noreferrer"
                              variant="outline-success"
                              size="sm"
                              className="d-flex align-items-center gap-1 px-2 py-1 rounded-3"
                              title="Xem sản phẩm ngoài chợ"
                            >
                              <ExternalLink size={13} />
                              <span className="d-none d-xxl-inline">Xem sàn</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex flex-wrap align-items-center justify-content-between p-3 border-top bg-light">
                <div className="small text-secondary mb-2 mb-md-0">
                  Hiển thị{' '}
                  <strong>
                    {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, filteredProducts.length)}
                  </strong>{' '}
                  trên tổng số <strong>{filteredProducts.length}</strong> nông sản
                </div>

                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  />
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <Pagination.Item
                      key={idx + 1}
                      active={idx + 1 === currentPage}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Approve Confirmation Modal */}
      <Modal
        show={Boolean(approveItem)}
        onHide={() => {
          if (!actionLoading) {
            setApproveItem(null)
            setModalError('')
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-success d-flex align-items-center gap-2">
            <CheckCircle2 size={20} /> Xác nhận phê duyệt nông sản
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="d-flex align-items-start gap-2 py-2 px-3 mb-3">
              <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-1" />
              <div className="small">
                <strong>Lỗi kiểm duyệt: </strong>
                <span>{modalError}</span>
              </div>
            </Alert>
          )}

          {approveItem && (
            <>
              <p className="mb-2">Bạn có chắc chắn muốn phê duyệt nông sản sau:</p>
              <div className="p-3 bg-light rounded-3 border mb-3">
                <h6 className="fw-bold text-dark mb-1">{approveItem.name}</h6>
                <div className="small text-secondary">
                  Nhà vườn: <strong>{approveItem.supplierName}</strong> • Giá:{' '}
                  <strong className="text-success">
                    {formatCurrency(Number(approveItem.price || 0))}/{approveItem.unit}
                  </strong>
                </div>
              </div>

              {approveItem.certificates?.some((c) => c.status === 'PENDING') && (
                <div className="p-3 mb-3 rounded-3 border border-warning bg-warning bg-opacity-10 small">
                  <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                    <Award size={16} className="text-warning" />
                    <span>Chứng chỉ VietGAP đang chờ duyệt kèm theo</span>
                  </div>
                  <div className="text-secondary">
                    Hệ thống sẽ đồng thời tự động phê duyệt các chứng chỉ chất lượng hợp lệ của sản phẩm này.
                  </div>
                </div>
              )}

              <p className="text-secondary small mb-0">
                Sản phẩm sau khi duyệt sẽ lập tức hiển thị công khai trên chợ nông sản CleanMarket để người tiêu dùng đặt mua.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            disabled={actionLoading}
            onClick={() => {
              setApproveItem(null)
              setModalError('')
            }}
          >
            Hủy
          </Button>
          <Button
            variant="success"
            className="fw-bold px-4"
            disabled={actionLoading}
            onClick={handleExecuteApprove}
          >
            {actionLoading ? <Spinner size="sm" className="me-1" /> : <CheckCircle2 size={16} className="me-1" />}
            Xác nhận phê duyệt
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Quick Reject Modal */}
      <Modal
        show={Boolean(rejectItem)}
        onHide={() => {
          if (!actionLoading) {
            setRejectItem(null)
            setModalError('')
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger d-flex align-items-center gap-2">
            <XCircle size={20} /> Từ chối kiểm duyệt nông sản
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="d-flex align-items-start gap-2 py-2 px-3 mb-3">
              <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-1" />
              <div className="small">
                <strong>Lỗi từ chối: </strong>
                <span>{modalError}</span>
              </div>
            </Alert>
          )}

          {rejectItem && (
            <>
              <p className="small mb-2 text-dark fw-semibold">
                Nông sản: <strong>{rejectItem.name}</strong> ({rejectItem.supplierName})
              </p>
              <p className="small mb-2 text-secondary">
                Chọn mẫu lý do hoặc nhập nội dung cụ thể để gửi cho nhà vườn đối tác:
              </p>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {productPresetReasons.map((p) => (
                  <span
                    key={p}
                    className={`approval-preset-chip ${rejectReason === p ? 'active' : ''}`}
                    onClick={() => setRejectReason(p)}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập lý do chi tiết..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                className="rounded-3"
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            disabled={actionLoading}
            onClick={() => {
              setRejectItem(null)
              setModalError('')
            }}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            className="fw-bold px-4"
            disabled={!rejectReason.trim() || actionLoading}
            onClick={handleExecuteReject}
          >
            {actionLoading ? <Spinner size="sm" className="me-1" /> : <XCircle size={16} className="me-1" />}
            Xác nhận từ chối
          </Button>
        </Modal.Footer>
      </Modal>

      {/* High-res Image Lightbox Modal */}
      <Modal
        show={Boolean(previewImageUrl)}
        onHide={() => setPreviewImageUrl(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold text-dark d-flex align-items-center gap-2">
            <Eye size={18} className="text-success" />
            <span>Hình ảnh thực tế nông sản</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 text-center">
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Hình ảnh phóng to"
              className="rounded-3 shadow-sm"
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
