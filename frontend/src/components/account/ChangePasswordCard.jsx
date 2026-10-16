import { useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { api } from '../../services/apiClient'

const empty = { currentPassword: '', newPassword: '', confirm: '' }

export default function ChangePasswordCard() {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError(''); setNotice('')
    if (form.newPassword.length < 8) return setError('Mật khẩu mới cần ít nhất 8 ký tự.')
    if (form.newPassword !== form.confirm) return setError('Mật khẩu nhập lại không khớp.')
    setSaving(true)
    try {
      await api.put('/api/users/me/password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm(empty); setNotice('Đổi mật khẩu thành công.')
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <Card className="detail-card border-0 p-4 shadow-sm mt-4">
      <h4 className="fw-bold mb-3 text-dark">Đổi mật khẩu</h4>
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={submit}>
        <Row className="g-2">
          <Col md={4}><Form.Control type="password" required placeholder="Mật khẩu hiện tại" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></Col>
          <Col md={4}><Form.Control type="password" required placeholder="Mật khẩu mới (≥ 8 ký tự)" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></Col>
          <Col md={4}><Form.Control type="password" required placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></Col>
          <Col xs={12}><Button type="submit" variant="outline-success" disabled={saving}>{saving ? 'Đang lưu...' : 'Đổi mật khẩu'}</Button></Col>
        </Row>
      </Form>
    </Card>
  )
}
