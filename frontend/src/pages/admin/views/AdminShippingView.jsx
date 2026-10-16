import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Table, Button, Badge, Form, Spinner, Alert, Modal } from 'react-bootstrap'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'
import { api } from '../../../services/apiClient'
import formatCurrency from '../../../utils/formatCurrency'

const emptyZone = { zoneCode: '', zoneName: '', addressKeywords: '', shippingFee: '', freeShippingThreshold: '', active: true }

// The API takes numbers; an empty threshold means the zone never ships for free.
const toRequest = (zone) => ({
  zoneCode: zone.zoneCode.trim(),
  zoneName: zone.zoneName.trim(),
  addressKeywords: zone.addressKeywords.trim(),
  shippingFee: Number(zone.shippingFee),
  freeShippingThreshold: zone.freeShippingThreshold === '' || zone.freeShippingThreshold == null ? null : Number(zone.freeShippingThreshold),
  active: zone.active,
})

function ZoneFields({ zone, onChange, lockCode }) {
  const set = (key) => (e) => onChange({ ...zone, [key]: e.target.value })
  return (
    <Row className="g-2">
      <Col md={3}>
        <Form.Label className="small fw-semibold">Mã vùng</Form.Label>
        <Form.Control required placeholder="VD: HN_NOI_THANH" value={zone.zoneCode} onChange={set('zoneCode')} disabled={lockCode} />
      </Col>
      <Col md={4}>
        <Form.Label className="small fw-semibold">Tên vùng</Form.Label>
        <Form.Control required placeholder="VD: Hà Nội nội thành" value={zone.zoneName} onChange={set('zoneName')} />
      </Col>
      <Col md={5}>
        <Form.Label className="small fw-semibold">Từ khóa nhận diện địa chỉ</Form.Label>
        <Form.Control required placeholder="Cách nhau bằng dấu phẩy: hoàn kiếm, ba đình, đống đa" value={zone.addressKeywords} onChange={set('addressKeywords')} />
      </Col>
      <Col md={4}>
        <Form.Label className="small fw-semibold">Phí giao hàng (đ)</Form.Label>
        <Form.Control required type="number" min={0} step={1000} value={zone.shippingFee} onChange={set('shippingFee')} />
      </Col>
      <Col md={4}>
        <Form.Label className="small fw-semibold">Miễn phí từ (đ)</Form.Label>
        <Form.Control type="number" min={0} step={1000} placeholder="Để trống nếu không miễn phí" value={zone.freeShippingThreshold ?? ''} onChange={set('freeShippingThreshold')} />
      </Col>
      <Col md={4} className="d-flex align-items-end">
        <Form.Check type="switch" id={`zone-active-${lockCode ? 'edit' : 'new'}`} label="Đang áp dụng" checked={zone.active}
          onChange={(e) => onChange({ ...zone, active: e.target.checked })} />
      </Col>
    </Row>
  )
}

