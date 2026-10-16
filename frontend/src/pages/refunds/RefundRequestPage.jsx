import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { api } from '../../services/apiClient'
import formatCurrency from '../../utils/formatCurrency'
import RefundBankCard from '../../components/refunds/RefundBankCard'

const REASONS = ['Chất lượng sản phẩm (dập nát, héo)', 'Giao thiếu / sai sản phẩm', 'Lý do khác']

// Customer picks a paid order, says why and how much, and staff review the request; approved refunds then ask for a bank account below.
export default function RefundRequestPage() {
  const [eligible, setEligible] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState('')
  const [partId, setPartId] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    try {
      const [orders, complaints] = await Promise.all([api.get('/api/refunds/eligible-orders'), api.get('/api/complaints/my')])
      setEligible(orders || [])
      setRequests((complaints || []).filter((c) => c.requestType === 'REFUND'))
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const order = eligible.find((o) => String(o.orderId) === orderId)
  const part = order?.parts.find((p) => String(p.id) === partId)
  // A refund for one supplier's part cannot exceed that part, nor what is still refundable on the order.
  const max = order ? Math.min(Number(order.refundable), part ? Number(part.amount) : Infinity) : 0

  const pickOrder = (value) => {
    setOrderId(value); setPartId('')
    const picked = eligible.find((o) => String(o.orderId) === value)
    setAmount(picked ? String(Number(picked.refundable)) : '')
  }
  const pickPart = (value) => {
    setPartId(value)
    const picked = order?.parts.find((p) => String(p.id) === value)
    setAmount(String(Math.min(Number(order.refundable), picked ? Number(picked.amount) : Infinity)))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError(''); setNotice('')
    const value = Number(amount)
    if (!(value > 0) || value > max) { setError(`Số tiền đề nghị phải từ 1đ đến ${formatCurrency(max)}`); return }
    setSaving(true)
    try {
      await api.post('/api/complaints', {
        orderId: order.orderId, reason, description, requestType: 'REFUND', requestedAmount: value,
        supplierOrderId: partId ? Number(partId) : null,
      })
      setNotice(`Đã gửi yêu cầu hoàn ${formatCurrency(value)} cho đơn ${order.orderCode}. CleanMarket sẽ xem xét và thông báo cho bạn.`)
      setOrderId(''); setPartId(''); setAmount(''); setDescription('')
      await load()
      setReloadKey((k) => k + 1)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="success" /></Container>

  return (
    <Container className="py-4 py-md-5">
      <h2 className="fw-bold mb-1">Yêu cầu hoàn tiền</h2>
      <p className="text-muted mb-4">Chọn đơn đã thanh toán, nêu lý do và số tiền muốn hoàn. Sau khi được duyệt, bạn gửi số tài khoản để nhận tiền.</p>
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-4">
        <Col lg={7}>
          <Card className="detail-card border-0 p-4 shadow-sm">
            <h5 className="fw-bold mb-3">Tạo yêu cầu</h5>
            {eligible.length === 0 ? (
              <Alert variant="light" className="border mb-0">
                Chưa có đơn nào có thể yêu cầu hoàn tiền. Chỉ đơn đã thanh toán, chưa hoàn hết và không có khiếu nại đang xử lý mới hiện ở đây. <Link to="/orders">Xem đơn hàng</Link>
              </Alert>
            ) : (
              <Form onSubmit={submit} className="d-grid gap-3">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Đơn hàng</Form.Label>
                  <Form.Select required value={orderId} onChange={(e) => pickOrder(e.target.value)}>
                    <option value="">— Chọn đơn hàng —</option>
                    {eligible.map((o) => (
                      <option key={o.orderId} value={o.orderId}>
                        {o.orderCode} · {new Date(o.createdAt).toLocaleDateString('vi-VN')} · đã trả {formatCurrency(Number(o.paidAmount))} · có thể hoàn {formatCurrency(Number(o.refundable))}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {order && order.parts.length > 1 && (
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Nhà cung cấp liên quan</Form.Label>
                    <Form.Select value={partId} onChange={(e) => pickPart(e.target.value)}>
                      <option value="">Cả đơn hàng</option>
                      {order.parts.map((p) => <option key={p.id} value={p.id}>{p.supplierName} · {formatCurrency(Number(p.amount))}</option>)}
                    </Form.Select>
                  </Form.Group>
                )}
                <Form.Group>
                  <Form.Label className="small fw-semibold">Lý do</Form.Label>
                  <Form.Select value={reason} onChange={(e) => setReason(e.target.value)}>
                    {REASONS.map((r) => <option key={r}>{r}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Số tiền đề nghị hoàn (đ)</Form.Label>
                  <Form.Control required type="number" min={1} max={max || undefined} step={1} disabled={!order} value={amount} onChange={(e) => setAmount(e.target.value)} />
                  {order && <Form.Text>Tối đa {formatCurrency(max)}</Form.Text>}
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Mô tả chi tiết</Form.Label>
                  <Form.Control as="textarea" rows={3} required placeholder="Sản phẩm nào, tình trạng ra sao..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </Form.Group>
                <Button type="submit" className="primary-btn" disabled={saving || !order}>
                  {saving ? <Spinner size="sm" /> : 'Gửi yêu cầu hoàn tiền'}
                </Button>
              </Form>
            )}
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="detail-card border-0 p-4 shadow-sm">
            <h5 className="fw-bold mb-3">Yêu cầu đã gửi</h5>
            {requests.length === 0 ? <div className="text-muted small">Bạn chưa gửi yêu cầu hoàn tiền nào.</div> : requests.map((c) => (
              <div key={c.id} className="border rounded-3 p-3 mb-2 small">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Link to={`/orders/${c.orderCode}`} className="fw-bold">{c.orderCode}</Link>
                  <Badge bg={c.status === 'RESOLVED' ? 'success' : 'warning'}>{c.status === 'RESOLVED' ? 'Đã xử lý' : 'Chờ duyệt'}</Badge>
                </div>
                <div>Đề nghị hoàn: <strong>{formatCurrency(Number(c.requestedAmount || 0))}</strong>{c.supplierName && <> · {c.supplierName}</>}</div>
                <div className="text-muted">{c.reason} — {c.description}</div>
                {c.resolution && <div className="text-success mt-1">Phản hồi: {c.resolution}</div>}
              </div>
            ))}
          </Card>
          <RefundBankCard reloadKey={reloadKey} />
        </Col>
      </Row>
    </Container>
  )
}
