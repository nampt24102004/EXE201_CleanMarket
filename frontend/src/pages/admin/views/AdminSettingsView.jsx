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
import { Sliders, Edit, CheckCircle2, AlertTriangle, Key } from 'lucide-react'
import { api } from '../../../services/apiClient'

export default function AdminSettingsView() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Edit Modal
  const [editSetting, setEditSetting] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/admin/settings')
      setSettings(data || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải cấu hình hệ thống.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadSettings)
  }, [loadSettings])

  const handleSaveSetting = async (e) => {
    e.preventDefault()
    if (!editSetting) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await api.put(`/api/admin/settings/${editSetting.key}`, {
        value: editValue,
        description: editDesc,
      })
      setNotice(`Đã cập nhật tham số cấu hình "${editSetting.key}" thành công!`)
      setEditSetting(null)
      await loadSettings()
    } catch (err) {
      setError(`Lỗi lưu cấu hình: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-settings-view">
      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice('')}>
          <CheckCircle2 size={16} className="me-2 inline-block text-success" />
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <AlertTriangle size={16} className="me-2 inline-block text-danger" />
          {error}
        </Alert>
      )}

      <div className="admin-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Cấu hình hệ thống CleanMarket</h5>
            <p className="text-secondary small mb-0">
              Quản lý các tham số vận hành, thời gian hết hạn đơn, hạn ngạch và thông số kỹ thuật
            </p>
          </div>
          <Badge bg="purple" pill className="px-3 py-2 text-white bg-dark">
            {settings.length} tham số
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Sliders size={40} className="mb-2 opacity-50" />
            <p className="mb-0">Hệ thống đang sử dụng cấu hình mặc định (chưa có ghi đè tham số).</p>
          </div>
        ) : (
          <Table responsive className="admin-table">
            <thead>
              <tr>
                <th>Khóa tham số (Key)</th>
                <th>Giá trị hiện tại (Value)</th>
                <th>Mô tả chức năng</th>
                <th>Cập nhật lần cuối</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((item) => (
                <tr key={item.key}>
                  <td>
                    <div className="d-flex align-items-center gap-1 font-monospace fw-bold text-dark">
                      <Key size={14} className="text-secondary" />
                      <span>{item.key}</span>
                    </div>
                  </td>
                  <td>
                    <code className="text-success fw-bold px-2 py-1 bg-light rounded">
                      {item.value}
                    </code>
                  </td>
                  <td className="small text-secondary">{item.description || 'Chưa có mô tả'}</td>
                  <td className="small text-secondary">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : 'Mặc định'}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="d-flex align-items-center gap-1 px-2 py-1"
                      onClick={() => {
                        setEditSetting(item)
                        setEditValue(item.value || '')
                        setEditDesc(item.description || '')
                      }}
                    >
                      <Edit size={13} />
                      <span>Chỉnh sửa</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Edit Setting Modal */}
      <Modal show={Boolean(editSetting)} onHide={() => setEditSetting(null)} centered>
        <Form onSubmit={handleSaveSetting}>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">
              Chỉnh sửa tham số: <span className="text-primary">{editSetting?.key}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small fw-bold">Giá trị mới (Value) *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                required
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold">Mô tả tham số</Form.Label>
              <Form.Control
                placeholder="Mô tả ý nghĩa của tham số này..."
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setEditSetting(null)}>
              Hủy
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" /> : 'Lưu cấu hình'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
