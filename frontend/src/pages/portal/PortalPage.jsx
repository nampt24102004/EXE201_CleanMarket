import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import PartnerNav from '../../components/partner/PartnerNav'
import StaffNav from '../../components/portal/StaffNav'
import { useAuth } from '../../context/useAuth'
import { api } from '../../services/apiClient'
import formatCurrency from '../../utils/formatCurrency'

const title = { PARTNER: 'Không gian nhà cung cấp', MANAGER: 'Trung tâm vận hành', ADMIN: 'Quản trị hệ thống' }
const statusLabel = { DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt', PENDING_APPROVAL: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối', ACTIVE: 'Đang bán', INACTIVE: 'Ngừng bán', CREATED: 'Mới tạo', CONFIRMED: 'Đã xác nhận', SHIPPED: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy', RESOLVED: 'Đã xử lý', COMPLETED: 'Hoàn tất' }
const documentTypeLabel = { BUSINESS_LICENSE: 'Giấy phép kinh doanh', FOOD_SAFETY: 'Giấy chứng nhận an toàn thực phẩm', VIETGAP: 'Chứng nhận VietGAP', ORGANIC: 'Chứng nhận hữu cơ', OCOP: 'Chứng nhận OCOP', OTHER: 'Giấy tờ khác' }
const documentDisplayName = (item) => item.documentType === 'OTHER' && item.documentName && item.documentName !== 'OTHER'
  ? item.documentName
  : documentTypeLabel[item.documentType] || item.documentName || item.originalFileName
const auditActionLabel = { USER_ENABLE: 'Mở khóa tài khoản', USER_DISABLE: 'Khóa tài khoản', USER_ROLE_CHANGE: 'Thay đổi quyền tài khoản', CATEGORY_CREATE: 'Tạo danh mục', CATEGORY_STATUS: 'Cập nhật trạng thái danh mục', COMPLAINT_RESOLVE: 'Xử lý khiếu nại', REFUND_REQUEST: 'Yêu cầu hoàn tiền', REFUND_MANUAL_COMPLETE: 'Hoàn tất hoàn tiền thủ công', PRODUCT_CREATED: 'Tạo sản phẩm', PRODUCT_SUBMITTED: 'Gửi sản phẩm duyệt', PRODUCT_SUBMIT: 'Gửi sản phẩm duyệt', PRODUCT_APPROVED: 'Duyệt sản phẩm', PRODUCT_REJECTED: 'Từ chối sản phẩm', CERTIFICATE_UPLOADED: 'Tải chứng nhận lên', CERTIFICATE_APPROVED: 'Duyệt chứng nhận', CERTIFICATE_REJECTED: 'Từ chối chứng nhận', SUPPLIER_SUBMITTED: 'Gửi hồ sơ nhà cung cấp', SUPPLIER_UPDATED: 'Cập nhật hồ sơ đăng ký', SUPPLIER_PROFILE_UPDATE: 'Cập nhật hồ sơ nhà cung cấp', SUPPLIER_RESUBMITTED: 'Gửi lại hồ sơ nhà cung cấp', SUPPLIER_APPROVED: 'Duyệt nhà cung cấp', SUPPLIER_REJECTED: 'Từ chối nhà cung cấp', SUPPLIER_DOCUMENT_UPLOADED: 'Tải giấy tờ nhà cung cấp', SUPPLIER_DOCUMENT_APPROVED: 'Duyệt giấy tờ nhà cung cấp', SUPPLIER_DOCUMENT_REJECTED: 'Từ chối giấy tờ nhà cung cấp', BATCH_CREATE: 'Tạo lô hàng' }
const auditAction = (value) => auditActionLabel[value] || (value?.startsWith('SUPPLIER_ORDER_') ? `Cập nhật đơn nhà cung cấp: ${statusLabel[value.replace('SUPPLIER_ORDER_', '')] || value.replace('SUPPLIER_ORDER_', '')}` : value)
const nextOrderStatus = { CREATED: 'CONFIRMED', CONFIRMED: 'SHIPPED', SHIPPED: 'DELIVERED' }

function DataCard({ title: cardTitle, children }) { return <Card className="detail-card border-0 p-3 p-md-4"><Card.Body><h2 className="h4 mb-3">{cardTitle}</h2>{children}</Card.Body></Card> }

export default function PortalPage({ role, onCatalogChanged }) {
  const { section = '' } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState({ products: [], batches: [], orders: [], categories: [], suppliers: [], complaints: [], refunds: [], users: [], roles: [], audit: [], profile: null })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [productForm, setProductForm] = useState({ name: '', price: '', unit: 'kg', categoryId: '', description: '', imageUrl: '', certificateNo: '' })
  const [batchForm, setBatchForm] = useState({ productId: '', farmName: '', origin: '', harvestDate: '', packagingDate: '', expiryDate: '', quantity: '', certificateNo: '' })
  const [profileForm, setProfileForm] = useState({ name: '', location: '', description: '' })
  const [documentForm, setDocumentForm] = useState({ documentType: 'BUSINESS_LICENSE', documentName: '', file: null })
  const [documentInputKey, setDocumentInputKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      if (role === 'PARTNER') {
        const [profile, products, orders, categories] = await Promise.all([api.get('/api/suppliers/my'), api.get('/api/partner/products'), api.get('/api/partner/orders'), api.get('/api/categories')])
        const batchGroups = await Promise.all(products.map((product) => api.get(`/api/partner/products/${product.id}/batches`)))
        setData((current) => ({ ...current, profile, products, orders, categories, batches: batchGroups.flat() }))
        setProfileForm({ name: profile.name, location: profile.location, description: profile.description || '' })
        setProductForm((current) => ({ ...current, categoryId: current.categoryId || String(categories[0]?.id || '') }))
      } else if (role === 'MANAGER') {
        const [suppliers, products, orders, complaints, refunds] = await Promise.all([api.get('/api/manager/suppliers/pending'), api.get('/api/manager/products'), api.get('/api/manager/orders?size=100').then((page) => page.items), api.get('/api/manager/complaints'), api.get('/api/manager/refunds')])
        setData((current) => ({ ...current, suppliers, products, orders, complaints, refunds }))
      } else {
        const [users, roles, categories, audit] = await Promise.all([api.get('/api/admin/users?size=100').then((page) => page.items), api.get('/api/admin/roles'), api.get('/api/admin/categories'), api.get('/api/admin/audit-logs?size=100').then((page) => page.items)])
        setData((current) => ({ ...current, users, roles, categories, audit }))
      }
    } catch (caught) { setError(caught.message) } finally { setLoading(false) }
  }, [role])

  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const run = async (action, success, refreshCatalog = false) => {
    setError(''); setNotice('')
    try { await action(); await load(); if (refreshCatalog) await onCatalogChanged?.(); setNotice(success); return true } catch (caught) { setError(caught.message); return false }
  }
  const createProduct = (event) => {
    event.preventDefault()
    run(() => api.post('/api/partner/products', { ...productForm, price: Number(productForm.price), categoryId: Number(productForm.categoryId) }), 'Đã gửi sản phẩm để Manager duyệt.')
  }
  const createBatch = (event) => {
    event.preventDefault()
    const { productId, ...body } = batchForm
    run(() => api.post(`/api/partner/products/${productId}/batches`, { ...body, quantity: Number(body.quantity), expiryDate: body.expiryDate || null }), 'Đã tạo lô hàng và mã truy xuất.', true)
  }
  const saveProfile = (event) => { event.preventDefault(); run(() => api.put('/api/partner/supplier-profile', profileForm), 'Đã cập nhật hồ sơ nhà cung cấp.', true) }
  const uploadDocument = (event) => {
    event.preventDefault()
    const body = new FormData()
    body.append('documentType', documentForm.documentType)
    const documentName = documentForm.documentType === 'OTHER'
      ? documentForm.documentName.trim()
      : documentTypeLabel[documentForm.documentType]
    body.append('documentName', documentName)
    body.append('file', documentForm.file)
    run(() => api.post('/api/partner/supplier-profile/documents', body), 'Đã tải giấy tờ lên. Giấy tờ mới đang chờ kiểm duyệt.')
      .then((uploaded) => { if (uploaded) { setDocumentForm({ documentType: 'BUSINESS_LICENSE', documentName: '', file: null }); setDocumentInputKey((value) => value + 1) } })
  }

  let content
  if (section === '') {
    const stats = role === 'PARTNER' ? [['Sản phẩm', data.products.length], ['Lô hàng', data.batches.length], ['Đơn hàng', data.orders.length], ['Chờ duyệt', data.products.filter((item) => ['PENDING', 'PENDING_APPROVAL'].includes(item.approvalStatus)).length]] : role === 'MANAGER' ? [['Nhà cung cấp chờ duyệt', data.suppliers.length], ['Sản phẩm chờ duyệt', data.products.length], ['Đơn hàng', data.orders.length], ['Khiếu nại', data.complaints.length]] : [['Tài khoản', data.users.length], ['Danh mục', data.categories.length], ['Nhật ký', data.audit.length]]
    content = <Row className="g-4">{stats.map(([label, value]) => <Col sm={6} xl={3} key={label}><div className="portal-stat"><span>{label}</span><strong>{value}</strong></div></Col>)}{role === 'ADMIN' && <Col xs={12}><DataCard title="Kết nối hệ thống"><p className="text-secondary mb-0">Dữ liệu trên trang này được đọc và cập nhật trực tiếp qua Spring Boot API.</p></DataCard></Col>}</Row>
  } else if (role === 'PARTNER' && section === 'profile') {
    content = <Row className="g-4"><Col lg={7}><DataCard title="Hồ sơ nhà cung cấp"><Form onSubmit={saveProfile}>{[['name','Tên nhà cung cấp'],['location','Địa điểm'],['description','Mô tả']].map(([key,label]) => <Form.Group className="mb-3" key={key}><Form.Label>{label}</Form.Label><Form.Control as={key === 'description' ? 'textarea' : undefined} required={key !== 'description'} value={profileForm[key]} onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })} /></Form.Group>)}<Badge bg={data.profile?.status === 'APPROVED' ? 'success' : 'warning'} className="me-3">{statusLabel[data.profile?.status] || data.profile?.status}</Badge><Button type="submit" className="primary-btn">Lưu hồ sơ</Button></Form></DataCard></Col><Col lg={5}><DataCard title="Giấy tờ nhà cung cấp"><p className="text-secondary small">Bạn có thể cung cấp thêm giấy phép, chứng nhận chất lượng hoặc giấy tờ liên quan. File mới sẽ được gửi kiểm duyệt.</p>{data.profile?.documents?.length ? <div className="mb-4">{data.profile.documents.map((item) => <div className="border-top py-2" key={item.id}><div className="d-flex justify-content-between gap-2"><a href={item.fileUrl} target="_blank" rel="noreferrer">{documentDisplayName(item)}</a><Badge bg={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>{statusLabel[item.status] || item.status}</Badge></div><div className="small text-secondary">{documentTypeLabel[item.documentType] || item.documentType} · {item.originalFileName}</div>{item.rejectionReason && <div className="small text-danger">{item.rejectionReason}</div>}</div>)}</div> : <p className="text-secondary">Chưa có giấy tờ nào.</p>}<Form onSubmit={uploadDocument}><Form.Group className="mb-3"><Form.Label>Loại giấy tờ</Form.Label><Form.Select value={documentForm.documentType} onChange={(event) => setDocumentForm({ ...documentForm, documentType: event.target.value, documentName: '' })}>{Object.entries(documentTypeLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Form.Select></Form.Group>{documentForm.documentType === 'OTHER' && <Form.Group className="mb-3"><Form.Label>Tên giấy tờ khác</Form.Label><Form.Control required value={documentForm.documentName} onChange={(event) => setDocumentForm({ ...documentForm, documentName: event.target.value })} placeholder="Nhập tên giấy tờ" /></Form.Group>}<Form.Group className="mb-3"><Form.Label>File giấy tờ</Form.Label><Form.Control key={documentInputKey} required type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setDocumentForm({ ...documentForm, file: event.target.files[0] || null })} /><Form.Text>Hỗ trợ PDF, JPG, JPEG và PNG.</Form.Text></Form.Group><Button type="submit" className="primary-btn" disabled={!documentForm.file || (documentForm.documentType === 'OTHER' && !documentForm.documentName.trim())}>Tải giấy tờ lên</Button></Form></DataCard></Col></Row>
  } else if (role === 'PARTNER' && section === 'products') {
    content = <Row className="g-4"><Col lg={7}><DataCard title="Sản phẩm của tôi"><Table responsive hover><thead><tr><th>Tên</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th></tr></thead><tbody>{data.products.map((item) => <tr key={item.id}><td>{item.name}</td><td>{formatCurrency(Number(item.price))}</td><td>{item.stock} {item.unit}</td><td><Badge bg={item.approvalStatus === 'APPROVED' ? 'success' : 'warning'}>{statusLabel[item.approvalStatus] || item.approvalStatus}</Badge></td></tr>)}</tbody></Table></DataCard></Col><Col lg={5}><DataCard title="Gửi sản phẩm để duyệt"><Form onSubmit={createProduct}>{[['name','Tên sản phẩm'],['price','Giá bán (VND)'],['unit','Đơn vị'],['description','Mô tả'],['imageUrl','URL hình ảnh'],['certificateNo','Mã chứng nhận']].map(([key,label]) => <Form.Group className="mb-3" key={key}><Form.Label>{label}</Form.Label><Form.Control required={['name','price','unit'].includes(key)} type={key === 'price' ? 'number' : 'text'} min={key === 'price' ? 1 : undefined} value={productForm[key]} onChange={(e) => setProductForm({ ...productForm, [key]: e.target.value })} /></Form.Group>)}<Form.Group className="mb-3"><Form.Label>Danh mục</Form.Label><Form.Select required value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>{data.categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</Form.Select></Form.Group><Button className="primary-btn" type="submit">Gửi duyệt</Button></Form></DataCard></Col></Row>
  } else if (role === 'PARTNER' && section === 'batches') {
    content = <Row className="g-4"><Col lg={7}><DataCard title="Lô hàng & QR"><Table responsive><thead><tr><th>Mã lô</th><th>Sản phẩm</th><th>Truy xuất</th></tr></thead><tbody>{data.batches.map((item) => <tr key={item.id}><td>{item.batchCode}</td><td>{data.products.find((p) => p.id === item.productId)?.name}</td><td><img className="portal-qr" src={`/api/partner/batches/${item.id}/qr`} alt={`QR ${item.batchCode}`} /><Link className="d-block" to={`/trace/${item.traceCode}`}>Xem truy xuất</Link></td></tr>)}</tbody></Table></DataCard></Col><Col lg={5}><DataCard title="Tạo lô hàng"><Form onSubmit={createBatch}><Form.Group className="mb-3"><Form.Label>Sản phẩm đã duyệt</Form.Label><Form.Select required value={batchForm.productId} onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}><option value="">Chọn sản phẩm</option>{data.products.filter((item) => item.approvalStatus === 'APPROVED').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Form.Select></Form.Group>{[['farmName','Trang trại'],['origin','Vùng trồng'],['harvestDate','Ngày thu hoạch'],['packagingDate','Ngày đóng gói'],['expiryDate','Hạn sử dụng'],['quantity','Số lượng'],['certificateNo','Mã chứng nhận']].map(([key,label]) => <Form.Group className="mb-3" key={key}><Form.Label>{label}</Form.Label><Form.Control required={!['expiryDate','certificateNo'].includes(key)} type={key.includes('Date') ? 'date' : key === 'quantity' ? 'number' : 'text'} value={batchForm[key]} onChange={(e) => setBatchForm({ ...batchForm, [key]: e.target.value })} /></Form.Group>)}<Button className="primary-btn" type="submit">Tạo lô</Button></Form></DataCard></Col></Row>
  } else if (role === 'PARTNER' && section === 'orders') {
    content = <DataCard title="Đơn thuộc nhà cung cấp"><Table responsive><thead><tr><th>Mã đơn</th><th>Giá trị</th><th>Trạng thái</th><th></th></tr></thead><tbody>{data.orders.map((order) => <tr key={order.id}><td>{order.orderCode}</td><td>{formatCurrency(Number(order.totalAmount))}</td><td>{statusLabel[order.status] || order.status}</td><td>{nextOrderStatus[order.status] && <Button size="sm" variant="outline-success" onClick={() => run(() => api.put(`/api/partner/orders/${order.id}/status`, { status: nextOrderStatus[order.status] }), `Đã chuyển trạng thái sang ${statusLabel[nextOrderStatus[order.status]]}.`)}>{statusLabel[nextOrderStatus[order.status]]}</Button>}</td></tr>)}</tbody></Table></DataCard>
  } else if (role === 'MANAGER' && section === 'suppliers') {
    content = <DataCard title="Nhà cung cấp chờ duyệt">{data.suppliers.length === 0 && <p>Không có hồ sơ chờ duyệt.</p>}{data.suppliers.map((item) => <div className="d-flex justify-content-between align-items-center border-top py-3" key={item.id}><div><strong>{item.name}</strong><div className="small text-secondary">{item.location} · <a href={item.documentUrl}>Tài liệu</a></div></div><div className="d-flex gap-2"><Button size="sm" variant="outline-danger" onClick={() => run(() => api.put(`/api/manager/suppliers/${item.id}/reject`, { reason: 'Hồ sơ chưa đạt yêu cầu' }), 'Đã từ chối hồ sơ.')}>Từ chối</Button><Button size="sm" variant="success" onClick={() => run(() => api.put(`/api/manager/suppliers/${item.id}/approve`), 'Đã duyệt nhà cung cấp.', true)}>Duyệt</Button></div></div>)}</DataCard>
  } else if (role === 'MANAGER' && (section === 'products' || section === 'certifications')) {
    content = <DataCard title={section === 'products' ? 'Sản phẩm chờ duyệt' : 'Chứng nhận sản phẩm'}>{data.products.length === 0 && <p>Không có sản phẩm chờ duyệt.</p>}{data.products.map((item) => <div className="d-flex justify-content-between align-items-center border-top py-3" key={item.id}><div><strong>{item.name}</strong><div className="small text-secondary">{item.supplierName} · {item.certificateNo || 'Chưa có chứng nhận'}</div></div>{section === 'products' && <div className="d-flex gap-2"><Button size="sm" variant="outline-danger" onClick={() => run(() => api.put(`/api/manager/products/${item.id}/reject`, { reason: 'Sản phẩm chưa đạt yêu cầu' }), 'Đã từ chối sản phẩm.')}>Từ chối</Button><Button size="sm" variant="success" onClick={() => run(() => api.put(`/api/manager/products/${item.id}/approve`), 'Đã duyệt sản phẩm.', true)}>Duyệt</Button></div>}</div>)}</DataCard>
  } else if (role === 'MANAGER' && section === 'orders') {
    content = <DataCard title="Tất cả đơn hàng"><Table responsive><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tạm tính</th><th>Giảm giá</th><th>Phí giao hàng</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead><tbody>{data.orders.map((item) => <tr key={item.id}><td>{item.orderCode}</td><td>{item.fullName}</td><td>{formatCurrency(Number(item.subtotal))}</td><td>{formatCurrency(Number(item.partnerDiscount||0)+Number(item.platformDiscount||0))}</td><td>{formatCurrency(Number(item.shippingFee||0))}<div className="small text-secondary">{item.shippingZone}</div></td><td>{formatCurrency(Number(item.totalAmount))}</td><td>{statusLabel[item.status] || item.status}</td></tr>)}</tbody></Table></DataCard>
  } else if (role === 'MANAGER' && section === 'complaints') {
    content = <DataCard title="Khiếu nại chờ xử lý">{data.complaints.length === 0 && <p>Không có khiếu nại chờ xử lý.</p>}{data.complaints.map((item) => <div className="border-top py-3" key={item.id}><strong>Đơn {item.orderCode}</strong><p>{item.reason}: {item.description}</p><Button size="sm" variant="outline-success" onClick={() => run(() => api.put(`/api/manager/complaints/${item.id}/resolve`, { resolution: 'Đã kiểm tra và xử lý bởi Manager' }), 'Đã xử lý khiếu nại.')}>Đánh dấu đã xử lý</Button></div>)}</DataCard>
  } else if (role === 'MANAGER' && section === 'refunds') {
    content = <DataCard title="Yêu cầu hoàn tiền"><Table responsive><thead><tr><th>Đơn</th><th>Số tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>{data.refunds.map((item) => <tr key={item.id}><td>{item.orderCode}</td><td>{formatCurrency(Number(item.amount))}</td><td>{item.status}</td><td>{item.status !== 'COMPLETED' && <Button size="sm" onClick={() => run(() => api.put(`/api/manager/refunds/${item.id}/manual-complete`, { providerRef: `MANUAL-${Date.now()}`, note: 'Hoàn thủ công bởi Manager' }), 'Đã hoàn tất hoàn tiền.')}>Hoàn tất</Button>}</td></tr>)}</tbody></Table></DataCard>
  } else if (role === 'ADMIN' && section === 'users') {
    content = <DataCard title="Tài khoản hệ thống"><Table responsive><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th></tr></thead><tbody>{data.users.map((item) => <tr key={item.id}><td>{item.fullName}</td><td>{item.email}</td><td><Form.Select size="sm" value={item.role} disabled={item.id === user.id} onChange={(e) => run(() => api.put(`/api/admin/users/${item.id}/role`, { role: e.target.value }), 'Đã đổi vai trò tài khoản.')}>{data.roles.map((roleName) => <option key={roleName}>{roleName}</option>)}</Form.Select></td><td><Button size="sm" disabled={item.id === user.id} variant={item.enabled ? 'outline-success' : 'outline-secondary'} onClick={() => run(() => api.put(`/api/admin/users/${item.id}/status`, { enabled: !item.enabled }), 'Đã cập nhật trạng thái tài khoản.')}>{item.enabled ? 'Đang hoạt động' : 'Đã khóa'}</Button></td></tr>)}</tbody></Table></DataCard>
  } else if (role === 'ADMIN' && section === 'categories') {
    content = <DataCard title="Danh mục"><Form className="d-flex gap-2 mb-3" onSubmit={(event) => { event.preventDefault(); run(() => api.post('/api/admin/categories', { name: newCategory }), 'Đã thêm danh mục.', true); setNewCategory('') }}><Form.Control required value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Tên danh mục mới" /><Button type="submit">Thêm</Button></Form>{data.categories.map((item) => <div className="d-flex justify-content-between border-top py-2" key={item.id}><span>{item.name}</span><Button size="sm" variant={item.active ? 'outline-success' : 'outline-secondary'} onClick={() => run(() => api.put(`/api/admin/categories/${item.id}/status`, { enabled: !item.active }), 'Đã cập nhật danh mục.', true)}>{item.active ? 'Đang dùng' : 'Đã ẩn'}</Button></div>)}</DataCard>
  } else if (role === 'ADMIN' && section === 'audit-logs') {
    content = <DataCard title="Nhật ký thao tác"><Table responsive><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th></tr></thead><tbody>{data.audit.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td><td>{item.actorEmail || 'Hệ thống'}</td><td>{auditAction(item.action)}</td><td>{item.entityType} #{item.entityId}</td></tr>)}</tbody></Table></DataCard>

  } else content = <Alert variant="warning">Không tìm thấy trang trong khu vực này.</Alert>

  return <Container className="py-4 py-md-5"><div className="hero-kicker mb-2">{role}</div><h1 className="section-title">{title[role]}</h1><p className="text-secondary mb-4">Xin chào, {user?.name}. Dữ liệu được đồng bộ với backend.</p>{role === 'PARTNER' ? <PartnerNav active={section} /> : <StaffNav role={role} active={section} />}{notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}{error && <Alert variant="danger">{error}</Alert>}{loading ? <div className="text-center py-5"><Spinner animation="border" variant="success" /></div> : content}</Container>
}
