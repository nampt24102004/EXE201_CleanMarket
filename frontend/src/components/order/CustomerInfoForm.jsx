import { Alert, Card, Col, Form, Row } from 'react-bootstrap'

function CustomerInfoForm({ customerInfo, onChange, validationErrors }) {
  const hasError = (message) => validationErrors.includes(message)

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    onChange({
      ...customerInfo,
      [name]: value,
    })
  }

  return (
    <Card className="checkout-card border-0 p-3 p-md-4">
      <Card.Body>
        <Card.Title className="mb-3">Thông tin khách hàng</Card.Title>
        {validationErrors.length > 0 ? (
          <Alert variant="danger">
            <div className="fw-semibold mb-1">Vui lòng kiểm tra lại thông tin:</div>
            <ul className="mb-0 ps-3">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
        <Form noValidate>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Họ và tên</Form.Label>
                <Form.Control
                  name="fullName"
                  value={customerInfo.fullName}
                  onChange={handleFieldChange}
                  isInvalid={hasError('Vui lòng nhập họ và tên.')}
                  placeholder="Nhập họ và tên"
                />
                <Form.Control.Feedback type="invalid">
                  Họ và tên không được để trống.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleFieldChange}
                  isInvalid={hasError('Vui lòng nhập số điện thoại.')}
                  placeholder="Nhập số điện thoại"
                />
                <Form.Control.Feedback type="invalid">
                  Số điện thoại không được để trống.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  name="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={handleFieldChange}
                  isInvalid={hasError('Email không đúng định dạng.')}
                  placeholder="email@example.com"
                />
                <Form.Control.Feedback type="invalid">
                  Email cần đúng định dạng hợp lệ.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Địa chỉ giao hàng</Form.Label>
                <Form.Control
                  name="address"
                  value={customerInfo.address}
                  onChange={handleFieldChange}
                  isInvalid={hasError('Vui lòng nhập địa chỉ giao hàng.')}
                  placeholder="Nhập địa chỉ giao hàng"
                />
                <Form.Control.Feedback type="invalid">
                  Địa chỉ giao hàng không được để trống.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Ghi chú đơn hàng</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="note"
                  value={customerInfo.note}
                  onChange={handleFieldChange}
                  placeholder="Thêm ghi chú nếu bạn muốn giao hàng theo khung giờ cụ thể."
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  )
}

export default CustomerInfoForm
