import { useEffect, useState } from 'react'
import { Alert, Badge, Card, Col, Container, Image, ListGroup, Row, Spinner } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import { api } from '../../services/apiClient'

export default function TracePage() {
  const { traceCode } = useParams()
  const [trace, setTrace] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    api.get(`/api/trace/${encodeURIComponent(traceCode)}`)
      .then((data) => { if (active) setTrace(data) })
      .catch((caught) => { if (active) setError(caught.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [traceCode])
  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="success" /></Container>
  if (error || !trace) return <Container className="py-5"><Alert variant="danger"><h1 className="h4">Không tìm thấy mã truy xuất</h1>{error || 'Hãy kiểm tra lại mã QR.'}</Alert></Container>
  const expired = trace.expiryDate && new Date(`${trace.expiryDate}T23:59:59`) < new Date()
  const warning = trace.status === 'RECALLED' || expired || trace.status === 'INVALID'
  const fields = [['Mã lô', trace.batchCode], ['Trang trại', trace.farmName], ['Vùng trồng / nguồn gốc', trace.origin], ['Ngày thu hoạch', trace.harvestDate], ['Ngày đóng gói', trace.packagingDate], ['Hạn sử dụng', trace.expiryDate], ['Chứng nhận VietGAP', trace.certificateNo]]
  return <Container className="py-4 py-md-5"><div className="hero-kicker mb-2">Truy xuất nguồn gốc theo lô</div><h1 className="section-title mb-4">Thông tin lô hàng</h1>{warning && <Alert variant="danger">Lô hàng cần được kiểm tra trước khi sử dụng.</Alert>}<Row className="g-4"><Col lg={5}><Card className="detail-card border-0 p-3 h-100"><Image src={trace.productImage} alt={trace.productName} className="detail-image" /><Card.Body><h2 className="h4">{trace.productName}</h2><p className="mb-2">{trace.supplierName}</p><Badge bg={trace.supplierVerificationStatus === 'APPROVED' ? 'success' : 'secondary'}>{trace.supplierVerificationStatus === 'APPROVED' ? 'Nhà cung cấp đã xác minh' : trace.supplierVerificationStatus}</Badge></Card.Body></Card></Col><Col lg={7}><Card className="detail-card border-0 p-3 h-100"><Card.Body><div className="d-flex justify-content-between align-items-center"><h2 className="h4 mb-0">Dữ liệu từ backend</h2><Badge bg={warning ? 'danger' : 'success'}>{warning ? 'Cần chú ý' : 'Đang lưu hành'}</Badge></div><ListGroup variant="flush" className="mt-3">{fields.map(([label, value]) => <ListGroup.Item key={label} className="px-0 d-flex justify-content-between gap-3"><span className="text-secondary">{label}</span><strong className="text-end">{value || 'Chưa cập nhật'}</strong></ListGroup.Item>)}</ListGroup></Card.Body></Card></Col></Row></Container>
}