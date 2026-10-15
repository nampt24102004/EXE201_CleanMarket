import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PartnerNav from '../../components/partner/PartnerNav'
import { api } from '../../services/apiClient'
import { documentStatus } from '../../utils/documentStatus'
import formatCurrency from '../../utils/formatCurrency'

const statusLabel={DRAFT:'Bản nháp',PENDING:'Đang chờ duyệt',APPROVED:'Đã duyệt',REJECTED:'Cần chỉnh sửa'}
const empty={name:'',categoryId:'',price:'',unit:'kg',stock:'0',origin:'',description:'',imageUrl:'',certificateNo:''}
export function PartnerProductsPage(){
  const [products,setProducts]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true)
  useEffect(()=>{api.get('/api/partner/products').then(setProducts).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
  return <Container className="py-5"><div className="d-flex justify-content-between align-items-end mb-4"><div><div className="hero-kicker">PARTNER CENTER</div><h1 className="section-title mb-0">Sản phẩm của tôi</h1></div><Button as={Link} to="/partner/products/create" className="primary-btn">Thêm sản phẩm</Button></div><PartnerNav active="products" />
    {error&&<Alert variant="danger">{error}</Alert>}{loading?<Spinner animation="border"/>:<Card className="detail-card border-0"><Card.Body><Table responsive hover><thead><tr><th>Tên</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th><th></th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.name}{p.rejectionReason&&<div className="small text-danger">{p.rejectionReason}</div>}</td><td>{formatCurrency(Number(p.price))}</td><td>{p.stock} {p.unit}</td><td><Badge bg={p.approvalStatus==='APPROVED'?'success':p.approvalStatus==='REJECTED'?'danger':'warning'}>{statusLabel[p.approvalStatus]||p.approvalStatus}</Badge></td><td>{p.approvalStatus!=='APPROVED'&&<Button as={Link} size="sm" variant="outline-success" to={`/partner/products/${p.id}/edit`}>Chỉnh sửa</Button>}</td></tr>)}</tbody></Table>{!products.length&&<p className="mb-0">Bạn chưa có sản phẩm.</p>}</Card.Body></Card>}
  </Container>
}
export function PartnerProductFormPage(){
  const {id}=useParams(),navigate=useNavigate(),[categories,setCategories]=useState([]),[form,setForm]=useState(empty),[images,setImages]=useState([]),[certificateFile,setCertificateFile]=useState(null)
  const [certs,setCerts]=useState([]),[approvalStatus,setApprovalStatus]=useState('DRAFT')
  const removeCertificate=async(c)=>{if(!window.confirm(`Xóa chứng nhận ${c.certificateNumber}?`))return;setError('');try{const p=await api.delete(`/api/partner/products/${id}/certificates/${c.id}`);setCerts(p.certificates||[])}catch(e){setError(e.message)}}
  const [cert,setCert]=useState({certificateType:'VIETGAP',certificateNumber:'',issuer:'',issuedDate:'',expiryDate:''}),[error,setError]=useState(''),[saving,setSaving]=useState(false),[loading,setLoading]=useState(Boolean(id))
  useEffect(()=>{api.get('/api/categories').then(v=>{setCategories(v);setForm(x=>({...x,categoryId:x.categoryId||String(v[0]?.id||'')}))}).catch(e=>setError(e.message));if(id)api.get(`/api/partner/products/${id}`).then(p=>{setCerts(p.certificates||[]);setApprovalStatus(p.approvalStatus);setForm({name:p.name,categoryId:String(p.categoryId),price:String(p.price),unit:p.unit,stock:String(p.stock),origin:p.origin,description:p.description||'',imageUrl:p.imageUrl||'',certificateNo:''})}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[id])
  const save=async(e)=>{e.preventDefault();setSaving(true);setError('');try{const body={...form,categoryId:Number(form.categoryId),price:Number(form.price),stock:Number(form.stock)};let p=id?await api.put(`/api/partner/products/${id}`,body):await api.post('/api/partner/products',body)
      if(images.length){const data=new FormData();images.forEach(f=>data.append('files',f));await api.post(`/api/partner/products/${p.id}/images`,data)}
      if(certificateFile){const data=new FormData();Object.entries(cert).forEach(([k,v])=>{if(v)data.append(k,v)});data.append('file',certificateFile);await api.post(`/api/partner/products/${p.id}/certificates`,data)}
      if(e.nativeEvent.submitter?.value==='submit')p=await api.post(`/api/partner/products/${p.id}/submit`)
      navigate('/partner/products')
    }catch(ex){setError(ex.message)}finally{setSaving(false)}}
  if(loading)return <Container className="py-5 text-center"><Spinner animation="border"/></Container>
  return <Container className="py-5"><div className="hero-kicker">PARTNER CENTER</div><h1 className="section-title">{id?'Chỉnh sửa sản phẩm':'Thêm sản phẩm'}</h1><PartnerNav active="products" />{error&&<Alert variant="danger">{error}</Alert>}
    <Form onSubmit={save}><Row className="g-4"><Col lg={7}><Card className="detail-card border-0"><Card.Body><h2 className="h4 mb-3">Thông tin sản phẩm</h2><Row className="g-3">
      <Col xs={12}><Form.Label>Tên sản phẩm *</Form.Label><Form.Control required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Col>
      <Col md={6}><Form.Label>Danh mục *</Form.Label><Form.Select required value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Col>
      <Col md={3}><Form.Label>Giá *</Form.Label><Form.Control required min="1" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></Col>
      <Col md={3}><Form.Label>Đơn vị *</Form.Label><Form.Control required value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></Col>
      <Col md={6}><Form.Label>Tồn kho *</Form.Label><Form.Control required min="0" type="number" step="0.1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></Col>
      <Col md={6}><Form.Label>Xuất xứ *</Form.Label><Form.Control required value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})}/></Col>
      <Col xs={12}><Form.Label>Mô tả</Form.Label><Form.Control as="textarea" rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Col>
      <Col xs={12}><Form.Label>Ảnh sản phẩm</Form.Label><Form.Control type="file" multiple accept=".jpg,.jpeg,.png" onChange={e=>setImages([...e.target.files])}/><Form.Text>Chọn tối đa 8 ảnh JPG/PNG.</Form.Text></Col>
    </Row></Card.Body></Card></Col><Col lg={5}><Card className="detail-card border-0"><Card.Body><h2 className="h4">Chứng nhận (tùy chọn)</h2><p className="text-secondary small">Chứng nhận chỉ hiện với khách sau khi được duyệt.</p>
      {certs.map(c=>{const [label,color]=documentStatus[c.status]||[c.status,'light'];const removable=['REJECTED','EXPIRED'].includes(c.status)||['DRAFT','REJECTED'].includes(approvalStatus);return <div key={c.id} className="d-flex justify-content-between align-items-start gap-2 border rounded-3 p-2 mb-2"><div><a href={c.fileUrl} target="_blank" rel="noreferrer">{c.certificateType} · {c.certificateNumber}</a> <Badge bg={color}>{label}</Badge>{c.expiryDate&&<div className="small text-secondary">Hiệu lực đến {new Date(`${c.expiryDate}T00:00:00`).toLocaleDateString('vi-VN')}</div>}{c.status==='REJECTED'&&c.rejectionReason&&<div className="small text-danger">Lý do: {c.rejectionReason}</div>}</div>{removable&&<Button size="sm" variant="outline-danger" onClick={()=>removeCertificate(c)}>Xóa</Button>}</div>})}
      <Form.Select className="mb-2" value={cert.certificateType} onChange={e=>setCert({...cert,certificateType:e.target.value})}>{['VIETGAP','ORGANIC','OCOP','FOOD_SAFETY','OTHER'].map(x=><option key={x}>{x}</option>)}</Form.Select>
      <Form.Control className="mb-2" placeholder="Số chứng nhận" value={cert.certificateNumber} onChange={e=>setCert({...cert,certificateNumber:e.target.value})}/><Form.Control className="mb-2" placeholder="Đơn vị cấp" value={cert.issuer} onChange={e=>setCert({...cert,issuer:e.target.value})}/>
      <Row><Col><Form.Label>Ngày cấp</Form.Label><Form.Control type="date" value={cert.issuedDate} onChange={e=>setCert({...cert,issuedDate:e.target.value})}/></Col><Col><Form.Label>Ngày hết hạn</Form.Label><Form.Control type="date" value={cert.expiryDate} onChange={e=>setCert({...cert,expiryDate:e.target.value})}/></Col></Row>
      <Form.Control className="mt-2" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setCertificateFile(e.target.files[0])}/>
    </Card.Body></Card><div className="d-flex gap-2 mt-3"><Button type="submit" variant="outline-success" disabled={saving} value="draft">Lưu nháp</Button><Button type="submit" className="primary-btn" disabled={saving} value="submit">Lưu và gửi duyệt</Button></div></Col></Row></Form>
  </Container>
}
