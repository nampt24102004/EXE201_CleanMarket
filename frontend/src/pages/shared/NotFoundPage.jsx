import { Button, Card, Container, Stack } from 'react-bootstrap'

function NotFoundPage({ currentPath, onBackHome }) {
  return (
    <Container className="py-5">
      <Card className="success-card border-0 p-3 p-md-4 text-center">
        <Card.Body>
          <Stack gap={3} className="align-items-center">
            <div className="success-icon">404</div>
            <div>
              <h2 className="section-title mb-2">Không tìm thấy trang</h2>
              <p className="text-secondary mb-0">
                Đường dẫn <strong>{currentPath}</strong> không tồn tại hoặc đã bị thay
                đổi.
              </p>
            </div>
            <Button className="primary-btn" size="lg" onClick={onBackHome}>
              Quay về trang chủ
            </Button>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default NotFoundPage
