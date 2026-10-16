import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Tag,
  Package,
  Store,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Building2,
  Phone,
  User,
  Info,
} from 'lucide-react'
import AdminSidebar from '../admin/AdminSidebar'
import AdminTopbar from '../admin/AdminTopbar'
import StaffSidebar from '../staff/StaffSidebar'
import StaffTopbar from '../staff/StaffTopbar'
import StaffNav from '../../components/portal/StaffNav'
import { api } from '../../services/apiClient'
import formatCurrency from '../../utils/formatCurrency'
import '../admin/admin.css'

const color = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'secondary',
}

const statusLabel = {
  ALL: 'Tất cả',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  SUSPENDED: 'Tạm ngừng',
}

const supplierTypeLabel = {
  FARM: 'Trang trại nông nghiệp',
  COOPERATIVE: 'Hợp tác xã nông sản',
  HOUSEHOLD_BUSINESS: 'Hộ kinh doanh cá thể',
  COMPANY: 'Doanh nghiệp nông nghiệp',
  OTHER: 'Mô hình khác',
}

const documentTypeLabel = {
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
  FOOD_SAFETY: 'Chứng nhận An toàn vệ sinh thực phẩm',
  VIETGAP: 'Chứng nhận VietGAP chuẩn quốc gia',
  ORGANIC: 'Chứng nhận Nông nghiệp Hữu cơ',
  OCOP: 'Chứng nhận Sản phẩm OCOP',
  OTHER: 'Hồ sơ năng lực / Giấy tờ khác',
}

const productPresetReasons = [
  'Ảnh nông sản bị mờ hoặc không phản ánh thực tế sản phẩm.',
  'Mã số chứng nhận VietGAP chưa tra cứu được trên cổng dữ liệu quốc gia.',
  'Thông tin quy cách và xuất xứ vùng trồng chưa đầy đủ, minh bạch.',
  'Đơn vị tính hoặc giá niêm yết không phù hợp với quy định sàn.',
  'Giấy chứng nhận an toàn thực phẩm / VietGAP đã hết hạn hiệu lực.',
]

const supplierPresetReasons = [
  'Giấy phép kinh doanh không trùng khớp với thông tin đăng ký.',
  'Thiếu chứng nhận cơ sở đủ điều kiện an toàn thực phẩm.',
  'Hình ảnh vùng trồng và quy trình sản xuất chưa đạt tiêu chuẩn.',
  'Số điện thoại hoặc địa chỉ vùng canh tác không xác thực được.',
]

