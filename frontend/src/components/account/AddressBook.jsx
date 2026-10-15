import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import { api } from '../../services/apiClient'

const empty = { recipientName: '', phone: '', addressLine: '', defaultAddress: false }

// Saved delivery addresses; the default one is prefilled at checkout.
export default function AddressBook() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try { setItems(await api.get('/api/users/me/addresses')) } catch (e) { setError(e.message); setItems([]) }
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      if (editId) await api.put(`/api/users/me/addresses/${editId}`, form)
      else await api.post('/api/users/me/addresses', form)
      setForm(empty); setEditId(null); await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  const remove = async (item) => {
    if (!window.confirm(`Xóa địa chỉ của ${item.recipientName}?`)) return
    try { await api.delete(`/api/users/me/addresses/${item.id}`); await load() } catch (e) { setError(e.message) }
  }
  const makeDefault = async (item) => {
    try { await api.put(`/api/users/me/addresses/${item.id}`, { ...item, defaultAddress: true }); await load() } catch (e) { setError(e.message) }
  }

  return (
    <Card className="detail-card border-0 p-4 shadow-sm mt-4">
      <h4 className="fw-bold mb-3 text-dark">Sổ địa chỉ nhận hàng</h4>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {items === null ? <Spinner size="sm" /> : items.length === 0 ? (
        <p className="text-secondary small">Chưa có địa chỉ nào. Địa chỉ mặc định sẽ được tự điền khi thanh toán.</p>
      ) : (
        <div className="d-grid gap-2 mb-3">
          {items.map((a) => (
            <div key={a.id} className="border rounded-3 p-3 d-flex justify-content-between align-items-start gap-2">
              <div>
                <div className="fw-semibold">{a.recipientName} · {a.phone} {a.defaultAddress && <Badge bg="success" className="ms-1">Mặc định</Badge>}</div>
                <div className="small text-secondary">{a.addressLine}</div>
              </div>
              <div className="d-flex gap-1 flex-wrap justify-content-end">
                {!a.defaultAddress && <Button size="sm" variant="outline-success" onClick={() => makeDefault(a)}>Đặt mặc định</Button>}
                <Button size="sm" variant="outline-secondary" onClick={() => { setEditId(a.id); setForm({ recipientName: a.recipientName, phone: a.phone, addressLine: a.addressLine, defaultAddress: a.defaultAddress }) }}>Sửa</Button>
                <Button size="sm" variant="outline-danger" onClick={() => remove(a)}>Xóa</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Form onSubmit={save}>
        <Row className="g-2">
          <Col md={6}><Form.Control required placeholder="Tên người nhận" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} /></Col>
          <Col md={6}><Form.Control required placeholder="Số điện thoại (10 số)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Col>
          <Col xs={12}><Form.Control required as="textarea" rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></Col>
          <Col xs={12} className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <Form.Check label="Đặt làm địa chỉ mặc định" checked={form.defaultAddress} onChange={(e) => setForm({ ...form, defaultAddress: e.target.checked })} />
            <div className="d-flex gap-2">
              {editId && <Button variant="link" onClick={() => { setEditId(null); setForm(empty) }}>Hủy sửa</Button>}
              <Button type="submit" className="primary-btn" disabled={saving}>{editId ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}</Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Card>
  )
}
