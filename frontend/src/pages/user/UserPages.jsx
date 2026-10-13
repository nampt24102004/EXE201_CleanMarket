import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import formatCurrency from '../../utils/formatCurrency'
import { api } from '../../services/apiClient'

const statusLabel = { CREATED: 'Đã tạo', PENDING_PAYMENT: 'Chờ thanh toán', CONFIRMED: 'Đã xác nhận', SHIPPED: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy', PAID: 'Đã thanh toán', PENDING: 'Đang chờ', FAILED: 'Thất bại' }

export function MyOrdersPage({ orders }) {
  return <Container className="py-5"><div className="hero-kicker mb-2">Tài khoản</div><h1 className="section-title mb-4">Đơn hàng của tôi</h1>{orders.length === 0 ? <Alert variant="info">Bạn chưa có đơn hàng. <Link to="/products">Khám phá sản phẩm</Link></Alert> : <Row className="g-3">{orders.map((order) => <Col lg={6} key={order.orderCode}><Card className="detail-card border-0 p-3 h-100"><Card.Body><div className="d-flex justify-content-between"><strong>{order.orderCode}</strong><Badge bg={order.status === 'CANCELLED' ? 'secondary' : 'success'}>{statusLabel[order.status] || order.status}</Badge></div><p className="text-secondary mt-2 mb-2">{new Date(order.createdAt).toLocaleString('vi-VN')}</p><div className="fw-bold mb-3">{formatCurrency(order.totalAmount)}</div><Link to={`/orders/${order.orderCode}`}>Xem chi tiết →</Link></Card.Body></Card></Col>)}</Row>}</Container>
}

export function OrderDetailPage({ orders, onOrdersChanged }) {
  const { orderCode } = useParams()
  const navigate = useNavigate()
  const order = orders.find((item) => item.orderCode === orderCode)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewItemId, setReviewItemId] = useState('')
  const [reason, setReason] = useState('Chất lượng sản phẩm')
  const [description, setDescription] = useState('')
  const [reviews, setReviews] = useState([])
  const [complaints, setComplaints] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const deliveredItems = order?.supplierOrders?.filter((part) => part.status === 'DELIVERED').flatMap((part) => part.items) || []
  const selectedReviewItemId = reviewItemId || String(deliveredItems[0]?.id || '')

  useEffect(() => {
    if (!order) return
    const productIds = [...new Set(order.items.map((item) => item.product.id))]
    Promise.all([Promise.all(productIds.map((id) => api.get(`/api/products/${id}/reviews`))), api.get('/api/complaints/my')])
      .then(([reviewGroups, complaintData]) => {
        setReviews(reviewGroups.flat())
        setComplaints(complaintData.filter((item) => item.orderCode === orderCode))
      })
      .catch((caught) => setError(caught.message))
  }, [order, orderCode])

  if (!order) return <Container className="py-5"><Alert variant="danger">Không tìm thấy đơn hàng của bạn.</Alert></Container>
  const supplierGroups = Object.groupBy ? Object.groupBy(order.items, (item) => item.product.supplierName || 'Nhà cung cấp') : order.items.reduce((groups, item) => ({ ...groups, [item.product.supplierName || 'Nhà cung cấp']: [...(groups[item.product.supplierName || 'Nhà cung cấp'] || []), item] }), {})

  const submitReview = async (event) => {
    event.preventDefault(); setError(''); setNotice('')
    try {
      const created = await api.post('/api/reviews', { orderItemId: Number(selectedReviewItemId), rating: Number(rating), comment })
      setReviews((current) => [...current, created]); setComment(''); setNotice('Đã lưu đánh giá vào hệ thống.')
    } catch (caught) { setError(caught.message) }
  }
  const submitComplaint = async (event) => {
    event.preventDefault(); setError(''); setNotice('')
    try {
      const created = await api.post('/api/complaints', { orderId: order.id, reason, description })
      setComplaints((current) => [created, ...current]); setDescription(''); setNotice('Đã gửi khiếu nại tới Manager.')
    } catch (caught) { setError(caught.message) }
  }
  const cancelOrder = async () => {
    try { await api.post(`/api/orders/${order.id}/cancel`); await onOrdersChanged(); setNotice('Đã hủy đơn hàng.') } catch (caught) { setError(caught.message) }
  }

  return <Container className="py-5"><Link to="/orders">← Đơn hàng của tôi</Link><div className="d-flex justify-content-between align-items-center mt-3"><h1 className="section-title mb-0">Đơn {orderCode}</h1><div className="d-flex gap-2">{order.status === 'PENDING_PAYMENT' && order.paymentMethod === 'payos' && <Button className="primary-btn" onClick={() => navigate(`/payment/payos?orderId=${order.id}`)}>Thanh toán ngay</Button>}{['CREATED', 'PENDING_PAYMENT'].includes(order.status) && <Button variant="outline-danger" onClick={cancelOrder}>Hủy đơn</Button>}</div></div><p className="text-secondary">Đặt ngày {new Date(order.createdAt).toLocaleString('vi-VN')} · {statusLabel[order.status] || order.status}</p>{notice && <Alert variant="success">{notice}</Alert>}{error && <Alert variant="danger">{error}</Alert>}<Row className="g-4"><Col lg={7}><Card className="detail-card border-0 p-3"><Card.Body><h2 className="h4 mb-3">Sản phẩm theo nhà cung cấp</h2>{Object.entries(supplierGroups).map(([supplier, items]) => <div key={supplier} className="mb-4"><h3 className="h6 text-success">{supplier}</h3><Table><tbody>{items.map((item) => <tr key={item.id}><td>{item.product.name}</td><td>{item.quantity} {item.product.unit}</td><td className="text-end">{formatCurrency(item.totalAmount || item.product.price * item.quantity)}</td></tr>)}</tbody></Table></div>)}<div className="fw-bold text-end">Tổng cộng: {formatCurrency(order.totalAmount)}</div></Card.Body></Card></Col><Col lg={5}><Card className="detail-card border-0 p-3 mb-4"><Card.Body><h2 className="h4">Giao hàng & thanh toán</h2><p className="mb-1">{order.customerInfo.fullName} · {order.customerInfo.phone}</p><p>{order.customerInfo.address}</p><Badge bg={order.paymentMethod === 'cod' ? 'secondary' : 'warning'}>{order.paymentMethod === 'cod' ? 'COD' : 'payOS / VietQR'}</Badge></Card.Body></Card><Card className="detail-card border-0 p-3"><Card.Body><h2 className="h4">Gửi khiếu nại</h2><Form onSubmit={submitComplaint}><Form.Select className="mb-2" value={reason} onChange={(e) => setReason(e.target.value)}><option>Chất lượng sản phẩm</option><option>Giao hàng</option><option>Thanh toán</option></Form.Select><Form.Control as="textarea" required rows={3} className="mb-2" placeholder="Mô tả vấn đề" value={description} onChange={(e) => setDescription(e.target.value)} /><Button type="submit" variant="outline-success">Gửi khiếu nại</Button></Form>{complaints.map((item) => <div className="small mt-3" key={item.id}><Badge bg={item.status === 'RESOLVED' ? 'success' : 'warning'}>{item.status}</Badge> {item.reason}</div>)}</Card.Body></Card></Col></Row><Card className="detail-card border-0 p-3 mt-4"><Card.Body><h2 className="h4">Đánh giá sản phẩm đã giao</h2>{deliveredItems.length ? <Form onSubmit={submitReview}><Form.Label>Sản phẩm</Form.Label><Form.Select required value={selectedReviewItemId} onChange={(e) => setReviewItemId(e.target.value)} className="mb-2">{deliveredItems.map((item) => <option key={item.id} value={item.id}>{item.productName}</option>)}</Form.Select><Form.Label>Số sao</Form.Label><Form.Select value={rating} onChange={(e) => setRating(e.target.value)} className="mb-2">{[5,4,3,2,1].map((item) => <option key={item} value={item}>{item} sao</option>)}</Form.Select><Form.Control as="textarea" required rows={2} className="mb-2" placeholder="Chia sẻ trải nghiệm của bạn" value={comment} onChange={(e) => setComment(e.target.value)} /><Button className="primary-btn" type="submit">Gửi đánh giá</Button></Form> : <Alert variant="light">Bạn có thể đánh giá khi phần đơn đã được giao.</Alert>}{reviews.map((item) => <p className="mt-3 mb-0" key={item.id}>★ {item.rating}/5 · {item.comment} · {item.author}</p>)}</Card.Body></Card></Container>
}

