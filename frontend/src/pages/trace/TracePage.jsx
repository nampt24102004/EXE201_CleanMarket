import { useEffect, useState } from 'react'
import { Alert, Badge, Card, Col, Container, Image, ListGroup, Row, Spinner } from 'react-bootstrap'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../services/apiClient'
import { QrCode, ShieldCheck, CheckCircle2, Calendar, MapPin, Store, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function TracePage() {
  const { traceCode } = useParams()
  const [trace, setTrace] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get(`/api/trace/${encodeURIComponent(traceCode)}`)
      .then((data) => {
        if (active) setTrace(data)
      })
      .catch((caught) => {
        if (active) setError(caught.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [traceCode])

  if (loading)
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <div className="mt-3 text-secondary fw-semibold">Đang truy xuất thông tin lô hàng từ hệ thống...</div>
      </Container>
    )

  if (error || !trace)
    return (
      <Container className="py-5">
        <Card className="detail-card border-0 p-5 text-center max-w-600 mx-auto">
          <AlertTriangle size={48} className="text-warning mx-auto mb-3" />
          <h2 className="h4 fw-bold mb-2">Không tìm thấy mã truy xuất</h2>
          <p className="text-secondary mb-4">{error || 'Mã QR không hợp lệ hoặc lô hàng chưa được kích hoạt.'}</p>
          <div>
            <Link to="/" className="btn btn-outline-success rounded-pill px-4 py-2 fw-semibold">
              Quay về trang chủ
            </Link>
          </div>
        </Card>
      </Container>
    )

  const expired = trace.expiryDate && new Date(`${trace.expiryDate}T23:59:59`) < new Date()
  const warning = trace.status === 'RECALLED' || expired || trace.status === 'INVALID'

  const fields = [
    ['Mã lô xuất kho', trace.batchCode, CheckCircle2],
    ['Trang trại canh tác', trace.farmName, Store],
    ['Vùng trồng / Xuất xứ', trace.origin, MapPin],
    ['Ngày thu hoạch', trace.harvestDate, Calendar],
    ['Ngày đóng gói', trace.packagingDate, Calendar],
    ['Hạn sử dụng', trace.expiryDate, Calendar],
    ['Số chứng chỉ VietGAP', trace.certificateNo, ShieldCheck],
  ]

  return (
    <Container className="py-4 py-md-5">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/" className="btn btn-sm btn-light border rounded-pill d-inline-flex align-items-center gap-1">
          <ArrowLeft size={14} /> Trang chủ
        </Link>
        <span className="badge-chip">
          <QrCode size={14} className="text-success" />
          Hệ thống minh bạch chuỗi cung ứng
        </span>
      </div>

      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
        <div>
          <div className="hero-kicker mb-1">Xác thực nguồn gốc điện tử</div>
          <h1 className="section-title mb-1">
            Hồ sơ kiểm định <span className="gradient-text">lô nông sản</span>
          </h1>
          <p className="text-secondary mb-0">
            Mã truy xuất: <span className="font-monospace fw-bold text-dark">{traceCode}</span>
          </p>
        </div>

        <Badge bg={warning ? 'danger' : 'success'} pill className="px-3 py-2 fs-6">
          {warning ? '⚠️ Cần kiểm tra' : '✓ Đạt chuẩn lưu hành'}
        </Badge>
      </div>

      {warning && (
        <Alert variant="danger" className="rounded-4 mb-4">
          <strong>Cảnh báo:</strong> Lô hàng này đã hết hạn sử dụng hoặc đang trong diện thu hồi. Vui lòng liên hệ hotline hỗ trợ.
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={5}>
          <Card className="detail-card border-0 p-3 p-md-4 h-100">
            <div className="position-relative rounded-4 overflow-hidden mb-3">
              <Image
                src={trace.productImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                alt={trace.productName}
                className="detail-image"
              />
              <div className="position-absolute top-0 start-0 m-3">
                <span className="badge-tag-organic bg-white shadow-sm">
                  <ShieldCheck size={13} className="text-success" />
                  Đã kiểm tra chất lượng
                </span>
              </div>
            </div>

            <Card.Body className="p-0">
              <h2 className="h4 fw-bold text-dark mb-1">{trace.productName}</h2>
              <div className="text-secondary small mb-3">{trace.supplierName}</div>
              <div className="p-3 bg-light rounded-4 border">
                <div className="small text-muted mb-1">Trạng thái nhà vườn:</div>
                <div className="fw-bold text-success d-flex align-items-center gap-1">
                  <CheckCircle2 size={16} />
                  {trace.supplierVerificationStatus === 'APPROVED'
                    ? 'Nhà cung cấp đã xác minh chính thức'
                    : trace.supplierVerificationStatus}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="detail-card border-0 p-3 p-md-4 h-100">
            <Card.Body>
              <h3 className="h5 fw-bold mb-3 text-dark">Thông tin chi tiết nhật ký thu hoạch</h3>
              <ListGroup variant="flush">
                {fields.map(([label, value, Icon]) => (
                  <ListGroup.Item
                    key={label}
                    className="px-0 py-3 bg-transparent d-flex justify-content-between align-items-center gap-3 border-bottom"
                  >
                    <span className="text-secondary small d-flex align-items-center gap-2">
                      <Icon size={16} className="text-success" />
                      {label}
                    </span>
                    <strong className="text-end text-dark">{value || 'Chưa cập nhật'}</strong>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}