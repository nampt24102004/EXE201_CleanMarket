import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StaffNav from '../../components/portal/StaffNav'
import { api } from '../../services/apiClient'
import formatCurrency from '../../utils/formatCurrency'

const color={PENDING:'warning',APPROVED:'success',REJECTED:'danger',SUSPENDED:'secondary'}
const statusLabel={ALL:'Tất cả',PENDING:'Chờ duyệt',APPROVED:'Đã duyệt',REJECTED:'Đã từ chối',SUSPENDED:'Tạm ngừng'}
const supplierTypeLabel={FARM:'Trang trại',COOPERATIVE:'Hợp tác xã',HOUSEHOLD_BUSINESS:'Hộ kinh doanh',COMPANY:'Doanh nghiệp',OTHER:'Khác'}
const documentTypeLabel={BUSINESS_LICENSE:'Giấy phép kinh doanh',FOOD_SAFETY:'Giấy chứng nhận an toàn thực phẩm',VIETGAP:'Chứng nhận VietGAP',ORGANIC:'Chứng nhận hữu cơ',OCOP:'Chứng nhận OCOP',OTHER:'Giấy tờ khác'}
export function ApprovalListPage({kind,base='/manager'}){
  const [items,setItems]=useState([]),[filter,setFilter]=useState('PENDING'),[loading,setLoading]=useState(true),[error,setError]=useState('')
  useEffect(()=>{let active=true;api.get(`/api/manager/${kind}?status=${filter}`).then(v=>active&&setItems(v)).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false}},[filter,kind])
  const supplier=kind==='suppliers'
  const role=base==='/admin'?'ADMIN':'MANAGER'
  return <Container className="py-5"><div className="hero-kicker">TRUNG TÂM KIỂM DUYỆ</div><h1 className="section-title">{supplier?'Duyệt nhà cung cấp':'Duyệt sản phẩm'}</h1><StaffNav role={role} active={kind} />
    <div className="d-flex gap-2 mb-4">{(supplier?['ALL','PENDING','APPROVED','REJECTED','SUSPENDED']:['PENDING','APPROVED','REJECTED']).map(x=><Button key={x} size="sm" variant={filter===x?'success':'outline-success'} onClick={()=>{setLoading(true);setFilter(x)}}>{statusLabel[x]}</Button>)}</div>
    {error&&<Alert variant="danger">{error}</Alert>}{loading?<Spinner animation="border"/>:<Card className="detail-card border-0"><Card.Body><Table responsive hover><thead><tr><th>Tên</th><th>{supplier?'Người đăng ký':'Nhà cung cấp'}</th><th>{supplier?'Liên hệ':'Giá / tồn'}</th><th>Trạng thái</th><th></th></tr></thead><tbody>{items.map(x=>{const itemStatus=supplier?x.status:x.approvalStatus;return <tr key={x.id}><td>{x.name}</td><td>{supplier?x.applicantName:x.supplierName}</td><td>{supplier?<>{x.email}<br/>{x.phone}</>:<>{formatCurrency(Number(x.price))}<br/>{x.stock} {x.unit}</>}</td><td><Badge bg={color[itemStatus]||'secondary'}>{statusLabel[itemStatus]||itemStatus}</Badge></td><td><Button as={Link} to={`${base}/${kind}/${x.id}`} size="sm" variant="outline-success">Xem chi tiết</Button></td></tr>})}</tbody></Table>{!items.length&&<p className="mb-0">Không có dữ liệu.</p>}</Card.Body></Card>}
  </Container>
}
export function ApprovalDetailPage({kind,base='/manager'}){
  const {id}=useParams(),navigate=useNavigate(),[item,setItem]=useState(null),[reason,setReason]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const load=useCallback(()=>api.get(`/api/manager/${kind}/${id}`).then(setItem).catch(e=>setError(e.message)),[id,kind])
  useEffect(()=>{void load()},[load])
  const decide=async(action)=>{setError('');if(action==='reject'&&!reason.trim())return setError('Vui lòng nhập lý do từ chối.');try{await api.put(`/api/manager/${kind}/${id}/${action}`,action==='reject'?{reason}:undefined);setNotice(action==='approve'?'Đã phê duyệt.':'Đã từ chối.');await load()}catch(e){setError(e.message)}}
  const reviewCert=async(certId,action)=>{try{await api.put(`/api/manager/products/${id}/certificates/${certId}/${action}`,action==='reject'?{reason:reason||'Chứng nhận chưa đạt yêu cầu'}:undefined);await load()}catch(e){setError(e.message)}}
  const reviewSupplierDocument=async(documentId,action)=>{try{await api.put(`/api/manager/suppliers/${id}/documents/${documentId}/${action}`,action==='reject'?{reason:reason||'Giấy tờ chưa đạt yêu cầu'}:undefined);setNotice(action==='approve'?'Đã duyệt giấy tờ.':'Đã từ chối giấy tờ.');await load()}catch(e){setError(e.message)}}
  if(!item&&!error)return <Container className="py-5 text-center"><Spinner animation="border"/></Container>
  if(!item)return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>
  const supplier=kind==='suppliers',status=supplier?item.status:item.approvalStatus
  const role=base==='/admin'?'ADMIN':'MANAGER'
  return <Container className="py-5"><Button variant="link" className="ps-0 mb-2" onClick={()=>navigate(`${base}/${kind}`)}>← Quay lại</Button><div className="d-flex justify-content-between"><h1 className="section-title">{item.name}</h1><Badge bg={color[status]||'secondary'} className="align-self-start">{statusLabel[status]||status}</Badge></div><StaffNav role={role} active={kind} />
    {notice&&<Alert variant="success">{notice}</Alert>}{error&&<Alert variant="danger">{error}</Alert>}<Row className="g-4"><Col lg={7}><Card className="detail-card border-0"><Card.Body>
      {supplier?<><h2 className="h4">Thông tin hồ sơ</h2><p><strong>Người đăng ký:</strong> {item.applicantName}</p><p><strong>Email:</strong> {item.email}</p><p><strong>Điện thoại:</strong> {item.phone}</p><p><strong>Loại:</strong> {supplierTypeLabel[item.supplierType]||item.supplierType}</p><p><strong>Địa chỉ:</strong> {item.location}</p><p>{item.description}</p><h3 className="h5">Giấy tờ</h3>{item.documents?.map(d=><div className="border-top py-2" key={d.id}><div className="d-flex justify-content-between gap-2"><a href={d.fileUrl} target="_blank" rel="noreferrer">{d.documentName||documentTypeLabel[d.documentType]} — {d.originalFileName}</a><Badge bg={color[d.status]||'secondary'}>{statusLabel[d.status]||d.status}</Badge></div><div className="small text-secondary">{documentTypeLabel[d.documentType]||d.documentType}</div>{d.rejectionReason&&<div className="small text-danger">{d.rejectionReason}</div>}{d.status==='PENDING'&&<div className="d-flex gap-2 mt-2"><Button size="sm" variant="success" onClick={()=>reviewSupplierDocument(d.id,'approve')}>Duyệt giấy tờ</Button><Button size="sm" variant="outline-danger" onClick={()=>reviewSupplierDocument(d.id,'reject')}>Từ chối</Button></div>}</div>)}</>:<><h2 className="h4">Thông tin sản phẩm</h2><p><strong>Nhà cung cấp:</strong> {item.supplierName}</p><p><strong>Giá:</strong> {formatCurrency(Number(item.price))} / {item.unit}</p><p><strong>Tồn kho:</strong> {item.stock}</p><p><strong>Xuất xứ:</strong> {item.origin}</p><p>{item.description}</p><div className="d-flex gap-2 flex-wrap">{item.images?.map(i=><img key={i.id} src={i.imageUrl} alt={i.originalFileName} style={{width:120,height:90,objectFit:'cover',borderRadius:10}}/>)}</div></>}
    </Card.Body></Card></Col><Col lg={5}>
      {!supplier&&<Card className="detail-card border-0 mb-4"><Card.Body><h2 className="h4">Chứng nhận</h2>{item.certificates?.map(c=><div className="border-top py-3" key={c.id}><a href={c.fileUrl} target="_blank" rel="noreferrer">{documentTypeLabel[c.certificateType]||c.certificateType} — {c.certificateNumber}</a><div className="small">{c.issuer} · {statusLabel[c.status]||c.status}</div>{c.status==='PENDING'&&<div className="d-flex gap-2 mt-2"><Button size="sm" variant="success" onClick={()=>reviewCert(c.id,'approve')}>Duyệt chứng nhận</Button><Button size="sm" variant="outline-danger" onClick={()=>reviewCert(c.id,'reject')}>Từ chối</Button></div>}</div>)}{!item.certificates?.length&&<p>Không có chứng nhận.</p>}</Card.Body></Card>}
      {status==='PENDING'&&<Card className="detail-card border-0"><Card.Body><h2 className="h4">Quyết định</h2><Form.Control as="textarea" rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Lý do bắt buộc khi từ chối"/><div className="d-flex gap-2 mt-3"><Button variant="outline-danger" onClick={()=>decide('reject')}>Từ chối</Button><Button variant="success" onClick={()=>decide('approve')}>Phê duyệt</Button></div></Card.Body></Card>}
      {item.rejectionReason&&<Alert variant="danger">{item.rejectionReason}</Alert>}
    </Col></Row>
  </Container>
}
