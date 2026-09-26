import { useEffect,useState } from 'react'
import { Alert,Button,Card,Col,Container,Form,Row,Spinner } from 'react-bootstrap'
import { Link,useNavigate,useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { api } from '../../services/apiClient'
export default function VerifyEmailPage(){
 const [params]=useSearchParams(),navigate=useNavigate(),{verifyEmail,logout}=useAuth()
 const [email,setEmail]=useState(params.get('email')||''),[otp,setOtp]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(60)
 useEffect(()=>{if(seconds<=0)return;const id=setInterval(()=>setSeconds(v=>Math.max(0,v-1)),1000);return()=>clearInterval(id)},[seconds])
 const submit=async e=>{e.preventDefault();setError('');setBusy(true);try{await verifyEmail(email,otp);await logout();navigate('/login',{replace:true,state:{message:'Xác thực email thành công. Vui lòng đăng nhập để tiếp tục.'}})}catch(x){setError([x.message,...(x.errors||[])].filter(Boolean).join(' '))}finally{setBusy(false)}}
 const resend=async()=>{setError('');setMessage('');setBusy(true);try{await api.post('/api/auth/email/resend',{email:email.trim()});setMessage('Mã OTP mới đã được gửi. Vui lòng kiểm tra cả Spam.');setSeconds(60)}catch(x){setError([x.message,...(x.errors||[])].filter(Boolean).join(' '))}finally{setBusy(false)}}
 return <Container className="py-5"><Row className="justify-content-center"><Col lg={5} md={8}><Card className="detail-card border-0 p-3 p-md-4"><Card.Body>
 <div className="hero-kicker mb-2">Bảo mật tài khoản</div><h1 className="h2 fw-bold">Xác thực email</h1><p className="text-secondary">Nhập mã OTP 6 số. Mã có hiệu lực trong 5 phút.</p>{error&&<Alert variant="danger">{error}</Alert>}{message&&<Alert variant="success">{message}</Alert>}
 <Form onSubmit={submit}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></Form.Group><Form.Group className="mb-4"><Form.Label>Mã OTP</Form.Label><Form.Control inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} className="text-center fs-3" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}/></Form.Group><Button type="submit" disabled={busy||otp.length!==6} className="primary-btn w-100 py-2">{busy&&<Spinner size="sm" className="me-2"/>}Xác thực</Button></Form>
 <div className="text-center mt-3"><Button variant="link" disabled={busy||seconds>0||!email.trim()} onClick={resend}>{seconds>0?'Gửi lại sau '+seconds+'s':'Gửi lại mã OTP'}</Button></div><p className="text-center mb-0"><Link to="/login">Quay lại đăng nhập</Link></p>
 </Card.Body></Card></Col></Row></Container>}
