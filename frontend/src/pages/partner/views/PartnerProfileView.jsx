import { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Badge,
  Form,
  Spinner,
  Alert,
  Row,
  Col,
} from 'react-bootstrap'
import {
  FileText,
  Upload,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { api } from '../../../services/apiClient'

const documentTypeLabel = {
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
  FOOD_SAFETY: 'Giấy chứng nhận an toàn thực phẩm',
  VIETGAP: 'Chứng nhận VietGAP',
  ORGANIC: 'Chứng nhận hữu cơ',
  OCOP: 'Chứng nhận OCOP',
  OTHER: 'Giấy tờ khác',
}

const statusBadge = {
  APPROVED: { label: 'Đang hoạt động', bg: 'success' },
  PENDING: { label: 'Đang chờ duyệt', bg: 'warning' },
  REJECTED: { label: 'Bị từ chối', bg: 'danger' },
  SUSPENDED: { label: 'Tạm đình chỉ', bg: 'secondary' },
}

export default function PartnerProfileView({ onCatalogChanged = () => {} }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    location: '',
    description: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Document Upload Form
  const [docForm, setDocForm] = useState({
    documentType: 'BUSINESS_LICENSE',
    documentName: '',
    file: null,
  })
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docInputKey, setDocInputKey] = useState(0)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/suppliers/my')
      setProfile(data)
      setProfileForm({
        name: data?.name || '',
        location: data?.location || '',
        description: data?.description || '',
      })
    } catch (err) {
      setError(err.message || 'Lỗi tải hồ sơ nhà cung cấp.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadProfile)
  }, [loadProfile])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setError('')
    setNotice('')
    try {
      await api.put('/api/partner/supplier-profile', profileForm)
      setNotice('Đã cập nhật thông tin hồ sơ nhà cung cấp thành công!')
      await loadProfile()
      await onCatalogChanged()
    } catch (err) {
      setError(err.message || 'Lỗi lưu hồ sơ.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUploadDocument = async (e) => {
    e.preventDefault()
    if (!docForm.file) return

    setUploadingDoc(true)
    setError('')
    setNotice('')
    try {
      const body = new FormData()
      body.append('documentType', docForm.documentType)
      const docName =
        docForm.documentType === 'OTHER'
          ? docForm.documentName.trim()
          : documentTypeLabel[docForm.documentType]
      body.append('documentName', docName)
      body.append('file', docForm.file)

      await api.post('/api/partner/supplier-profile/documents', body)
      setNotice('Đã tải tài liệu lên thành công! Hồ sơ mới đang được Quản lý kiểm duyệt.')
      setDocForm({
        documentType: 'BUSINESS_LICENSE',
        documentName: '',
        file: null,
      })
      setDocInputKey((k) => k + 1)
      await loadProfile()
    } catch (err) {
      setError(err.message || 'Lỗi tải tài liệu lên.')
    } finally {
      setUploadingDoc(false)
    }
  }

  const statusConfig = statusBadge[profile?.status] || {
    label: profile?.status || 'Chưa rõ',
    bg: 'secondary',
  }

  return (
    <div className="partner-profile-view">
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

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <div className="mt-2 text-secondary small">Đang tải hồ sơ nhà cung cấp...</div>
        </div>
      ) : (
        <Row className="g-4">
          {/* Cột 1: Thông tin hồ sơ */}
          <Col lg={7}>
            <div className="admin-card h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0 text-dark">Hồ sơ Nhà vườn / Hợp tác xã</h5>
                  <p className="text-secondary small mb-0">
                    Thông tin hiển thị công khai trên gian hàng đối tác CleanMarket
                  </p>
                </div>
                <Badge bg={statusConfig.bg} className="px-3 py-2 fs-6">
                  {statusConfig.label}
                </Badge>
              </div>

              <Form onSubmit={handleSaveProfile} className="d-flex flex-column gap-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Tên nhà cung cấp / Trang trại *</Form.Label>
                  <Form.Control
                    required
                    placeholder="VD: Nông trại Rau sạch Hòa Lạc"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-bold">Vùng trồng / Địa chỉ trụ sở *</Form.Label>
                  <Form.Control
                    required
                    placeholder="VD: Xã Thạch Hòa, Huyện Thạch Thất, TP. Hà Nội"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small fw-bold">Giới thiệu quy trình canh tác & cam kết sạch</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    placeholder="Giới thiệu về diện tích, nguồn nước tưới, tiêu chuẩn VietGAP hoặc chứng nhận hữu cơ áp dụng..."
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  />
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button
                    type="submit"
                    variant="success"
                    size="sm"
                    className="px-4 py-2 fw-semibold"
                    disabled={savingProfile}
                  >
                    {savingProfile ? <Spinner animation="border" size="sm" /> : 'Lưu thay đổi hồ sơ'}
                  </Button>
                </div>
              </Form>
            </div>
          </Col>

          {/* Cột 2: Giấy tờ pháp lý & Upload */}
          <Col lg={5}>
            <div className="d-flex flex-column gap-4">
              {/* Danh sách giấy tờ đã gửi */}
              <div className="admin-card">
                <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                  <ShieldCheck size={18} className="text-success" />
                  <span>Giấy tờ pháp lý & Chứng nhận</span>
                </h5>
                <p className="text-secondary small mb-3">
                  Tài liệu pháp lý để sàn xác minh năng lực và tiêu chuẩn an toàn
                </p>

                {profile?.documents?.length ? (
                  <div className="d-flex flex-column gap-2 mb-3">
                    {profile.documents.map((item) => {
                      const docSt =
                        item.status === 'APPROVED'
                          ? { label: 'Đã duyệt', bg: 'success' }
                          : item.status === 'REJECTED'
                          ? { label: 'Từ chối', bg: 'danger' }
                          : { label: 'Chờ duyệt', bg: 'warning' }

                      return (
                        <div key={item.id} className="p-3 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="fw-bold text-dark small text-decoration-none d-flex align-items-center gap-1"
                            >
                              <FileText size={14} className="text-primary" />
                              <span>{item.documentName || documentTypeLabel[item.documentType]}</span>
                              <ExternalLink size={12} className="text-secondary" />
                            </a>
                            <Badge bg={docSt.bg} className="px-2 py-1 small">
                              {docSt.label}
                            </Badge>
                          </div>
                          <div className="small text-secondary" style={{ fontSize: '0.75rem' }}>
                            {documentTypeLabel[item.documentType] || item.documentType} · {item.originalFileName}
                          </div>
                          {item.rejectionReason && (
                            <div className="small text-danger d-flex align-items-center gap-1 mt-1">
                              <AlertCircle size={12} />
                              <span>Lý do: {item.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-3 border rounded text-center text-secondary small mb-3 bg-light">
                    Chưa có giấy tờ kiểm định nào được lưu.
                  </div>
                )}
              </div>

              {/* Tải giấy tờ mới */}
              <div className="admin-card">
                <h6 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                  <Upload size={16} className="text-success" />
                  <span>Bổ sung giấy tờ pháp lý mới</span>
                </h6>
                <p className="text-secondary small mb-3">
                  Đính kèm giấy phép kinh doanh mới, chứng nhận VietGAP gia hạn hoặc chứng chỉ OCOP
                </p>

                <Form onSubmit={handleUploadDocument} className="d-flex flex-column gap-2">
                  <Form.Group>
                    <Form.Label className="small fw-bold">Loại tài liệu *</Form.Label>
                    <Form.Select
                      size="sm"
                      value={docForm.documentType}
                      onChange={(e) =>
                        setDocForm({ ...docForm, documentType: e.target.value, documentName: '' })
                      }
                    >
                      {Object.entries(documentTypeLabel).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {docForm.documentType === 'OTHER' && (
                    <Form.Group>
                      <Form.Label className="small fw-bold">Tên tài liệu cụ thể *</Form.Label>
                      <Form.Control
                        size="sm"
                        required
                        placeholder="VD: Bản cam kết dư lượng thuốc BVTV"
                        value={docForm.documentName}
                        onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })}
                      />
                    </Form.Group>
                  )}

                  <Form.Group>
                    <Form.Label className="small fw-bold">Tệp tài liệu đính kèm *</Form.Label>
                    <Form.Control
                      key={docInputKey}
                      size="sm"
                      required
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] || null })}
                    />
                    <Form.Text className="small text-secondary">
                      Hỗ trợ PDF, JPG, PNG dung lượng dưới 10MB.
                    </Form.Text>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="outline-success"
                    size="sm"
                    className="mt-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                    disabled={!docForm.file || uploadingDoc}
                  >
                    {uploadingDoc ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Tải giấy tờ lên để xét duyệt</span>
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </div>
  )
}
