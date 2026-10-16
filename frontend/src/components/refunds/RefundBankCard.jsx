import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Form } from 'react-bootstrap'
import { api } from '../../services/apiClient'
import formatCurrency from '../../utils/formatCurrency'
import { refundStatus } from '../../utils/refundStatus'

const empty = { bankName: '', accountNumber: '', accountHolder: '' }

// The customer's refunds (one order's when orderCode is given), with the form to send the receiving bank account.
export default function RefundBankCard({ orderCode, reloadKey = 0 }) {
  const [refunds, setRefunds] = useState([])
  const [forms, setForms] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async () => {
    try {
      const mine = (await api.get('/api/refunds/my')).filter((r) => !orderCode || r.orderCode === orderCode)
      setRefunds(mine)
      setForms(Object.fromEntries(mine.map((r) => [r.id, { bankName: r.bankName || '', accountNumber: r.bankAccountNumber || '', accountHolder: r.bankAccountHolder || '' }])))
    } catch { /* No refunds or not a customer: nothing to show. */ }
  }, [orderCode])
  useEffect(() => { void Promise.resolve().then(load) }, [load, reloadKey])

  if (!refunds.length) return null

  const submit = async (event, refund) => {
    event.preventDefault()
    setSavingId(refund.id); setError(''); setNotice('')
    try {
      await api.put(`/api/refunds/${refund.id}/bank-info`, forms[refund.id] || empty)
      setNotice('Đã gửi thông tin tài khoản. CleanMarket sẽ kiểm tra và chuyển tiền cho bạn.')
      await load()
    } catch (e) { setError(e.message) } finally { setSavingId(null) }
  }
  const setField = (id, key, value) => setForms((current) => ({ ...current, [id]: { ...(current[id] || empty), [key]: value } }))

  return (
    <Card className="detail-card border-0 p-4 shadow-sm mt-4">
      <h5 className="fw-bold mb-3 text-dark">Hoàn tiền</h5>
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      {refunds.map((r) => {
        const [label, color] = r.status === 'REQUESTED' ? ['Chờ bạn gửi số tài khoản', 'warning'] : refundStatus[r.status] || [r.status, 'secondary']
        const editable = ['REQUESTED', 'BANK_INFO_SUBMITTED'].includes(r.status)
        const form = forms[r.id] || empty
        return (
          <div key={r.id} className="border rounded-3 p-3 mb-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>{formatCurrency(Number(r.amount))}{!orderCode && <span className="text-muted fw-normal small ms-2">Đơn {r.orderCode}</span>}</strong>
              <Badge bg={color}>{label}</Badge>
            </div>
            {r.bankReviewNote && r.status === 'REQUESTED' && <Alert variant="warning" className="py-2 small">Tài khoản trước chưa hợp lệ: {r.bankReviewNote}</Alert>}
            {r.status === 'MANUAL_COMPLETED' && <div className="small text-success">Đã chuyển vào {r.bankName} ••••{r.bankAccountNumber?.slice(-4)} · Mã giao dịch {r.providerRef}</div>}
            {r.status === 'APPROVED' && <div className="small text-secondary">Sẽ chuyển vào {r.bankName} ••••{r.bankAccountNumber?.slice(-4)} ({r.bankAccountHolder}).</div>}
            {editable && (
              <Form onSubmit={(e) => submit(e, r)} className="d-grid gap-2 small">
                <Form.Control required placeholder="Tên ngân hàng (VD: Vietcombank)" value={form.bankName} onChange={(e) => setField(r.id, 'bankName', e.target.value)} />
                <Form.Control required inputMode="numeric" placeholder="Số tài khoản" value={form.accountNumber} onChange={(e) => setField(r.id, 'accountNumber', e.target.value.replace(/\D/g, ''))} />
                <Form.Control required placeholder="Tên chủ tài khoản (không dấu)" value={form.accountHolder} onChange={(e) => setField(r.id, 'accountHolder', e.target.value)} />
                <Button type="submit" className="primary-btn" disabled={savingId === r.id}>
                  {r.status === 'BANK_INFO_SUBMITTED' ? 'Cập nhật số tài khoản' : 'Gửi số tài khoản nhận tiền'}
                </Button>
              </Form>
            )}
          </div>
        )
      })}
    </Card>
  )
}
