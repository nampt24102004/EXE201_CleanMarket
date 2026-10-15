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
import {
  QrCode,
  Plus,
  Download,
  ExternalLink,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../../services/apiClient'

const initialBatchForm = {
  productId: '',
  farmName: '',
  origin: '',
  harvestDate: '',
  packagingDate: '',
  expiryDate: '',
  quantity: '',
  certificateNo: '',
}

export default function PartnerBatchesView({
  showCreateModalInit = false,
  onCloseCreateModalInit = () => {},
}) {
  const [batches, setBatches] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedProductFilter, setSelectedProductFilter] = useState('ALL')

  // Create Batch Modal
  const [showCreateModal, setShowCreateModal] = useState(showCreateModalInit)
  const [batchForm, setBatchForm] = useState(initialBatchForm)
  const [creating, setCreating] = useState(false)

  // QR Preview Modal
  const [previewQrBatch, setPreviewQrBatch] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const prods = await api.get('/api/partner/products')
      setProducts(prods || [])

      // Load batches for each product
      const batchArrays = await Promise.all(
        (prods || []).map((p) =>
          api.get(`/api/partner/products/${p.id}/batches`).catch(() => [])
        )
      )
      setBatches(batchArrays.flat())
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách lô hàng & mã QR.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const approvedProducts = products.filter((p) => p.approvalStatus === 'APPROVED')

  const handleOpenCreate = useCallback(() => {
    const firstApproved = approvedProducts[0]
    setBatchForm({
      ...initialBatchForm,
      productId: firstApproved ? String(firstApproved.id) : '',
      farmName: firstApproved?.origin || '',
      origin: firstApproved?.origin || '',
    })
    setShowCreateModal(true)
  }, [approvedProducts])

  useEffect(() => {
    if (showCreateModalInit) {
      void Promise.resolve().then(() => {
        handleOpenCreate()
        onCloseCreateModalInit()
      })
    }
  }, [showCreateModalInit, onCloseCreateModalInit, handleOpenCreate])

  const handleCreateBatch = async (e) => {
    e.preventDefault()
    if (!batchForm.productId) {
      setError('Vui lòng chọn một sản phẩm đã được kiểm duyệt.')
      return
    }

    setCreating(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        farmName: batchForm.farmName.trim(),
        origin: batchForm.origin.trim(),
        harvestDate: batchForm.harvestDate,
        packagingDate: batchForm.packagingDate,
        expiryDate: batchForm.expiryDate || null,
        quantity: Number(batchForm.quantity),
        certificateNo: batchForm.certificateNo ? batchForm.certificateNo.trim() : null,
      }

      await api.post(`/api/partner/products/${batchForm.productId}/batches`, payload)
      setNotice('Đã tạo thành công lô nông sản mới và cấp mã QR truy xuất!')
      setShowCreateModal(false)
      await loadData()
    } catch (err) {
      setError(err.message || 'Lỗi tạo lô hàng.')
    } finally {
      setCreating(false)
    }
  }

  const handleDownloadQr = (batch) => {
    const link = document.createElement('a')
    link.href = `/api/partner/batches/${batch.id}/qr`
    link.download = `QR_${batch.batchCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredBatches = batches.filter((b) => {
    if (selectedProductFilter === 'ALL') return true
    return String(b.productId) === selectedProductFilter
  })

  return (
    <div className="partner-batches-view">
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
          <h5 className="fw-bold mb-1 text-dark">Lô nông sản & Mã QR truy xuất nguồn gốc</h5>
          <p className="text-secondary small mb-0">
            Minh bạch từng mẻ thu hoạch, ngày đóng gói và cấp tem nhãn điện tử cho người tiêu dùng
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="success"
            size="sm"
            className="d-flex align-items-center gap-1 shadow-sm"
            onClick={handleOpenCreate}
            disabled={approvedProducts.length === 0}
            title={approvedProducts.length === 0 ? 'Cần có ít nhất 1 sản phẩm đã duyệt' : ''}
          >
            <Plus size={16} />
            <span>Tạo lô nông sản mới</span>
          </Button>
        </div>
      </div>

      {approvedProducts.length === 0 && (
        <Alert variant="warning" className="small">
          * Bạn cần có ít nhất một nông sản ở trạng thái <strong>Đã duyệt (APPROVED)</strong> để tạo lô hàng và sinh mã QR truy xuất.
        </Alert>
      )}

      {/* Filter by Product */}
      <div className="admin-card mb-4 p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '380px' }}>
          <Form.Label className="small fw-bold text-secondary mb-0 text-nowrap">Lọc theo nông sản:</Form.Label>
          <Form.Select
            size="sm"
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
          >
            <option value="ALL">Tất cả sản phẩm ({batches.length} lô)</option>
            {products.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </Form.Select>
        </div>
        <Badge bg="success" pill className="px-3 py-2">
          {filteredBatches.length} lô hàng hiển thị
        </Badge>
      </div>

      {/* Batches Table */}
      <div className="admin-card">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="mt-2 text-secondary small">Đang tải danh sách lô hàng...</div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <QrCode size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Chưa có lô hàng nào được tạo.</p>
          </div>
        ) : (
          <Table responsive className="admin-table align-middle">
            <thead>
              <tr>
                <th>Mã Lô & Tem QR</th>
                <th>Sản phẩm liên kết</th>
                <th>Thu hoạch / Đóng gói</th>
                <th>Hạn sử dụng</th>
                <th>Số lượng lô</th>
                <th>Chứng nhận</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => {
                const prod = products.find((p) => p.id === b.productId)
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={`/api/partner/batches/${b.id}/qr`}
                          alt={`QR ${b.batchCode}`}
                          className="rounded border p-1 bg-white cursor-pointer"
                          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                          onClick={() => setPreviewQrBatch(b)}
                          title="Click để phóng to mã QR"
                        />
                        <div>
                          <code className="fw-bold fs-6 text-dark">{b.batchCode}</code>
                          <div className="small text-secondary" style={{ fontSize: '0.72rem' }}>
                            Mã tra cứu: <span className="fw-semibold text-primary">{b.traceCode}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="text-dark small d-block">{prod?.name || 'Nông sản'}</strong>
                      <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                        Trang trại: {b.farmName || prod?.origin || 'Nhà vườn'}
                      </span>
                    </td>
                    <td>
                      <div className="small text-dark d-flex align-items-center gap-1">
                        <Calendar size={12} className="text-success" />
                        <span>Hái: {b.harvestDate || '—'}</span>
                      </div>
                      <div className="small text-secondary">Gói: {b.packagingDate || '—'}</div>
                    </td>
                    <td>
                      <span className="small text-dark fw-semibold">
                        {b.expiryDate || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-dark small">{b.quantity}</span>{' '}
                      <span className="text-secondary small">{prod?.unit || 'kg'}</span>
                    </td>
                    <td>
                      {b.certificateNo ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                          <CheckCircle2 size={11} className="me-1 inline-block" />
                          {b.certificateNo}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="px-2 py-1 d-flex align-items-center gap-1"
                          title="Tải ảnh QR PNG về in nhãn"
                          onClick={() => handleDownloadQr(b)}
                        >
                          <Download size={13} />
                          <span style={{ fontSize: '0.75rem' }}>Tải QR</span>
                        </Button>
                        <Link
                          to={`/trace/${b.traceCode}`}
                          target="_blank"
                          className="btn btn-sm btn-outline-success px-2 py-1 d-flex align-items-center gap-1"
                          title="Xem trang tra cứu công khai cho khách hàng"
                        >
                          <ExternalLink size={13} />
                          <span style={{ fontSize: '0.75rem' }}>Tra cứu</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* Create Batch Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Form onSubmit={handleCreateBatch}>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Tạo Lô nông sản mới & Cấp mã QR truy xuất</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small fw-bold">Chọn nông sản đã kiểm duyệt *</Form.Label>
              <Form.Select
                required
                value={batchForm.productId}
                onChange={(e) => {
                  const pid = e.target.value
                  const found = approvedProducts.find((p) => String(p.id) === pid)
                  setBatchForm({
                    ...batchForm,
                    productId: pid,
                    farmName: found?.origin || batchForm.farmName,
                    origin: found?.origin || batchForm.origin,
                  })
                }}
              >
                {approvedProducts.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name} ({p.stock} {p.unit} tồn kho)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Tên nông trại / Cơ sở canh tác *</Form.Label>
                  <Form.Control
                    required
                    placeholder="VD: Nông trại Hòa Lạc Farm"
                    value={batchForm.farmName}
                    onChange={(e) => setBatchForm({ ...batchForm, farmName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Vùng trồng / Địa điểm thu hoạch *</Form.Label>
                  <Form.Control
                    required
                    placeholder="VD: Khu nông nghệ cao Hòa Lạc"
                    value={batchForm.origin}
                    onChange={(e) => setBatchForm({ ...batchForm, origin: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Ngày thu hoạch *</Form.Label>
                  <Form.Control
                    required
                    type="date"
                    value={batchForm.harvestDate}
                    onChange={(e) => setBatchForm({ ...batchForm, harvestDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Ngày đóng gói *</Form.Label>
                  <Form.Control
                    required
                    type="date"
                    value={batchForm.packagingDate}
                    onChange={(e) => setBatchForm({ ...batchForm, packagingDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Hạn sử dụng</Form.Label>
                  <Form.Control
                    type="date"
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Sản lượng mẻ thu hoạch (Số lượng) *</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="VD: 50"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Số hiệu chứng nhận VietGAP / OCOP</Form.Label>
                  <Form.Control
                    placeholder="VD: VG-2026-889"
                    value={batchForm.certificateNo}
                    onChange={(e) => setBatchForm({ ...batchForm, certificateNo: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={creating}>
              {creating ? <Spinner animation="border" size="sm" /> : 'Tạo lô hàng & Cấp mã QR'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* QR Code Big Preview Modal */}
      <Modal show={Boolean(previewQrBatch)} onHide={() => setPreviewQrBatch(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">
            Mã QR Truy Xuất Nguồn Gốc: {previewQrBatch?.batchCode}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {previewQrBatch && (
            <>
              <img
                src={`/api/partner/batches/${previewQrBatch.id}/qr`}
                alt={`QR ${previewQrBatch.batchCode}`}
                className="img-fluid p-3 border rounded shadow-sm mb-3"
                style={{ maxWidth: '240px', backgroundColor: '#fff' }}
              />
              <div className="fw-bold text-dark fs-5">{previewQrBatch.batchCode}</div>
              <p className="text-secondary small mb-3">
                Khách hàng quét mã này sẽ mở trực tiếp trang xác thực nguồn gốc tại:
                <br />
                <code className="text-success">{`/trace/${previewQrBatch.traceCode}`}</code>
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Button
                  variant="success"
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={() => handleDownloadQr(previewQrBatch)}
                >
                  <Download size={14} />
                  <span>Tải ảnh QR (PNG)</span>
                </Button>
                <Link
                  to={`/trace/${previewQrBatch.traceCode}`}
                  target="_blank"
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                >
                  <ExternalLink size={14} />
                  <span>Mở trang tra cứu</span>
                </Link>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
