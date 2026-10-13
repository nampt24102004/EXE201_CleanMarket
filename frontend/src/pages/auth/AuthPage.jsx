import { useState } from 'react'
import { Alert,Button,Card,Col,Container,Form,Row,Spinner } from 'react-bootstrap'
import { Link,useLocation,useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
const homes={USER:'/',PARTNER:'/partner',MANAGER:'/manager',ADMIN:'/admin'}
export default function AuthPage({registerMode=false}){
 const {login,register,logout}=useAuth(),navigate=useNavigate(),location=useLocation()
 const [form,setForm]=useState({name:'',email:'',password:'',confirmPassword:''}),[error,setError]=useState(''),[unverified,setUnverified]=useState(false),[busy,setBusy]=useState(false)
 const [supplierIntent,setSupplierIntent]=useState(registerMode&&new URLSearchParams(location.search).get('type')==='supplier')
 const nextPath=supplierIntent?'/partner/register':null
 const verificationUrl='/verify-email?email='+encodeURIComponent(form.email.trim())+(nextPath?'&next='+encodeURIComponent(nextPath):'')
 const submit=async e=>{e.preventDefault();setError('');setUnverified(false);if(registerMode&&form.name.trim().length<2)return setError('Vui lòng nhập họ tên hợp lệ.');if(form.password.length<8)return setError('Mật khẩu cần ít nhất 8 ký tự.');if(registerMode&&form.password!==form.confirmPassword)return setError('Mật khẩu nhập lại không khớp.');setBusy(true)
  try{if(registerMode){const r=await register(form);if(r.emailVerificationRequired)return navigate(verificationUrl,{replace:true});await logout();return navigate('/login',{replace:true,state:{message:'Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.',...(nextPath&&{from:nextPath})}})}const u=await login(form.email,form.password);navigate(location.state?.from||homes[u.role]||'/',{replace:true})}
  catch(x){setUnverified(x.code==='EMAIL_NOT_VERIFIED');setError([x.message,...(x.errors||[])].filter(Boolean).join(' '))}finally{setBusy(false)}}
 return <Container className="py-5"><Row className="justify-content-center"><Col lg={5} md={8}><Card className="detail-card border-0 p-3 p-md-4"><Card.Body>
 <div className="hero-kicker mb-2">Tài khoản CleanMarket</div><h1 className="h2 fw-bold">{registerMode?(supplierIntent?'Đăng ký nhà cung cấp':'Tạo tài khoản'):'Đăng nhập'}</h1><p className="text-secondary">{registerMode?(supplierIntent?'Tạo tài khoản, xác thực email và hoàn thiện hồ sơ nhà cung cấp.':'Đăng ký và xác thực bằng mã OTP gửi qua email.'):'Đăng nhập bằng tài khoản CleanMarket.'}</p>
 {registerMode&&<><div className="d-grid d-sm-flex gap-2 mb-3"><Button type="button" variant={supplierIntent?'outline-success':'success'} className="flex-fill" onClick={()=>setSupplierIntent(false)}>Mua hàng</Button><Button type="button" variant={supplierIntent?'success':'outline-success'} className="flex-fill" onClick={()=>setSupplierIntent(true)}>Trở thành nhà cung cấp</Button></div>{supplierIntent&&<Alert variant="info">Sau khi xác thực và đăng nhập, bạn sẽ điền hồ sơ nhà cung cấp. Tài khoản đối tác được kích hoạt sau khi Manager hoặc Admin phê duyệt.</Alert>}</>}
 {location.state?.message&&<Alert variant="success">{location.state.message}</Alert>}
 {error&&<Alert variant="danger">{error}{unverified&&<> <Link to={'/verify-email?email='+encodeURIComponent(form.email)+(location.state?.from==='/partner/register'?'&next='+encodeURIComponent('/partner/register'):'')}>Nhập mã OTP</Link></>}</Alert>}
 <Form onSubmit={submit}>{registerMode&&<Form.Group className="mb-3"><Form.Label>Họ và tên</Form.Label><Form.Control required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Form.Group>}
 <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Form.Group>
 <Form.Group className="mb-2"><Form.Label>Mật khẩu</Form.Label><Form.Control type="password" required minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></Form.Group>
 {registerMode&&<Form.Group className="mb-2"><Form.Label>Nhập lại mật khẩu</Form.Label><Form.Control type="password" required minLength={8} value={form.confirmPassword} isInvalid={Boolean(form.confirmPassword)&&form.password!==form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})}/><Form.Control.Feedback type="invalid">Mật khẩu nhập lại không khớp.</Form.Control.Feedback></Form.Group>}
 {!registerMode&&<div className="text-end mb-4"><Link to="/forgot-password">Quên mật khẩu?</Link></div>}{registerMode&&<div className="mb-4"/>}
 <Button disabled={busy} type="submit" className="primary-btn w-100 py-2">{busy&&<Spinner size="sm" className="me-2"/>}{registerMode?'Đăng ký':'Đăng nhập'}</Button></Form>
 <p className="mt-4 mb-0 text-center">{registerMode?'Đã có tài khoản?':'Chưa có tài khoản?'} <Link to={registerMode?'/login':'/register'} state={registerMode&&nextPath?{from:nextPath}:undefined}>{registerMode?'Đăng nhập':'Đăng ký'}</Link></p>
 </Card.Body></Card></Col></Row></Container>}
