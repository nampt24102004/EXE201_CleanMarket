import { useEffect, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Container, Spinner, Stack } from 'react-bootstrap'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../services/apiClient'
import formatCurrency from '../../utils/formatCurrency'

const terminalStatuses = new Set(['PAID', 'FAILED', 'CANCELLED'])

export default function PayOSPaymentPage({ returnMode = false }) {
  const location = useLocation()
  const [params] = useSearchParams()
  const orderId = Number(params.get('orderId'))
  const [payment, setPayment] = useState(location.state?.payment || null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const startedAt = useRef(null)

  useEffect(() => {
    if (!orderId || returnMode || payment) return
    api.post('/api/payments/payos/create', { orderId }).then(setPayment).catch((caught) => setError(caught.message))
  }, [orderId, payment, returnMode])

  useEffect(() => {
    if (!orderId) return undefined
    if (startedAt.current === null) startedAt.current = Date.now()
    let active = true
    let timer
    const poll = async () => {
      try {
        const next = await api.get(`/api/payments/order/${orderId}/status`)
        if (!active) return
        setStatus(next)
        setError('')
        if (!terminalStatuses.has(next.paymentStatus) && Date.now() - startedAt.current < 15 * 60 * 1000) timer = window.setTimeout(poll, 2500)
      } catch (caught) {
        if (!active) return
        setError(caught.message)
        if (Date.now() - startedAt.current < 15 * 60 * 1000) timer = window.setTimeout(poll, 2500)
      }
    }
    poll()
    return () => { active = false; if (timer) window.clearTimeout(timer) }
  }, [orderId])

  if (!orderId) return <Container className="py-5"><Alert variant="danger">Thiếu mã đơn hàng để kiểm tra thanh toán.</Alert></Container>
  const paid = status?.paymentStatus === 'PAID'
  const failed = ['FAILED', 'CANCELLED'].includes(status?.paymentStatus)
  const heading = paid ? 'Thanh toán thành công' : failed ? 'Thanh toán chưa hoàn tất' : 'Đang chờ thanh toán...'

  return <Container className="py-5"><Card className="detail-card border-0 p-3 p-md-5 mx-auto" style={{ maxWidth: 760 }}><Stack gap={4}>
    <div className="text-center"><div className={paid ? 'success-icon mx-auto mb-3' : 'hero-kicker mb-2'}>{paid ? '✓' : 'CleanMarket'}</div><h1 className="section-title">{heading}</h1>{!paid && !failed && <p className="text-secondary">Hệ thống tự kiểm tra trạng thái mỗi 2,5 giây. Chỉ webhook payOS đã xác minh mới xác nhận thành công.</p>}</div>
    {error && <Alert variant="warning">{error}</Alert>}
    {status && <div className="soft-panel p-4"><div className="d-flex justify-content-between mb-2"><span>Mã đơn</span><strong>{status.orderCode}</strong></div><div className="d-flex justify-content-between mb-2"><span>Tổng tiền</span><strong>{formatCurrency(Number(status.amount))}</strong></div><div className="d-flex justify-content-between"><span>Trạng thái</span><Badge bg={paid ? 'success' : failed ? 'danger' : 'warning'}>{status.paymentStatus}</Badge></div></div>}
    {!returnMode && !paid && !failed && payment?.qrCode && <div className="qr-panel text-center"><QRCodeSVG value={payment.qrCode} size={240} level="M" includeMargin /><p className="mt-3 mb-0 text-secondary">Quét mã bằng ứng dụng ngân hàng hỗ trợ VietQR</p></div>}
    {!returnMode && !paid && !failed && payment?.checkoutUrl && <Button as="a" href={payment.checkoutUrl} target="_blank" rel="noreferrer" className="primary-btn py-3">Mở trang thanh toán payOS</Button>}
    {!payment && !status && !error && <div className="text-center"><Spinner animation="border" variant="success" /></div>}
    {returnMode && !paid && !failed && <Alert variant="info">payOS đã chuyển bạn về website. CleanMarket đang chờ webhook ngân hàng xác nhận giao dịch.</Alert>}
    {failed && <Button as={Link} to={`/payment/payos?orderId=${orderId}`} variant="outline-success">Thử thanh toán lại</Button>}
    <div className="text-center"><Link to={status?.orderCode ? `/orders/${status.orderCode}` : '/orders'}>Xem đơn hàng của tôi</Link></div>
  </Stack></Card></Container>
}