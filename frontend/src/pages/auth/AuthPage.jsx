import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { LogIn, UserPlus, Store } from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'

import { canOpen, homeFor } from '../../utils/authRoutes'

export default function AuthPage({ registerMode = false }) {
  const { login, loginWithGoogle, register, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [supplierIntent, setSupplierIntent] = useState(
    registerMode && new URLSearchParams(location.search).get('type') === 'supplier'
  )
  const googleBtnRef = useRef(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [manualToken, setManualToken] = useState('')

  const handleGoogleCredential = useCallback(async (credential) => {
    setBusy(true)
    setError('')
    try {
      const u = await loginWithGoogle(credential)
      const target = canOpen(location.state?.from, u) ? location.state.from : (supplierIntent ? '/partner/register' : homeFor(u))
      navigate(target, { replace: true })
    } catch (x) {
      setError([x.message, ...(x.errors || [])].filter(Boolean).join(' '))
    } finally {
      setBusy(false)
    }
  }, [location.state, loginWithGoogle, navigate, supplierIntent])

  useEffect(() => {
    if (!googleClientId) return

    const tryInit = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res) => {
            if (res?.credential) {
              handleGoogleCredential(res.credential)
            }
          },
        })
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: registerMode ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        })
      }
    }

    tryInit()
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        tryInit()
        clearInterval(timer)
      }
    }, 500)
    return () => clearInterval(timer)
  }, [googleClientId, registerMode, handleGoogleCredential])

  const handleCustomGoogleClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    } else {
      setShowConfigModal(true)
    }
  }

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
      navigate(canOpen(location.state?.from, u) ? location.state.from : homeFor(u), { replace: true })
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

              <div className="position-relative my-4 text-center">
                <hr className="text-muted opacity-25" />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-secondary small fw-medium">
                  hoặc
                </span>
              </div>

              <div className="d-flex flex-column align-items-center">
                <div ref={googleBtnRef} className="w-100 d-flex justify-content-center" />
                {(!googleClientId || !window.google?.accounts?.id) && (
                  <button
                    type="button"
                    onClick={handleCustomGoogleClick}
                    disabled={busy}
                    className="btn btn-outline-light border text-dark w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm bg-white"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{registerMode ? 'Đăng ký bằng Google' : 'Đăng nhập bằng Google'}</span>
                  </button>
                )}
              </div>

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

      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Tích hợp Google Sign-In & Sign-Up</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          <p className="mb-2">
            Hệ thống CleanMarket đã hỗ trợ đầy đủ xác thực tài khoản Google qua endpoint <strong>/api/auth/google</strong>, tự động phân quyền người dùng và cấp phiên làm việc.
          </p>
          <div className="bg-light p-3 rounded-3 border mb-3">
            <div className="fw-bold mb-1">Để kích hoạt cửa sổ Google OAuth trực tiếp:</div>
            <ol className="mb-0 ps-3">
              <li>Tạo <strong>OAuth 2.0 Client ID</strong> tại Google Cloud Console.</li>
              <li>Thêm <code>VITE_GOOGLE_CLIENT_ID=&lt;client_id&gt;</code> vào file <code>frontend/.env</code>.</li>
              <li>Thêm <code>GOOGLE_CLIENT_ID=&lt;client_id&gt;</code> vào file <code>backend/.env</code>.</li>
            </ol>
          </div>
          <div>
            <label className="fw-semibold mb-1">Thử nghiệm xác thực với Google ID Token (Credential):</label>
            <Form.Control
              size="sm"
              placeholder="Dán ID Token từ Google tại đây..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="mb-2"
            />
            <Button
              size="sm"
              variant="success"
              className="w-100 fw-bold"
              disabled={!manualToken.trim() || busy}
              onClick={() => {
                setShowConfigModal(false)
                handleGoogleCredential(manualToken.trim())
              }}
            >
              Xác thực ngay với Backend
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  )
}
