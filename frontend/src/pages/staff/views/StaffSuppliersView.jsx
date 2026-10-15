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
  Store,
  Check,
  X,
  FileText,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { api } from '../../../services/apiClient'

const documentTypeLabel = {
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
  FOOD_SAFETY: 'An toàn thực phẩm',
  VIETGAP: 'Chứng nhận VietGAP',
  ORGANIC: 'Chứng nhận hữu cơ',
  OCOP: 'Chứng nhận OCOP',
  OTHER: 'Giấy tờ khác',
}

const statusBadge = {
  PENDING: { label: 'Chờ duyệt', bg: 'warning' },
  APPROVED: { label: 'Đang hoạt động', bg: 'success' },
  REJECTED: { label: 'Đã từ chối', bg: 'danger' },
  SUSPENDED: { label: 'Tạm đình chỉ', bg: 'secondary' },
}

export default function StaffSuppliersView({ onCatalogChanged }) {
  const [suppliers, setSuppliers] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Detail Modal
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Decision Modal (Reject / Suspend)
  const [decisionModal, setDecisionModal] = useState({
    show: false,
    type: '', // 'reject_supplier', 'suspend_supplier', 'reject_doc'
    supplierId: null,
    documentId: null,
    targetName: '',
    reason: '',
  })
  const [processingDecision, setProcessingDecision] = useState(false)

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get(`/api/manager/suppliers?status=${statusFilter}`)
      setSuppliers(data || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách nhà cung cấp.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void Promise.resolve().then(loadSuppliers)
  }, [loadSuppliers])

  const handleViewDetail = async (id) => {
    setLoadingDetail(true)
    setSelectedSupplier(null)
    try {
      const data = await api.get(`/api/manager/suppliers/${id}`)
      setSelectedSupplier(data)
    } catch (err) {
      setError(`Không thể tải chi tiết đối tác: ${err.message}`)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleApproveSupplier = async (id) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/manager/suppliers/${id}/approve`)
      setNotice('Đã phê duyệt nhà cung cấp đối tác!')
      await loadSuppliers()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi duyệt: ${err.message}`)
    }
  }

  const handleReactivateSupplier = async (id) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/manager/suppliers/${id}/reactivate`)
      setNotice('Đã kích hoạt lại nhà cung cấp!')
      await loadSuppliers()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi kích hoạt lại: ${err.message}`)
    }
  }

  const handleApproveDocument = async (supplierId, docId) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/manager/suppliers/${supplierId}/documents/${docId}/approve`)
      setNotice('Đã phê duyệt giấy tờ kiểm định!')
      if (selectedSupplier) {
        await handleViewDetail(supplierId)
      }
      await loadSuppliers()
    } catch (err) {
      setError(`Lỗi duyệt giấy tờ: ${err.message}`)
    }
  }

  const handleConfirmDecision = async (e) => {
    e.preventDefault()
    if (!decisionModal.reason.trim()) return
    setProcessingDecision(true)
    setError('')
    setNotice('')
    try {
      const { type, supplierId, documentId, reason } = decisionModal
      if (type === 'reject_supplier') {
        await api.put(`/api/manager/suppliers/${supplierId}/reject`, { reason })
        setNotice('Đã từ chối hồ sơ nhà cung cấp.')
      } else if (type === 'suspend_supplier') {
        await api.put(`/api/manager/suppliers/${supplierId}/suspend`, { reason })
        setNotice('Đã tạm ngừng hoạt động nhà cung cấp.')
      } else if (type === 'reject_doc') {
        await api.put(`/api/manager/suppliers/${supplierId}/documents/${documentId}/reject`, { reason })
        setNotice('Đã từ chối giấy tờ kiểm định.')
        if (selectedSupplier) await handleViewDetail(supplierId)
      }

      setDecisionModal({ show: false, type: '', supplierId: null, documentId: null, targetName: '', reason: '' })
      await loadSuppliers()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Thao tác thất bại: ${err.message}`)
    } finally {
      setProcessingDecision(false)
    }
  }

  return (
    <div className="staff-suppliers-view">
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Filter Toolbar */}
      <div className="admin-card mb-4">
        <Row className="g-3 align-items-center">
          <Col md={6}>
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-bold text-secondary text-nowrap">Lọc trạng thái:</span>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả hồ sơ</option>
                <option value="PENDING">Chờ duyệt (Pending)</option>
                <option value="APPROVED">Đang hoạt động (Approved)</option>
                <option value="SUSPENDED">Tạm đình chỉ (Suspended)</option>
                <option value="REJECTED">Đã từ chối (Rejected)</option>
              </Form.Select>
            </div>
          </Col>
          <Col md={6} className="d-flex justify-content-end">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={loadSuppliers}
              disabled={loading}
              className="d-flex align-items-center gap-1"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Tải lại</span>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Table Card */}
      <div className="admin-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Danh sách đối tác nhà cung cấp</h5>
            <p className="text-secondary small mb-0">
              Tổng số {suppliers.length} nhà cung cấp nông sản trên sàn
            </p>
          </div>
          <Badge bg="success" pill className="px-3 py-2">
            {suppliers.length} đối tác
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Store size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Không tìm thấy nhà cung cấp nào trong mục này.</p>
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>Tên nhà cung cấp</th>
                <th>Địa điểm</th>
                <th>Trạng thái</th>
                <th>Tài liệu đính kèm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const badge = statusBadge[s.status] || { label: s.status, bg: 'secondary' }
                return (
                  <tr key={s.id}>
                    <td>
                      <strong className="text-dark fs-6">{s.name}</strong>
                      <div className="small text-secondary">ID #{s.id}</div>
                    </td>
                    <td className="small text-secondary">{s.location}</td>
                    <td>
                      <Badge bg={badge.bg} className="px-2 py-1">
                        {badge.label}
                      </Badge>
                    </td>
                    <td>
                      {s.documentUrl ? (
                        <a
                          href={s.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                        >
                          <FileText size={13} />
                          <span>Xem file</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-secondary small">Chưa có file</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="d-flex align-items-center gap-1 px-2 py-1"
                          onClick={() => handleViewDetail(s.id)}
                          title="Xem hồ sơ chi tiết và giấy tờ"
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </Button>

                        {s.status === 'PENDING' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              className="d-flex align-items-center gap-1 px-2 py-1"
                              onClick={() => handleApproveSupplier(s.id)}
                            >
                              <Check size={13} />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="d-flex align-items-center gap-1 px-2 py-1"
                              onClick={() =>
                                setDecisionModal({
                                  show: true,
                                  type: 'reject_supplier',
                                  supplierId: s.id,
                                  documentId: null,
                                  targetName: s.name,
                                  reason: 'Hồ sơ pháp lý chưa đầy đủ',
                                })
                              }
                            >
                              <X size={13} />
                              <span>Từ chối</span>
                            </Button>
                          </>
                        )}

                        {s.status === 'APPROVED' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="d-flex align-items-center gap-1 px-2 py-1"
                            onClick={() =>
                              setDecisionModal({
                                show: true,
                                type: 'suspend_supplier',
                                supplierId: s.id,
                                documentId: null,
                                targetName: s.name,
                                reason: 'Tạm đình chỉ để kiểm tra định kỳ',
                              })
                            }
                          >
                            <PauseCircle size={13} />
                            <span>Đình chỉ</span>
                          </Button>
                        )}

                        {s.status === 'SUSPENDED' && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="d-flex align-items-center gap-1 px-2 py-1"
                            onClick={() => handleReactivateSupplier(s.id)}
                          >
                            <PlayCircle size={13} />
                            <span>Kích hoạt lại</span>
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
      </div>

      {/* Supplier Detail Modal */}
      <Modal
        show={Boolean(selectedSupplier) || loadingDetail}
        onHide={() => setSelectedSupplier(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">
            Chi tiết hồ sơ nhà cung cấp: {selectedSupplier?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetail ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="success" />
            </div>
          ) : selectedSupplier ? (
            <div>
              <div className="mb-3 pb-3 border-bottom">
                <h5 className="fw-bold mb-1 text-dark">{selectedSupplier.name}</h5>
                <p className="text-secondary small mb-2">{selectedSupplier.description || 'Chưa có mô tả'}</p>
                <div className="d-flex align-items-center gap-3 small">
                  <span><strong>Địa chỉ:</strong> {selectedSupplier.location}</span>
                  <span>
                    <strong>Trạng thái: </strong>
                    <Badge bg={statusBadge[selectedSupplier.status]?.bg || 'secondary'}>
                      {statusBadge[selectedSupplier.status]?.label || selectedSupplier.status}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Documents Section */}
              <h6 className="fw-bold text-dark mb-2">Giấy tờ & Chứng nhận chất lượng</h6>
              {selectedSupplier.documents?.length ? (
                <div className="d-flex flex-column gap-2">
                  {selectedSupplier.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-bold text-dark small">
                          {documentTypeLabel[doc.documentType] || doc.documentName || doc.documentType}
                        </div>
                        <div className="text-secondary small">
                          {doc.originalFileName} •{' '}
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-success">
                            Mở tệp kiểm tra <ExternalLink size={12} className="inline-block" />
                          </a>
                        </div>
                        {doc.rejectionReason && (
                          <div className="text-danger small mt-1">{doc.rejectionReason}</div>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge
                          bg={
                            doc.status === 'APPROVED'
                              ? 'success'
                              : doc.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                          className="px-2 py-1"
                        >
                          {doc.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : doc.status === 'REJECTED'
                            ? 'Từ chối'
                            : 'Chờ duyệt'}
                        </Badge>
                        {doc.status !== 'APPROVED' && (
                          <Button
                            variant="success"
                            size="sm"
                            className="px-2 py-1"
                            onClick={() => handleApproveDocument(selectedSupplier.id, doc.id)}
                          >
                            <Check size={13} /> Duyệt
                          </Button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="px-2 py-1"
                            onClick={() =>
                              setDecisionModal({
                                show: true,
                                type: 'reject_doc',
                                supplierId: selectedSupplier.id,
                                documentId: doc.id,
                                targetName: doc.documentName || doc.originalFileName,
                                reason: 'Giấy tờ mờ hoặc đã hết hạn hiệu lực',
                              })
                            }
                          >
                            <X size={13} /> Từ chối
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary small">Nhà cung cấp chưa tải lên giấy tờ nào.</p>
              )}
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setSelectedSupplier(null)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Decision Modal */}
      <Modal show={decisionModal.show} onHide={() => setDecisionModal({ ...decisionModal, show: false })} centered>
        <Form onSubmit={handleConfirmDecision}>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">
              {decisionModal.type === 'suspend_supplier'
                ? 'Tạm đình chỉ nhà cung cấp'
                : 'Từ chối yêu cầu'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small text-secondary mb-3">
              Mục: <strong className="text-dark">{decisionModal.targetName}</strong>. Vui lòng nêu rõ lý do:
            </p>
            <Form.Group>
              <Form.Label className="small fw-bold">Lý do *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                required
                value={decisionModal.reason}
                onChange={(e) => setDecisionModal({ ...decisionModal, reason: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDecisionModal({ ...decisionModal, show: false })}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="submit"
              disabled={processingDecision || !decisionModal.reason.trim()}
            >
              {processingDecision ? <Spinner animation="border" size="sm" /> : 'Xác nhận'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
