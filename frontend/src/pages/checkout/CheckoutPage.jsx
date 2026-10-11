import { Alert, Button, Col, Container, Row, Stack } from 'react-bootstrap'
import PageTitle from '../../components/common/PageTitle'
import PaymentMethod from '../../components/order/PaymentMethod'
import OrderSummary from '../../components/order/OrderSummary'
import OrderInfoPage from '../order-info/OrderInfoPage'

function CheckoutPage({
  cartItems,
  customerInfo,
  paymentMethod,
  availablePayments,
  validationErrors,
  onCustomerInfoChange,
  onPaymentMethodChange,
  onConfirmOrder,
}) {
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
      {validationErrors.includes('Phương thức thanh toán này hiện chưa khả dụng.') && (
        <Alert variant="warning">Phương thức thanh toán này hiện chưa khả dụng. Vui lòng chọn COD.</Alert>
      )}
      <Row className="g-4">
        <Col lg={7}>
          <Stack gap={4}>
            <OrderInfoPage
              customerInfo={customerInfo}
              onCustomerInfoChange={onCustomerInfoChange}
              validationErrors={validationErrors}
            />
            <PaymentMethod value={paymentMethod} onChange={onPaymentMethodChange} availability={availablePayments} />
          </Stack>
        </Col>
        <Col lg={5}>
          <Stack gap={4}>
            <OrderSummary
              cartItems={cartItems}
              paymentMethod={paymentMethod}
            />
            <Button className="primary-btn py-3" size="lg" onClick={onConfirmOrder}>
              Xác nhận đặt hàng
            </Button>
          </Stack>
        </Col>
      </Row>
    </Container>
  )
}

export default CheckoutPage
