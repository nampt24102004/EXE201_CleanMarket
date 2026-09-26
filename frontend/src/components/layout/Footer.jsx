import { Col, Container, Row, Stack } from 'react-bootstrap'

function Footer() {
  return (
    <footer id="contact" className="footer mt-5 py-4">
      <Container>
        <Row className="g-4 align-items-center">
          <Col md={6}>
            <h5 className="mb-2">Clean Market</h5>
            <p className="mb-0 contact-block">
              Rau hữu cơ tươi ngon, giao nhanh trong ngày và được chọn lọc từ những
              nông trại sạch uy tín.
            </p>
          </Col>
          <Col md={6}>
            <Stack gap={2} className="contact-block">
              <span>Hotline: 0358 755 719</span>
              <span>Email: cleanmarket101@gmail.com</span>
              <span>Địa chỉ:Khu CNC Hòa Lạc</span>
            </Stack>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
