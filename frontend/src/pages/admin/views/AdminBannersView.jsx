import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Table,
  Modal,
  Form,
  Spinner,
  Alert,
} from 'react-bootstrap'
import {
  Megaphone,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  RotateCw,
  Search,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { api } from '../../../services/apiClient'

const THEME_STYLES = {
  ORGANIC_EMERALD: {
    label: 'Xanh Lục Bảo (Mặc định)',
    gradient: 'linear-gradient(90deg, #14532d, #16a34a 50%, #15803d)',
    badgeBg: 'rgba(255, 255, 255, 0.22)',
    badgeBorder: 'rgba(255, 255, 255, 0.35)',
    textColor: '#ffffff',
    iconColor: '#fef08a',
  },
  SUNSET_ORANGE: {
    label: 'Cam Hoàng Hôn (Khuyến Mãi Hot)',
    gradient: 'linear-gradient(90deg, #9a3412, #ea580c 50%, #c2410c)',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
    badgeBorder: 'rgba(255, 255, 255, 0.4)',
    textColor: '#ffffff',
    iconColor: '#fef08a',
  },
  ROYAL_GOLD: {
    label: 'Vàng Kim VietGAP (Thượng Hạng)',
    gradient: 'linear-gradient(90deg, #713f12, #ca8a04 50%, #854d0e)',
    badgeBg: 'rgba(0, 0, 0, 0.25)',
    badgeBorder: 'rgba(255, 255, 255, 0.3)',
    textColor: '#ffffff',
    iconColor: '#ffffff',
  },
  OCEAN_BLUE: {
    label: 'Xanh Đại Dương (Tươi Mát)',
    gradient: 'linear-gradient(90deg, #1e3a8a, #2563eb 50%, #1d4ed8)',
    badgeBg: 'rgba(255, 255, 255, 0.22)',
    badgeBorder: 'rgba(255, 255, 255, 0.35)',
    textColor: '#ffffff',
    iconColor: '#93c5fd',
  },
  NEON_FOREST: {
    label: 'Xanh Rừng Neon (Công Nghệ Sinh Học)',
    gradient: 'linear-gradient(90deg, #064e3b, #059669 40%, #10b981 70%, #064e3b)',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
    badgeBorder: 'rgba(255, 255, 255, 0.45)',
    textColor: '#ffffff',
    iconColor: '#6ee7b7',
  },
}

const ANIMATION_EFFECTS = {
  SLIDE_HORIZONTAL: {
    label: 'Trượt ngang mượt mà (Slide Carousel)',
    desc: 'Tự động trượt lần lượt các thông điệp sang ngang mượt mà',
    badgeClass: 'badge-pulse-soft',
  },
  BOUNCE_BADGE: {
    label: 'Huy hiệu nhấp nháy bắt mắt (Bouncing Badge)',
    desc: 'Huy hiệu khuyến mãi nảy nhẹ liên tục thu hút người mua',
    badgeClass: 'badge-bounce-anim',
  },
  PULSE_GLOW: {
    label: 'Phát sáng nhịp thở (Glowing Pulse)',
    desc: 'Toàn bộ thanh banner toả ánh sáng hào quang nhẹ nhàng',
    badgeClass: 'badge-glow-anim',
  },
  FADE: {
    label: 'Chuyển mờ dần hiện đại (Smooth Fade)',
    desc: 'Thông điệp chuyển tiếp bằng hiệu ứng mờ nhạt sang trọng',
    badgeClass: 'badge-fade-anim',
  },
  MARQUEE: {
    label: 'Chạy chữ liên tục (Continuous Flow)',
    desc: 'Dòng chữ chuyển động liên tục cho thông điệp dài',
    badgeClass: 'badge-marquee-anim',
  },
}

export default function AdminBannersView({ base = '/admin' }) {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ACTIVE, INACTIVE

  // Simulator Preview State
  const [previewIndex, setPreviewIndex] = useState(0)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formValues, setFormValues] = useState({
    title: '',
    badgeText: 'Ưu đãi hôm nay',
    linkUrl: '/products',
    position: 'TOP_BAR',
    themeStyle: 'ORGANIC_EMERALD',
    animationEffect: 'SLIDE_HORIZONTAL',
    hotline: '0358 755 719',
    displayOrder: 1,
    isActive: true,
  })

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadBanners = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const endpoint = base === '/manager' ? '/api/manager/banners' : '/api/admin/banners'
      const data = await api.get(endpoint)
      setBanners(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách banner khuyến mãi.')
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    void Promise.resolve().then(loadBanners)
  }, [loadBanners])

  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      const matchSearch =
        !search ||
        (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.badgeText || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && b.isActive) ||
        (statusFilter === 'INACTIVE' && !b.isActive)
      return matchSearch && matchStatus
    })
  }, [banners, search, statusFilter])

  // Active Banners for Live Preview Simulator
  const activeBanners = useMemo(() => {
    return banners.filter((b) => b.isActive)
  }, [banners])

  const currentPreviewBanner = activeBanners[previewIndex] || activeBanners[0] || formValues

  const handleOpenCreate = () => {
    setEditingBanner(null)
    setFormValues({
      title: '',
      badgeText: 'Ưu đãi hôm nay',
      linkUrl: '/products',
      position: 'TOP_BAR',
      themeStyle: 'ORGANIC_EMERALD',
      animationEffect: 'SLIDE_HORIZONTAL',
      hotline: '0358 755 719',
      displayOrder: banners.length + 1,
      isActive: true,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner)
    setFormValues({
      title: banner.title || '',
      badgeText: banner.badgeText || '',
      linkUrl: banner.linkUrl || '',
      position: banner.position || 'TOP_BAR',
      themeStyle: banner.themeStyle || 'ORGANIC_EMERALD',
      animationEffect: banner.animationEffect || 'SLIDE_HORIZONTAL',
      hotline: banner.hotline || '',
      displayOrder: banner.displayOrder ?? 0,
      isActive: banner.isActive ?? true,
    })
    setShowModal(true)
  }

  const handleSaveBanner = async (e) => {
    e.preventDefault()
    if (!formValues.title.trim()) {
      setError('Vui lòng nhập tiêu đề thông điệp khuyến mãi.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const endpoint = base === '/manager' ? '/api/manager/banners' : '/api/admin/banners'
      if (editingBanner) {
        await api.put(`${endpoint}/${editingBanner.id}`, formValues)
        setNotice(`Đã cập nhật banner "${formValues.badgeText || formValues.title}" thành công!`)
      } else {
        await api.post(endpoint, formValues)
        setNotice(`Đã tạo mới banner khuyến mãi "${formValues.badgeText || formValues.title}" thành công!`)
      }
      setShowModal(false)
      await loadBanners()
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu banner khuyến mãi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (banner) => {
    try {
      const endpoint = base === '/manager' ? '/api/manager/banners' : '/api/admin/banners'
      await api.patch(`${endpoint}/${banner.id}/toggle`)
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
      )
      setNotice(`Đã ${banner.isActive ? 'tạm dừng' : 'kích hoạt'} banner thành công!`)
    } catch (err) {
      setError(err.message || 'Không thể chuyển trạng thái banner.')
    }
  }

  const handleDeleteBanner = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const endpoint = base === '/manager' ? '/api/manager/banners' : '/api/admin/banners'
      await api.delete(`${endpoint}/${deleteTarget.id}`)
      setNotice(`Đã xóa banner "${deleteTarget.title}" khỏi hệ thống.`)
      setDeleteTarget(null)
      await loadBanners()
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa banner.')
    } finally {
      setDeleting(false)
    }
  }

  const activeTheme = THEME_STYLES[currentPreviewBanner.themeStyle] || THEME_STYLES.ORGANIC_EMERALD

  return (
    <div className="admin-banners-view">
      {/* Toast Notice */}
      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice('')} className="shadow-sm mb-4">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            <span>{notice}</span>
          </div>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="shadow-sm mb-4">
          <div className="d-flex align-items-center gap-2">
            <XCircle size={18} className="text-danger" />
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {/* Header Banner & Live Interactive Simulator */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="p-4 bg-white border-bottom">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="p-2 rounded-3 bg-success-subtle text-success">
                  <Megaphone size={20} />
                </span>
                <h4 className="fw-bold mb-0 text-dark">Quản lý Banner Thông Tin Khuyến Mãi</h4>
              </div>
              <p className="text-secondary small mb-0">
                Tùy chỉnh thông điệp ưu đãi, chọn chủ đề màu sắc thiên nhiên và điều khiển hiệu ứng hoạt họa hiển thị trực tiếp trên đầu trang.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-pill px-3 py-2 d-flex align-items-center gap-1"
                onClick={loadBanners}
                disabled={loading}
              >
                <RotateCw size={14} className={loading ? 'spin-anim' : ''} />
                <span>Làm mới</span>
              </Button>
              <Button
                variant="success"
                className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold shadow-sm"
                onClick={handleOpenCreate}
              >
                <Plus size={16} />
                <span>Thêm banner mới</span>
              </Button>
            </div>
          </div>

          {/* Live Simulator Header */}
          <div className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <Activity size={16} className="text-success" />
              <span className="small fw-bold text-dark">Trình mô phỏng hiển thị thực tế (Live Banner Simulator):</span>
              <Badge bg="success" pill className="small">
                {activeBanners.length} banner đang kích hoạt
              </Badge>
            </div>
            {activeBanners.length > 1 && (
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-white border rounded-circle p-1"
                  onClick={() =>
                    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : activeBanners.length - 1))
                  }
                  title="Banner trước"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="small text-secondary fw-semibold">
                  {previewIndex + 1} / {activeBanners.length}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-white border rounded-circle p-1"
                  onClick={() =>
                    setPreviewIndex((prev) => (prev < activeBanners.length - 1 ? prev + 1 : 0))
                  }
                  title="Banner kế tiếp"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Rendered Live Banner Bar */}
          <div
            className="rounded-3 px-3 py-2 text-white position-relative overflow-hidden shadow-sm transition-all"
            style={{
              background: activeTheme.gradient,
              minHeight: 46,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate pe-2">
              {currentPreviewBanner.badgeText && (
                <span
                  className={`badge rounded-pill fw-bold text-white px-2 py-1 d-inline-flex align-items-center ${
                    ANIMATION_EFFECTS[currentPreviewBanner.animationEffect]?.badgeClass || ''
                  }`}
                  style={{
                    background: activeTheme.badgeBg,
                    border: `1px solid ${activeTheme.badgeBorder}`,
                    fontSize: '0.74rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  <Sparkles size={11} className="me-1" style={{ color: activeTheme.iconColor }} />
                  {currentPreviewBanner.badgeText}
                </span>
              )}
              <span className="small fw-semibold text-truncate">
                {currentPreviewBanner.title || 'Tiêu đề thông điệp khuyến mãi sẽ hiển thị tại đây...'}
              </span>
              {currentPreviewBanner.linkUrl && (
                <span className="badge bg-white text-dark rounded-pill px-2 py-0 small fw-bold d-none d-sm-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
                  <span>Chi tiết</span>
                  <ExternalLink size={10} />
                </span>
              )}
            </div>

            <div className="d-none d-md-flex align-items-center gap-3 text-white-50 small flex-shrink-0">
              {currentPreviewBanner.hotline && (
                <span className="d-flex align-items-center gap-1 text-white">
                  <PhoneCall size={13} /> Hotline: <strong>{currentPreviewBanner.hotline}</strong>
                </span>
              )}
              <span>|</span>
              <span className="d-flex align-items-center gap-1 text-white">
                <ShieldCheck size={14} className="text-warning" /> Truy xuất QR từng lô hàng
              </span>
            </div>
          </div>
        </div>

        {/* KPI Ribbon */}
        <div className="bg-light p-3 border-top">
          <Row className="g-3">
            <Col sm={6} lg={3}>
              <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary small fw-semibold">Tổng số banner</div>
                  <div className="fs-4 fw-bold text-dark">{banners.length}</div>
                </div>
                <div className="p-2 rounded-circle bg-primary-subtle text-primary">
                  <Layers size={22} />
                </div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary small fw-semibold">Đang kích hoạt</div>
                  <div className="fs-4 fw-bold text-success">{activeBanners.length}</div>
                </div>
                <div className="p-2 rounded-circle bg-success-subtle text-success">
                  <CheckCircle2 size={22} />
                </div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary small fw-semibold">Thanh Top Bar</div>
                  <div className="fs-4 fw-bold text-dark">
                    {banners.filter((b) => b.position === 'TOP_BAR').length}
                  </div>
                </div>
                <div className="p-2 rounded-circle bg-warning-subtle text-warning">
                  <Megaphone size={22} />
                </div>
              </div>
            </Col>
            <Col sm={6} lg={3}>
              <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary small fw-semibold">Hiệu ứng hoạt họa</div>
                  <div className="fs-4 fw-bold text-info">5 kiểu</div>
                </div>
                <div className="p-2 rounded-circle bg-info-subtle text-info">
                  <Zap size={22} />
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Filter Toolbar & Table Card */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="p-3 bg-white border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-bold text-secondary">Trạng thái:</span>
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${statusFilter === 'ALL' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả ({banners.length})
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'ACTIVE' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Đang bật ({activeBanners.length})
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'INACTIVE' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter('INACTIVE')}
              >
                Đã tắt ({banners.length - activeBanners.length})
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2" style={{ maxWidth: 320 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <Search size={14} className="text-secondary" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm banner, huy hiệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="small text-secondary mt-2">Đang tải danh sách banner...</div>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Megaphone size={40} className="text-muted opacity-50 mb-2" />
            <div className="fw-bold">Không tìm thấy banner khuyến mãi nào</div>
            <p className="small text-muted mb-3">Hãy tạo banner mới để kích hoạt thông điệp trên thanh đầu trang.</p>
            <Button variant="success" size="sm" className="rounded-pill px-3" onClick={handleOpenCreate}>
              <Plus size={14} className="me-1" />
              Tạo banner đầu tiên
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover align="middle" className="mb-0">
              <thead className="table-light small text-secondary">
                <tr>
                  <th style={{ width: 60 }} className="text-center">#</th>
                  <th>Huy hiệu & Chủ đề</th>
                  <th>Nội dung thông điệp khuyến mãi</th>
                  <th>Hiệu ứng hoạt họa</th>
                  <th>Liên kết & Hotline</th>
                  <th style={{ width: 120 }} className="text-center">Trạng thái</th>
                  <th style={{ width: 110 }} className="text-end pe-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map((b) => {
                  const theme = THEME_STYLES[b.themeStyle] || THEME_STYLES.ORGANIC_EMERALD
                  const effect = ANIMATION_EFFECTS[b.animationEffect] || ANIMATION_EFFECTS.SLIDE_HORIZONTAL

                  return (
                    <tr key={b.id}>
                      <td className="text-center text-muted fw-bold small">{b.displayOrder ?? b.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-3 p-1 px-2 text-white fw-bold small d-inline-flex align-items-center gap-1 shadow-sm"
                            style={{ background: theme.gradient, fontSize: '0.75rem' }}
                          >
                            <Sparkles size={11} style={{ color: theme.iconColor }} />
                            <span>{b.badgeText || 'Không nhãn'}</span>
                          </div>
                          <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
                            ({theme.label.split('(')[0].trim()})
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark small">{b.title}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Vị trí: <strong>{b.position}</strong>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="border fw-semibold p-1 px-2">
                          <Zap size={12} className="text-warning me-1" />
                          {effect.label.split('(')[0].trim()}
                        </Badge>
                      </td>
                      <td>
                        <div className="small text-truncate" style={{ maxWidth: 180 }}>
                          {b.linkUrl ? (
                            <a href={b.linkUrl} target="_blank" rel="noreferrer" className="text-decoration-none text-success fw-semibold">
                              {b.linkUrl}
                            </a>
                          ) : (
                            <span className="text-muted">Không gắn link</span>
                          )}
                        </div>
                        {b.hotline && (
                          <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                            Hotline: <strong>{b.hotline}</strong>
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="switch"
                          id={`switch-${b.id}`}
                          checked={b.isActive}
                          onChange={() => handleToggleStatus(b)}
                          label={
                            <span className={`small fw-bold ${b.isActive ? 'text-success' : 'text-secondary'}`}>
                              {b.isActive ? 'Đang bật' : 'Tắt'}
                            </span>
                          }
                        />
                      </td>
                      <td className="text-end pe-3">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle p-1 text-primary border"
                            title="Chỉnh sửa banner"
                            onClick={() => handleOpenEdit(b)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle p-1 text-danger border"
                            title="Xóa banner"
                            onClick={() => setDeleteTarget(b)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal Thêm / Chỉnh sửa Banner */}
      <Modal
        show={showModal}
        onHide={() => !submitting && setShowModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <Form onSubmit={handleSaveBanner}>
          <Modal.Header closeButton className="border-bottom">
            <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
              <Megaphone size={20} className="text-success" />
              <span>{editingBanner ? 'Chỉnh sửa Banner Khuyến Mãi' : 'Thêm Banner Khuyến Mãi Mới'}</span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Live Modal Preview Box */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small fw-bold text-dark">Xem trước trực quan thời gian thực:</span>
                <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                  Hiệu ứng: {ANIMATION_EFFECTS[formValues.animationEffect]?.label.split('(')[0]}
                </span>
              </div>
              <div
                className="rounded-3 px-3 py-2 text-white position-relative overflow-hidden shadow-sm"
                style={{
                  background: (THEME_STYLES[formValues.themeStyle] || THEME_STYLES.ORGANIC_EMERALD).gradient,
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate pe-2">
                  {formValues.badgeText && (
                    <span
                      className={`badge rounded-pill fw-bold text-white px-2 py-1 d-inline-flex align-items-center ${
                        ANIMATION_EFFECTS[formValues.animationEffect]?.badgeClass || ''
                      }`}
                      style={{
                        background: (THEME_STYLES[formValues.themeStyle] || THEME_STYLES.ORGANIC_EMERALD).badgeBg,
                        border: `1px solid ${(THEME_STYLES[formValues.themeStyle] || THEME_STYLES.ORGANIC_EMERALD).badgeBorder}`,
                        fontSize: '0.74rem',
                      }}
                    >
                      <Sparkles size={11} className="me-1 text-warning" />
                      {formValues.badgeText}
                    </span>
                  )}
                  <span className="small fw-semibold text-truncate">
                    {formValues.title || 'Nhập tiêu đề thông điệp bên dưới để xem trực quan...'}
                  </span>
                  {formValues.linkUrl && (
                    <span className="badge bg-white text-dark rounded-pill px-2 py-0 small fw-bold d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
                      <span>Chi tiết</span>
                      <ExternalLink size={10} />
                    </span>
                  )}
                </div>

                <div className="d-none d-md-flex align-items-center gap-2 text-white-50 small flex-shrink-0">
                  {formValues.hotline && (
                    <span className="text-white">
                      Hotline: <strong>{formValues.hotline}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Row className="g-3">
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark">
                    Tiêu đề thông điệp khuyến mãi <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="VD: Miễn phí vận chuyển cho đơn từ 150.000đ • 100% tươi sạch VietGAP"
                    value={formValues.title}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Nội dung chính hiển thị trên thanh thông báo đầu website.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark">Nhãn huy hiệu (Badge)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="VD: Ưu đãi hôm nay, Freeship 15K"
                    value={formValues.badgeText}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, badgeText: e.target.value }))}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark d-flex align-items-center gap-1">
                    <span>Phong cách chủ đề màu (Theme Style)</span>
                  </Form.Label>
                  <Form.Select
                    value={formValues.themeStyle}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, themeStyle: e.target.value }))}
                  >
                    {Object.entries(THEME_STYLES).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark d-flex align-items-center gap-1">
                    <Zap size={14} className="text-warning" />
                    <span>Hiệu ứng hoạt họa (Animation Effect)</span>
                  </Form.Label>
                  <Form.Select
                    value={formValues.animationEffect}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, animationEffect: e.target.value }))}
                  >
                    {Object.entries(ANIMATION_EFFECTS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {ANIMATION_EFFECTS[formValues.animationEffect]?.desc}
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark">Đường dẫn liên kết (CTA Link)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="VD: /products, /vouchers, hoặc URL"
                    value={formValues.linkUrl}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Khách hàng click vào banner sẽ được dẫn tới trang này.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark">Hotline hỗ trợ</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="VD: 0358 755 719"
                    value={formValues.hotline}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, hotline: e.target.value }))}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark">Thứ tự ưu tiên</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formValues.displayOrder}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }))
                    }
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Số nhỏ hơn sẽ được ưu tiên hiển thị trước.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-dark">Kích hoạt ngay</Form.Label>
                  <Form.Check
                    type="switch"
                    id="modal-active-switch"
                    label="Bật hiển thị banner này ngay sau khi lưu"
                    checked={formValues.isActive}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="mt-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className="border-top">
            <Button
              variant="light"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="rounded-pill px-3"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={submitting}
              className="rounded-pill px-4 fw-bold shadow-sm"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Đang lưu...
                </>
              ) : editingBanner ? (
                'Lưu thay đổi'
              ) : (
                'Tạo banner'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Xóa Banner */}
      <Modal
        show={Boolean(deleteTarget)}
        onHide={() => !deleting && setDeleteTarget(null)}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-danger">Xác nhận xóa banner</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small text-secondary">
          Bạn có chắc chắn muốn xóa vĩnh viễn banner{' '}
          <strong className="text-dark">"{deleteTarget?.title}"</strong> không? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Hủy
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteBanner} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
