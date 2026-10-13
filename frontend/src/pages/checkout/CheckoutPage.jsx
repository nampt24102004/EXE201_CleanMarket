import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Col, Container, Form, InputGroup, Row, Spinner, Stack } from 'react-bootstrap'
import PageTitle from '../../components/common/PageTitle'
import PaymentMethod from '../../components/order/PaymentMethod'
import OrderSummary from '../../components/order/OrderSummary'
import OrderInfoPage from '../order-info/OrderInfoPage'
import { api } from '../../services/apiClient'

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
      try { setQuote(await api.post('/api/checkout/quote', { address: shippingAddress, platformVoucherCode: platformCode || null, partnerVoucherCodes: Object.values(partnerCodes).filter(Boolean) })) }
      catch (error) { setQuote(null); setQuoteError(error.message) }
      finally { setQuoting(false) }
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
      <PageTitle
        eyebrow="Thanh toán"
        title="Hoàn tất thông tin đặt hàng"
        description="Điền đầy đủ thông tin giao hàng và chọn cách thanh toán phù hợp."
      />
      {validationErrors.includes('Vui lòng chọn phương thức thanh toán.') ? (
        <Alert variant="warning">Bạn cần chọn phương thức thanh toán trước khi xác nhận.</Alert>
      ) : null}
      {validationErrors.includes('Giỏ hàng của bạn đang trống.') ? (
        <Alert variant="warning">Giỏ hàng của bạn đang trống, vui lòng thêm sản phẩm trước khi thanh toán.</Alert>
      ) : null}
      <Row className="g-4">
        <Col lg={7}>
          <Stack gap={4}>
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
            <div className="detail-card p-4">
              <h2 className="h4">Mã giảm giá</h2>
              <Form.Group className="mb-3">
                <Form.Label>Voucher CleanMarket</Form.Label>
                <InputGroup>
                  <Form.Control
                    value={platformInput}
                    onChange={(event) => setPlatformInput(normalizeCode(event.target.value))}
                    onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyPlatformCode() } }}
                    placeholder="Nhập mã, ví dụ CMNEW1"
                  />
                  <Button variant="outline-success" onClick={applyPlatformCode} disabled={!platformInput.trim()}>Áp dụng</Button>
                  {platformCode && <Button variant="outline-secondary" onClick={() => { setPlatformCode(''); setPlatformInput('') }}>Bỏ mã</Button>}
                </InputGroup>
                <Form.Text>Mã áp dụng cho mọi khách hàng; mỗi tài khoản được sử dụng từng mã một lần.</Form.Text>
                {platformCode && activeQuote && <div className="mt-2"><Badge bg="success">Đã áp dụng {platformCode}</Badge></div>}
              </Form.Group>
              {activeQuote?.suppliers?.map((supplier) => (
                <Form.Group className="mb-3" key={supplier.supplierId}>
                  <Form.Label>Voucher của {supplier.supplierName}</Form.Label>
                  <InputGroup>
                    <Form.Control
                      value={partnerInputs[supplier.supplierId] || ''}
                      onChange={(event) => setPartnerInputs((current) => ({ ...current, [supplier.supplierId]: normalizeCode(event.target.value) }))}
                      placeholder="Nhập mã nhà cung cấp"
                    />
                    <Button variant="outline-success" onClick={() => applyPartnerCode(supplier.supplierId)} disabled={!partnerInputs[supplier.supplierId]?.trim()}>Áp dụng</Button>
                    {partnerCodes[supplier.supplierId] && <Button variant="outline-secondary" onClick={() => { setPartnerCodes((current) => ({ ...current, [supplier.supplierId]: '' })); setPartnerInputs((current) => ({ ...current, [supplier.supplierId]: '' })) }}>Bỏ mã</Button>}
                  </InputGroup>
                </Form.Group>
              ))}
              {quoting && <div><Spinner size="sm" /> Đang tính lại...</div>}{shippingAddress && quoteError && <Alert variant="warning" className="mb-0">{quoteError}</Alert>}
            </div>
            <PaymentMethod value={paymentMethod} onChange={onPaymentMethodChange} />
          </Stack>
        </Col>
        <Col lg={5}>
          <Stack gap={4}>
            <OrderSummary
              cartItems={cartItems}
              paymentMethod={paymentMethod}
              quote={activeQuote}
            />
            <Button className="primary-btn py-3" size="lg" onClick={submit} disabled={!activeQuote || quoting}>
              Xác nhận đặt hàng
            </Button>
          </Stack>
        </Col>
      </Row>
    </Container>
  )
}

export default CheckoutPage