// Delivery zones: which addresses CleanMarket ships to, at what fee, and from which order value delivery is free.
export default function AdminShippingView() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newZone, setNewZone] = useState(emptyZone)
  const [adding, setAdding] = useState(false)
  const [editZone, setEditZone] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const loadZones = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setZones((await api.get('/api/admin/shipping-zones')) || [])
    } catch (err) {
      setError(err.message || 'Lỗi tải khu vực giao hàng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadZones)
  }, [loadZones])

  const handleCreate = async (e) => {
    e.preventDefault()
    setAdding(true)
    setError('')
    setNotice('')
    try {
      await api.post('/api/admin/shipping-zones', toRequest(newZone))
      setNotice(`Đã thêm khu vực "${newZone.zoneName.trim()}".`)
      setNewZone(emptyZone)
      await loadZones()
    } catch (err) {
      setError(`Lỗi thêm khu vực: ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setSavingEdit(true)
    setError('')
    setNotice('')
    try {
      await api.put(`/api/admin/shipping-zones/${editZone.id}`, toRequest(editZone))
      setNotice(`Đã cập nhật khu vực "${editZone.zoneName.trim()}".`)
      setEditZone(null)
      await loadZones()
    } catch (err) {
      setError(`Lỗi cập nhật khu vực: ${err.message}`)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleToggle = async (zone) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/admin/shipping-zones/${zone.id}`, toRequest({ ...zone, active: !zone.active }))
      setNotice(`Đã ${zone.active ? 'tắt' : 'bật'} khu vực "${zone.zoneName}".`)
      await loadZones()
    } catch (err) {
      setError(`Lỗi cập nhật khu vực: ${err.message}`)
    }
  }

  return (
    <div className="admin-shipping-view">
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <div className="admin-card mb-4">
        <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
          <Plus size={18} className="text-success" />
          <span>Thêm khu vực giao hàng</span>
        </h6>
        <Form onSubmit={handleCreate}>
          <ZoneFields zone={newZone} onChange={setNewZone} />
          <div className="text-end mt-3">
            <Button variant="success" type="submit" disabled={adding} className="d-inline-flex align-items-center gap-1">
              {adding ? <Spinner animation="border" size="sm" /> : <Plus size={16} />}
              <span>Tạo khu vực</span>
            </Button>
          </div>
        </Form>
      </div>

      <div className="admin-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Khu vực giao hàng</h5>
            <p className="text-secondary small mb-0">Checkout chỉ nhận địa chỉ thuộc khu vực đang áp dụng. Khu vực đã tắt không mất dữ liệu và có thể bật lại.</p>
          </div>
          <Badge bg="success" pill className="px-3 py-2">{zones.filter((z) => z.active).length}/{zones.length} đang áp dụng</Badge>
        </div>
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
        ) : zones.length === 0 ? (
          <div className="text-center py-5 text-secondary">Chưa có khu vực giao hàng nào.</div>
        ) : (
          <Table responsive hover className="align-middle mb-0">
            <thead>
              <tr>
                <th>Khu vực</th>
                <th>Từ khóa địa chỉ</th>
                <th className="text-end">Phí giao</th>
                <th className="text-end">Miễn phí từ</th>
                <th>Trạng thái</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className={zone.active ? '' : 'text-muted'}>
                  <td>
                    <div className="fw-semibold">{zone.zoneName}</div>
                    <div className="small text-secondary">{zone.zoneCode}</div>
                  </td>
                  <td className="small" style={{ maxWidth: 280 }}>{zone.addressKeywords}</td>
                  <td className="text-end">{formatCurrency(Number(zone.shippingFee))}</td>
                  <td className="text-end">{zone.freeShippingThreshold != null ? formatCurrency(Number(zone.freeShippingThreshold)) : 'Không áp dụng'}</td>
                  <td><Badge bg={zone.active ? 'success' : 'secondary'}>{zone.active ? 'Đang áp dụng' : 'Đã tắt'}</Badge></td>
                  <td className="text-end text-nowrap">
                    <Button variant="outline-primary" size="sm" className="me-2" title="Sửa"
                      onClick={() => setEditZone({ ...zone, freeShippingThreshold: zone.freeShippingThreshold ?? '' })}>
                      <Edit size={14} />
                    </Button>
                    <Button variant={zone.active ? 'outline-secondary' : 'outline-success'} size="sm" title={zone.active ? 'Tắt khu vực' : 'Bật khu vực'} onClick={() => handleToggle(zone)}>
                      {zone.active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Modal show={!!editZone} onHide={() => setEditZone(null)} size="lg" centered>
        <Form onSubmit={handleSaveEdit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5">Sửa khu vực giao hàng</Modal.Title>
          </Modal.Header>
          <Modal.Body>{editZone && <ZoneFields zone={editZone} onChange={setEditZone} lockCode />}</Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setEditZone(null)}>Hủy</Button>
            <Button variant="success" type="submit" disabled={savingEdit}>
              {savingEdit ? <Spinner animation="border" size="sm" /> : 'Lưu thay đổi'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
