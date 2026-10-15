import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Col, Container, Form, InputGroup, Row, Spinner, Stack } from 'react-bootstrap'
import PaymentMethod from '../../components/order/PaymentMethod'
import OrderSummary from '../../components/order/OrderSummary'
import OrderInfoPage from '../order-info/OrderInfoPage'
import { api } from '../../services/apiClient'
import { Ticket, ArrowRight, Truck } from 'lucide-react'

function CheckoutPage({
  cartItems,
  customerInfo,
  paymentMethod,
  validationErrors,
  onCustomerInfoChange,
  onPaymentMethodChange,
  onConfirmOrder,
}) {
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [quoting, setQuoting] = useState(false)
  const [shippingZones, setShippingZones] = useState([])
  const [shippingZonesLoading, setShippingZonesLoading] = useState(true)
  const [shippingZonesError, setShippingZonesError] = useState('')
  const [shippingZoneCode, setShippingZoneCode] = useState('')
  const [localErrors, setLocalErrors] = useState([])
  const [platformInput, setPlatformInput] = useState('')
  const [platformCode, setPlatformCode] = useState('')
  const [partnerInputs, setPartnerInputs] = useState({})
  const [partnerCodes, setPartnerCodes] = useState({})
  const selectedZone = shippingZones.find((zone) => zone.zoneCode === shippingZoneCode)
  const shippingAddress = selectedZone && customerInfo.address?.trim()
    ? `${customerInfo.address.trim()}, ${selectedZone.zoneName}`
    : ''

  // Saved addresses from the profile's address book; the default one fills an empty form once.
  const [savedAddresses, setSavedAddresses] = useState([])
  const applyAddress = (a) => onCustomerInfoChange({ ...customerInfo, fullName: a.recipientName, phone: a.phone, address: a.addressLine })
  useEffect(() => {
    let active = true
    api.get('/api/users/me/addresses').then((list) => {
      if (!active) return
      setSavedAddresses(list || [])
      const preferred = (list || []).find((a) => a.defaultAddress)
      if (preferred && !customerInfo.address?.trim()) applyAddress(preferred)
    }).catch(() => {})
    return () => { active = false }
    // Prefill only once on arrival; later edits by the customer must not be overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let active = true
    api.get('/api/checkout/shipping-zones')
      .then((data) => { if (active) setShippingZones(data) })
      .catch((error) => { if (active) setShippingZonesError(`Không tải được khu vực giao hàng: ${error.message}`) })
      .finally(() => { if (active) setShippingZonesLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!shippingAddress) return undefined
    const timer = setTimeout(async () => {
      setQuoting(true); setQuoteError('')
      try {
        setQuote(
          await api.post('/api/checkout/quote', {
            address: shippingAddress,
            platformVoucherCode: platformCode || null,
            partnerVoucherCodes: Object.values(partnerCodes).filter(Boolean),
          })
        )
      } catch (error) {
        setQuote(null)
        setQuoteError(error.message)
      } finally {
        setQuoting(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [shippingAddress, platformCode, partnerCodes])

  const activeQuote = shippingAddress ? quote : null
  const formErrors = [...validationErrors, ...localErrors]
  const normalizeCode = (value) => value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 80)

  const changeZone = (code) => {
    setShippingZoneCode(code)
    setLocalErrors([])
    onCustomerInfoChange({ ...customerInfo, address: '' })
  }

  const applyPlatformCode = () => {
    const code = platformInput.trim().toUpperCase()
    setPlatformCode(code)
    setPlatformInput(code)
  }

  const applyPartnerCode = (supplierId) => {
    const code = (partnerInputs[supplierId] || '').trim().toUpperCase()
    setPartnerCodes((current) => ({ ...current, [supplierId]: code }))
  }

  const submit = () => {
    const errors = []
    if (!shippingZoneCode) errors.push('Vui lòng chọn khu vực giao hàng.')
    if (!customerInfo.address?.trim()) errors.push('Vui lòng nhập địa chỉ giao hàng.')
    setLocalErrors(errors)
    if (errors.length) return
    onConfirmOrder({
      shippingAddress,
      platformVoucherCode: platformCode || null,
      partnerVoucherCodes: Object.values(partnerCodes).filter(Boolean),
    })
  }

  return (
    <Container className="py-4 py-md-5">
      {/* Step Indicator */}
      <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
        <span className="badge bg-light text-muted border rounded-pill px-3 py-2">
          1. Giỏ hàng
        </span>
        <span className="text-muted">➔</span>
        <span className="badge bg-success rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1">
          <Truck size={14} /> 2. Địa chỉ & Thanh toán
        </span>
        <span className="text-muted">➔</span>
        <span className="badge bg-light text-muted border rounded-pill px-3 py-2">
          3. Hoàn tất
        </span>
      </div>

      <div className="mb-4">
        <div className="hero-kicker mb-1">Xác nhận thanh toán</div>
        <h1 className="section-title mb-1">
          Thông tin giao hàng & <span className="gradient-text">đặt hàng</span>
        </h1>
        <p className="text-secondary mb-0">
          Điền đầy đủ địa chỉ nhận hàng và chọn cách thanh toán phù hợp.
        </p>
      </div>

      {validationErrors.includes('Vui lòng chọn phương thức thanh toán.') && (
        <Alert variant="warning" className="rounded-4">Bạn cần chọn phương thức thanh toán trước khi xác nhận.</Alert>
      )}
      {validationErrors.includes('Giỏ hàng của bạn đang trống.') && (
        <Alert variant="warning" className="rounded-4">Giỏ hàng của bạn đang trống, vui lòng thêm sản phẩm trước khi thanh toán.</Alert>
      )}

      <Row className="g-4">
        <Col lg={7}>
          <Stack gap={4}>
            {savedAddresses.length > 0 && (
              <Form.Select
                aria-label="Chọn địa chỉ đã lưu"
                defaultValue=""
                onChange={(e) => {
                  const picked = savedAddresses.find((a) => String(a.id) === e.target.value)
                  if (picked) applyAddress(picked)
                }}
              >
                <option value="" disabled>Chọn địa chỉ đã lưu trong sổ địa chỉ…</option>
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>{a.recipientName} · {a.phone} · {a.addressLine}{a.defaultAddress ? ' (mặc định)' : ''}</option>
                ))}
              </Form.Select>
            )}
            <OrderInfoPage
              customerInfo={customerInfo}
              onCustomerInfoChange={onCustomerInfoChange}
              validationErrors={formErrors}
              shippingZones={shippingZones}
              shippingZoneCode={shippingZoneCode}
              onShippingZoneChange={changeZone}
              shippingZonesLoading={shippingZonesLoading}
              shippingZonesError={shippingZonesError}
            />

            {/* Voucher Box */}
            <div className="detail-card p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Ticket size={20} className="text-success" />
                <h4 className="fw-bold mb-0">Mã giảm giá & Ưu đãi</h4>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Voucher hệ thống CleanMarket</Form.Label>
                <InputGroup>
                  <Form.Control
                    value={platformInput}
                    onChange={(event) => setPlatformInput(normalizeCode(event.target.value))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        applyPlatformCode()
                      }
                    }}
                    placeholder="Nhập mã (ví dụ: CMNEW1)"
                    className="rounded-start-3"
                  />
                  <Button
                    variant="outline-success"
                    onClick={applyPlatformCode}
                    disabled={!platformInput.trim()}
                    className="fw-bold px-3"
                  >
                    Áp dụng
                  </Button>
                  {platformCode && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setPlatformCode('')
                        setPlatformInput('')
                      }}
                    >
                      Bỏ mã
                    </Button>
                  )}
                </InputGroup>
                <Form.Text className="text-muted small">
                  Mỗi tài khoản được sử dụng một lần mã ưu đãi tân khách hàng hoặc chiến dịch.
                </Form.Text>
                {platformCode && activeQuote && (
                  <div className="mt-2">
                    <Badge bg="success" pill className="px-3 py-1">
                      ✓ Đã áp dụng mã {platformCode}
                    </Badge>
                  </div>
                )}
              </Form.Group>

              {activeQuote?.suppliers?.map((supplier) => (
                <Form.Group className="mb-3" key={supplier.supplierId}>
                  <Form.Label className="small fw-semibold">Voucher riêng của {supplier.supplierName}</Form.Label>
                  <InputGroup>
                    <Form.Control
                      value={partnerInputs[supplier.supplierId] || ''}
                      onChange={(event) =>
                        setPartnerInputs((current) => ({
                          ...current,
                          [supplier.supplierId]: normalizeCode(event.target.value),
                        }))
                      }
                      placeholder="Nhập mã nhà cung cấp"
                      className="rounded-start-3"
                    />
                    <Button
                      variant="outline-success"
                      onClick={() => applyPartnerCode(supplier.supplierId)}
                      disabled={!partnerInputs[supplier.supplierId]?.trim()}
                      className="fw-bold px-3"
                    >
                      Áp dụng
                    </Button>
                    {partnerCodes[supplier.supplierId] && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setPartnerCodes((current) => ({ ...current, [supplier.supplierId]: '' }))
                          setPartnerInputs((current) => ({ ...current, [supplier.supplierId]: '' }))
                        }}
                      >
                        Bỏ mã
                      </Button>
                    )}
                  </InputGroup>
                </Form.Group>
              ))}

              {quoting && (
                <div className="text-success small fw-semibold d-flex align-items-center gap-2 mt-2">
                  <Spinner size="sm" /> Đang tính toán phí ship & giảm giá...
                </div>
              )}
              {shippingAddress && quoteError && (
                <Alert variant="warning" className="rounded-3 mt-3 mb-0">
                  {quoteError}
                </Alert>
              )}
            </div>

            <PaymentMethod value={paymentMethod} onChange={onPaymentMethodChange} />
          </Stack>
        </Col>

        <Col lg={5}>
          <Stack gap={4} className="sticky-top" style={{ top: '100px' }}>
            <OrderSummary
              cartItems={cartItems}
              paymentMethod={paymentMethod}
              quote={activeQuote}
            />
            <Button
              className="primary-btn py-3 fs-6 w-100 fw-bold"
              size="lg"
              onClick={submit}
              disabled={!activeQuote || quoting}
            >
              <span>Xác nhận & Hoàn tất đơn hàng</span>
              <ArrowRight size={18} />
            </Button>
          </Stack>
        </Col>
      </Row>
    </Container>
  )
}

export default CheckoutPage
