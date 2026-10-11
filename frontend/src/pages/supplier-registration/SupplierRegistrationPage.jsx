import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap'
import { api } from '../../services/apiClient'

const empty={supplierName:'',email:'',phone:'',address:'',supplierType:'FARM',description:'',confirmed:false}
const labels={PENDING:'Đang chờ duyệt',APPROVED:'Đã được phê duyệt',REJECTED:'Cần bổ sung hồ sơ',SUSPENDED:'Tạm ngừng'}
const colors={PENDING:'warning',APPROVED:'success',REJECTED:'danger',SUSPENDED:'secondary'}
const supplierTypes=[
  {value:'FARM',label:'Trang trại'},
  {value:'COOPERATIVE',label:'Hợp tác xã'},
  {value:'HOUSEHOLD_BUSINESS',label:'Hộ kinh doanh'},
  {value:'COMPANY',label:'Doanh nghiệp'},
  {value:'OTHER',label:'Khác'},
]
const documentTypes=[
  {value:'BUSINESS_LICENSE',label:'Giấy phép kinh doanh'},
  {value:'FOOD_SAFETY',label:'Giấy chứng nhận an toàn thực phẩm'},
  {value:'VIETGAP',label:'Chứng nhận VietGAP'},
  {value:'ORGANIC',label:'Chứng nhận hữu cơ'},
  {value:'OCOP',label:'Chứng nhận OCOP'},
  {value:'OTHER',label:'Giấy tờ khác'},
]
export default function SupplierRegistrationPage(){
  const [application,setApplication]=useState(null),[form,setForm]=useState(empty),[files,setFiles]=useState([]),[documentType,setDocumentType]=useState('BUSINESS_LICENSE')
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const load=async()=>{try{const value=await api.get('/api/supplier-applications/me');setApplication(value);setForm({supplierName:value.name,email:value.email,phone:value.phone,address:value.location,supplierType:value.supplierType,description:value.description||'',confirmed:true})}catch(e){if(e.status!==404)setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{let active=true;api.get('/api/supplier-applications/me').then(value=>{if(active){setApplication(value);setForm({supplierName:value.name,email:value.email,phone:value.phone,address:value.location,supplierType:value.supplierType,description:value.description||'',confirmed:true})}}).catch(e=>{if(active&&e.status!==404)setError(e.message)}).finally(()=>active&&setLoading(false));return()=>{active=false}},[])
  const submit=async(e)=>{e.preventDefault();setSaving(true);setError('');try{
    let value=application?await api.put('/api/supplier-applications/me',form):await api.post('/api/supplier-applications',form)
    for(const file of files){const data=new FormData();data.append('documentType',documentType);data.append('documentName',file.name);data.append('file',file);await api.post('/api/supplier-applications/me/documents',data)}
    if(application?.status==='REJECTED')value=await api.post('/api/supplier-applications/me/resubmit')
    setApplication(value);setNotice('Đăng ký nhà cung cấp thành công. Hồ sơ của bạn đang được CleanMarket kiểm duyệt.');setFiles([]);await load()
  }catch(e2){setError(e2.message)}finally{setSaving(false)}}
  if(loading)return <Container className="py-5 text-center"><Spinner animation="border" variant="success"/></Container>
  const editable=!application||['PENDING','REJECTED'].includes(application.status)
  return <Container className="py-5"><div className="hero-kicker">PARTNER</div><h1 className="section-title">Đăng ký nhà cung cấp</h1>
    {notice&&<Alert variant="success">{notice}<div className="mt-2">Bạn vẫn có thể mua sắm và sử dụng CleanMarket bình thường trong thời gian chờ xét duyệt.</div></Alert>}
    {error&&<Alert variant="danger">{error}</Alert>}
    {application?.status==='PENDING'&&<Alert variant="warning">Hồ sơ đang được CleanMarket kiểm duyệt. Bạn vẫn có thể mua sắm bình thường trong thời gian chờ xét duyệt.</Alert>}
    {application?.status==='APPROVED'&&<Alert variant="success">Hồ sơ đã được phê duyệt. Hãy đăng xuất và đăng nhập lại để kích hoạt quyền truy cập Partner Center.</Alert>}
    {application&&<Card className="detail-card border-0 mb-4"><Card.Body><div className="d-flex justify-content-between align-items-center"><div><h2 className="h4">{application.name}</h2><p className="mb-0 text-secondary">Hồ sơ nhà cung cấp của bạn</p></div><Badge bg={colors[application.status]}>{labels[application.status]||application.status}</Badge></div>
      {application.rejectionReason&&<Alert variant="danger" className="mt-3 mb-0"><strong>Lý do từ chối:</strong> {application.rejectionReason}</Alert>}
      {!!application.documents?.length&&<div className="mt-3">{application.documents.map(d=><div key={d.id}><a href={d.fileUrl} target="_blank" rel="noreferrer">{d.documentName}</a> · {d.status}</div>)}</div>}
    </Card.Body></Card>}
    {editable&&<Card className="detail-card border-0"><Card.Body><Form onSubmit={submit}><Row className="g-3">
      <Col md={6}><Form.Label>Tên nhà cung cấp *</Form.Label><Form.Control required value={form.supplierName} onChange={e=>setForm({...form,supplierName:e.target.value})}/></Col>
      <Col md={6}><Form.Label>Email *</Form.Label><Form.Control type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Col>
      <Col md={6}><Form.Label>Số điện thoại *</Form.Label><Form.Control required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Col>
      <Col md={6}><Form.Label>Loại nhà cung cấp *</Form.Label><Form.Select value={form.supplierType} onChange={e=>setForm({...form,supplierType:e.target.value})}>{supplierTypes.map(type=><option key={type.value} value={type.value}>{type.label}</option>)}</Form.Select></Col>
      <Col xs={12}><Form.Label>Địa chỉ *</Form.Label><Form.Control required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></Col>
      <Col xs={12}><Form.Label>Mô tả</Form.Label><Form.Control as="textarea" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Col>
      <Col md={4}><Form.Label>Loại giấy tờ</Form.Label><Form.Select value={documentType} onChange={e=>setDocumentType(e.target.value)}>{documentTypes.map(type=><option key={type.value} value={type.value}>{type.label}</option>)}</Form.Select></Col>
      <Col md={8}><Form.Label>Giấy tờ (PDF/JPG/JPEG/PNG)</Form.Label><Form.Control type="file" multiple accept=".pdf,.jpg,.jpeg,.png" required={!application?.documents?.length} onChange={e=>setFiles([...e.target.files])}/></Col>
      <Col xs={12}><Form.Check required type="checkbox" checked={form.confirmed} onChange={e=>setForm({...form,confirmed:e.target.checked})} label="Tôi xác nhận các thông tin trên là chính xác."/></Col>
      <Col xs={12}><Button type="submit" className="primary-btn" disabled={saving}>{saving?'Đang gửi...':application?.status==='REJECTED'?'Cập nhật và gửi lại':'Gửi hồ sơ'}</Button></Col>
    </Row></Form></Card.Body></Card>}
  </Container>
}

