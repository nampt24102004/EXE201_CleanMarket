import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Badge,
  Form,
  Spinner,
  Alert,
  Modal,
} from 'react-bootstrap'
import {
  Store,
  PackageCheck,
  Check,
  X,
  FileText,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

const orderStatusBadge = {
  CREATED: 'info',
  CONFIRMED: 'primary',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'secondary',
}

const statusLabel = {
  CREATED: 'Mới tạo',
  CONFIRMED: 'Đã xác nhận',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
}

export default function AdminOperationsView({ subSection = 'suppliers', onCatalogChanged }) {
  // Same view serves /manager and /admin; detail pages live under whichever area is open.
  const base = useLocation().pathname.startsWith('/admin') ? '/admin' : '/manager'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [complaints, setComplaints] = useState([])
  const [refunds, setRefunds] = useState([])

  // Rejection modal
  const [rejectItem, setRejectItem] = useState(null)
  const [rejectType, setRejectType] = useState('supplier') // 'supplier' or 'product'
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (subSection === 'suppliers') {
        const data = await api.get('/api/manager/suppliers/pending')
        setSuppliers(data || [])
      } else if (subSection === 'products') {
        const data = await api.get('/api/manager/products')
        setProducts(data || [])
      } else if (subSection === 'orders') {
        const page = await api.get('/api/manager/orders?size=100')
        setOrders(page?.items || [])
      } else if (subSection === 'complaints') {
        const data = await api.get('/api/manager/complaints')
        setComplaints(data || [])
      } else if (subSection === 'refunds') {
        const data = await api.get('/api/manager/refunds')
        setRefunds(data || [])
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu vận hành.')
    } finally {
      setLoading(false)
    }
  }, [subSection])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const handleApproveSupplier = async (id) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/manager/suppliers/${id}/approve`)
      setNotice('Đã phê duyệt nhà cung cấp đối tác thành công!')
      await loadData()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi duyệt: ${err.message}`)
    }
  }

  const handleApproveProduct = async (id) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/manager/products/${id}/approve`)
      setNotice('Đã phê duyệt nông sản lên sàn CleanMarket!')
      await loadData()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi duyệt: ${err.message}`)
    }
  }

  const handleConfirmReject = async (e) => {
    e.preventDefault()
    if (!rejectItem || !rejectReason.trim()) return
    setProcessing(true)
    setError('')
    setNotice('')
    try {
      if (rejectType === 'supplier') {
        await api.put(`/api/manager/suppliers/${rejectItem.id}/reject`, {
          reason: rejectReason.trim(),
        })
        setNotice(`Đã từ chối hồ sơ đối tác "${rejectItem.name}".`)
      } else {
        await api.put(`/api/manager/products/${rejectItem.id}/reject`, {
          reason: rejectReason.trim(),
        })
        setNotice(`Đã từ chối nông sản "${rejectItem.name}".`)
      }
      setRejectItem(null)
      setRejectReason('')
      await loadData()
      await onCatalogChanged?.()
    } catch (err) {
      setError(`Lỗi từ chối: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleResolveComplaint = async (id) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/manager/complaints/${id}/resolve`, {
        resolution: 'Đã giải quyết và phản hồi khách hàng bởi Admin',
      })
      setNotice('Đã đánh dấu xử lý khiếu nại thành công!')
      await loadData()
    } catch (err) {
      setError(`Lỗi xử lý khiếu nại: ${err.message}`)
    }
  }

  const handleCompleteRefund = async (id) => {
    setError('')
    setNotice('')
    try {
      const refundRef = 'ADMIN-REFUND-' + String(new Date().getTime())
      await api.put(`/api/manager/refunds/${id}/manual-complete`, {
        providerRef: refundRef,
        note: 'Đã hoàn tất hoàn tiền cho khách bởi Admin',
      })
      setNotice('Đã xác nhận hoàn tiền thành công!')
      await loadData()
    } catch (err) {
      setError(`Lỗi hoàn tiền: ${err.message}`)
    }
  }

  return (
    <div className="admin-operations-view">
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

      {/* SUBSECTION: SUPPLIERS */}
      {subSection === 'suppliers' && (
        <div className="admin-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Duyệt hồ sơ nhà cung cấp nông sản</h5>
              <p className="text-secondary small mb-0">
                Các hồ sơ nông trại đăng ký mở gian hàng đối tác đang chờ duyệt
              </p>
            </div>
            <Badge bg="warning" pill className="px-3 py-2 text-dark">
              {suppliers.length} hồ sơ chờ
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <Store size={40} className="mb-2 opacity-50" />
              <p className="mb-0">Hiện không có hồ sơ nhà vườn nào đang chờ duyệt.</p>
            </div>
          ) : (
            <Table responsive className="admin-table">
              <thead>
                <tr>
                  <th>Tên nhà cung cấp</th>
                  <th>Địa chỉ / Vùng trồng</th>
                  <th>Tài liệu pháp lý</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`${base}/suppliers/${item.id}`} className="text-decoration-none">
                        <strong className="text-dark fs-6">{item.name}</strong>
                      </Link>
                    </td>
                    <td className="small text-secondary">{item.location}</td>
                    <td>
                      {item.documentUrl ? (
                        <a
                          href={item.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                        >
                          <FileText size={13} />
                          <span>Xem giấy tờ</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-secondary small">Chưa có tài liệu</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          className="d-flex align-items-center gap-1 px-3 py-1"
                          onClick={() => handleApproveSupplier(item.id)}
                        >
                          <Check size={14} />
                          <span>Duyệt</span>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center gap-1 px-3 py-1"
                          onClick={() => {
                            setRejectItem(item)
                            setRejectType('supplier')
                            setRejectReason('Hồ sơ giấy tờ chưa đạt tiêu chuẩn VietGAP/GlobalGAP')
                          }}
                        >
                          <X size={14} />
                          <span>Từ chối</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {/* SUBSECTION: PRODUCTS */}
      {subSection === 'products' && (
        <div className="admin-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Duyệt sản phẩm nông sản đối tác</h5>
              <p className="text-secondary small mb-0">
                Kiểm định nguồn gốc và mã chứng nhận VietGAP trước khi đăng bán
              </p>
            </div>
            <Badge bg="primary" pill className="px-3 py-2">
              {products.length} sản phẩm
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <PackageCheck size={40} className="mb-2 opacity-50" />
              <p className="mb-0">Không có nông sản nào đang chờ duyệt.</p>
            </div>
          ) : (
            <Table responsive className="admin-table">
              <thead>
                <tr>
                  <th>Nông sản</th>
                  <th>Nhà vườn</th>
                  <th>Mã chứng nhận</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`${base}/products/${item.id}`} className="text-decoration-none">
                        <strong className="text-dark fs-6">{item.name}</strong>
                      </Link>
                    </td>
                    <td className="small text-secondary">{item.supplierName}</td>
                    <td>
                      <Badge bg="light" text="dark" className="border px-2 py-1">
                        {item.certificateNo || 'Chưa cung cấp'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Link
                          to={`${base}/products/${item.id}`}
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 py-1"
                        >
                          <Eye size={14} />
                          <span>Xem chi tiết</span>
                        </Link>
                        <Button
                          variant="success"
                          size="sm"
                          className="d-flex align-items-center gap-1 px-3 py-1"
                          onClick={() => handleApproveProduct(item.id)}
                        >
                          <Check size={14} />
                          <span>Duyệt</span>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center gap-1 px-3 py-1"
                          onClick={() => {
                            setRejectItem(item)
                            setRejectType('product')
                            setRejectReason('Thông tin sản phẩm hoặc mã chứng nhận chưa hợp lệ')
                          }}
                        >
                          <X size={14} />
                          <span>Từ chối</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {/* SUBSECTION: ORDERS */}
      {subSection === 'orders' && (
        <div className="admin-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Quản lý toàn bộ đơn hàng sàn</h5>
              <p className="text-secondary small mb-0">Theo dõi doanh số và luồng xử lý đơn hàng</p>
            </div>
            <Badge bg="success" pill className="px-3 py-2">
              {orders.length} đơn gần nhất
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5 text-secondary">Chưa có đơn hàng nào.</div>
          ) : (
            <Table responsive className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tạm tính</th>
                  <th>Giảm giá</th>
                  <th>Phí ship</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((item) => (
                  <tr key={item.id}>
                    <td><strong className="text-dark">{item.orderCode}</strong></td>
                    <td>{item.fullName}</td>
                    <td>{formatCurrency(Number(item.subtotal))}</td>
                    <td className="text-danger">
                      {formatCurrency(Number(item.partnerDiscount || 0) + Number(item.platformDiscount || 0))}
                    </td>
                    <td>
                      {formatCurrency(Number(item.shippingFee || 0))}
                      <div className="small text-secondary">{item.shippingZone}</div>
                    </td>
                    <td className="fw-bold text-success">{formatCurrency(Number(item.totalAmount))}</td>
                    <td>
                      <Badge bg={orderStatusBadge[item.status] || 'secondary'} className="px-2 py-1">
                        {statusLabel[item.status] || item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {/* SUBSECTION: COMPLAINTS */}
      {subSection === 'complaints' && (
        <div className="admin-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Khiếu nại khách hàng</h5>
              <p className="text-secondary small mb-0">Xử lý các phản hồi và tranh chấp đơn hàng</p>
            </div>
            <Badge bg="warning" pill className="px-3 py-2 text-dark">
              {complaints.length} khiếu nại
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5 text-secondary">Không có khiếu nại nào cần xử lý.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {complaints.map((item) => (
                <div key={item.id} className="p-3 border rounded-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-dark">Đơn hàng #{item.orderCode}</strong>
                    <Badge bg="warning" text="dark">{item.reason}</Badge>
                  </div>
                  <p className="text-secondary small mb-3">{item.description}</p>
                  <Button
                    variant="success"
                    size="sm"
                    className="d-flex align-items-center gap-1"
                    onClick={() => handleResolveComplaint(item.id)}
                  >
                    <Check size={14} />
                    <span>Đánh dấu đã giải quyết</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBSECTION: REFUNDS */}
      {subSection === 'refunds' && (
        <div className="admin-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Yêu cầu hoàn tiền</h5>
              <p className="text-secondary small mb-0">Hoàn tiền thủ công cho các đơn có vấn đề</p>
            </div>
            <Badge bg="danger" pill className="px-3 py-2">
              {refunds.length} yêu cầu
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-5 text-secondary">Không có yêu cầu hoàn tiền nào.</div>
          ) : (
            <Table responsive className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Số tiền hoàn</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((item) => (
                  <tr key={item.id}>
                    <td><strong className="text-dark">{item.orderCode}</strong></td>
                    <td className="fw-bold text-danger">{formatCurrency(Number(item.amount))}</td>
                    <td><Badge bg="warning" text="dark">{item.status}</Badge></td>
                    <td>
                      {item.status !== 'COMPLETED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCompleteRefund(item.id)}
                        >
                          Xác nhận hoàn tất hoàn tiền
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      <Modal show={Boolean(rejectItem)} onHide={() => setRejectItem(null)} centered>
        <Form onSubmit={handleConfirmReject}>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Từ chối phê duyệt</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small text-secondary mb-3">
              Bạn đang từ chối {rejectType === 'supplier' ? 'hồ sơ nhà vườn' : 'nông sản'}:{' '}
              <strong className="text-dark">{rejectItem?.name}</strong>. Vui lòng nêu rõ lý do:
            </p>
            <Form.Group>
              <Form.Label className="small fw-bold">Lý do từ chối *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setRejectItem(null)}>
              Hủy
            </Button>
            <Button variant="danger" size="sm" type="submit" disabled={processing || !rejectReason.trim()}>
              {processing ? <Spinner animation="border" size="sm" /> : 'Xác nhận từ chối'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
