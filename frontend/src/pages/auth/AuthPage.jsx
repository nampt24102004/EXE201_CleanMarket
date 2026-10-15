import { useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { LogIn, UserPlus, Store } from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'

const homes = { USER: '/', PARTNER: '/partner', MANAGER: '/manager', ADMIN: '/admin' }

export default function AuthPage({ registerMode = false }) {
  const { login, register, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [supplierIntent, setSupplierIntent] = useState(
    registerMode && new URLSearchParams(location.search).get('type') === 'supplier'
  )

  const nextPath = supplierIntent ? '/partner/register' : null
  const verificationUrl =
    '/verify-email?email=' +
    encodeURIComponent(form.email.trim()) +
    (nextPath ? '&next=' + encodeURIComponent(nextPath) : '')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setUnverified(false)

    if (registerMode && form.name.trim().length < 2)
      return setError('Vui lòng nhập họ tên hợp lệ.')
    if (form.password.length < 8)
      return setError('Mật khẩu cần ít nhất 8 ký tự.')
    if (registerMode && form.password !== form.confirmPassword)
      return setError('Mật khẩu nhập lại không khớp.')

    setBusy(true)
    try {
      if (registerMode) {
        const r = await register(form)
        if (r.emailVerificationRequired)
          return navigate(verificationUrl, { replace: true })
        await logout()
        return navigate('/login', {
          replace: true,
          state: {
            message: 'Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.',
            ...(nextPath && { from: nextPath }),
          },
        })
      }
      const u = await login(form.email, form.password)
      navigate(location.state?.from || homes[u.role] || '/', { replace: true })
    } catch (x) {
      setUnverified(x.code === 'EMAIL_NOT_VERIFIED')
      setError([x.message, ...(x.errors || [])].filter(Boolean).join(' '))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={5} md={8}>
          <Card className="detail-card border-0 p-4 p-md-5 shadow-lg">
            <Card.Body>
              <div className="text-center mb-4">
                <div className="d-flex justify-content-center mb-3">
                  <BrandLogo size="lg" />
                </div>
                <div className="hero-kicker mb-1">CleanMarket Authentication</div>
                <h2 className="fw-bold mb-2 text-dark">
                  {registerMode
                    ? supplierIntent
                      ? 'Đăng ký nhà vườn'
                      : 'Tạo tài khoản mới'
                    : 'Chào mừng trở lại'}
                </h2>
                <p className="text-secondary small mb-0">
                  {registerMode
                    ? supplierIntent
                      ? 'Đăng ký tài khoản để bắt đầu phân phối nông sản chuẩn VietGAP.'
                      : 'Đăng ký nhanh để nhận ưu đãi và mua nông sản tươi sạch.'
                    : 'Đăng nhập vào hệ thống nông sản sạch CleanMarket.'}
                </p>
              </div>

              {registerMode && (
                <div className="d-grid d-sm-flex gap-2 mb-4 p-1 bg-light rounded-pill border">
                  <button
                    type="button"
                    className={`btn rounded-pill py-2 flex-fill fw-bold ${
                      !supplierIntent ? 'btn-success text-white' : 'btn-light text-muted'
                    }`}
                    onClick={() => setSupplierIntent(false)}
                  >
                    Khách mua hàng
                  </button>
                  <button
                    type="button"
                    className={`btn rounded-pill py-2 flex-fill fw-bold ${
                      supplierIntent ? 'btn-success text-white' : 'btn-light text-muted'
                    }`}
                    onClick={() => setSupplierIntent(true)}
                  >
                    Nhà vườn đối tác
                  </button>
                </div>
              )}

              {registerMode && supplierIntent && (
                <Alert variant="info" className="small rounded-4 py-3 mb-4">
                  <div className="fw-bold mb-1 d-flex align-items-center gap-1">
                    <Store size={16} /> Lưu ý cho nhà vườn:
                  </div>
                  Sau khi xác thực email và đăng nhập, bạn sẽ điền hồ sơ nông trại để ban quản lý duyệt
                  kích hoạt gian hàng.
                </Alert>
              )}

              {location.state?.message && (
                <Alert variant="success" className="rounded-4">
                  {location.state.message}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="rounded-4">
                  {error}
                  {unverified && (
                    <div className="mt-2">
                      <Link
                        to={
                          '/verify-email?email=' +
                          encodeURIComponent(form.email) +
                          (location.state?.from === '/partner/register'
                            ? '&next=' + encodeURIComponent('/partner/register')
                            : '')
                        }
                        className="fw-bold"
                      >
                        Bấm vào đây để nhập mã xác thực OTP →
                      </Link>
                    </div>
                  )}
                </Alert>
              )}

              <Form onSubmit={submit}>
                {registerMode && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">Họ và tên</Form.Label>
                    <Form.Control
                      required
                      placeholder="Nguyễn Văn A"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="py-2 rounded-3"
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Địa chỉ Email</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    placeholder="email@vidu.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="py-2 rounded-3"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    required
                    minLength={8}
                    placeholder="Tối thiểu 8 ký tự"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="py-2 rounded-3"
                  />
                </Form.Group>

                {registerMode && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">Nhập lại mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      required
                      minLength={8}
                      placeholder="Xác nhận lại mật khẩu"
                      value={form.confirmPassword}
                      isInvalid={
                        Boolean(form.confirmPassword) && form.password !== form.confirmPassword
                      }
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="py-2 rounded-3"
                    />
                    <Form.Control.Feedback type="invalid">
                      Mật khẩu nhập lại không khớp.
                    </Form.Control.Feedback>
                  </Form.Group>
                )}

                {!registerMode && (
                  <div className="text-end mb-4">
                    <Link to="/forgot-password" className="small text-secondary fw-semibold">
                      Quên mật khẩu?
                    </Link>
                  </div>
                )}

                <Button
                  disabled={busy}
                  type="submit"
                  className="primary-btn w-100 py-3 fw-bold fs-6 mt-2"
                >
                  {busy ? (
                    <Spinner size="sm" className="me-2" />
                  ) : registerMode ? (
                    <UserPlus size={18} className="me-1" />
                  ) : (
                    <LogIn size={18} className="me-1" />
                  )}
                  {registerMode ? 'Tạo tài khoản' : 'Đăng nhập'}
                </Button>
              </Form>

              <div className="text-center mt-4 pt-3 border-top small text-secondary">
                {registerMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                <Link
                  to={registerMode ? '/login' : '/register'}
                  state={registerMode && nextPath ? { from: nextPath } : undefined}
                  className="fw-bold text-success"
                >
                  {registerMode ? 'Đăng nhập ngay' : 'Đăng ký tài khoản mới'}
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