export function ApprovalListPage({ kind, base = '/manager' }) {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api
      .get(`/api/manager/${kind}?status=${filter}`)
      .then((v) => active && setItems(v))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [filter, kind])

  const supplier = kind === 'suppliers'
  const role = base === '/admin' ? 'ADMIN' : 'MANAGER'

  return (
    <Container className="py-5">
      <div className="hero-kicker">TRUNG TÂM KIỂM DUYỆT</div>
      <h1 className="section-title">
        {supplier ? 'Duyệt nhà cung cấp' : 'Duyệt sản phẩm'}
      </h1>
      <StaffNav role={role} active={kind} />
      <div className="d-flex gap-2 mb-4">
        {(supplier
          ? ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']
          : ['PENDING', 'APPROVED', 'REJECTED']
        ).map((x) => (
          <Button
            key={x}
            size="sm"
            variant={filter === x ? 'success' : 'outline-success'}
            onClick={() => {
              setLoading(true)
              setFilter(x)
            }}
          >
            {statusLabel[x]}
          </Button>
        ))}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Card className="detail-card border-0">
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>{supplier ? 'Người đăng ký' : 'Nhà cung cấp'}</th>
                  <th>{supplier ? 'Liên hệ' : 'Giá / tồn'}</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => {
                  const itemStatus = supplier ? x.status : x.approvalStatus
                  return (
                    <tr key={x.id}>
                      <td>{x.name}</td>
                      <td>{supplier ? x.applicantName : x.supplierName}</td>
                      <td>
                        {supplier ? (
                          <>
                            {x.email}
                            <br />
                            {x.phone}
                          </>
                        ) : (
                          <>
                            {formatCurrency(Number(x.price))}
                            <br />
                            {x.stock} {x.unit}
                          </>
                        )}
                      </td>
                      <td>
                        <Badge bg={color[itemStatus] || 'secondary'}>
                          {statusLabel[itemStatus] || itemStatus}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          as={Link}
                          to={`${base}/${kind}/${x.id}`}
                          size="sm"
                          variant="outline-success"
                        >
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            {!items.length && <p className="mb-0">Không có dữ liệu.</p>}
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export function ApprovalDetailPage({ kind, base = '/manager' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [batchCertLoading, setBatchCertLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const [copiedCode, setCopiedCode] = useState(false)

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [previewModalUrl, setPreviewModalUrl] = useState(null)
  const [certActionTarget, setCertActionTarget] = useState(null) // { id, action: 'approve' | 'reject', isDoc }
  const [certRejectReason, setCertRejectReason] = useState('')

  // Reviewer checklist items
  const [checklist, setChecklist] = useState({
    imageQuality: false,
    originVerified: false,
    certificateValid: false,
    pricingReasonable: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get(`/api/manager/${kind}/${id}`)
      setItem(data)
      return data
    } catch (e) {
      setError(e.message || 'Không thể tải chi tiết đối tượng duyệt.')
      return null
    } finally {
      setLoading(false)
    }
  }, [id, kind])

  useEffect(() => {
    let active = true
    api
      .get(`/api/manager/${kind}/${id}`)
      .then((data) => {
        if (active) setItem(data)
      })
      .catch((e) => {
        if (active) setError(e.message || 'Không thể tải chi tiết đối tượng duyệt.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, kind])

  const supplier = kind === 'suppliers'
  const status = item ? (supplier ? item.status : item.approvalStatus) : 'PENDING'
  const isAdmin = base === '/admin'

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    const exp = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return exp < today
  }

  const certs = item?.certificates || []
  const docs = item?.documents || []
  const pendingCerts = !supplier ? certs.filter((c) => c.status === 'PENDING') : []
  const pendingValidCerts = pendingCerts.filter((c) => !isExpired(c.expiryDate))
  const pendingExpiredCerts = pendingCerts.filter((c) => isExpired(c.expiryDate))
  const hasExpiredPendingDocs = supplier && docs.some((d) => d.status !== 'REJECTED' && isExpired(d.expiryDate))

  const handleCopy = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const executeApproveAllValidCerts = async () => {
    if (!pendingValidCerts.length) return
    setBatchCertLoading(true)
    setError('')
    setNotice('')
    try {
      for (const c of pendingValidCerts) {
        await api.put(`/api/manager/products/${id}/certificates/${c.id}/approve`)
      }
      setNotice(`Đã phê duyệt thành công ${pendingValidCerts.length} chứng nhận VietGAP/CL!`)
      await load()
    } catch (e) {
      setError(e.message || 'Lỗi khi phê duyệt chứng nhận.')
    } finally {
      setBatchCertLoading(false)
    }
  }

  const executeApprove = async ({ autoApproveCerts = false } = {}) => {
    if (!supplier && pendingExpiredCerts.length > 0) {
      const msg = `Sản phẩm có ${pendingExpiredCerts.length} chứng nhận đã hết hạn hiệu lực. Vui lòng từ chối chứng nhận hết hạn trước khi duyệt sản phẩm.`
      setModalError(msg)
      setError(msg)
      return
    }

    setActionLoading(true)
    setModalError('')
    setError('')
    try {
      // Auto approve valid pending certificates first if requested or if pending certs exist
      if (!supplier && (autoApproveCerts || pendingValidCerts.length > 0)) {
        for (const c of pendingValidCerts) {
          await api.put(`/api/manager/products/${id}/certificates/${c.id}/approve`)
        }
      }
      await api.put(`/api/manager/${kind}/${id}/approve`)
      setNotice(
        supplier
          ? 'Đã phê duyệt hồ sơ đối tác thành công! Gian hàng đã được kích hoạt.'
          : 'Đã phê duyệt nông sản thành công! Sản phẩm hiện đã được niêm yết trên sàn.'
      )
      setShowApproveModal(false)
      await load()
    } catch (e) {
      const msg = e.message || 'Lỗi khi phê duyệt.'
      setModalError(msg)
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const executeReject = async () => {
    if (!reason.trim()) {
      setModalError('Vui lòng nhập lý do từ chối để nhà vườn có cơ sở khắc phục.')
      return
    }
    setActionLoading(true)
    setModalError('')
    setError('')
    try {
      await api.put(`/api/manager/${kind}/${id}/reject`, { reason: reason.trim() })
      setNotice('Đã gửi thông báo từ chối kiểm duyệt kèm lý do phản hồi.')
      setShowRejectModal(false)
      await load()
    } catch (e) {
      const msg = e.message || 'Lỗi khi từ chối.'
      setModalError(msg)
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSupplierStatusAction = async (actionName) => {
    if (actionName === 'suspend' && !reason.trim()) {
      setError('Vui lòng nhập lý do tạm dừng hoạt động đối tác.')
      return
    }
    setActionLoading(true)
    setError('')
    try {
      if (actionName === 'suspend') {
        await api.put(`/api/manager/suppliers/${id}/suspend`, { reason: reason.trim() })
        setNotice('Đã tạm ngừng hoạt động nhà cung cấp.')
      } else if (actionName === 'reactivate') {
        await api.put(`/api/manager/suppliers/${id}/reactivate`)
        setNotice('Đã kích hoạt lại hoạt động nhà cung cấp.')
      }
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const executeCertReview = async () => {
    if (!certActionTarget) return
    const { id: certId, action, isDoc } = certActionTarget
    setActionLoading(true)
    setModalError('')
    setError('')
    try {
      if (isDoc) {
        await api.put(
          `/api/manager/suppliers/${id}/documents/${certId}/${action}`,
          action === 'reject'
            ? { reason: certRejectReason.trim() || 'Giấy tờ chưa đạt tiêu chuẩn pháp lý' }
            : undefined
        )
        setNotice(action === 'approve' ? 'Đã duyệt giấy tờ pháp lý.' : 'Đã từ chối giấy tờ.')
      } else {
        await api.put(
          `/api/manager/products/${id}/certificates/${certId}/${action}`,
          action === 'reject'
            ? { reason: certRejectReason.trim() || 'Chứng nhận chưa đạt yêu cầu' }
            : undefined
        )
        setNotice(action === 'approve' ? 'Đã duyệt chứng chỉ VietGAP.' : 'Đã từ chối chứng chỉ.')
      }
      setCertActionTarget(null)
      setCertRejectReason('')
      await load()
    } catch (e) {
      const msg = e.message || 'Lỗi khi cập nhật chứng chỉ.'
      setModalError(msg)
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const images = item?.images || []
  const activeImage =
    images[activeImgIndex]?.imageUrl ||
    item?.image ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'

  return (
    <div className="admin-shell">
      {/* Sidebar for Admin or Manager */}
      {isAdmin ? (
        <AdminSidebar
          activeSection={kind}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
        <StaffSidebar
          activeSection={kind}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Container Wrap */}
      <div className="admin-main-wrap">
        {isAdmin ? (
          <AdminTopbar
            activeSection={kind}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onRefresh={load}
            refreshing={loading}
          />
        ) : (
          <StaffTopbar
            activeSection={kind}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onRefresh={load}
            refreshing={loading}
          />
        )}

        <main className="admin-content-body">
          {/* Breadcrumb Navigation Bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                size="sm"
                className="border d-flex align-items-center gap-1 text-secondary px-3 py-1 rounded-3"
                onClick={() => navigate(`${base}/${kind}`)}
              >
                <ArrowLeft size={16} />
                <span className="fw-medium">Quay lại danh sách</span>
              </Button>
              <div className="d-none d-md-flex align-items-center gap-2 text-secondary small ms-2">
                <span>Trang quản trị</span>
                <ChevronRight size={14} />
                <span>{supplier ? 'Duyệt nhà cung cấp' : 'Duyệt nông sản mới'}</span>
                <ChevronRight size={14} />
                <span className="text-dark fw-bold">#{id}</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                size="sm"
                className="border text-secondary d-flex align-items-center gap-1"
                onClick={load}
                disabled={loading}
                title="Tải lại dữ liệu"
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                <span className="d-none d-sm-inline">Làm mới</span>
              </Button>

              {status === 'PENDING' && (
                <>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="fw-bold d-flex align-items-center gap-1 px-3 py-1 rounded-3"
                    onClick={() => {
                      setModalError('')
                      setShowRejectModal(true)
                    }}
                  >
                    <XCircle size={15} />
                    <span>Từ chối</span>
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    className="fw-bold d-flex align-items-center gap-1 px-3 py-1 rounded-3 shadow-sm"
                    onClick={() => {
                      setModalError('')
                      setShowApproveModal(true)
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Phê duyệt</span>
                  </Button>
                </>
              )}

              {status === 'APPROVED' && !supplier && (
                <Button
                  as="a"
                  href={`/products/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline-success"
                  size="sm"
                  className="fw-bold d-flex align-items-center gap-1 px-3 py-1 rounded-3"
                >
                  <ExternalLink size={14} />
                  <span>Xem trên sàn</span>
                </Button>
              )}
            </div>
          </div>

          {/* Feedback Banners */}
          {notice && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setNotice('')}
              className="rounded-4 shadow-sm border-0 d-flex align-items-center gap-2"
            >
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <div>{notice}</div>
            </Alert>
          )}

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError('')}
              className="rounded-4 shadow-sm border-0 d-flex align-items-center gap-2"
            >
              <AlertTriangle size={18} className="flex-shrink-0" />
              <div>{error}</div>
            </Alert>
          )}

          {loading && !item ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <div className="mt-2 text-secondary small">Đang tải dữ liệu hồ sơ kiểm định...</div>
            </div>
          ) : !item ? (
            <div className="admin-card text-center py-5">
              <AlertTriangle size={48} className="text-danger mb-2" />
              <h5 className="fw-bold">Không tìm thấy thông tin đối tượng</h5>
              <p className="text-secondary small">Vui lòng kiểm tra lại liên kết hoặc mã ID.</p>
            </div>
          ) : (
            <>
              {/* Product / Supplier Title Card */}
              <div className="admin-card mb-4 p-4 position-relative overflow-hidden">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className={`admin-kpi-icon-box flex-shrink-0 ${
                        status === 'APPROVED'
                          ? 'bg-success bg-opacity-10 text-success'
                          : status === 'REJECTED'
                          ? 'bg-danger bg-opacity-10 text-danger'
                          : 'bg-warning bg-opacity-10 text-warning'
                      }`}
                      style={{ width: 52, height: 52, borderRadius: 14 }}
                    >
                      {status === 'APPROVED' ? (
                        <ShieldCheck size={28} />
                      ) : status === 'REJECTED' ? (
                        <ShieldAlert size={28} />
                      ) : (
                        <Clock size={28} />
                      )}
                    </div>
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <Badge
                          bg={color[status] || 'secondary'}
                          className="px-3 py-1 fs-6 fw-bold text-uppercase"
                        >
                          {statusLabel[status] || status}
                        </Badge>
                        <span className="text-secondary small fw-medium">
                          Mã định danh: #{id}
                        </span>
                        {!supplier && item.certificateNo && (
                          <Badge bg="light" text="dark" className="border px-2 py-1">
                            VietGAP: {item.certificateNo}
                          </Badge>
                        )}
                      </div>
                      <h2 className="fw-bold text-dark mb-1 fs-3">{item.name}</h2>
                      <div className="text-secondary small d-flex flex-wrap align-items-center gap-3">
                        <span className="d-flex align-items-center gap-1">
                          <Store size={14} className="text-success" />
                          <strong>{supplier ? item.applicantName : item.supplierName}</strong>
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <MapPin size={14} className="text-danger" />
                          <span>{item.origin || item.location || 'Chưa cập nhật vùng trồng'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner Text */}
                  <div className="text-end d-none d-lg-block">
                    {status === 'PENDING' && (
                      <div className="small text-warning fw-bold d-flex align-items-center gap-1">
                        <Clock size={16} /> Đang đợi bạn thẩm định hồ sơ
                      </div>
                    )}
                    {status === 'APPROVED' && (
                      <div className="small text-success fw-bold d-flex align-items-center gap-1">
                        <CheckCircle2 size={16} /> Đã phê duyệt chính thức
                      </div>
                    )}
                    {status === 'REJECTED' && (
                      <div className="small text-danger fw-bold d-flex align-items-center gap-1">
                        <XCircle size={16} /> Hồ sơ đã bị từ chối
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection notice if previously rejected */}
                {item.rejectionReason && (
                  <div className="mt-3 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3">
                    <div className="fw-bold text-danger d-flex align-items-center gap-2 mb-1 small">
                      <AlertTriangle size={16} /> Lý do từ chối đã gửi cho đối tác:
                    </div>
                    <div className="small text-danger">{item.rejectionReason}</div>
                  </div>
                )}
              </div>

              {/* KPI Stat Ribbon */}
              <Row className="g-3 mb-4">
                {!supplier ? (
                  <>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-success">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Giá niêm yết</div>
                            <div className="admin-kpi-value text-success mt-1">
                              {formatCurrency(Number(item.price))}
                            </div>
                            <div className="small text-secondary mt-1">
                              Đơn vị tính: <strong>/{item.unit}</strong>
                            </div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <Tag size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-primary">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Tồn kho ban đầu</div>
                            <div className="admin-kpi-value text-primary mt-1">
                              {item.stock} <span className="fs-6 text-muted">{item.unit}</span>
                            </div>
                            <div className="small text-secondary mt-1">
                              Trạng thái: <strong>Sẵn sàng cung ứng</strong>
                            </div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <Package size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-purple">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Nhà vườn cung cấp</div>
                            <div className="fw-bold text-dark mt-1 text-truncate" style={{ maxWidth: 180 }}>
                              {item.supplierName}
                            </div>
                            <div className="small text-secondary mt-1">
                              Đối tác CleanMarket
                            </div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <Store size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-warning">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Chứng nhận VietGAP</div>
                            <div className="fw-bold text-dark mt-1 text-truncate" style={{ maxWidth: 180 }}>
                              {item.certificateNo || 'Chưa cung cấp'}
                            </div>
                            <div className="small text-secondary mt-1">
                              {item.certificates?.length || 0} hồ sơ đính kèm
                            </div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <Award size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                  </>
                ) : (
                  <>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-success">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Loại hình tổ chức</div>
                            <div className="fw-bold text-dark mt-1 fs-5">
                              {supplierTypeLabel[item.supplierType] || item.supplierType}
                            </div>
                            <div className="small text-secondary mt-1">Đối tác nhà vườn</div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <Building2 size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-primary">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Đại diện pháp lý</div>
                            <div className="fw-bold text-dark mt-1 fs-5">
                              {item.applicantName}
                            </div>
                            <div className="small text-secondary mt-1">Người đăng ký</div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <User size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-purple">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Số điện thoại</div>
                            <div className="fw-bold text-dark mt-1 fs-5">
                              {item.phone}
                            </div>
                            <div className="small text-secondary mt-1">Hotline liên hệ</div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <Phone size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xl={3} sm={6}>
                      <div className="admin-kpi-card kpi-warning">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="admin-kpi-label">Giấy tờ đính kèm</div>
                            <div className="admin-kpi-value text-warning mt-1">
                              {item.documents?.length || 0}
                            </div>
                            <div className="small text-secondary mt-1">Hồ sơ pháp lý nộp</div>
                          </div>
                          <div className="admin-kpi-icon-box">
                            <FileText size={20} />
                          </div>
                        </div>
                      </div>
                    </Col>
                  </>
                )}
              </Row>

              {/* Main Content Layout */}
              <Row className="g-4">
                {/* Left Column: Details, Visuals & Certificates */}
                <Col lg={8}>
                  {!supplier ? (
                    <>
                      {/* Product Visual Showcase Card */}
                      <div className="admin-card mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                            <Eye size={18} className="text-success" />
                            <span>Hình ảnh thực tế nông sản</span>
                          </h5>
                          <span className="badge bg-light text-secondary border">
                            {images.length > 0 ? `${images.length} ảnh tải lên` : 'Ảnh mặc định'}
                          </span>
                        </div>

                        {/* Large Featured Preview */}
                        <div className="approval-gallery-wrap mb-3">
                          <img
                            src={activeImage}
                            alt={item.name}
                            className="approval-gallery-main"
                            onClick={() => setPreviewModalUrl(activeImage)}
                            style={{ cursor: 'pointer' }}
                            title="Bấm để xem ảnh phóng to"
                          />
                          <div className="approval-gallery-badge">
                            <Sparkles size={14} className="text-warning" />
                            <span>Ảnh thực tế vùng trồng • Click để phóng to</span>
                          </div>
                        </div>

                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                          <div className="approval-thumb-strip">
                            {images.map((img, idx) => (
                              <button
                                key={img.id || idx}
                                type="button"
                                className={`approval-thumb-btn ${activeImgIndex === idx ? 'active' : ''}`}
                                onClick={() => setActiveImgIndex(idx)}
                              >
                                <img src={img.imageUrl} alt={img.originalFileName || `Ảnh ${idx + 1}`} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product Specifications & Description Card */}
                      <div className="admin-card mb-4">
                        <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                          <Info size={18} className="text-primary" />
                          <span>Thông tin chi tiết & Quy chuẩn nông sản</span>
                        </h5>

                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="fw-semibold text-secondary small mb-1">MÔ TẢ NÔNG SẢN:</div>
                          <p className="mb-0 text-dark" style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                            {item.description || 'Chưa có thông tin mô tả chi tiết từ nhà vườn.'}
                          </p>
                        </div>

                        <Table responsive className="admin-table align-middle">
                          <tbody>
                            <tr>
                              <td className="text-secondary fw-medium" style={{ width: 200 }}>Tên nông sản</td>
                              <td><strong className="text-dark">{item.name}</strong></td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Đơn vị & Giá niêm yết</td>
                              <td>
                                <span className="text-success fw-bold fs-6">
                                  {formatCurrency(Number(item.price))}
                                </span>{' '}
                                / {item.unit}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Tồn kho sẵn sàng</td>
                              <td>{item.stock} {item.unit}</td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Khu vực / Vùng trồng</td>
                              <td>
                                <span className="d-flex align-items-center gap-1">
                                  <MapPin size={15} className="text-danger" />
                                  <span>{item.origin || 'Chưa cập nhật'}</span>
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Mã chứng nhận VietGAP</td>
                              <td>
                                {item.certificateNo ? (
                                  <div className="d-flex align-items-center gap-2">
                                    <code className="bg-light px-2 py-1 rounded border text-dark fw-bold">
                                      {item.certificateNo}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline-secondary"
                                      className="py-0 px-2"
                                      onClick={() => handleCopy(item.certificateNo)}
                                      title="Sao chép mã"
                                    >
                                      {copiedCode ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted">Chưa khai báo</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>

                      {/* Certificates & Verification Hub */}
                      <div className="admin-card mb-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                          <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                            <Award size={20} className="text-warning" />
                            <span>Chứng thư chất lượng & VietGAP ({item.certificates?.length || 0})</span>
                          </h5>
                          <div className="d-flex align-items-center gap-2">
                            {pendingValidCerts.length > 0 && status === 'PENDING' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="fw-bold d-flex align-items-center gap-1 py-1 px-3"
                                disabled={batchCertLoading || actionLoading}
                                onClick={executeApproveAllValidCerts}
                              >
                                {batchCertLoading ? <Spinner size="sm" /> : <CheckCircle2 size={14} />}
                                <span>Duyệt tất cả chứng chỉ ({pendingValidCerts.length})</span>
                              </Button>
                            )}
                            <span className="badge bg-light text-secondary border">
                              Kiểm định độc lập
                            </span>
                          </div>
                        </div>

                        {item.certificates && item.certificates.length > 0 ? (
                          item.certificates.map((cert) => {
                            const expired = isExpired(cert.expiryDate)
                            return (
                              <div key={cert.id} className="approval-cert-card">
                                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                                  <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <Badge bg="success" className="px-2 py-1">
                                        {documentTypeLabel[cert.certificateType] || cert.certificateType}
                                      </Badge>
                                      <strong className="text-dark">Số: {cert.certificateNumber}</strong>
                                    </div>
                                    <div className="text-secondary small">
                                      Cơ quan cấp: <strong>{cert.issuer || 'Trung tâm chứng nhận'}</strong>
                                    </div>
                                  </div>

                                  <div className="d-flex align-items-center gap-2">
                                    {expired ? (
                                      <Badge bg="danger">Đã hết hạn</Badge>
                                    ) : (
                                      <Badge bg="success">Còn hiệu lực</Badge>
                                    )}
                                    <Badge bg={color[cert.status] || 'secondary'}>
                                      {statusLabel[cert.status] || cert.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top text-secondary small">
                                  <div className="d-flex align-items-center gap-3">
                                    <span>
                                      Ngày cấp: <strong>{cert.issuedDate || 'N/A'}</strong>
                                    </span>
                                    <span>
                                      Hết hạn: <strong>{cert.expiryDate || 'N/A'}</strong>
                                    </span>
                                  </div>

                                  <div className="d-flex align-items-center gap-2">
                                    {cert.fileUrl && (
                                      <a
                                        href={cert.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                      >
                                        <FileText size={13} />
                                        <span>Xem chứng thư gốc</span>
                                        <ExternalLink size={12} />
                                      </a>
                                    )}

                                    {cert.status === 'PENDING' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="success"
                                          disabled={actionLoading || batchCertLoading}
                                          onClick={() => {
                                            setModalError('')
                                            setCertActionTarget({ id: cert.id, action: 'approve', isDoc: false })
                                          }}
                                        >
                                          Duyệt chứng chỉ
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline-danger"
                                          disabled={actionLoading || batchCertLoading}
                                          onClick={() => {
                                            setModalError('')
                                            setCertActionTarget({ id: cert.id, action: 'reject', isDoc: false })
                                          }}
                                        >
                                          Từ chối
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {cert.rejectionReason && (
                                  <div className="mt-2 text-danger small bg-danger bg-opacity-10 p-2 rounded">
                                    Lý do từ chối: {cert.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-center py-4 bg-light rounded-3 border">
                            <Award size={36} className="text-secondary opacity-50 mb-2" />
                            <p className="text-secondary small mb-0">
                              Nông sản này chưa đính kèm hồ sơ chứng chỉ chất lượng độc lập.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Supplier Detail View */
                    <>
                      <div className="admin-card mb-4">
                        <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                          <Building2 size={18} className="text-success" />
                          <span>Hồ sơ năng lực nhà cung cấp</span>
                        </h5>

                        <Table responsive className="admin-table align-middle">
                          <tbody>
                            <tr>
                              <td className="text-secondary fw-medium" style={{ width: 220 }}>Tên nhà vườn / Hợp tác xã</td>
                              <td><strong className="text-dark fs-6">{item.name}</strong></td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Người đại diện liên hệ</td>
                              <td>{item.applicantName}</td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Email trao đổi</td>
                              <td><a href={`mailto:${item.email}`} className="text-decoration-none">{item.email}</a></td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Hotline / Điện thoại</td>
                              <td><a href={`tel:${item.phone}`} className="text-decoration-none fw-bold">{item.phone}</a></td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Mô hình sản xuất</td>
                              <td>
                                <Badge bg="info" text="dark" className="px-2 py-1">
                                  {supplierTypeLabel[item.supplierType] || item.supplierType}
                                </Badge>
                              </td>
                            </tr>
                            <tr>
                              <td className="text-secondary fw-medium">Địa chỉ trụ sở / Vùng trồng</td>
                              <td>{item.location}</td>
                            </tr>
                          </tbody>
                        </Table>

                        <div className="mt-3 p-3 bg-light rounded-3 border">
                          <div className="fw-semibold text-secondary small mb-1">GIỚI THIỆU QUY MÔ NÔNG TRẠI:</div>
                          <p className="mb-0 text-dark" style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                            {item.description || 'Chưa có thông tin mô tả chi tiết từ đối tác.'}
                          </p>
                        </div>
                      </div>

                      {/* Supplier Legal Documents */}
                      <div className="admin-card mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                            <FileText size={18} className="text-primary" />
                            <span>Giấy tờ pháp lý & An toàn thực phẩm ({item.documents?.length || 0})</span>
                          </h5>
                          <span className="badge bg-light text-secondary border">Hồ sơ đối tác</span>
                        </div>

                        {item.documents && item.documents.length > 0 ? (
                          item.documents.map((doc) => (
                            <div key={doc.id} className="approval-cert-card">
                              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                                <div>
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <Badge bg="primary">
                                      {documentTypeLabel[doc.documentType] || doc.documentType}
                                    </Badge>
                                    <strong className="text-dark">
                                      {doc.documentName || doc.originalFileName}
                                    </strong>
                                  </div>
                                  <div className="small text-secondary">
                                    Tên tập tin gốc: {doc.originalFileName}
                                  </div>
                                </div>

                                <Badge bg={color[doc.status] || 'secondary'}>
                                  {statusLabel[doc.status] || doc.status}
                                </Badge>
                              </div>

                              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top text-secondary small">
                                <div>
                                  {doc.expiryDate && (
                                    <span>
                                      Hạn hiệu lực: <strong>{doc.expiryDate}</strong>
                                    </span>
                                  )}
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  {doc.fileUrl && (
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                                    >
                                      <FileText size={13} />
                                      <span>Mở tài liệu</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  )}

                                  {doc.status === 'PENDING' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="success"
                                        disabled={actionLoading}
                                        onClick={() => {
                                          setModalError('')
                                          setCertActionTarget({ id: doc.id, action: 'approve', isDoc: true })
                                        }}
                                      >
                                        Duyệt giấy tờ
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline-danger"
                                        disabled={actionLoading}
                                        onClick={() => {
                                          setModalError('')
                                          setCertActionTarget({ id: doc.id, action: 'reject', isDoc: true })
                                        }}
                                      >
                                        Từ chối
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {doc.rejectionReason && (
                                <div className="mt-2 text-danger small bg-danger bg-opacity-10 p-2 rounded">
                                  Lý do từ chối: {doc.rejectionReason}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 bg-light rounded-3 border">
                            <FileText size={36} className="text-secondary opacity-50 mb-2" />
                            <p className="text-secondary small mb-0">Đối tác chưa nộp tài liệu pháp lý đính kèm.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </Col>

                {/* Right Column: Decision Hub & Quality Verification Checklist */}
                <Col lg={4}>
                  {/* Decision Action Hub Card */}
                  <div className="admin-card mb-4 position-sticky" style={{ top: 88, zIndex: 10 }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                        <ShieldCheck size={20} className="text-success" />
                        <span>Quyết định thẩm định</span>
                      </h5>
                      <Badge bg={color[status] || 'secondary'}>
                        {statusLabel[status] || status}
                      </Badge>
                    </div>

                    {status === 'PENDING' ? (
                      <div>
                        {/* Pending Certs / Docs Notice for Reviewer */}
                        {!supplier && pendingCerts.length > 0 && (
                          <div className="p-3 mb-3 rounded-3 border border-warning bg-warning bg-opacity-10">
                            <div className="d-flex align-items-start gap-2">
                              <Award size={18} className="text-warning flex-shrink-0 mt-1" />
                              <div className="small w-100">
                                <div className="fw-bold text-dark mb-1">
                                  Có {pendingCerts.length} chứng nhận VietGAP đang chờ duyệt
                                </div>
                                {pendingExpiredCerts.length > 0 ? (
                                  <div className="text-danger fw-medium mb-2">
                                    ⚠️ Có {pendingExpiredCerts.length} chứng chỉ đã hết hạn hiệu lực. Cần từ chối trước khi duyệt sản phẩm.
                                  </div>
                                ) : (
                                  <div className="text-secondary mb-2">
                                    Quy định an toàn yêu cầu duyệt chứng chỉ trước khi mở bán nông sản.
                                  </div>
                                )}
                                {pendingValidCerts.length > 0 && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="fw-bold d-flex align-items-center justify-content-center gap-1 w-100 py-1"
                                    disabled={batchCertLoading || actionLoading}
                                    onClick={executeApproveAllValidCerts}
                                  >
                                    {batchCertLoading ? <Spinner size="sm" /> : <CheckCircle2 size={14} />}
                                    <span>Duyệt nhanh {pendingValidCerts.length} chứng nhận</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {supplier && hasExpiredPendingDocs && (
                          <div className="p-3 mb-3 rounded-3 border border-danger bg-danger bg-opacity-10 small text-danger">
                            <div className="fw-bold mb-1">⚠️ Giấy tờ pháp lý đã hết hạn hiệu lực</div>
                            <div>Theo quy định, bạn cần từ chối hồ sơ để nhà cung cấp bổ sung giấy tờ mới còn hạn.</div>
                          </div>
                        )}

                        <p className="small text-secondary mb-3">
                          Kiểm tra kỹ các tiêu chí an toàn trước khi bấm phê duyệt hoặc gửi phản hồi từ chối.
                        </p>

                        <div className="mb-3">
                          <label className="fw-semibold small text-dark mb-1">
                            Lý do phản hồi (Bắt buộc khi từ chối):
                          </label>
                          <div className="d-flex flex-wrap gap-1 mb-2">
                            {(supplier ? supplierPresetReasons : productPresetReasons).map((p) => (
                              <span
                                key={p}
                                className={`approval-preset-chip ${reason === p ? 'active' : ''}`}
                                onClick={() => setReason(p)}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Nhập ghi chú phản hồi cho đối tác..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="rounded-3"
                          />
                        </div>

                        <div className="d-grid gap-2">
                          <Button
                            variant="success"
                            size="lg"
                            className="fw-bold py-2 fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                            disabled={actionLoading || (!supplier && pendingExpiredCerts.length > 0) || (supplier && hasExpiredPendingDocs)}
                            onClick={() => {
                              setModalError('')
                              setShowApproveModal(true)
                            }}
                          >
                            <CheckCircle2 size={18} />
                            <span>
                              {!supplier && pendingValidCerts.length > 0
                                ? 'Duyệt chứng nhận & Phê duyệt'
                                : 'Phê duyệt ngay'}
                            </span>
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="fw-semibold py-2 d-flex align-items-center justify-content-center gap-2"
                            disabled={actionLoading}
                            onClick={() => {
                              setModalError('')
                              setShowRejectModal(true)
                            }}
                          >
                            <XCircle size={18} />
                            <span>Từ chối duyệt</span>
                          </Button>
                        </div>
                      </div>
                    ) : status === 'APPROVED' ? (
                      <div className="p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25 text-center">
                        <CheckCircle2 size={36} className="text-success mb-2" />
                        <h6 className="fw-bold text-success mb-1">Hồ sơ đã được phê duyệt</h6>
                        <p className="small text-secondary mb-3">
                          {supplier
                            ? 'Nhà vườn đã được mở quyền đăng sản phẩm và bán hàng.'
                            : 'Nông sản đang được hiển thị công khai trên sàn thương mại điện tử.'}
                        </p>
                        {supplier && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="w-100 fw-semibold d-flex align-items-center justify-content-center gap-1"
                            onClick={() => handleSupplierStatusAction('suspend')}
                          >
                            <PauseCircle size={14} />
                            <span>Tạm ngừng đối tác</span>
                          </Button>
                        )}
                        {!supplier && (
                          <Button
                            as="a"
                            href={`/products/${id}`}
                            target="_blank"
                            rel="noreferrer"
                            variant="success"
                            size="sm"
                            className="w-100 fw-bold d-flex align-items-center justify-content-center gap-1"
                          >
                            <ExternalLink size={14} />
                            <span>Xem sản phẩm trên sàn</span>
                          </Button>
                        )}
                      </div>
                    ) : status === 'SUSPENDED' && supplier ? (
                      <div className="p-3 bg-secondary bg-opacity-10 rounded-3 border text-center">
                        <PauseCircle size={36} className="text-secondary mb-2" />
                        <h6 className="fw-bold text-secondary mb-1">Đang tạm ngừng hoạt động</h6>
                        <p className="small text-secondary mb-3">Đối tác đang bị khóa gian hàng tạm thời.</p>
                        <Button
                          variant="success"
                          size="sm"
                          className="w-100 fw-bold d-flex align-items-center justify-content-center gap-1"
                          onClick={() => handleSupplierStatusAction('reactivate')}
                        >
                          <PlayCircle size={14} />
                          <span>Kích hoạt lại đối tác</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-danger bg-opacity-10 rounded-3 border border-danger border-opacity-25 text-center">
                        <XCircle size={36} className="text-danger mb-2" />
                        <h6 className="fw-bold text-danger mb-1">Hồ sơ đã bị từ chối</h6>
                        <p className="small text-secondary mb-3">
                          Đối tác có thể cập nhật lại hồ sơ dựa trên lý do phản hồi.
                        </p>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="w-100 fw-semibold"
                          onClick={() => setShowApproveModal(true)}
                        >
                          Xem xét lại & Phê duyệt
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Quality Audit Checklist */}
                  <div className="admin-card mb-4">
                    <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                      <Sparkles size={16} className="text-warning" />
                      <span>Checklist thẩm định an toàn</span>
                    </h6>
                    <div className="approval-checklist-item">
                      <Form.Check
                        type="checkbox"
                        id="chk-1"
                        checked={checklist.imageQuality}
                        onChange={(e) =>
                          setChecklist({ ...checklist, imageQuality: e.target.checked })
                        }
                      />
                      <label htmlFor="chk-1" className="cursor-pointer mb-0">
                        Hình ảnh thực tế sắc nét, không dùng ảnh mạng giả mạo.
                      </label>
                    </div>
                    <div className="approval-checklist-item">
                      <Form.Check
                        type="checkbox"
                        id="chk-2"
                        checked={checklist.originVerified}
                        onChange={(e) =>
                          setChecklist({ ...checklist, originVerified: e.target.checked })
                        }
                      />
                      <label htmlFor="chk-2" className="cursor-pointer mb-0">
                        Địa chỉ vùng canh tác rõ ràng, có thông tin truy xuất.
                      </label>
                    </div>
                    <div className="approval-checklist-item">
                      <Form.Check
                        type="checkbox"
                        id="chk-3"
                        checked={checklist.certificateValid}
                        onChange={(e) =>
                          setChecklist({ ...checklist, certificateValid: e.target.checked })
                        }
                      />
                      <label htmlFor="chk-3" className="cursor-pointer mb-0">
                        Chứng nhận VietGAP / VSATTP còn hiệu lực và đúng thẩm quyền.
                      </label>
                    </div>
                    <div className="approval-checklist-item">
                      <Form.Check
                        type="checkbox"
                        id="chk-4"
                        checked={checklist.pricingReasonable}
                        onChange={(e) =>
                          setChecklist({ ...checklist, pricingReasonable: e.target.checked })
                        }
                      />
                      <label htmlFor="chk-4" className="cursor-pointer mb-0">
                        Giá niêm yết và quy cách đóng gói hợp lý với thị trường.
                      </label>
                    </div>
                  </div>

                  {/* Support & Audit Quick Info */}
                  <div className="admin-card p-3 bg-light border-0">
                    <div className="d-flex align-items-center gap-2 mb-2 text-dark fw-bold small">
                      <ShieldCheck size={16} className="text-success" />
                      <span>Quy trình tiêu chuẩn CleanMarket</span>
                    </div>
                    <p className="text-secondary small mb-0" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                      Mọi hành động phê duyệt hoặc từ chối đều được lưu trữ trong <strong>Nhật ký an toàn (Audit Logs)</strong> để đảm bảo tính minh bạch và truy vết nguồn gốc thực phẩm.
                    </p>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </main>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        show={showApproveModal}
        onHide={() => {
          if (!actionLoading) {
            setShowApproveModal(false)
            setModalError('')
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-success d-flex align-items-center gap-2">
            <CheckCircle2 size={20} /> Xác nhận phê duyệt
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="d-flex align-items-start gap-2 py-2 px-3 mb-3">
              <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-1" />
              <div className="small">
                <strong>Lỗi kiểm định: </strong>
                <span>{modalError}</span>
              </div>
            </Alert>
          )}

          <p className="mb-2">
            Bạn có chắc chắn muốn phê duyệt{' '}
            <strong>{supplier ? 'nhà cung cấp đối tác' : 'nông sản này'}</strong>:
          </p>
          <div className="p-3 bg-light rounded-3 border mb-3">
            <h6 className="fw-bold text-dark mb-1">{item?.name}</h6>
            <div className="small text-secondary">
              {supplier
                ? `Người đại diện: ${item?.applicantName} • ĐT: ${item?.phone}`
                : `Nhà vườn: ${item?.supplierName} • Giá: ${formatCurrency(Number(item?.price || 0))}/${item?.unit}`}
            </div>
          </div>

          {!supplier && pendingCerts.length > 0 && (
            <div className="p-3 mb-3 rounded-3 border border-warning bg-warning bg-opacity-10">
              <div className="d-flex align-items-start gap-2">
                <Award size={18} className="text-warning flex-shrink-0 mt-1" />
                <div className="small">
                  <div className="fw-bold text-dark mb-1">
                    Sản phẩm có {pendingCerts.length} chứng nhận VietGAP/CL đang chờ duyệt
                  </div>
                  {pendingExpiredCerts.length > 0 ? (
                    <div className="text-danger fw-semibold">
                      ⚠️ Có {pendingExpiredCerts.length} chứng nhận đã hết hạn hiệu lực. Cần từ chối chứng nhận hết hạn trước khi phê duyệt sản phẩm.
                    </div>
                  ) : (
                    <div className="text-secondary">
                      Hệ thống sẽ đồng thời tự động duyệt {pendingValidCerts.length} chứng nhận hợp lệ này và đưa sản phẩm lên sàn ngay lập tức.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {supplier && hasExpiredPendingDocs && (
            <div className="p-3 mb-3 rounded-3 border border-danger bg-danger bg-opacity-10 small text-danger">
              <div className="fw-bold mb-1">⚠️ Hồ sơ đối tác chứa giấy tờ đã hết hạn hiệu lực</div>
              <div>Bạn cần từ chối hồ sơ kèm lý do phản hồi để đối tác cập nhật giấy tờ mới.</div>
            </div>
          )}

          <p className="text-secondary small mb-0">
            {supplier
              ? 'Đối tác sẽ được kích hoạt tài khoản đối tác để bắt đầu tạo sản phẩm và quản lý đơn hàng.'
              : 'Sản phẩm sẽ được niêm yết công khai trên chợ nông sản CleanMarket để người tiêu dùng đặt mua ngay lập tức.'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            disabled={actionLoading}
            onClick={() => {
              setShowApproveModal(false)
              setModalError('')
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="success"
            className="fw-bold px-4"
            disabled={actionLoading || (!supplier && pendingExpiredCerts.length > 0) || (supplier && hasExpiredPendingDocs)}
            onClick={() => executeApprove({ autoApproveCerts: true })}
          >
            {actionLoading ? <Spinner size="sm" className="me-1" /> : <CheckCircle2 size={16} className="me-1" />}
            {!supplier && pendingValidCerts.length > 0
              ? 'Duyệt chứng nhận & Phê duyệt'
              : 'Xác nhận phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        show={showRejectModal}
        onHide={() => {
          if (!actionLoading) {
            setShowRejectModal(false)
            setModalError('')
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger d-flex align-items-center gap-2">
            <XCircle size={20} /> Từ chối phê duyệt hồ sơ
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
          <p className="small mb-2 text-dark fw-semibold">
            Chọn hoặc nhập lý do từ chối để phản hồi trực tiếp cho đối tác:
          </p>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {(supplier ? supplierPresetReasons : productPresetReasons).map((p) => (
              <span
                key={p}
                className={`approval-preset-chip ${reason === p ? 'active' : ''}`}
                onClick={() => setReason(p)}
              >
                {p}
              </span>
            ))}
          </div>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Nhập lý do chi tiết..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="rounded-3"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            disabled={actionLoading}
            onClick={() => {
              setShowRejectModal(false)
              setModalError('')
            }}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            className="fw-bold px-4"
            disabled={!reason.trim() || actionLoading}
            onClick={executeReject}
          >
            {actionLoading ? <Spinner size="sm" className="me-1" /> : <XCircle size={16} className="me-1" />}
            Xác nhận từ chối
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Single Document / Certificate Reject Modal */}
      <Modal
        show={Boolean(certActionTarget)}
        onHide={() => {
          if (!actionLoading) {
            setCertActionTarget(null)
            setModalError('')
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {certActionTarget?.action === 'approve'
              ? 'Xác nhận duyệt giấy tờ'
              : 'Từ chối giấy tờ / chứng chỉ'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="d-flex align-items-start gap-2 py-2 px-3 mb-3">
              <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-1" />
              <div className="small">
                <strong>Lỗi xử lý: </strong>
                <span>{modalError}</span>
              </div>
            </Alert>
          )}
          {certActionTarget?.action === 'approve' ? (
            <p className="mb-0">Bạn có chắc chắn muốn duyệt chứng chỉ / giấy tờ này không?</p>
          ) : (
            <div>
              <label className="fw-semibold small mb-2">Nhập lý do không đạt yêu cầu:</label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập lý do từ chối tài liệu này..."
                value={certRejectReason}
                onChange={(e) => setCertRejectReason(e.target.value)}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            disabled={actionLoading}
            onClick={() => {
              setCertActionTarget(null)
              setModalError('')
            }}
          >
            Hủy
          </Button>
          <Button
            variant={certActionTarget?.action === 'approve' ? 'success' : 'danger'}
            className="fw-bold"
            disabled={actionLoading}
            onClick={executeCertReview}
          >
            {actionLoading && <Spinner size="sm" className="me-1" />}
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Fullscreen Photo Lightbox Modal */}
      <Modal
        show={Boolean(previewModalUrl)}
        onHide={() => setPreviewModalUrl(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold text-dark d-flex align-items-center gap-2">
            <Eye size={18} className="text-success" />
            <span>Ảnh kiểm định thực tế nông sản</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 text-center">
          {previewModalUrl && (
            <img
              src={previewModalUrl}
              alt="Ảnh phóng to"
              className="rounded-3 shadow-sm"
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