export function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api.get('/api/users/me').then((data) => { setProfile(data); setFullName(data.fullName) }).catch((caught) => setError(caught.message)) }, [])
  const save = async (event) => { event.preventDefault(); try { const data = await api.put('/api/users/me', { fullName }); setProfile(data); setNotice('Đã cập nhật hồ sơ.') } catch (caught) { setError(caught.message) } }
  if (!profile && !error) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>
  return <Container className="py-5"><h1 className="section-title mb-4">Hồ sơ của tôi</h1>{notice && <Alert variant="success">{notice}</Alert>}{error && <Alert variant="danger">{error}</Alert>}{profile && <Card className="detail-card border-0 p-4"><Form onSubmit={save}><Form.Group className="mb-3"><Form.Label>Họ tên</Form.Label><Form.Control value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Form.Group><div className="mb-3"><strong>Email:</strong> {profile.email}</div><Button className="primary-btn" type="submit">Lưu thay đổi</Button></Form></Card>}</Container>
}

export function PaymentResultPage({ orders }) {
  const [params] = useSearchParams()
  const orderCode = params.get('orderCode')
  const order = orders.find((item) => item.orderCode === orderCode)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { if (orderCode) api.get(`/api/orders/${encodeURIComponent(orderCode)}/payment-status`).then(setPayment).catch((caught) => setError(caught.message)) }, [orderCode])
  return <Container className="py-5"><Card className="detail-card border-0 p-4"><h1 className="section-title">Trạng thái thanh toán</h1>{error && <Alert variant="warning">{error}</Alert>}{payment ? <><Alert variant={payment.status === 'PAID' ? 'success' : 'warning'}>{statusLabel[payment.status] || payment.status}</Alert><p>Đơn hàng: <strong>{payment.orderCode}</strong></p><p>Số tiền: <strong>{formatCurrency(Number(payment.amount))}</strong></p></> : !error && <Spinner animation="border" />}{order && <Link to={`/orders/${order.orderCode}`}>Xem đơn hàng</Link>}</Card></Container>
}
