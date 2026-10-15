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
  Sprout,
  Plus,
  Edit2,
  Send,
  AlertCircle,
  FileCheck,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

const statusBadge = {
  DRAFT: { label: 'Bản nháp', bg: 'secondary' },
  PENDING: { label: 'Chờ kiểm duyệt', bg: 'warning' },
  PENDING_APPROVAL: { label: 'Chờ kiểm duyệt', bg: 'warning' },
  APPROVED: { label: 'Đã duyệt', bg: 'success' },
  REJECTED: { label: 'Cần sửa đổi', bg: 'danger' },
}

const emptyForm = {
  name: '',
  categoryId: '',
  price: '',
  unit: 'kg',
  stock: '10',
  origin: '',
  description: '',
}

export default function PartnerProductsView({
  onCatalogChanged = () => {},
  showCreateModalInit = false,
  onCloseCreateModalInit = () => {},
}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Product Modal State
  const [showModal, setShowModal] = useState(showCreateModalInit)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [images, setImages] = useState([])
  const [certFile, setCertFile] = useState(null)
  const [certData, setCertData] = useState({
    certificateType: 'VIETGAP',
    certificateNumber: '',
    issuer: '',
    issuedDate: '',
    expiryDate: '',
  })
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [prods, cats] = await Promise.all([
        api.get('/api/partner/products'),
        api.get('/api/categories').catch(() => []),
      ])
      setProducts(prods || [])
      setCategories(cats || [])
      if (cats?.length && !form.categoryId) {
        setForm((prev) => ({ ...prev, categoryId: String(cats[0].id) }))
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách nông sản.')
    } finally {
      setLoading(false)
    }
  }, [form.categoryId])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const handleOpenCreate = useCallback(() => {
    setEditProduct(null)
    setForm({
      ...emptyForm,
      categoryId: categories[0] ? String(categories[0].id) : '',
    })
    setImages([])
    setCertFile(null)
    setCertData({
      certificateType: 'VIETGAP',
      certificateNumber: '',
      issuer: '',
      issuedDate: '',
      expiryDate: '',
    })
    setShowModal(true)
  }, [categories])

  useEffect(() => {
    if (showCreateModalInit) {
      void Promise.resolve().then(() => {
        handleOpenCreate()
        onCloseCreateModalInit()
      })
    }
  }, [showCreateModalInit, onCloseCreateModalInit, handleOpenCreate])

  const handleOpenEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name || '',
      categoryId: String(product.categoryId || (categories[0]?.id || '')),
      price: String(product.price || ''),
      unit: product.unit || 'kg',
      stock: String(product.stock || '0'),
      origin: product.origin || '',
      description: product.description || '',
    })
    setImages([])
    setCertFile(null)
    setCertData({
      certificateType: 'VIETGAP',
      certificateNumber: '',
      issuer: '',
      issuedDate: '',
      expiryDate: '',
    })
    setShowModal(true)
  }

  const handleSaveProduct = async (actionType) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        price: Number(form.price),
        unit: form.unit.trim(),
        stock: Number(form.stock),
        origin: form.origin.trim(),
        description: form.description.trim(),
      }

      let res
      if (editProduct) {
        res = await api.put(`/api/partner/products/${editProduct.id}`, payload)
      } else {
        res = await api.post('/api/partner/products', payload)
      }

      const productId = res.id || editProduct?.id

      // Upload Images if selected
      if (images.length > 0 && productId) {
        const imgData = new FormData()
        images.forEach((file) => imgData.append('files', file))
        await api.post(`/api/partner/products/${productId}/images`, imgData)
      }

      // Upload Certificate if selected
      if (certFile && productId) {
        const cData = new FormData()
        cData.append('certificateType', certData.certificateType)
        if (certData.certificateNumber) cData.append('certificateNumber', certData.certificateNumber)
        if (certData.issuer) cData.append('issuer', certData.issuer)
        if (certData.issuedDate) cData.append('issuedDate', certData.issuedDate)
        if (certData.expiryDate) cData.append('expiryDate', certData.expiryDate)
        cData.append('file', certFile)
        await api.post(`/api/partner/products/${productId}/certificates`, cData)
      }

      // Submit for review if requested
      if (actionType === 'submit' && productId) {
        await api.post(`/api/partner/products/${productId}/submit`)
        setNotice(`Đã gửi nông sản "${payload.name}" tới Quản lý kiểm định!`)
      } else {
        setNotice(`Đã lưu thông tin nông sản "${payload.name}" thành công!`)
      }

      setShowModal(false)
      await loadData()
      await onCatalogChanged()
    } catch (err) {
      setError(err.message || 'Lỗi lưu thông tin sản phẩm.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForApproval = async (product) => {
    setError('')
    setNotice('')
    try {
      await api.post(`/api/partner/products/${product.id}/submit`)
      setNotice(`Đã gửi nông sản "${product.name}" tới Quản lý kiểm duyệt!`)
      await loadData()
    } catch (err) {
      setError(`Không thể gửi duyệt: ${err.message}`)
    }
  }

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'PENDING') return ['PENDING', 'PENDING_APPROVAL'].includes(p.approvalStatus)
    return p.approvalStatus === statusFilter
  })

  return (
    <div className="partner-products-view">
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
          <h5 className="fw-bold mb-1 text-dark">Danh mục Nông sản của Nhà vườn</h5>
          <p className="text-secondary small mb-0">
            Quản lý nông sản sạch, gửi hồ sơ kiểm duyệt VietGAP và cập nhật số lượng tồn kho
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="success"
            size="sm"
            className="d-flex align-items-center gap-1 shadow-sm"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Thêm nông sản mới</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key: 'ALL', label: 'Tất cả nông sản' },
          { key: 'APPROVED', label: 'Đã duyệt (Đang bán)' },
          { key: 'PENDING', label: 'Đang chờ duyệt' },
          { key: 'REJECTED', label: 'Cần chỉnh sửa' },
          { key: 'DRAFT', label: 'Bản nháp' },
        ].map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={statusFilter === tab.key ? 'success' : 'outline-secondary'}
            className="rounded-pill px-3"
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Products Table */}
      <div className="admin-card">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <div className="mt-2 text-secondary small">Đang tải nông sản của nhà vườn...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Sprout size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Không tìm thấy nông sản nào theo bộ lọc.</p>
          </div>
        ) : (
          <Table responsive className="admin-table align-middle">
            <thead>
              <tr>
                <th>Nông sản</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Chứng nhận</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const st = statusBadge[p.approvalStatus] || {
                  label: p.approvalStatus,
                  bg: 'secondary',
                }
                const firstImg = p.images?.[0]?.imageUrl || p.imageUrl

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {firstImg ? (
                          <img
                            src={firstImg}
                            alt={p.name}
                            className="rounded-3 object-fit-cover border"
                            style={{ width: '48px', height: '48px' }}
                          />
                        ) : (
                          <div
                            className="rounded-3 bg-light d-flex align-items-center justify-content-center border text-secondary"
                            style={{ width: '48px', height: '48px' }}
                          >
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <div>
                          <strong className="text-dark small d-block">{p.name}</strong>
                          <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                            Xuất xứ: {p.origin || 'Nhà vườn'}
                          </span>
                          {p.rejectionReason && (
                            <div className="small text-danger d-flex align-items-center gap-1 mt-1">
                              <AlertCircle size={12} />
                              <span>{p.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {p.category?.name || p.categoryName || 'Rau củ'}
                      </span>
                    </td>
                    <td>
                      <strong className="text-primary small">
                        {formatCurrency(Number(p.price))}
                      </strong>
                      <span className="text-secondary small"> / {p.unit}</span>
                    </td>
                    <td>
                      <span className="fw-bold text-dark small">{p.stock}</span>{' '}
                      <span className="text-secondary small">{p.unit}</span>
                    </td>
                    <td>
                      {p.certificateNo || p.certificates?.length ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                          <FileCheck size={12} className="me-1 inline-block" />
                          {p.certificateNo || p.certificates?.[0]?.certificateNumber || 'VietGAP'}
                        </span>
                      ) : (
                        <span className="text-muted small">Chưa có</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={st.bg} className="px-2 py-1">
                        {st.label}
                      </Badge>
                      {p.approvalStatus === 'APPROVED' && (
                        <div className="small text-success mt-1" style={{ fontSize: '0.7rem' }}>
                          <CheckCircle size={10} className="me-1 inline-block" /> Đang bán
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        {p.approvalStatus !== 'APPROVED' && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="px-2 py-1"
                            title="Chỉnh sửa nông sản"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit2 size={13} />
                          </Button>
                        )}
                        {['DRAFT', 'REJECTED'].includes(p.approvalStatus) && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="px-2 py-1 d-flex align-items-center gap-1"
                            title="Gửi duyệt lên sàn"
                            onClick={() => handleSubmitForApproval(p)}
                          >
                            <Send size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Gửi duyệt</span>
                          </Button>
                        )}
                        {p.approvalStatus === 'APPROVED' && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="px-2 py-1"
                            onClick={() => handleOpenEdit(p)}
                          >
                            Cập nhật kho
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

      {/* Modal Create / Edit Product */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">
            {editProduct ? `Chỉnh sửa nông sản: ${editProduct.name}` : 'Thêm nông sản mới'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <Row className="g-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label className="small fw-bold">Tên nông sản *</Form.Label>
                <Form.Control
                  required
                  placeholder="VD: Cà rốt hữu cơ Đà Lạt"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Danh mục *</Form.Label>
                <Form.Select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Giá bán (VND) *</Form.Label>
                <Form.Control
                  type="number"
                  min="500"
                  required
                  placeholder="35000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Đơn vị tính *</Form.Label>
                <Form.Select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="bó">bó</option>
                  <option value="túi">túi</option>
                  <option value="hộp">hộp</option>
                  <option value="trái">trái</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Tồn kho ban đầu *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group>
            <Form.Label className="small fw-bold">Vùng trồng / Xuất xứ *</Form.Label>
            <Form.Control
              required
              placeholder="VD: Huyện Đơn Dương, Tỉnh Lâm Đồng"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label className="small fw-bold">Mô tả sản phẩm & Quy trình canh tác</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Mô tả giống cây, đặc điểm dinh dưỡng và phương thức thu hái..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Form.Group>

          {/* Upload Images */}
          <div className="border rounded p-3 bg-light">
            <Form.Label className="small fw-bold mb-1 d-flex align-items-center gap-1">
              <ImageIcon size={15} />
              <span>Hình ảnh nông sản (Tối đa 8 ảnh JPG/PNG)</span>
            </Form.Label>
            <Form.Control
              type="file"
              multiple
              accept=".jpg,.jpeg,.png"
              onChange={(e) => setImages([...e.target.files])}
            />
            {images.length > 0 && (
              <div className="small text-success mt-1">Đã chọn {images.length} tệp hình ảnh.</div>
            )}
          </div>

          {/* Upload Certification (Optional) */}
          <div className="border rounded p-3 bg-light">
            <Form.Label className="small fw-bold mb-2 d-flex align-items-center gap-1">
              <FileCheck size={15} />
              <span>Chứng nhận chất lượng nông sản (VietGAP, OCOP, Hữu cơ)</span>
            </Form.Label>
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Select
                  size="sm"
                  value={certData.certificateType}
                  onChange={(e) => setCertData({ ...certData, certificateType: e.target.value })}
                >
                  <option value="VIETGAP">Chứng nhận VietGAP</option>
                  <option value="ORGANIC">Chứng nhận Hữu cơ (Organic)</option>
                  <option value="OCOP">Chứng nhận OCOP</option>
                  <option value="FOOD_SAFETY">Chứng nhận An toàn thực phẩm</option>
                  <option value="OTHER">Chứng nhận khác</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Control
                  size="sm"
                  placeholder="Mã / Số hiệu chứng nhận"
                  value={certData.certificateNumber}
                  onChange={(e) => setCertData({ ...certData, certificateNumber: e.target.value })}
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  size="sm"
                  placeholder="Cơ quan cấp chứng nhận"
                  value={certData.issuer}
                  onChange={(e) => setCertData({ ...certData, issuer: e.target.value })}
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  size="sm"
                  type="date"
                  placeholder="Ngày hết hạn"
                  value={certData.expiryDate}
                  onChange={(e) => setCertData({ ...certData, expiryDate: e.target.value })}
                />
              </Col>
            </Row>
            <Form.Control
              size="sm"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setCertFile(e.target.files[0] || null)}
            />
            <div className="small text-secondary mt-1" style={{ fontSize: '0.72rem' }}>
              Chứng nhận sẽ được Quản lý duyệt trước khi gắn nhãn xanh công khai cho khách hàng.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
            Hủy bỏ
          </Button>
          <Button
            variant="outline-success"
            size="sm"
            disabled={saving}
            onClick={() => handleSaveProduct('draft')}
          >
            {saving ? <Spinner animation="border" size="sm" /> : 'Lưu bản nháp'}
          </Button>
          <Button
            variant="success"
            size="sm"
            disabled={saving}
            onClick={() => handleSaveProduct('submit')}
          >
            {saving ? <Spinner animation="border" size="sm" /> : 'Lưu & Gửi duyệt ngay'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
